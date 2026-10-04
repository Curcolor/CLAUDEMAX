import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { resolverGrafo, buscarEnPath, resolverServidor, textoEstado } from "../graphify-auto-lib.mjs";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const PROY = path.join(FIX, "proy");
const GRAFO = path.join(PROY, "graphify-out", "graph.json");

test("resolverGrafo: GRAPHIFY_GRAPH > CLAUDE_PROJECT_DIR > cwd subiendo; null si nada", () => {
    assert.equal(resolverGrafo({ GRAPHIFY_GRAPH: GRAFO }, "/otro"), GRAFO);
    assert.equal(resolverGrafo({ GRAPHIFY_GRAPH: "/no/existe.json", CLAUDE_PROJECT_DIR: PROY }, "/otro"), GRAFO);
    assert.equal(resolverGrafo({ CLAUDE_PROJECT_DIR: PROY }, "/otro"), GRAFO);
    assert.equal(resolverGrafo({}, path.join(PROY, "src")), GRAFO);
    assert.equal(resolverGrafo({}, PROY), GRAFO);
    assert.equal(resolverGrafo({}, os.tmpdir()), null);
    assert.equal(resolverGrafo({ CLAUDE_PROJECT_DIR: "/no/existe" }, os.tmpdir()), null);
});

// PATH temporal con un graphify-mcp falso: .cmd en Windows, script con shebang en POSIX.
function pathConFalso(salida = "", codigo = 0) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gmcp-"));
    const script = path.join(dir, "graphify-mcp.mjs");
    fs.writeFileSync(script, `process.stdout.write(${JSON.stringify(salida)} + JSON.stringify(process.argv.slice(2)) + "\\n"); process.exit(${codigo});`);
    let bin;
    if (process.platform === "win32") {
        bin = path.join(dir, "graphify-mcp.cmd");
        fs.writeFileSync(bin, `@echo off\r\nnode "%~dp0graphify-mcp.mjs" %*\r\n`);
    } else {
        bin = path.join(dir, "graphify-mcp");
        fs.writeFileSync(bin, `#!/bin/sh\nexec node "$(dirname "$0")/graphify-mcp.mjs" "$@"\n`);
        fs.chmodSync(bin, 0o755);
    }
    return { dir, bin };
}

// El .cmd/.sh falso invoca `node`, así que el PATH de prueba lleva también el directorio de Node
// (y nada más: sin python, para que resolverServidor no lo encuentre).
const NODE_DIR = path.dirname(process.execPath);
const pathDe = dir => `${dir}${path.delimiter}${NODE_DIR}`;

test("buscarEnPath y resolverServidor: graphify-mcp falso en PATH; sin nada → null", () => {
    const { dir, bin } = pathConFalso();
    const env = { PATH: pathDe(dir), Path: pathDe(dir) };
    assert.equal(buscarEnPath("graphify-mcp", env), bin);
    assert.deepEqual(resolverServidor(env), { cmd: bin, args: [], shell: bin.endsWith(".cmd") });
    // PATH vacío y sin python: null (resolverServidor no debe lanzar)
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), "vacio-"));
    assert.equal(resolverServidor({ PATH: vacio, Path: vacio }), null);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(vacio, { recursive: true, force: true });
});

test("textoEstado: sin grafo, sin servidor, ambos", () => {
    assert.match(textoEstado(null, { cmd: "x", args: [] }, "/w/proy"), /no existe graphify-out\/graph\.json en \/w\/proy[\s\S]*graphify extract \. --code-only/);
    assert.match(textoEstado(GRAFO, null, "/w/proy"), /graphify no está instalado[\s\S]*uv tool install graphifyy/);
    assert.match(textoEstado(GRAFO, { cmd: "x", args: [] }, "/w/proy"), /listo/);
});

const WRAPPER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "graphify-auto.mjs");

// Lanza el envoltorio, le manda mensajes JSON-RPC por stdin y devuelve las respuestas parseadas.
// cwd = un directorio SIN graphify-out/ (el repo de CLAUDEMAX puede tener el suyo y la caída al
// cwd lo encontraría, rompiendo el aislamiento de la prueba).
function hablar(mensajes, env, cwd = os.tmpdir()) {
    return new Promise(resolve => {
        const child = spawn(process.execPath, [WRAPPER], { cwd, env: { ...process.env, ...env }, stdio: ["pipe", "pipe", "pipe"] });
        let out = "", err = "";
        child.stdout.on("data", d => { out += d; });
        child.stderr.on("data", d => { err += d; });
        child.on("close", code => {
            const respuestas = out.split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return { crudo: l }; } });
            resolve({ code, respuestas, err, out });
        });
        for (const m of mensajes) child.stdin.write(JSON.stringify(m) + "\n");
        child.stdin.end();
    });
}

const INIT = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } } };

test("mini-servidor sin grafo: initialize, tools/list, tools/call, ping, notificación, método desconocido", async () => {
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), "sin-grafo-"));
    const r = await hablar([
        INIT,
        { jsonrpc: "2.0", method: "notifications/initialized" },
        { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
        { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "graphify_estado", arguments: {} } },
        { jsonrpc: "2.0", id: 4, method: "ping" },
        { jsonrpc: "2.0", id: 5, method: "resources/list" },
    ], { CLAUDE_PROJECT_DIR: vacio, GRAPHIFY_GRAPH: "", PATH: vacio, Path: vacio });
    assert.equal(r.code, 0, r.err);
    const por = id => r.respuestas.find(x => x.id === id);
    assert.equal(por(1).result.serverInfo.name, "graphify-auto");
    assert.equal(por(1).result.protocolVersion, "2024-11-05");
    assert.deepEqual(por(2).result.tools.map(t => t.name), ["graphify_estado"]);
    assert.match(por(3).result.content[0].text, /Sin grafo[\s\S]*graphify extract \. --code-only/);
    assert.deepEqual(por(4).result, {});
    assert.equal(por(5).error.code, -32601);
    assert.equal(r.respuestas.length, 5, "la notificación no recibe respuesta");
    fs.rmSync(vacio, { recursive: true, force: true });
});

test("mini-servidor con grafo pero sin servidor: el estado dice cómo instalar graphify", async () => {
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), "sin-srv-"));
    const r = await hablar([INIT, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "graphify_estado", arguments: {} } }],
        { CLAUDE_PROJECT_DIR: PROY, PATH: vacio, Path: vacio });
    assert.match(r.respuestas.find(x => x.id === 2).result.content[0].text, /graphify no está instalado[\s\S]*uv tool install graphifyy/);
    fs.rmSync(vacio, { recursive: true, force: true });
});

test("proxy: con graphify-mcp falso en el PATH lo lanza con la ruta del grafo y devuelve su código", async () => {
    const { dir } = pathConFalso("ARGS=", 0);
    const r = await hablar([], { CLAUDE_PROJECT_DIR: PROY, PATH: pathDe(dir), Path: pathDe(dir) });
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, new RegExp("ARGS=\\[" + JSON.stringify(GRAFO).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\]"));
    fs.rmSync(dir, { recursive: true, force: true });
    const { dir: dir3 } = pathConFalso("", 3);
    const r3 = await hablar([], { CLAUDE_PROJECT_DIR: PROY, PATH: pathDe(dir3), Path: pathDe(dir3) });
    assert.equal(r3.code, 3);
    fs.rmSync(dir3, { recursive: true, force: true });
});
