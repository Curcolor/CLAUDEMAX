#!/usr/bin/env node
// CLI de RAG de CLAUDEMAX. Implementación única para ingest/query/status; el
// wrapper MCP delega en este archivo. Config desde .env junto a este archivo (alternativa: variables de entorno).
//   node rag.mjs init                 aplica schema.sql
//   node rag.mjs ingest [path]        ruta por defecto: ../V.A.U.L.T
//   node rag.mjs query "<texto>" [--project P] [--categoria C] [--proyecto P] [--topk N] [--json]
//   node rag.mjs reindex [path]       trunca + ingesta completa
//   node rag.mjs status

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
loadDotEnv(path.join(HERE, ".env"));
const PG_URL = process.env.PG_URL || "postgres://rag:rag@localhost:5433/rag";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.EMBED_MODEL || "bge-m3";
const DIMS = 1024;

function loadDotEnv(file) {
    try {
        for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
            const m = line.match(/^([A-Z_]+)=(.*)$/);
            if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
        }
    } catch {}
}

async function embed(texts) {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: EMBED_MODEL, input: texts })
    });
    if (!res.ok) throw new Error(`embed de ollama devolvió HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const vecs = data.embeddings;
    if (!Array.isArray(vecs) || vecs.length !== texts.length || vecs[0].length !== DIMS) {
        throw new Error(`forma de embedding inesperada desde ${EMBED_MODEL}`);
    }
    return vecs;
}

function toVec(v) { return `[${v.join(",")}]`; }

// Quita un comentario en línea (" # ...") de un valor escalar YAML y las comillas envolventes.
function stripYamlComment(value) {
    const i = value.search(/\s#/);
    let v = (i >= 0 ? value.slice(0, i) : value).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
    }
    return v;
}

// Extrae el bloque de frontmatter YAML inicial ("---\n...\n---") sin dependencias externas.
// Soporta escalares (categoria, proyecto, fecha, fuente, ...) y `tags` en línea ([a, b]) o
// en bloque ("- item" en las líneas siguientes). Devuelve { meta, body } donde `body` es el
// texto sin el frontmatter — lo que efectivamente se trocea.
function parseFrontmatter(text) {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!m) return { meta: {}, body: text };
    const meta = {};
    const lines = m[1].split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const kv = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!kv) continue;
        const [, key, rawValue] = kv;
        if (key === "tags") {
            const value = stripYamlComment(rawValue);
            if (value.startsWith("[")) {
                const inner = value.replace(/^\[/, "").replace(/\]$/, "");
                meta.tags = inner.split(",").map(s => stripYamlComment(s)).filter(Boolean);
            } else if (!value) {
                const tags = [];
                let j = i + 1;
                while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
                    tags.push(stripYamlComment(lines[j].replace(/^\s*-\s+/, "")));
                    j++;
                }
                meta.tags = tags;
                i = j - 1;
            } else {
                meta.tags = [value];
            }
        } else {
            meta[key] = stripYamlComment(rawValue);
        }
    }
    const body = text.slice(m[0].length);
    return { meta, body };
}

// Divide un archivo markdown en chunks de ~500 tokens (heurística de ~4 caracteres/token)
// en los límites de los encabezados, con un solapamiento de ~50 tokens entre chunks adyacentes.
function chunkMarkdown(text) {
    const MAX = 2000, OVERLAP = 200;
    const lines = text.split(/\r?\n/);
    const out = [];
    let heading = "", buf = [];
    const flush = () => {
        const body = buf.join("\n").trim();
        if (!body) { buf = []; return; }
        for (let i = 0; i < body.length; i += MAX - OVERLAP) {
            const piece = body.slice(i, i + MAX).trim();
            if (piece) out.push({ heading, content: piece });
            if (i + MAX >= body.length) break;
        }
        buf = [];
    };
    for (const line of lines) {
        const h = line.match(/^#{1,6}\s+(.*)$/);
        if (h) { flush(); heading = h[1].trim(); }
        buf.push(line);
    }
    flush();
    return out;
}

// Categoría (Bloque 1, taxonomía) inferida de la primera carpeta bajo el root del vault.
const CATEGORIA_POR_CARPETA = {
    Codigo: "codigo",
    Proyectos: "proyectos",
    Organizacion: "organizacion",
    Investigacion: "investigacion",
    Aprendizaje: "aprendizaje",
    Journal: "personal",
};

// meta.categoria (frontmatter) manda; si falta, se infiere de la carpeta. 00-Inbox y
// cualquier carpeta no reconocida quedan sin categoría (null).
function categoriaOf(file, root, meta) {
    if (meta && meta.categoria) return meta.categoria;
    const rel = path.relative(root, file).split(path.sep);
    return CATEGORIA_POR_CARPETA[rel[0]] || null;
}

// meta.proyecto (frontmatter) manda sobre la inferencia por carpeta; es la clave transversal
// que relaciona notas de distintas categorías. Se infiere de Proyectos/<nombre> o Codigo/<nombre>
// (la subcarpeta es el nombre del proyecto); Journal/ usa el pseudo-proyecto "journal".
function projectOf(file, root, meta) {
    if (meta && meta.proyecto) return meta.proyecto;
    const rel = path.relative(root, file).split(path.sep);
    for (const carpeta of ["Proyectos", "Codigo"]) {
        const i = rel.indexOf(carpeta);
        // Solo cuenta como proyecto si es un subdirectorio (no un archivo suelto en la carpeta)
        if (i >= 0 && rel[i + 1] && rel.length > i + 2) return rel[i + 1];
    }
    if (rel[0] === "Journal") return "journal";
    return null;
}

function* walkMd(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith(".") || e.name === "node_modules") continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) yield* walkMd(p);
        else if (e.name.endsWith(".md")) yield p;
    }
}

async function withDb(fn) {
    const client = new pg.Client({ connectionString: PG_URL });
    await client.connect();
    try { return await fn(client); } finally { await client.end(); }
}

async function cmdInit() {
    await withDb(async db => {
        await db.query(fs.readFileSync(path.join(HERE, "schema.sql"), "utf8"));
    });
    console.log("rag: schema aplicado");
}

async function cmdIngest(root) {
    root = path.resolve(root || path.join(HERE, "..", "V.A.U.L.T"));
    let added = 0, skipped = 0, sinCategoria = 0;
    const seen = new Set();
    await withDb(async db => {
        for (const file of walkMd(root)) {
            seen.add(file);
            const raw = fs.readFileSync(file, "utf8");
            const { meta, body } = parseFrontmatter(raw);
            const mtime = fs.statSync(file).mtime;
            const project = projectOf(file, root, meta);
            const categoria = categoriaOf(file, root, meta);
            const tags = Array.isArray(meta.tags) ? meta.tags : [];
            if (!categoria) sinCategoria++;
            const chunks = chunkMarkdown(body);
            const fresh = [];
            for (const c of chunks) {
                const hash = crypto.createHash("sha1").update(c.content).digest("hex");
                const { rowCount } = await db.query(
                    "SELECT 1 FROM chunks WHERE source=$1 AND content_hash=$2", [file, hash]);
                if (rowCount) { skipped++; } else { fresh.push({ ...c, hash }); }
            }
            if (fresh.length) {
                const vecs = await embed(fresh.map(c => c.content));
                await db.query("DELETE FROM chunks WHERE source=$1", [file]);
                for (let i = 0; i < fresh.length; i++) {
                    const c = fresh[i];
                    await db.query(
                        `INSERT INTO chunks (source, project, categoria, proyecto, tags, heading, content, content_hash, mtime, embedding)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                        [file, project, categoria, project, tags, c.heading, c.content, c.hash, mtime, toVec(vecs[i])]);
                    added++;
                }
            }
        }
        const { rows } = await db.query("SELECT DISTINCT source FROM chunks");
        for (const r of rows) {
            if (r.source.startsWith(root) && !seen.has(r.source)) {
                await db.query("DELETE FROM chunks WHERE source=$1", [r.source]);
            }
        }
    });
    console.log(`rag: ingesta completa — ${added} chunks añadidos, ${skipped} sin cambios`);
    if (sinCategoria) console.log(`rag: aviso — ${sinCategoria} archivo(s) sin categoría (añade "categoria" al frontmatter o mueve la nota a una carpeta reconocida)`);
}

