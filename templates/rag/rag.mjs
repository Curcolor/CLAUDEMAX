#!/usr/bin/env node
// CLI de RAG de CLAUDEMAX. Implementación única para ingest/query/status; el
// wrapper MCP delega en este archivo. Config desde .env junto a este archivo (alternativa: variables de entorno).
//   node rag.mjs init                 aplica schema.sql
//   node rag.mjs ingest [path] [--backend ollama|remote|kaggle]
//   node rag.mjs query "<texto>" [--categoria C] [--proyecto P] [--topk N] [--json]
//   node rag.mjs reindex [path] [--backend ollama|remote|kaggle]   trunca + ingesta completa
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
const EMBED_BACKEND_DEFAULT = (process.env.EMBED_BACKEND || "ollama").trim().toLowerCase();
const DIMS = 1024;

function loadDotEnv(file) {
    try {
        for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
            const m = line.match(/^([A-Z_]+)=(.*)$/);
            if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
        }
    } catch {}
}

// --- Backends de embeddings conmutables (Bloque 2, subproyecto F) ---------------------
// `ollama` y `remote` comparten esta misma implementación: `remote` solo apunta OLLAMA_URL
// a otra máquina de la LAN, sin código adicional. `kaggle` vive en un módulo aparte que se
// importa dinámicamente — si ese archivo no existe o falla, rag.mjs sigue funcionando con
// Ollama sin caerse.
let avisoKaggleQueryEmitido = false;

