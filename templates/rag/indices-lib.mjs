// Los dos índices de código que viven fuera del RAG: codebase-memory (index_repository) y
// graphify (extract --code-only). Los usa `ritual.mjs init-proyecto` y, en el sub-proyecto 5,
// `fin-ciclo`. Sin dependencias; se instala junto a rag.mjs en R.A.G/.
// buscarEnPath está duplicada de templates/mcp/graphify-auto-lib.mjs a propósito: esa lib vive en
// $CLAUDE_CONFIG_DIR/mcp/ y esta en R.A.G/ — no comparten directorio.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function existeArchivo(p) {
    try { return fs.statSync(p).isFile(); } catch { return false; }
}

// Primer ejecutable `nombre` en el PATH de `env`. En Windows solo .exe/.cmd/.bat: un archivo sin
// extensión (shim de pip o de bash) no se puede lanzar desde Node.
export function buscarEnPath(nombre, env = process.env) {
    const rutaPath = env.PATH || env.Path || "";
    const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat"] : [""];
    for (const dir of rutaPath.split(path.delimiter).filter(Boolean)) {
        for (const ext of exts) {
            const p = path.join(dir, nombre + ext);
            if (existeArchivo(p)) return p;
        }
    }
    return null;
}

const esShim = bin => /\.(cmd|bat)$/i.test(bin);

// `npm root -g`; npm es un .cmd en Windows, así que va por shell. null si npm falta o falla.
export function npmRootGlobal(env = process.env) {
    try {
        const r = spawnSync("npm", ["root", "-g"], { env, shell: true, encoding: "utf8", timeout: 10_000, windowsHide: true });
        const out = String(r.stdout || "").trim();
        return r.status === 0 && out ? out : null;
    } catch { return null; }
}

// { cmd, args, shell } para lanzar codebase-memory-mcp, o null. Un .exe/binario del PATH gana; un
// .cmd pierde frente a `node <npm root -g>/codebase-memory-mcp/bin.js`, que no necesita shell.
export function resolverCodebaseMemory(env = process.env, { npmRoot = npmRootGlobal } = {}) {
    const bin = buscarEnPath("codebase-memory-mcp", env);
    if (bin && !esShim(bin)) return { cmd: bin, args: [], shell: false };
    const root = npmRoot(env);
    const js = root ? path.join(root, "codebase-memory-mcp", "bin.js") : null;
    if (js && existeArchivo(js)) return { cmd: process.execPath, args: [js], shell: false };
    if (bin) return { cmd: bin, args: [], shell: true };
    return null;
}

function pythonConGraphify(env, cmd, prefijo) {
    try {
        const r = spawnSync(cmd, [...prefijo, "-c", "import graphify"], { env, timeout: 10_000, stdio: "ignore", windowsHide: true });
        return r.status === 0;
    } catch { return false; }
}

// { cmd, args, shell } para lanzar el CLI de graphify, o null.
// Orden: graphify en el PATH → python -m graphify → py -3 -m graphify.
export function resolverGraphify(env = process.env, { probarPython = pythonConGraphify } = {}) {
    const bin = buscarEnPath("graphify", env);
    if (bin) return { cmd: bin, args: [], shell: esShim(bin) };
    const python = buscarEnPath("python", env);
    if (python && probarPython(env, python, [])) return { cmd: python, args: ["-m", "graphify"], shell: false };
    const py = buscarEnPath("py", env);
    if (py && probarPython(env, py, ["-3"])) return { cmd: py, args: ["-3", "-m", "graphify"], shell: false };
    return null;
}

// Un .cmd solo se lanza con shell: una línea con cada argumento entre comillas.
function lanzar(spawn, srv, args, opciones) {
    if (srv.shell) {
        const linea = [srv.cmd, ...srv.args, ...args].map(a => `"${a}"`).join(" ");
        return spawn(linea, [], { ...opciones, shell: true });
    }
    return spawn(srv.cmd, [...srv.args, ...args], opciones);
}

function resultado(r, nombre) {
    if (r.error) return { ok: false, codigo: null, aviso: `${nombre}: no se pudo lanzar (${r.error.message})` };
    if (r.status !== 0) return { ok: false, codigo: r.status, aviso: `${nombre}: terminó con código ${r.status} — revisa su salida arriba` };
    return { ok: true, codigo: 0, aviso: null };
}

// Indexa el repo en ~/.cache/codebase-memory-mcp/ (fuera del repo; nunca --persistence).
export function indexarCodebaseMemory(rutaRepo, { env = process.env, resolver = resolverCodebaseMemory, spawn = spawnSync } = {}) {
    const abs = path.resolve(rutaRepo);
    const srv = resolver(env);
    if (!srv) return { ok: false, codigo: null, aviso: "codebase-memory-mcp no está instalado — instálalo con: bash install.sh --only codebase-memory (desde el repo de CLAUDEMAX)" };
    const r = lanzar(spawn, srv, ["cli", "index_repository", "--repo-path", abs, "--mode", "moderate"], { cwd: abs, env, stdio: "inherit", windowsHide: true });
    return resultado(r, "codebase-memory index_repository");
}

// Extrae el grafo en <repo>/graphify-out/ (--code-only: AST local, sin API key de LLM).
export function extraerGraphify(rutaRepo, { env = process.env, resolver = resolverGraphify, spawn = spawnSync } = {}) {
    const abs = path.resolve(rutaRepo);
    const srv = resolver(env);
    if (!srv) return { ok: false, codigo: null, aviso: "graphify no está instalado — instálalo con: bash install.sh --only graphify (desde el repo de CLAUDEMAX)" };
    const r = lanzar(spawn, srv, ["extract", abs, "--code-only"], { cwd: abs, env, stdio: "inherit", windowsHide: true });
    return resultado(r, "graphify extract");
}
