#!/usr/bin/env node
// CLI del RAG de CLAUDEMAX. Implementación única para init/ingest/query/reindex/status/salud;
// el wrapper MCP delega en este archivo. Las funciones puras viven en rag-lib.mjs. Config
// desde .env junto a este archivo (alternativa: variables de entorno).
//   node rag.mjs init                       aplica schema.sql (con migración idempotente)
//   node rag.mjs ingest [vault] [--backend ollama|remote|kaggle] [--silencioso]
//   node rag.mjs query "<texto>" [--coleccion C] [--proyecto P] [--topk N] [--json]
//   node rag.mjs reindex [vault] [--backend ...]      trunca + ingesta completa
//   node rag.mjs status
//   node rag.mjs salud [vault] [--resumen] [--json]   huérfanas, enlaces rotos, caducas...

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as lib from "./rag-lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
lib.loadDotEnv(path.join(HERE, ".env"));
const RAG_ROOT = lib.resolverRagRoot(HERE);
const VAULT_DEFAULT = path.join(RAG_ROOT, "V.A.U.L.T");
const PG_URL = process.env.PG_URL || "postgres://rag:rag@localhost:5433/rag";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.EMBED_MODEL || "bge-m3";
const EMBED_BACKEND_DEFAULT = (process.env.EMBED_BACKEND || "ollama").trim().toLowerCase();
const DIMS = 1024;
const NO_DISPONIBLE = "rag no disponible: arranca Docker Desktop y Ollama";

// --- Backends de embeddings conmutables ---------------------------------------------------
// `ollama` y `remote` comparten implementación: `remote` solo apunta OLLAMA_URL a otra máquina.
// `kaggle` vive en un módulo aparte importado dinámicamente; si falla, se cae a Ollama.
let avisoKaggleQueryEmitido = false;

