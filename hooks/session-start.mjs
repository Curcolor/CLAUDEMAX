#!/usr/bin/env node
// Hook SessionStart de CLAUDEMAX: autocontextualiza cada sesión nueva con un resumen
// compacto del grafo de conocimiento de Graphify (Understand-Anything) del repo actual
// y, si el CLI del RAG responde, con los chunks más relevantes para el proyecto detectado.
//
// Nunca bloquea el arranque de la sesión ni la retrasa más de la cuenta: presupuesto total
// ~5s repartido entre los pasos, cada llamada a un proceso externo lleva su propio timeout
// explícito, y cualquier fallo (git ausente, sin `.ua/`, Docker apagado, `rag.mjs` no
// localizable) se traga en silencio — son casos normales, no errores.
//
// La salida es un único bloque de texto plano por stdout, con cabecera que dice
// explícitamente que es contexto automático de CLAUDEMAX. En hooks SessionStart, Claude
// Code añade ese texto como contexto de la sesión (a diferencia de, por ejemplo,
// PostToolUse, donde el stdout plano solo va al log de depuración).
//
// Registrado por bin/components/rules.sh como SessionStart → node <hooks>/session-start.mjs
// Variable de escape: CLAUDEMAX_SESSION_CONTEXT=0 (ni siquiera se lee stdin).

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";

// Salida inmediata si el usuario desactivó el hook.
if (String(process.env.CLAUDEMAX_SESSION_CONTEXT || "") === "0") {
    process.exit(0);
}

const BUDGET_MS = 5000;
const MAX_GRAPH_FILE_BYTES = 15_000_000; // por encima de esto no vale la pena parsear en el presupuesto de 5s
const MAX_TOP_NODES = 10;
const MAX_RAG_OUTPUT_CHARS = 4000;

const deadline = Date.now() + BUDGET_MS;
const timeLeft = () => deadline - Date.now();

function readAllStdin() {
    return new Promise(resolve => {
        let buf = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", c => { buf += c; });
        process.stdin.on("end", () => resolve(buf));
        process.stdin.on("error", () => resolve(buf));
        // Seguridad: si stdin es una TTY (invocación manual), no cuelgues para siempre.
        if (process.stdin.isTTY) resolve("");
    });
}

// Envuelve una promesa con un timeout propio; nunca rechaza (red de seguridad adicional
// para pasos que no dependen de un proceso hijo con su propio timeout, como leer stdin).
function withTimeout(promise, ms) {
    return new Promise(resolve => {
        let settled = false;
        const timer = setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, Math.max(0, ms));
        promise.then(v => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } })
            .catch(() => { if (!settled) { settled = true; clearTimeout(timer); resolve(null); } });
    });
}

function pick(obj, keys) {
    if (!obj || typeof obj !== "object") return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
}

// Ejecuta un comando externo con timeout acotado al presupuesto restante. Nunca lanza:
// cualquier error, timeout o código de salida distinto de 0 resuelve null.
function run(cmd, args, opts = {}) {
    return new Promise(resolve => {
        const budget = timeLeft();
        if (budget < 300) { resolve(null); return; } // no queda presupuesto razonable: ni lo intentes
        const timeout = Math.min(budget, opts.timeout || 2000);
        execFile(cmd, args, { timeout, windowsHide: true, cwd: opts.cwd, maxBuffer: 2_000_000 }, (err, stdout) => {
            if (err) { resolve(null); return; }
            resolve(String(stdout || "").trim());
        });
    });
}

// --- Paso 1: detección del proyecto ------------------------------------------------------

async function detectProjectRoot(cwd) {
    const top = await run("git", ["rev-parse", "--show-toplevel"], { cwd, timeout: 1500 });
    if (top) return path.resolve(top);
    return cwd;
}

// --- Paso 2: resumen del grafo de Graphify (.ua/knowledge-graph.json) --------------------
// El esquema real ha variado entre versiones del plugin Understand-Anything (misma
// precaución que ya documenta flattenGraph en templates/rag/rag.mjs): nodos con
// id/name/label, type/kind, complexity (simple|moderate|complex); aristas con
// source/from/src y target/to/dst. Nunca se asume un formato fijo. Nunca se vuelca el
// grafo entero: solo conteos, agregados por tipo/capa y el top de nodos más conectados.

const COMPLEXITY_RANK = { complex: 3, moderate: 2, simple: 1 };

