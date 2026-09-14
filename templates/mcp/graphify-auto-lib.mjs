// Funciones puras del envoltorio MCP de graphify (graphify-auto.mjs). Sin dependencias: se
// instala junto al envoltorio en $CLAUDE_CONFIG_DIR/mcp/, fuera del repo.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MAX_NIVELES = 6;

function existeArchivo(p) {
    try { return fs.statSync(p).isFile(); } catch { return false; }
}

// Ruta absoluta al graph.json del proyecto actual, o null. Orden: GRAPHIFY_GRAPH (pruebas y
// casos raros) → CLAUDE_PROJECT_DIR (lo pasa Claude Code al proceso del MCP) → cwd, subiendo.
export function resolverGrafo(env = process.env, cwd = process.cwd()) {
    if (env.GRAPHIFY_GRAPH && existeArchivo(env.GRAPHIFY_GRAPH)) return path.resolve(env.GRAPHIFY_GRAPH);
    if (env.CLAUDE_PROJECT_DIR) {
        const p = path.join(env.CLAUDE_PROJECT_DIR, "graphify-out", "graph.json");
        if (existeArchivo(p)) return path.resolve(p);
    }
    let dir = path.resolve(cwd);
    for (let i = 0; i <= MAX_NIVELES; i++) {
        const p = path.join(dir, "graphify-out", "graph.json");
        if (existeArchivo(p)) return p;
        const padre = path.dirname(dir);
        if (padre === dir) break;
        dir = padre;
    }
    return null;
}

// Primer ejecutable `nombre` (con las extensiones de Windows si aplica) en el PATH de `env`.
export function buscarEnPath(nombre, env = process.env) {
    const rutaPath = env.PATH || env.Path || "";
    const exts = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
    for (const dir of rutaPath.split(path.delimiter).filter(Boolean)) {
        for (const ext of exts) {
            const p = path.join(dir, nombre + ext);
            if (existeArchivo(p)) return p;
        }
    }
    return null;
}

function pythonConGraphify(env, cmd, prefijo) {
    try {
        const r = spawnSync(cmd, [...prefijo, "-c", "import graphify.serve"], { env, timeout: 5000, stdio: "ignore", windowsHide: true });
        return r.status === 0;
    } catch { return false; }
}

// { cmd, args, shell } del servidor real de graphify, o null si no hay ninguno.
// Orden: graphify-mcp en el PATH → python -m graphify.serve → py -3 -m graphify.serve.
export function resolverServidor(env = process.env) {
    const bin = buscarEnPath("graphify-mcp", env);
    if (bin) return { cmd: bin, args: [], shell: /\.(cmd|bat)$/i.test(bin) };
    if (buscarEnPath("python", env) && pythonConGraphify(env, "python", [])) return { cmd: "python", args: ["-m", "graphify.serve"], shell: false };
    if (buscarEnPath("py", env) && pythonConGraphify(env, "py", ["-3"])) return { cmd: "py", args: ["-3", "-m", "graphify.serve"], shell: false };
    return null;
}

// Texto de la tool graphify_estado: dice exactamente qué falta y cómo arreglarlo.
export function textoEstado(grafo, servidor, proyecto) {
    if (!grafo) {
        return `Sin grafo: no existe graphify-out/graph.json en ${proyecto}.\n` +
            "Genera el grafo con: graphify extract . --code-only  (dentro del repo; --code-only evita que falle con los .md cuando no hay API key de LLM).\n" +
            "Luego vuelve a abrir la sesión para que el MCP graphify lo sirva.";
    }
    if (!servidor) {
        return "graphify no está instalado (falta graphify-mcp en el PATH y python -m graphify.serve).\n" +
            "Instálalo con: uv tool install graphifyy  (o pipx install graphifyy / pip install --user graphifyy) y vuelve a abrir la sesión.\n" +
            `Grafo encontrado: ${grafo}`;
    }
    return `listo: ${grafo} servido por ${servidor.cmd}`;
}
