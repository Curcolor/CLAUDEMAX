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
