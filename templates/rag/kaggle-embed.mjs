#!/usr/bin/env node
// Backend de embeddings por lotes vía Kaggle (GPU T4 gratuita). Módulo aparte para no
// engordar rag.mjs — este archivo se importa dinámicamente y solo se usa desde
// `ingest`/`reindex` (nunca desde `query`; esa regla dura vive en rag.mjs, no aquí).
//
// Ciclo completo (todo vía el CLI oficial `kaggle`):
//   1. Empaqueta los textos pendientes en staging/chunks.jsonl
//   2. kaggle datasets create|version -p staging   (dataset de entrada del kernel)
//   3. kaggle kernels push -p kaggle/              (publica/dispara el kernel)
//   4. poll kaggle kernels status hasta "complete" (con timeout configurable)
//   5. kaggle kernels output -p out/               (descarga los resultados)
//   6. lee out/embeddings.jsonl y devuelve los vectores en el orden de entrada
//
// Si el CLI de kaggle no está instalado, faltan credenciales, o cualquier paso del ciclo
// falla, se avisa por stderr con instrucciones concretas y se devuelve null — el llamador
// (rag.mjs) cae a Ollama sin que la ingesta se interrumpa.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STAGING_DIR = path.join(HERE, "staging");
const OUT_DIR = path.join(HERE, "out");
const KERNEL_DIR = path.join(HERE, "kaggle");
const DATASET_NAME = "claudemax-chunks";

const POLL_INTERVAL_MS = Number(process.env.KAGGLE_POLL_INTERVAL_MS || 15000);
const POLL_TIMEOUT_MS = Number(process.env.KAGGLE_POLL_TIMEOUT_MS || 20 * 60 * 1000);

function sh(cmd, args) {
    return new Promise((resolve, reject) => {
        execFile(cmd, args, { maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) reject(Object.assign(new Error(stderr || err.message), { stdout, stderr }));
            else resolve({ stdout, stderr });
        });
    });
}

async function kaggleCliDisponible() {
    try { await sh("kaggle", ["--version"]); return true; } catch { return false; }
}

function kaggleJsonPath() {
    const home = process.env.USERPROFILE || os.homedir();
    return path.join(home, ".kaggle", "kaggle.json");
}

// Usuario de kaggle: variable de entorno primero; si no, el kaggle.json local.
function usuarioKaggle() {
    if (process.env.KAGGLE_USERNAME) return process.env.KAGGLE_USERNAME;
    try {
        const raw = fs.readFileSync(kaggleJsonPath(), "utf8");
        return JSON.parse(raw).username || null;
    } catch { return null; }
}

function credencialesOk() {
    if (!usuarioKaggle()) return false;
    if (process.env.KAGGLE_KEY) return true;
    return fs.existsSync(kaggleJsonPath());
}

function avisoConfiguracion(motivo) {
    console.error(`rag: backend kaggle no disponible (${motivo}). Para habilitarlo:`);
    console.error("  1) pip install kaggle");
    console.error("  2) crea un token en https://www.kaggle.com/settings -> API -> Create New Token");
    console.error(`  3) coloca el archivo descargado en ${kaggleJsonPath()} (o define KAGGLE_USERNAME/KAGGLE_KEY en .env)`);
    console.error("  4) verifica tu cuenta por teléfono en kaggle.com (una sola vez) para habilitar GPU e Internet en los kernels");
    console.error("rag: usando Ollama local en su lugar.");
}

async function empaquetarChunks(texts) {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
    const lineas = texts.map((t, i) => JSON.stringify({ i, text: t }));
    fs.writeFileSync(path.join(STAGING_DIR, "chunks.jsonl"), lineas.join("\n") + "\n", "utf8");
    // dataset-metadata.json: lo escribimos en cada corrida para que el "id" siempre
    // coincida con el usuario de kaggle configurado (evita desajustes si cambia el .env).
    const metaFile = path.join(STAGING_DIR, "dataset-metadata.json");
    fs.writeFileSync(metaFile, JSON.stringify({
        title: DATASET_NAME,
        id: `${usuarioKaggle()}/${DATASET_NAME}`,
        licenses: [{ name: "CC0-1.0" }]
    }, null, 2), "utf8");
}

