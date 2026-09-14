import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
