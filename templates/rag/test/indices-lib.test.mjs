import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
    buscarEnPath, resolverCodebaseMemory, resolverGraphify, indexarCodebaseMemory, extraerGraphify,
} from "../indices-lib.mjs";

const WIN = process.platform === "win32";
const envDe = dir => ({ PATH: dir, Path: dir });
const tmp = prefijo => fs.mkdtempSync(path.join(os.tmpdir(), prefijo));

// Binario falso: .cmd en Windows, script sin extensión en POSIX. Nunca se ejecuta.
function binarioFalso(nombre) {
    const dir = tmp("idx-");
    const bin = path.join(dir, WIN ? `${nombre}.cmd` : nombre);
    fs.writeFileSync(bin, WIN ? "@echo off\r\n" : "#!/bin/sh\n");
    if (!WIN) fs.chmodSync(bin, 0o755);
    return { dir, bin };
}

test("buscarEnPath: en Windows ignora archivos sin extensión", { skip: !WIN }, () => {
    const dir = tmp("idx-");
    fs.writeFileSync(path.join(dir, "graphify"), "");
    assert.equal(buscarEnPath("graphify", envDe(dir)), null);
    fs.writeFileSync(path.join(dir, "graphify.exe"), "");
    assert.equal(buscarEnPath("graphify", envDe(dir)), path.join(dir, "graphify.exe"));
    fs.rmSync(dir, { recursive: true, force: true });
});

test("resolverCodebaseMemory: binario en PATH → node bin.js de npm root -g → null", () => {
    const { dir, bin } = binarioFalso("codebase-memory-mcp");
    assert.deepEqual(resolverCodebaseMemory(envDe(dir), { npmRoot: () => null }), { cmd: bin, args: [], shell: WIN });
    const npm = tmp("npm-");
    fs.mkdirSync(path.join(npm, "codebase-memory-mcp"));
    const js = path.join(npm, "codebase-memory-mcp", "bin.js");
    fs.writeFileSync(js, "");
    // en Windows el .cmd pierde frente a node bin.js (sin shell); en POSIX el binario directo gana
    assert.deepEqual(resolverCodebaseMemory(envDe(dir), { npmRoot: () => npm }),
        WIN ? { cmd: process.execPath, args: [js], shell: false } : { cmd: bin, args: [], shell: false });
    const vacio = tmp("vacio-");
    assert.deepEqual(resolverCodebaseMemory(envDe(vacio), { npmRoot: () => npm }), { cmd: process.execPath, args: [js], shell: false });
    assert.equal(resolverCodebaseMemory(envDe(vacio), { npmRoot: () => null }), null);
    for (const d of [dir, npm, vacio]) fs.rmSync(d, { recursive: true, force: true });
});

test("resolverGraphify: graphify en PATH → python -m graphify → py -3 -m graphify → null", () => {
    const { dir, bin } = binarioFalso("graphify");
    assert.deepEqual(resolverGraphify(envDe(dir), { probarPython: () => { throw new Error("no debe probar python"); } }),
        { cmd: bin, args: [], shell: WIN });
    const pyDir = tmp("py-");
    const ext = WIN ? ".exe" : "";
    const python = path.join(pyDir, `python${ext}`), py = path.join(pyDir, `py${ext}`);
    fs.writeFileSync(python, "");
    fs.writeFileSync(py, "");
    assert.deepEqual(resolverGraphify(envDe(pyDir), { probarPython: (env, cmd) => cmd === python }), { cmd: python, args: ["-m", "graphify"], shell: false });
    assert.deepEqual(resolverGraphify(envDe(pyDir), { probarPython: (env, cmd) => cmd === py }), { cmd: py, args: ["-3", "-m", "graphify"], shell: false });
    assert.equal(resolverGraphify(envDe(pyDir), { probarPython: () => false }), null);
    for (const d of [dir, pyDir]) fs.rmSync(d, { recursive: true, force: true });
});

test("indexarCodebaseMemory y extraerGraphify: argumentos, cwd, shell y códigos; sin binario → aviso", () => {
    const llamadas = [];
    const spawnFalso = codigo => (cmd, args, opts) => { llamadas.push({ cmd, args, opts }); return { status: codigo }; };
    const repo = path.resolve("repo-x");
    assert.deepEqual(indexarCodebaseMemory("repo-x", { resolver: () => ({ cmd: "cbm", args: ["bin.js"], shell: false }), spawn: spawnFalso(0) }),
        { ok: true, codigo: 0, aviso: null });
    assert.equal(llamadas[0].cmd, "cbm");
    assert.deepEqual(llamadas[0].args, ["bin.js", "cli", "index_repository", "--repo-path", repo, "--mode", "moderate"]);
    assert.equal(llamadas[0].opts.cwd, repo);
    assert.equal(llamadas[0].opts.stdio, "inherit");
    const g = extraerGraphify("repo-x", { resolver: () => ({ cmd: "py", args: ["-3", "-m", "graphify"], shell: false }), spawn: spawnFalso(2) });
    assert.equal(g.ok, false);
    assert.equal(g.codigo, 2);
    assert.match(g.aviso, /código 2/);
    assert.deepEqual(llamadas[1].args, ["-3", "-m", "graphify", "extract", repo, "--code-only"]);
    assert.equal(llamadas[1].opts.cwd, repo);
    indexarCodebaseMemory("repo-x", { resolver: () => ({ cmd: "C:/n/cbm.cmd", args: [], shell: true }), spawn: spawnFalso(0) });
    assert.equal(llamadas[2].cmd, `"C:/n/cbm.cmd" "cli" "index_repository" "--repo-path" "${repo}" "--mode" "moderate"`);
    assert.deepEqual(llamadas[2].args, []);
    assert.equal(llamadas[2].opts.shell, true);
    const err = extraerGraphify("repo-x", { resolver: () => ({ cmd: "x", args: [], shell: false }), spawn: () => ({ error: new Error("ENOENT") }) });
    assert.deepEqual([err.ok, err.codigo], [false, null]);
    assert.match(err.aviso, /ENOENT/);
    assert.match(indexarCodebaseMemory("repo-x", { resolver: () => null }).aviso, /install\.sh --only codebase-memory/);
    assert.match(extraerGraphify("repo-x", { resolver: () => null }).aviso, /install\.sh --only graphify/);
});