// La primera vez el dataset no existe todavía y `create` es lo correcto; en corridas
// siguientes `create` falla porque ya existe, así que se cae a `version` — evita tener
// que persistir en disco si es "la primera vez".
async function publicarDataset() {
    console.error("rag: kaggle — subiendo lote de chunks...");
    try {
        await sh("kaggle", ["datasets", "create", "-p", STAGING_DIR]);
    } catch {
        await sh("kaggle", ["datasets", "version", "-p", STAGING_DIR, "-m", `lote ${new Date().toISOString()}`]);
    }
}

async function publicarKernel() {
    console.error("rag: kaggle — publicando el kernel de embeddings...");
    await sh("kaggle", ["kernels", "push", "-p", KERNEL_DIR]);
}

async function esperarKernel(slug) {
    const inicio = Date.now();
    console.error(`rag: kaggle — esperando a que el kernel termine (timeout ${Math.round(POLL_TIMEOUT_MS / 60000)} min)...`);
    for (;;) {
        const { stdout } = await sh("kaggle", ["kernels", "status", slug]);
        const estado = stdout.trim();
        console.error(`rag: kaggle — estado: ${estado}`);
        if (/complete/i.test(estado)) return;
        if (/error|cancel/i.test(estado)) throw new Error(`el kernel de kaggle terminó con estado: ${estado}`);
        if (Date.now() - inicio > POLL_TIMEOUT_MS) throw new Error("tiempo de espera agotado esperando el kernel de kaggle");
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
}

async function descargarResultados(slug) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.error("rag: kaggle — descargando resultados...");
    await sh("kaggle", ["kernels", "output", slug, "-p", OUT_DIR]);
}

// Lee out/embeddings.jsonl (una línea {"i":<indice>,"v":[...]} por chunk) y devuelve los
// vectores reordenados según `i`, que es el mismo índice usado en chunks.jsonl al empaquetar.
function leerEmbeddings(cantidadEsperada) {
    const file = path.join(OUT_DIR, "embeddings.jsonl");
    if (!fs.existsSync(file)) throw new Error(`no se encontró ${file} en la salida del kernel`);
    const vecs = new Array(cantidadEsperada);
    for (const linea of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
        if (!linea.trim()) continue;
        const { i, v } = JSON.parse(linea);
        vecs[i] = v;
    }
    if (vecs.some(v => !Array.isArray(v))) throw new Error("faltan vectores en embeddings.jsonl del kernel de kaggle");
    return vecs;
}

// Punto de entrada. Devuelve los vectores en el mismo orden que `texts`, o null si el
// backend no está disponible o el ciclo falla — el llamador (rag.mjs) cae a Ollama.
export async function embedKaggle(texts) {
    if (!(await kaggleCliDisponible())) {
        avisoConfiguracion("no se encontró el CLI 'kaggle' en el PATH");
        return null;
    }
    if (!credencialesOk()) {
        avisoConfiguracion("faltan credenciales de kaggle");
        return null;
    }
    const slug = process.env.KAGGLE_KERNEL_SLUG;
    if (!slug) {
        console.error("rag: falta KAGGLE_KERNEL_SLUG en .env (formato <usuario>/claudemax-embed) — usando Ollama local.");
        return null;
    }
    try {
        await empaquetarChunks(texts);
        await publicarDataset();
        await publicarKernel();
        await esperarKernel(slug);
        await descargarResultados(slug);
        const vecs = leerEmbeddings(texts.length);
        console.error(`rag: kaggle — ${vecs.length} embeddings recibidos.`);
        return vecs;
    } catch (e) {
        console.error(`rag: falló el ciclo de kaggle (${e.message}) — usando Ollama local.`);
        return null;
    }
}