async function cmdQuery(text, opts) {
    const [vec] = await embed([text]);
    const params = [toVec(vec)];
    // WHERE dinámico: cada filtro activo añade su placeholder numerado según la posición
    // real en `params` (no un número fijo), así son combinables en cualquier orden.
    const conditions = [];
    if (opts.project) { params.push(opts.project); conditions.push(`project = $${params.length}`); }
    if (opts.categoria) { params.push(opts.categoria); conditions.push(`categoria = $${params.length}`); }
    if (opts.proyecto) { params.push(opts.proyecto); conditions.push(`proyecto = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const topk = opts.topk || 5;
    const rows = await withDb(db => db.query(
        `SELECT source, project, categoria, proyecto, heading, content, 1 - (embedding <=> $1) AS score
         FROM chunks ${where} ORDER BY embedding <=> $1 LIMIT ${Number(topk)}`,
        params).then(r => r.rows));
    if (opts.json) { console.log(JSON.stringify(rows, null, 2)); return; }
    for (const r of rows) {
        const cat = r.categoria ? `[${r.categoria}] ` : "";
        console.log(`--- ${cat}${r.source}${r.heading ? " · " + r.heading : ""} (score ${Number(r.score).toFixed(3)})`);
        console.log(r.content.slice(0, 600) + (r.content.length > 600 ? " …" : ""));
    }
    if (!rows.length) console.log("rag: sin resultados");
}

async function cmdReindex(root) {
    await withDb(db => db.query("TRUNCATE chunks"));
    await cmdIngest(root);
}

async function cmdStatus() {
    let ollama = "caído";
    try {
        const r = await fetch(`${OLLAMA_URL}/api/tags`);
        if (r.ok) ollama = (await r.json()).models?.some(m => m.name.startsWith(EMBED_MODEL))
            ? `activo (${EMBED_MODEL} presente)` : `activo (falta ${EMBED_MODEL} — ejecuta: ollama pull ${EMBED_MODEL})`;
    } catch {}
    try {
        await withDb(async db => {
            const tot = await db.query("SELECT count(*) FROM chunks");
            const per = await db.query(
                "SELECT coalesce(project,'(ninguno)') p, count(*) c, max(mtime) m FROM chunks GROUP BY 1 ORDER BY 2 DESC");
            const perCat = await db.query(
                "SELECT coalesce(categoria,'(sin categoría)') cat, count(*) c FROM chunks GROUP BY 1 ORDER BY 2 DESC");
            console.log(`db: activa — ${tot.rows[0].count} chunks | ollama: ${ollama}`);
            console.log("  por proyecto:");
            for (const r of per.rows) console.log(`    ${r.p}: ${r.c} chunks (nota más reciente ${r.m ? r.m.toISOString().slice(0, 10) : "-"})`);
            console.log("  por categoría:");
            for (const r of perCat.rows) console.log(`    ${r.cat}: ${r.c} chunks`);
        });
    } catch (e) {
        console.log(`db: CAÍDA (${e.message}) | ollama: ${ollama}`);
        process.exitCode = 1;
    }
}

const [cmd, ...rest] = process.argv.slice(2);
const opts = { json: rest.includes("--json") };
const FLAGS = ["--project", "--categoria", "--proyecto", "--topk"];
const pi = rest.indexOf("--project"); if (pi >= 0) opts.project = rest[pi + 1];
const ci = rest.indexOf("--categoria"); if (ci >= 0) opts.categoria = rest[ci + 1];
const oi = rest.indexOf("--proyecto"); if (oi >= 0) opts.proyecto = rest[oi + 1];
const ki = rest.indexOf("--topk"); if (ki >= 0) opts.topk = Number(rest[ki + 1]);
const positional = rest.filter((a, i) =>
    !a.startsWith("--") && !FLAGS.includes(rest[i - 1]));

try {
    if (cmd === "init") await cmdInit();
    else if (cmd === "ingest") await cmdIngest(positional[0]);
    else if (cmd === "query") await cmdQuery(positional[0], opts);
    else if (cmd === "reindex") await cmdReindex(positional[0]);
    else if (cmd === "status") await cmdStatus();
    else {
        console.log("uso: rag.mjs init | ingest [path] | query \"<texto>\" [--project P] [--categoria C] [--proyecto P] [--topk N] [--json] | reindex [path] | status");
        process.exitCode = cmd ? 1 : 0;
    }
} catch (e) {
    console.error(`rag: error — ${e.message}`);
    process.exitCode = 1;
}
