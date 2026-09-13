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

// --- ingest (spec §3.2 y §3.4) -------------------------------------------------------------

// Devuelve { ok, resumen } e imprime el resumen (o la línea de "no disponible").
async function ejecutarIngest(vault, opts = {}) {
    const resumen = { indexados: 0, sinCambios: 0, fallidos: [], desconocidas: [], sinFuentes: [], avisos: [] };
    let db;
    try {
        db = await conectar();
        await pingOllama();
    } catch (e) {
        if (db) await db.end().catch(() => {});
        console.log(`${NO_DISPONIBLE} (${e.message})`);
        return { ok: false, resumen };
    }
    try {
        const archivos = [...lib.walkVault(vault)];
        const vistos = new Set(archivos.map(a => a.rel));
        const indice = lib.indiceDeNotas(archivos);

        // 1. Borrar lo que ya no existe en disco.
        for (const r of (await db.query("SELECT source FROM documentos")).rows) {
            if (vistos.has(r.source)) continue;
            await db.query("DELETE FROM chunks WHERE source=$1", [r.source]);
            await db.query("DELETE FROM documentos WHERE source=$1", [r.source]);
        }

        // 2. Cada nota: sin cambios → solo vigencia; cambiada o nueva → reembeber en una transacción.
        const reemplazos = [];
        for (const { abs, rel } of archivos) {
            try {
                const bytes = fs.readFileSync(abs);
                const hash = lib.sha256(bytes);
                const { meta, body, aviso } = lib.parseFrontmatter(bytes.toString("utf8"));
                if (aviso) resumen.avisos.push(`${rel}: ${aviso}`);
                const clas = lib.clasificar(rel);
                if (!clas.conocida) resumen.desconocidas.push(rel);
                const fuentes = Array.isArray(meta.fuentes) ? meta.fuentes : [];
                if (clas.coleccion === "codigo" && !fuentes.length) resumen.sinFuentes.push(rel);
                const rutasFuente = lib.resolverFuentes(fuentes, RAG_ROOT);
                if (fuentes.length && !rutasFuente.length) resumen.avisos.push(`${rel}: fuentes sin coincidencias`);
                const firmaActual = lib.firmaDe(rutasFuente, RAG_ROOT);
                const revisar = /^\d{4}-\d{2}-\d{2}$/.test(meta.revisar || "") ? meta.revisar : null;
                if (Array.isArray(meta.reemplaza) && meta.reemplaza.length) reemplazos.push({ desde: rel, refs: meta.reemplaza });

                const prev = (await db.query("SELECT content_hash, firma_origen FROM documentos WHERE source=$1", [rel])).rows[0];
                if (prev && prev.content_hash === hash) {
                    resumen.sinCambios++;
                    // La nota no cambió: caduca si declara fuentes y su firma ya no coincide (o no queda ninguna).
                    const caduca = fuentes.length > 0 && (firmaActual === null || firmaActual !== prev.firma_origen);
                    await db.query("UPDATE documentos SET estado=$2, revisar=$3, fuentes=$4 WHERE source=$1",
                        [rel, caduca ? "caduca" : "vigente", revisar, fuentes]);
                    continue;
                }

                const titulo = lib.tituloDe(body, rel);
                const fecha = lib.extraerFecha(path.basename(rel), meta, fs.statSync(abs).mtimeMs);
                const tags = Array.isArray(meta.tags) ? meta.tags : [];
                const proyecto = meta.proyecto || null;
                const trozos = lib.chunkMarkdown(lib.limpiarWikilinks(body));
                const vecs = [];
                for (let i = 0; i < trozos.length; i += 16) {
                    vecs.push(...await embed(trozos.slice(i, i + 16).map(t => t.content), { backend: opts.backend }));
                }
                // La nota cambió: se bendice contra sus fuentes de hoy. Solo queda caduca si declara
                // fuentes y ninguna existe.
                const estado = fuentes.length > 0 && firmaActual === null ? "caduca" : "vigente";
                await db.query("BEGIN");
                try {
                    await db.query("DELETE FROM chunks WHERE source=$1", [rel]);
                    for (let i = 0; i < trozos.length; i++) {
                        await db.query(
                            `INSERT INTO chunks (source, coleccion, autoridad, proyecto, heading, orden, content, embedding)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                            [rel, clas.coleccion, clas.autoridad, proyecto, trozos[i].heading, trozos[i].orden, trozos[i].content, lib.toVec(vecs[i])]);
                    }
                    await db.query(
                        `INSERT INTO documentos (source, titulo, coleccion, autoridad, proyecto, tags, fecha, content_hash,
                                                 fuentes, firma_origen, estado, reemplazada_por, revisar, actualizado)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NULL,$12,now())
                         ON CONFLICT (source) DO UPDATE SET titulo=EXCLUDED.titulo, coleccion=EXCLUDED.coleccion,
                             autoridad=EXCLUDED.autoridad, proyecto=EXCLUDED.proyecto, tags=EXCLUDED.tags,
                             fecha=EXCLUDED.fecha, content_hash=EXCLUDED.content_hash, fuentes=EXCLUDED.fuentes,
                             firma_origen=EXCLUDED.firma_origen, estado=EXCLUDED.estado, reemplazada_por=NULL,
                             revisar=EXCLUDED.revisar, actualizado=now()`,
                        [rel, titulo, clas.coleccion, clas.autoridad, proyecto, tags, fecha, hash, fuentes, firmaActual, estado, revisar]);
                    await db.query("COMMIT");
                } catch (e) {
                    await db.query("ROLLBACK");
                    throw e;
                }
                resumen.indexados++;
            } catch (e) {
                resumen.fallidos.push(`${rel}: ${e.message}`);
            }
        }

        // 3. `reemplaza:` se recalcula desde cero en cada ingest, así el orden de archivos no
        //    importa y una nota que reemplazaba y desapareció libera a la reemplazada.
        await db.query("UPDATE documentos SET reemplazada_por = NULL WHERE reemplazada_por IS NOT NULL");
        for (const { desde, refs } of reemplazos) {
            for (const ref of refs) {
                const r = lib.resolverNombreNota(ref, indice);
                if (r.error) { resumen.avisos.push(`${desde}: reemplaza "${lib.normalizarReferencia(ref)}" — ${r.error}`); continue; }
                if (r.source === desde) continue;
                await db.query("UPDATE documentos SET reemplazada_por=$2 WHERE source=$1", [r.source, desde]);
            }
        }

        // 4. Estado final con precedencia: reemplazada > caduca > revisar > vigente.
        await db.query(`UPDATE documentos SET estado = CASE
            WHEN reemplazada_por IS NOT NULL THEN 'reemplazada'
            WHEN estado = 'caduca' THEN 'caduca'
            WHEN revisar IS NOT NULL AND revisar < CURRENT_DATE THEN 'revisar'
            ELSE 'vigente' END`);
    } finally {
        await db.end().catch(() => {});
    }

    console.log(`indexados: ${resumen.indexados} | sin cambios: ${resumen.sinCambios} | fallidos: ${resumen.fallidos.length}`);
    for (const f of resumen.fallidos) console.log(`  FALLO ${f}`);
    for (const a of resumen.avisos) console.log(`  aviso ${a}`);
    if (resumen.desconocidas.length) {
        console.log("  carpetas desconocidas (coleccion=otros; mueve la nota a una carpeta de la taxonomía):");
        for (const d of resumen.desconocidas) console.log(`    ${d}`);
    }
    if (resumen.sinFuentes.length) {
        console.log("  Codigo/ sin fuentes (no se puede detectar si caducó; añade `fuentes:` al frontmatter):");
        for (const s of resumen.sinFuentes) console.log(`    ${s}`);
    }
    return { ok: resumen.fallidos.length === 0, resumen };
}

async function cmdIngest(root, opts = {}) {
    const vault = path.resolve(root || VAULT_DEFAULT);
    const { ok } = await ejecutarIngest(vault, opts);
    if (!ok && !opts.silencioso) process.exitCode = 1;
}

// --- query (spec §3.5) ---------------------------------------------------------------------

async function cmdQuery(text, opts = {}) {
    if (!text) { console.log(USO); process.exitCode = 1; return; }
    let vec;
    try {
        [vec] = await embed([text], { backend: opts.backend, forQuery: true });
    } catch (e) {
        console.log(`${NO_DISPONIBLE} (${e.message})`);
        process.exitCode = 1;
        return;
    }
    // Sin filtro: fuera las colecciones de ruido y las notas reemplazadas. Con --coleccion:
    // exactamente esa colección, aunque sea de las excluidas.
    const params = [lib.toVec(vec), opts.coleccion || null, lib.EXCLUIDAS_POR_DEFECTO];
    const cond = [`(($2::text IS NULL AND NOT (c.coleccion = ANY($3::text[])) AND d.estado <> 'reemplazada') OR c.coleccion = $2)`];
    if (opts.proyecto) { params.push(opts.proyecto); cond.push(`c.proyecto = $${params.length}`); }
    params.push(lib.CON_BOOST);
    const iBoost = params.length;
    const topk = Number(opts.topk) > 0 ? Number(opts.topk) : 5;
    const sql = `SELECT c.source, d.titulo, c.coleccion, c.autoridad, c.proyecto, d.fecha, d.estado,
                        d.reemplazada_por, d.revisar, c.heading, c.content, 1 - (c.embedding <=> $1) AS score
                 FROM chunks c JOIN documentos d USING (source)
                 WHERE ${cond.join(" AND ")}
                 ORDER BY (c.embedding <=> $1) - CASE WHEN c.coleccion = ANY($${iBoost}::text[]) THEN ${lib.BOOST} ELSE 0 END
                 LIMIT ${topk}`;
    let rows;
    try {
        rows = await withDb(db => db.query(sql, params).then(r => r.rows));
    } catch (e) {
        console.log(`${NO_DISPONIBLE} (${e.message})`);
        process.exitCode = 1;
        return;
    }
    if (opts.json) { console.log(JSON.stringify(rows, null, 2)); return; }
    if (!rows.length) { console.log("rag: sin resultados"); return; }
    console.log(rows.map(lib.formatearResultado).join("\n\n---\n\n"));
}
// --- salud (spec §3.6) ---------------------------------------------------------------------

async function recogerSalud(vault) {
    const archivos = [...lib.walkVault(vault)];
    const { huerfanas, enlacesRotos } = lib.analizarHubs(vault, archivos);
    const sinFuentes = archivos
        .filter(a => lib.clasificar(a.rel).coleccion === "codigo")
        .filter(a => !(lib.parseFrontmatter(fs.readFileSync(a.abs, "utf8")).meta.fuentes || []).length)
        .map(a => a.rel);
    const salud = { huerfanas, enlacesRotos, caducas: [], revisar: [], reemplazadas: [], reemplazadasEnlazadas: [], sinFuentes, bd: true };
    try {
        await withDb(async db => {
            const { rows } = await db.query("SELECT source, estado, reemplazada_por, revisar FROM documentos WHERE estado <> 'vigente' ORDER BY source");
            for (const r of rows) {
                if (r.estado === "caduca") salud.caducas.push(r.source);
                else if (r.estado === "revisar") salud.revisar.push({ source: r.source, revisar: String(r.revisar instanceof Date ? r.revisar.toISOString() : r.revisar).slice(0, 10) });
                else if (r.estado === "reemplazada") salud.reemplazadas.push({ source: r.source, por: r.reemplazada_por });
            }
        });
        const huerf = new Set(huerfanas);
        salud.reemplazadasEnlazadas = salud.reemplazadas.filter(r => !huerf.has(r.source)).map(r => r.source);
    } catch {
        salud.bd = false;
    }
    return salud;
}

function resumenSalud(s) {
    const partes = [];
    if (s.caducas.length) partes.push(`${s.caducas.length} caducas`);
    if (s.revisar.length) partes.push(`${s.revisar.length} a revisar`);
    if (s.huerfanas.length) partes.push(`${s.huerfanas.length} huérfanas`);
    if (s.enlacesRotos.length) partes.push(`${s.enlacesRotos.length} enlaces rotos`);
    if (s.reemplazadasEnlazadas.length) partes.push(`${s.reemplazadasEnlazadas.length} reemplazadas aún enlazadas`);
    if (s.sinFuentes.length) partes.push(`${s.sinFuentes.length} Codigo/ sin fuentes`);
    if (!s.bd) partes.push("sin BD");
    return partes.length ? `salud: ${partes.join(" · ")}` : "salud: sin avisos";
}

async function cmdSalud(root, opts = {}) {
    const vault = path.resolve(root || VAULT_DEFAULT);
    const s = await recogerSalud(vault);
    if (opts.json) { console.log(JSON.stringify(s, null, 2)); return; }
    if (opts.resumen) { console.log(resumenSalud(s)); return; }
    const seccion = (titulo, items, fmt = x => x) => {
        if (!items.length) return;
        console.log(`${titulo} (${items.length}):`);
        for (const i of items) console.log(`  ${fmt(i)}`);
    };
    seccion("huérfanas", s.huerfanas);
    seccion("enlaces rotos", s.enlacesRotos, e => `${e.hub} → ${e.destino}`);
    seccion("caducas", s.caducas);
    seccion("a revisar", s.revisar, r => `${r.source} (venció ${r.revisar})`);
    seccion("reemplazadas aún enlazadas desde un hub", s.reemplazadasEnlazadas);
    seccion("Codigo/ sin fuentes", s.sinFuentes);
    if (!s.bd) console.log("(sin BD: no se pudieron leer los estados caduca/revisar/reemplazada)");
    console.log(resumenSalud(s));
}

// --- reindex -------------------------------------------------------------------------------

async function cmdReindex(root, opts = {}) {
    try {
        await withDb(db => db.query("TRUNCATE chunks, documentos"));
    } catch (e) {
        console.log(`${NO_DISPONIBLE} (${e.message})`);
        process.exitCode = 1;
        return;
    }
    await cmdIngest(root, opts);
}

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
