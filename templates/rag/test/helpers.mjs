// Utilidades para las pruebas de integración: un Ollama falso con embeddings deterministas,
// copia mutable del vault de prueba y conexión a la BD de prueba (se salta si no responde).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const RAG_DIR = path.join(HERE, "..");
export const RAG_MJS = path.join(RAG_DIR, "rag.mjs");
export const FIXTURES = path.join(HERE, "fixtures");
export const TEST_PG_URL = process.env.RAG_TEST_PG_URL || "postgres://rag:rag@localhost:5433/rag_test";

// Vector de 1024 dimensiones a partir de trigramas de caracteres: textos iguales dan vectores
// iguales y textos parecidos, vectores cercanos — suficiente para probar ranking y boost.
export function embeddingFalso(texto) {
    const v = new Float64Array(1024);
    const t = String(texto).toLowerCase();
    for (let i = 0; i + 3 <= t.length; i++) {
        let h = 2166136261;
        for (const ch of t.slice(i, i + 3)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
        v[h % 1024] += 1;
    }
    let norma = 0;
    for (const x of v) norma += x * x;
    norma = Math.sqrt(norma) || 1;
    return Array.from(v, x => x / norma);
}

export async function arrancarOllamaFalso() {
    let llamadas = 0;
    const server = http.createServer((req, res) => {
        if (req.url === "/api/tags") {
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ models: [{ name: "bge-m3:latest" }] }));
            return;
        }
        if (req.url === "/api/embed") {
            let body = "";
            req.on("data", c => { body += c; });
            req.on("end", () => {
                llamadas++;
                const { input } = JSON.parse(body);
                const arr = Array.isArray(input) ? input : [input];
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify({ embeddings: arr.map(embeddingFalso) }));
            });
            return;
        }
        res.statusCode = 404; res.end();
    });
    await new Promise(r => server.listen(0, "127.0.0.1", r));
    return {
        url: `http://127.0.0.1:${server.address().port}`,
        llamadas: () => llamadas,
        cerrar: () => new Promise(r => server.close(r)),
    };
}

// Copia test/fixtures/ a un directorio temporal: las pruebas editan y borran archivos.
export function copiarFixtures() {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ragv2-"));
    fs.cpSync(FIXTURES, tmp, { recursive: true });
    return { root: tmp, vault: path.join(tmp, "vault"), limpiar: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

// ¿Responde la BD de prueba? Si no, las pruebas de integración se saltan.
export async function bdDisponible() {
    const client = new pg.Client({ connectionString: TEST_PG_URL, connectionTimeoutMillis: 2000 });
    try { await client.connect(); await client.end(); return true; } catch { return false; }
}

export async function consultar(sql, params = []) {
    const client = new pg.Client({ connectionString: TEST_PG_URL });
    await client.connect();
    try { return (await client.query(sql, params)).rows; } finally { await client.end(); }
}

export async function limpiarBd() {
    await consultar("DROP TABLE IF EXISTS chunks, documentos");
}

// Ejecuta `node rag.mjs <args>` contra la BD y el Ollama de prueba, con RAG_ROOT = fixtures copiados.
// Asíncrono a propósito: el Ollama falso vive en ESTE proceso, y un spawnSync bloquearía el
// event loop que tiene que atender las peticiones del hijo (deadlock hasta el timeout).
export function rag(args, { root, ollamaUrl, env: extra = {} }) {
    return new Promise(resolve => {
        execFile(process.execPath, [RAG_MJS, ...args], {
            encoding: "utf8",
            timeout: 60_000,
            maxBuffer: 10_000_000,
            env: { ...process.env, PG_URL: TEST_PG_URL, OLLAMA_URL: ollamaUrl, RAG_ROOT: root, EMBED_BACKEND: "ollama", ...extra },
        }, (err, stdout, stderr) => {
            const status = err ? (typeof err.code === "number" ? err.code : (err.killed ? null : 1)) : 0;
            resolve({ status, out: `${stdout}${stderr}` });
        });
    });
}
