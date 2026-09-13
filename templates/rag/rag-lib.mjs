// Funciones puras del RAG de CLAUDEMAX: sin base de datos y sin red. Las importan rag.mjs
// (CLI), mcp-server.mjs, ritual.mjs y las pruebas de test/. Todo lo que necesite Postgres u
// Ollama vive en rag.mjs.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Lee KEY=VALUE de un .env sin pisar variables ya definidas en el entorno.
export function loadDotEnv(file) {
    try {
        for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
            const m = line.match(/^([A-Z_]+)=(.*)$/);
            if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
        }
    } catch {}
}

// RAG_ROOT: la raíz del workspace, que contiene R.A.G/ y V.A.U.L.T/. Sale de .env si está
// definido; si no, es el directorio padre de la carpeta donde vive rag.mjs.
export function resolverRagRoot(here) {
    return path.resolve(process.env.RAG_ROOT || path.join(here, ".."));
}

// Carpeta → colección y autoridad (spec §1.3). Gana el prefijo más específico, por eso las
// subcarpetas de Superpowers van antes que cualquier entrada de un solo nivel.
export const COLECCIONES = [
    ["Superpowers/Specs",    "specs",         "diseño-vigente"],
    ["Superpowers/Planes",   "planes",        "historico-tecnico"],
    ["Superpowers/Tareas",   "proceso",       "historico-tecnico"],
    ["Superpowers/Sesiones", "sesiones",      "personal"],
    ["Hubs",                 "hubs",          "vigente"],
    ["Decisiones",           "decisiones",    "vigente"],
    ["Formales",             "docs_formales", "oficial"],
    ["Entrevistas",          "entrevistas",   "fuente-primaria"],
    ["Conocimiento",         "conocimiento",  "referencia"],
    ["Aprendizaje",          "aprendizaje",   "leccion"],
    ["Codigo",               "codigo",        "referencia"],
    ["Procesos",             "procesos",      "referencia"],
    ["Revisiones",           "revisiones",    "referencia"],
    ["Bitacoras",            "bitacoras",     "historica"],
    ["00-Inbox",             "inbox",         "sin-clasificar"],
];

// Colecciones que no entran en una búsqueda sin filtro: planes y reportes SDD llevan código
// literal y copaban los resultados (59 % del índice medido en el setup de trabajo); el Inbox
// está sin revisar.
export const EXCLUIDAS_POR_DEFECTO = ["planes", "proceso", "inbox"];
// Regla de autoridad en el ranking: resta fija a la distancia coseno.
export const CON_BOOST = ["decisiones", "hubs"];
export const BOOST = 0.05;
// Carpetas del vault que nunca se indexan.
export const CARPETAS_NO_INDEXADAS = new Set(["Plantillas", ".obsidian", ".trash", "node_modules"]);

export function clasificar(rel) {
    const r = rel.replace(/\\/g, "/");
    for (const [prefijo, coleccion, autoridad] of COLECCIONES) {
        if (r === prefijo || r.startsWith(prefijo + "/")) return { coleccion, autoridad, conocida: true };
    }
    return { coleccion: "otros", autoridad: "referencia", conocida: false };
}

// --- Frontmatter -------------------------------------------------------------------------

// Quita un comentario en línea (" # ...") y las comillas envolventes de un escalar YAML.
function stripYamlComment(value) {
    const i = value.search(/\s#/);
    let v = (i >= 0 ? value.slice(0, i) : value).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v;
}

// Claves cuyo valor siempre se normaliza a lista (en línea "[a, b]", en bloque "- a", o escalar).
const CLAVES_LISTA = new Set(["tags", "fuentes", "reemplaza"]);

// Extrae el frontmatter YAML inicial sin dependencias. Devuelve { meta, body, aviso }:
// `body` es el texto sin frontmatter (lo que se trocea); `aviso` es null salvo que haya un
// "---" de apertura sin cierre — entonces no se confía en nada y se indexa el texto entero.
export function parseFrontmatter(text) {
    if (!/^---\r?\n/.test(text)) return { meta: {}, body: text, aviso: null };
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
    if (!m) return { meta: {}, body: text, aviso: "frontmatter sin cierre (---); se indexa sin metadatos" };
    const meta = {};
    const lines = m[1].split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const kv = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!kv) continue;
        const [, key, rawValue] = kv;
        const value = stripYamlComment(rawValue);
        if (CLAVES_LISTA.has(key)) {
            if (value.startsWith("[") && !value.startsWith("[[")) {
                meta[key] = value.replace(/^\[/, "").replace(/\]$/, "").split(",").map(s => stripYamlComment(s)).filter(Boolean);
            } else if (!value) {
                const items = [];
                let j = i + 1;
                while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
                    items.push(stripYamlComment(lines[j].replace(/^\s*-\s+/, "")));
                    j++;
                }
                meta[key] = items;
                i = j - 1;
            } else {
                meta[key] = [value];
            }
        } else {
            meta[key] = value;
        }
    }
    return { meta, body: text.slice(m[0].length), aviso: null };
}

// "[[Nota|alias]]", "[[Nota#ancla]]", "Carpeta/Nota.md" → "Nota" / "Carpeta/Nota".
export function normalizarReferencia(ref) {
    return String(ref).trim()
        .replace(/^\[+|\]+$/g, "")
        .replace(/[|#].*$/, "")
        .replace(/\.md$/i, "")
        .replace(/\\/g, "/")
        .trim();
}

// Fecha de la nota: frontmatter válido > yyyy-mm-dd en el nombre > dd-mm-yyyy en el nombre >
// mtime. yyyy-mm-dd se prueba antes que dd-mm-yyyy porque un nombre como
// "2026-09-13-1530-x" contiene "09-13-1530", que el patrón dd-mm-yyyy tomaría por fecha.
export function extraerFecha(nombreArchivo, meta, mtimeMs) {
    if (meta && /^\d{4}-\d{2}-\d{2}$/.test(meta.fecha || "")) return meta.fecha;
    let m = nombreArchivo.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m && Number(m[2]) <= 12) return `${m[1]}-${m[2]}-${m[3]}`;
    m = nombreArchivo.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (m && Number(m[2]) <= 12) return `${m[3]}-${m[2]}-${m[1]}`;
    return new Date(mtimeMs).toISOString().slice(0, 10);
}

// Antes de embeber: [[a|b]] → b, [[a]] → a. Los corchetes no aportan semántica al vector.
export function limpiarWikilinks(texto) {
    return texto
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
        .replace(/\[\[([^\]]+)\]\]/g, "$1");
}

// Primer "# " del cuerpo; si no hay, el nombre del archivo sin extensión.
export function tituloDe(body, rel) {
    const m = body.match(/^# (.+)$/m);
    return m ? m[1].trim() : path.basename(rel, ".md");
}