function summarizeGraph(json) {
    if (!json || typeof json !== "object" || !Array.isArray(json.nodes)) return null;
    const nodes = json.nodes.filter(Boolean);
    const edges = (Array.isArray(json.edges) ? json.edges : []).filter(Boolean);

    const degreeById = new Map();
    const bumpDegree = id => { if (id != null) degreeById.set(id, (degreeById.get(id) || 0) + 1); };
    for (const e of edges) {
        bumpDegree(e.source ?? e.from ?? e.src);
        bumpDegree(e.target ?? e.to ?? e.dst);
    }

    const countByType = new Map();
    for (const n of nodes) {
        const type = n.type || n.kind || "(sin tipo)";
        countByType.set(type, (countByType.get(type) || 0) + 1);
    }

    const topNodes = nodes
        .map(n => {
            const id = n.id ?? n.name ?? n.label;
            return {
                name: n.name || n.label || (id != null ? String(id) : "(sin nombre)"),
                type: n.type || n.kind || "",
                filePath: n.path || n.filePath || n.file || "",
                degree: degreeById.get(id) || 0,
                complexityRank: COMPLEXITY_RANK[n.complexity] || 0,
            };
        })
        .sort((a, b) => (b.degree - a.degree) || (b.complexityRank - a.complexityRank))
        .slice(0, MAX_TOP_NODES);

    let topLayers = null;
    if (Array.isArray(json.layers) && json.layers.length) {
        topLayers = json.layers
            .filter(l => l && Array.isArray(l.nodeIds))
            .map(l => ({ name: l.name || l.id || "(capa sin nombre)", count: l.nodeIds.length }))
            .sort((a, b) => b.count - a.count);
    }

    return {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        countByType: [...countByType.entries()].sort((a, b) => b[1] - a[1]),
        topLayers,
        topNodes,
    };
}

function loadGraphSummary(projectRoot) {
    const file = path.join(projectRoot, ".ua", "knowledge-graph.json");
    try {
        if (!fs.existsSync(file)) return null;
        if (fs.statSync(file).size > MAX_GRAPH_FILE_BYTES) return null;
        const json = JSON.parse(fs.readFileSync(file, "utf8"));
        return summarizeGraph(json);
    } catch {
        return null;
    }
}

function formatGraphSummary(summary) {
    const lines = [];
    lines.push(`Grafo de Graphify (.ua/knowledge-graph.json): ${summary.nodeCount} nodos, ${summary.edgeCount} aristas.`);
    if (summary.topLayers && summary.topLayers.length) {
        const str = summary.topLayers.slice(0, 8).map(l => `${l.name} (${l.count})`).join(", ");
        lines.push(`Capas principales: ${str}.`);
    } else if (summary.countByType.length) {
        const str = summary.countByType.slice(0, 8).map(([t, n]) => `${t} (${n})`).join(", ");
        lines.push(`Tipos principales: ${str}.`);
    }
    if (summary.topNodes.length) {
        lines.push("Nodos más conectados / de mayor complejidad:");
        for (const n of summary.topNodes) {
            const filePart = n.filePath ? ` — ${n.filePath}` : "";
            lines.push(`  - ${n.name}${n.type ? ` (${n.type})` : ""}${filePart} · grado ${n.degree}`);
        }
    }
    return lines.join("\n");
}

// --- Paso 3: consulta acotada al RAG -----------------------------------------------------
// Localización de rag.mjs: variable CLAUDEMAX_RAG_DIR, o buscando R.A.G/rag.mjs subiendo
// desde el cwd hasta 4 niveles. Si Docker/Ollama/Postgres están apagados, rag.mjs falla
// rápido y con exit code != 0 — run() lo traduce en null sin ruido.

function findRagDir(startDir) {
    const fromEnv = process.env.CLAUDEMAX_RAG_DIR;
    if (fromEnv && fs.existsSync(path.join(fromEnv, "rag.mjs"))) return fromEnv;

    let dir = startDir;
    for (let level = 0; level <= 4; level++) {
        const candidate = path.join(dir, "R.A.G", "rag.mjs");
        if (fs.existsSync(candidate)) return path.join(dir, "R.A.G");
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

async function queryRag(ragDir, projectName) {
    const out = await run(process.execPath, [
        path.join(ragDir, "rag.mjs"), "query", projectName, "--proyecto", projectName, "--topk", "3",
    ], { cwd: ragDir, timeout: Math.max(500, timeLeft() - 200) });
    if (!out) return null;
    if (/^rag: (sin resultados|error)/.test(out)) return null;
    return out.length > MAX_RAG_OUTPUT_CHARS ? out.slice(0, MAX_RAG_OUTPUT_CHARS) + " …" : out;
}

// --- Programa principal --------------------------------------------------------------

async function main() {
    const raw = await withTimeout(readAllStdin(), 1000);
    let evt = {};
    if (raw) { try { evt = JSON.parse(raw); } catch { evt = {}; } }

    const cwdFromEvent = pick(evt, ["cwd", "cwd_path", "cwdPath"]);
    const cwd = (typeof cwdFromEvent === "string" && cwdFromEvent) ? cwdFromEvent : process.cwd();

    const projectRoot = timeLeft() > 300 ? await detectProjectRoot(cwd) : cwd;
    const projectName = path.basename(projectRoot) || "proyecto";

    const blocks = [];

    if (timeLeft() > 200) {
        const graphSummary = loadGraphSummary(projectRoot);
        if (graphSummary) blocks.push(formatGraphSummary(graphSummary));
    }

    if (timeLeft() > 500) {
        const ragDir = findRagDir(cwd);
        if (ragDir) {
            const result = await queryRag(ragDir, projectName);
            if (result) blocks.push(`RAG — resultados para "${projectName}":\n${result}`);
        }
    }

    if (blocks.length === 0) { process.exit(0); return; }

    const header = `Contexto automático de CLAUDEMAX (hook SessionStart · proyecto: ${projectName})`;
    process.stdout.write(`${header}\n\n${blocks.join("\n\n")}\n`);
    process.exit(0);
}

main().catch(() => process.exit(0));