async function embedOllama(texts) {
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

// Despacha al backend efectivo. `backend` (viene de --backend) sobrescribe EMBED_BACKEND
// del .env solo para esta corrida. Regla dura: una consulta (`forQuery: true`) nunca usa
// kaggle — es un backend asíncrono por lotes y no puede responder en el bucle interactivo
// de `query`, así que se avisa una vez por stderr y se cae a Ollama local.
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
    // "ollama" y "remote" son la misma llamada; remote solo cambia OLLAMA_URL en .env.
    return embedOllama(texts);
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

// Aplana un grafo de conocimiento de Graphify/Understand-Anything (.ua/knowledge-graph.json
// o .ua/domain-graph.json) a chunks de texto indexable, uno por nodo. El esquema real varía
// entre versiones del plugin (se ha visto `name`/`filePath` y también `label`/`path`), así
// que se detectan las claves que existan en vez de asumir un formato fijo. Si no hay un
// array "nodes" reconocible, se avisa por stderr y se omite el archivo sin lanzar excepción.
function flattenGraph(json, file) {
    if (!json || typeof json !== "object" || !Array.isArray(json.nodes)) {
        console.error(`rag: aviso — ${file} no tiene un array "nodes" reconocible; se omite`);
        return [];
    }
    const edges = Array.isArray(json.edges) ? json.edges : [];
    // Índice de aristas por nodo origen, para adjuntar "Relaciones:" al chunk de cada nodo.
    const edgesPorNodo = new Map();
    for (const e of edges) {
        if (!e) continue;
        const src = e.source ?? e.from ?? e.src;
        if (src == null) continue;
        if (!edgesPorNodo.has(src)) edgesPorNodo.set(src, []);
        edgesPorNodo.get(src).push(e);
    }
    const out = [];
    for (const node of json.nodes) {
        if (!node) continue;
        const id = node.id ?? node.name ?? node.label;
        const label = node.label || node.name || (id != null ? String(id) : "(sin nombre)");
        const tipo = node.type || node.kind || "";
        const resumen = node.summary || node.description || "";
        const ruta = node.path || node.filePath || node.file || "";
        const relaciones = (edgesPorNodo.get(id) || []).map(e => {
            const destino = e.target ?? e.to ?? e.dst ?? "?";
            const tipoArista = e.type || e.label || "relacionado con";
            return `${tipoArista} → ${destino}`;
        });
        const header = `${label}${tipo ? ` (${tipo})` : ""}${ruta ? ` — ${ruta}` : ""}`;
        const lineas = [header];
        if (resumen) lineas.push(resumen);
        if (relaciones.length) lineas.push(`Relaciones: ${relaciones.join("; ")}`);
        out.push({ heading: label, content: lineas.join("\n") });
    }
    return out;
}

// Categoría (Bloque 1, taxonomía) inferida de la primera carpeta bajo el root del vault.
// Semántica completa de cada categoría/carpeta: templates/vault/README.md y el README.md
// propio de cada carpeta (skills/rituales/SKILL.md la repite para quien escribe notas):
//   Codigo         → repos, arquitectura, snippets, grafos de Graphify.
//   Proyectos      → planes, decisiones, sprints, specs.
//   Organizacion   → parte legal y conceptual de la organización (miembros, estatutos,
//                    contratos, marca, procesos internos, clientes).
//   Investigacion  → lo que se pregunta e investiga para decidir algo (comparativas,
//                    estilos de diseño, papers, PDFs parseados, transcripciones).
//   Aprendizaje    → errores cometidos y su lección (postmortems), NO apuntes de tecnologías.
//   Journal        → categoria "personal", tag personal/bitacora: bitácoras del día completo.
// 00-Inbox/ no está en este mapa porque su categoría ("personal", tag personal/sesion —
// continuidad entre sesiones, la escribe el ritual fin-sesion) siempre llega vía frontmatter
// explícito, nunca por inferencia de carpeta.
const CATEGORIA_POR_CARPETA = {
    Codigo: "codigo",
    Proyectos: "proyectos",
    Organizacion: "organizacion",
    Investigacion: "investigacion",
    Aprendizaje: "aprendizaje",
    Journal: "personal",
};

// meta.categoria (frontmatter) manda; si falta, se infiere de la carpeta. 00-Inbox y
// cualquier carpeta no reconocida quedan sin categoría (null) si además falta el frontmatter
// — en la práctica esto no pasa con notas de 00-Inbox porque el ritual fin-sesion siempre
// escribe categoria: personal explícitamente.
function categoriaOf(file, root, meta) {
    if (meta && meta.categoria) return meta.categoria;
    const rel = path.relative(root, file).split(path.sep);
    return CATEGORIA_POR_CARPETA[rel[0]] || null;
}

// meta.proyecto (frontmatter) manda sobre la inferencia por carpeta; es la clave transversal
// que relaciona notas de distintas categorías. Se infiere de Proyectos/<nombre> o Codigo/<nombre>
// (la subcarpeta es el nombre del proyecto); Journal/ usa el pseudo-proyecto "journal". Las
// notas de 00-Inbox (ritual fin-sesion) traen su propio "proyecto" en el frontmatter.
function proyectoOf(file, root, meta) {
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

// Recorre el árbol de archivos indexables: notas .md del vault y grafos de Graphify
// (.ua/knowledge-graph.json, .ua/domain-graph.json). Ignora carpetas ocultas salvo `.ua`,
// que es donde Understand-Anything deja el grafo de cada repo.
function* walkSources(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name === "node_modules") continue;
            if (e.name.startsWith(".") && e.name !== ".ua") continue;
            yield* walkSources(p);
        } else if (e.name.endsWith(".md")) {
            yield p;
        } else if (e.name === "knowledge-graph.json" || e.name === "domain-graph.json") {
            yield p;
        }
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

async function cmdIngest(root, opts = {}) {
    root = path.resolve(root || path.join(HERE, "..", "V.A.U.L.T"));
    let added = 0, skipped = 0, sinCategoria = 0, grafosOmitidos = 0;
    const seen = new Set();
    await withDb(async db => {
        for (const file of walkSources(root)) {
            seen.add(file);
            const base = path.basename(file);
            const esGrafo = base === "knowledge-graph.json" || base === "domain-graph.json";

            let meta, chunks;
            if (esGrafo) {
                let json;
                try {
                    json = JSON.parse(fs.readFileSync(file, "utf8"));
                } catch (e) {
                    console.error(`rag: aviso — ${file} no es JSON válido; se omite (${e.message})`);
                    grafosOmitidos++;
                    continue;
                }
                // proyecto = nombre de la carpeta del repo que contiene .ua/ (el padre de .ua/)
                const repo = path.basename(path.dirname(path.dirname(file)));
                meta = { categoria: "codigo", proyecto: repo, tags: [] };
                chunks = flattenGraph(json, file);
                if (!chunks.length) { grafosOmitidos++; continue; }
            } else {
                const raw = fs.readFileSync(file, "utf8");
                const parsed = parseFrontmatter(raw);
                meta = parsed.meta;
                chunks = chunkMarkdown(parsed.body);
            }

            const mtime = fs.statSync(file).mtime;
            const proyecto = proyectoOf(file, root, meta);
            const categoria = categoriaOf(file, root, meta);
            const tags = Array.isArray(meta.tags) ? meta.tags : [];
            if (!categoria) sinCategoria++;
            const fresh = [];
            for (const c of chunks) {
                const hash = crypto.createHash("sha1").update(c.content).digest("hex");
                const { rowCount } = await db.query(
                    "SELECT 1 FROM chunks WHERE source=$1 AND content_hash=$2", [file, hash]);
                if (rowCount) { skipped++; } else { fresh.push({ ...c, hash }); }
            }
            if (fresh.length) {
                const vecs = await embed(fresh.map(c => c.content), { backend: opts.backend });
                await db.query("DELETE FROM chunks WHERE source=$1", [file]);
                for (let i = 0; i < fresh.length; i++) {
                    const c = fresh[i];
                    await db.query(
                        `INSERT INTO chunks (source, categoria, proyecto, tags, heading, content, content_hash, mtime, embedding)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                        [file, categoria, proyecto, tags, c.heading, c.content, c.hash, mtime, toVec(vecs[i])]);
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
    if (grafosOmitidos) console.log(`rag: aviso — ${grafosOmitidos} grafo(s) de Graphify omitido(s) (JSON inválido o sin "nodes")`);
}

async function cmdQuery(text, opts) {
    // forQuery:true aplica la regla dura del Bloque 2: kaggle nunca sirve una consulta.
    const [vec] = await embed([text], { backend: opts.backend, forQuery: true });
    const params = [toVec(vec)];
    // WHERE dinámico: cada filtro activo añade su placeholder numerado según la posición
    // real en `params` (no un número fijo), así son combinables en cualquier orden.
    const conditions = [];
    if (opts.categoria) { params.push(opts.categoria); conditions.push(`categoria = $${params.length}`); }
    if (opts.proyecto) { params.push(opts.proyecto); conditions.push(`proyecto = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const topk = opts.topk || 5;
    const rows = await withDb(db => db.query(
        `SELECT source, categoria, proyecto, heading, content, 1 - (embedding <=> $1) AS score
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

async function cmdReindex(root, opts) {
    await withDb(db => db.query("TRUNCATE chunks"));
    await cmdIngest(root, opts);
}

async function cmdStatus() {
    let ollama = "caído";
    try {
        const r = await fetch(`${OLLAMA_URL}/api/tags`);
        if (r.ok) ollama = (await r.json()).models?.some(m => m.name.startsWith(EMBED_MODEL))
            ? `activo (${EMBED_MODEL} presente)` : `activo (falta ${EMBED_MODEL} — ejecuta: ollama pull ${EMBED_MODEL})`;
    } catch {}
    const backendInfo = EMBED_BACKEND_DEFAULT === "kaggle"
        ? `kaggle (solo ingest/reindex por lotes — las consultas siempre usan ollama en ${OLLAMA_URL})`
        : `${EMBED_BACKEND_DEFAULT} → ${OLLAMA_URL}`;
    try {
        await withDb(async db => {
            const tot = await db.query("SELECT count(*) FROM chunks");
            const per = await db.query(
                "SELECT coalesce(proyecto,'(ninguno)') p, count(*) c, max(mtime) m FROM chunks GROUP BY 1 ORDER BY 2 DESC");
            const perCat = await db.query(
                "SELECT coalesce(categoria,'(sin categoría)') cat, count(*) c FROM chunks GROUP BY 1 ORDER BY 2 DESC");
            console.log(`backend de embeddings: ${backendInfo}`);
            console.log(`db: activa — ${tot.rows[0].count} chunks | ollama: ${ollama}`);
            console.log("  por proyecto:");
            for (const r of per.rows) console.log(`    ${r.p}: ${r.c} chunks (nota más reciente ${r.m ? r.m.toISOString().slice(0, 10) : "-"})`);
            console.log("  por categoría:");
            for (const r of perCat.rows) console.log(`    ${r.cat}: ${r.c} chunks`);
        });
    } catch (e) {
        console.log(`backend de embeddings: ${backendInfo}`);
        console.log(`db: CAÍDA (${e.message}) | ollama: ${ollama}`);
        process.exitCode = 1;
    }
}

const [cmd, ...rest] = process.argv.slice(2);
const opts = { json: rest.includes("--json") };
const FLAGS = ["--categoria", "--proyecto", "--topk", "--backend"];
const ci = rest.indexOf("--categoria"); if (ci >= 0) opts.categoria = rest[ci + 1];
const oi = rest.indexOf("--proyecto"); if (oi >= 0) opts.proyecto = rest[oi + 1];
const ki = rest.indexOf("--topk"); if (ki >= 0) opts.topk = Number(rest[ki + 1]);
const bi = rest.indexOf("--backend"); if (bi >= 0) opts.backend = rest[bi + 1];
const positional = rest.filter((a, i) =>
    !a.startsWith("--") && !FLAGS.includes(rest[i - 1]));

try {
    if (cmd === "init") await cmdInit();
    else if (cmd === "ingest") await cmdIngest(positional[0], opts);
    else if (cmd === "query") await cmdQuery(positional[0], opts);
    else if (cmd === "reindex") await cmdReindex(positional[0], opts);
    else if (cmd === "status") await cmdStatus();
    else {
        console.log("uso: rag.mjs init | ingest [path] [--backend ollama|remote|kaggle] | query \"<texto>\" [--categoria C] [--proyecto P] [--topk N] [--json] | reindex [path] [--backend ollama|remote|kaggle] | status");
        process.exitCode = cmd ? 1 : 0;
    }
} catch (e) {
    console.error(`rag: error — ${e.message}`);
    process.exitCode = 1;
}