async function embedOllama(texts) {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
        signal: AbortSignal.timeout(300_000),
    });
    if (!res.ok) throw new Error(`embed de ollama devolvió HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const vecs = data.embeddings;
    if (!Array.isArray(vecs) || vecs.length !== texts.length || vecs[0].length !== DIMS) {
        throw new Error(`forma de embedding inesperada desde ${EMBED_MODEL}`);
    }
    return vecs;
}

// Regla dura: una consulta (`forQuery: true`) nunca usa kaggle — es asíncrono por lotes.
async function embed(texts, { backend, forQuery = false } = {}) {
    let effective = (backend || EMBED_BACKEND_DEFAULT || "ollama").trim().toLowerCase();
    if (effective === "kaggle" && forQuery) {
        if (!avisoKaggleQueryEmitido) {
            console.error("rag: aviso — EMBED_BACKEND=kaggle no sirve consultas en vivo; usando Ollama local para esta query.");
            avisoKaggleQueryEmitido = true;
        }
        effective = "ollama";
    }
    if (effective === "kaggle") {
        try {
            const mod = await import("./kaggle-embed.mjs");
            const vecs = await mod.embedKaggle(texts);
            if (vecs) return vecs;
        } catch (e) {
            console.error(`rag: no se pudo usar el backend kaggle (${e.message}) — usando Ollama local.`);
        }
        return embedOllama(texts);
    }
    return embedOllama(texts);
}

// Comprobación rápida (3 s) de que Ollama responde, antes de un ingest.
async function pingOllama() {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`ollama HTTP ${res.status}`);
}

// --- Base de datos -------------------------------------------------------------------------

async function conectar() {
    const client = new pg.Client({ connectionString: PG_URL, connectionTimeoutMillis: 3000 });
    await client.connect();
    return client;
}

async function withDb(fn) {
    const client = await conectar();
    try { return await fn(client); } finally { await client.end(); }
}

async function cmdInit() {
    await withDb(db => db.query(fs.readFileSync(path.join(HERE, "schema.sql"), "utf8")));
    console.log("rag: schema aplicado");
}

async function cmdStatus() {
    let ollama = "caído";
    try {
        const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (r.ok) ollama = (await r.json()).models?.some(m => m.name.startsWith(EMBED_MODEL))
            ? `activo (${EMBED_MODEL} presente)` : `activo (falta ${EMBED_MODEL} — ejecuta: ollama pull ${EMBED_MODEL})`;
    } catch {}
    const backendInfo = EMBED_BACKEND_DEFAULT === "kaggle"
        ? `kaggle (solo ingest/reindex por lotes — las consultas siempre usan ollama en ${OLLAMA_URL})`
        : `${EMBED_BACKEND_DEFAULT} → ${OLLAMA_URL}`;
    console.log(`backend de embeddings: ${backendInfo}`);
    try {
        await withDb(async db => {
            const tot = await db.query("SELECT count(*)::int AS n FROM chunks");
            const docs = await db.query("SELECT count(*)::int AS n FROM documentos");
            console.log(`db: activa — ${tot.rows[0].n} chunks, ${docs.rows[0].n} documentos | ollama: ${ollama}`);
            if (tot.rows[0].n > 0 && docs.rows[0].n === 0) {
                console.log("rag: schema migrado: ejecuta `reindex` para poblar `documentos` con la taxonomía nueva.");
                return;
            }
            const porCol = await db.query("SELECT coleccion, count(*)::int AS c FROM documentos GROUP BY 1 ORDER BY 2 DESC");
            const porProy = await db.query("SELECT coalesce(proyecto,'(ninguno)') AS p, count(*)::int AS c FROM documentos GROUP BY 1 ORDER BY 2 DESC");
            const porEstado = await db.query("SELECT estado, count(*)::int AS c FROM documentos GROUP BY 1 ORDER BY 2 DESC");
            console.log("  por colección:");
            for (const r of porCol.rows) console.log(`    ${r.coleccion}: ${r.c} documentos`);
            console.log("  por proyecto:");
            for (const r of porProy.rows) console.log(`    ${r.p}: ${r.c} documentos`);
            console.log("  por estado:");
            for (const r of porEstado.rows) console.log(`    ${r.estado}: ${r.c} documentos`);
        });
    } catch (e) {
        console.log(`db: CAÍDA (${e.message}) | ollama: ${ollama}`);
        process.exitCode = 1;
    }
}

// Provisionales — se reemplazan en las tareas 8, 9 y 10.
async function cmdIngest() { throw new Error("ingest: pendiente (tarea 8)"); }
async function cmdQuery() { throw new Error("query: pendiente (tarea 9)"); }
async function cmdReindex() { throw new Error("reindex: pendiente (tarea 10)"); }
async function cmdSalud() { throw new Error("salud: pendiente (tarea 10)"); }

// --- Despacho ------------------------------------------------------------------------------

const [cmd, ...rest] = process.argv.slice(2);
const opts = { json: rest.includes("--json"), silencioso: rest.includes("--silencioso"), resumen: rest.includes("--resumen") };
const FLAGS = ["--coleccion", "--proyecto", "--topk", "--backend"];
for (const f of FLAGS) { const i = rest.indexOf(f); if (i >= 0) opts[f.slice(2)] = rest[i + 1]; }
const positional = rest.filter((a, i) => !a.startsWith("--") && !FLAGS.includes(rest[i - 1]));

const USO = `uso: rag.mjs init | ingest [vault] [--backend ollama|remote|kaggle] [--silencioso] | query "<texto>" [--coleccion C] [--proyecto P] [--topk N] [--json] | reindex [vault] [--backend ...] | status | salud [vault] [--resumen] [--json]`;

try {
    if (cmd === "init") await cmdInit();
    else if (cmd === "ingest") await cmdIngest(positional[0], opts);
    else if (cmd === "query") await cmdQuery(positional[0], opts);
    else if (cmd === "reindex") await cmdReindex(positional[0], opts);
    else if (cmd === "status") await cmdStatus();
    else if (cmd === "salud") await cmdSalud(positional[0], opts);
    else { console.log(USO); process.exitCode = cmd ? 1 : 0; }
} catch (e) {
    console.error(`rag: error — ${e.message}`);
    process.exitCode = 1;
}
