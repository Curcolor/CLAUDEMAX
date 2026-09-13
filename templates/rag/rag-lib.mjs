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

// --- Troceado ----------------------------------------------------------------------------

// Corta en encabezados de nivel 1–3 (los niveles 4–6 son subdivisiones internas, no unidades
// de sentido), empaqueta bloques consecutivos hasta `max` caracteres (~600 tokens de bge-m3
// con 2400) y parte con solape solo los bloques que por sí solos exceden `max`. `heading` es
// el encabezado del bloque con el que arranca el trozo; `orden` es su posición en la nota.
export function chunkMarkdown(body, { max = 2400, solape = 200 } = {}) {
    const partes = body.split(/(?=^#{1,3} )/m).filter(p => p.trim());
    let ultimoHeading = "";
    const bloques = partes.map(p => {
        const h = p.match(/^#{1,3} (.*)$/m);
        if (h && /^#{1,3} /.test(p)) ultimoHeading = h[1].trim();
        return { heading: ultimoHeading, texto: p.trim() };
    });
    const out = [];
    let acumulado = null;
    const cerrar = () => {
        if (acumulado && acumulado.texto.trim()) out.push({ heading: acumulado.heading, content: acumulado.texto.trim() });
        acumulado = null;
    };
    for (const b of bloques) {
        if (acumulado && acumulado.texto.length + 2 + b.texto.length <= max) {
            acumulado.texto += "\n\n" + b.texto;
            continue;
        }
        cerrar();
        if (b.texto.length <= max) { acumulado = { heading: b.heading, texto: b.texto }; continue; }
        let resto = b.texto;
        while (resto.length > max) {
            out.push({ heading: b.heading, content: resto.slice(0, max) });
            resto = resto.slice(max - solape);
        }
        acumulado = { heading: b.heading, texto: resto };
    }
    cerrar();
    return out.map((c, i) => ({ ...c, orden: i }));
}

// --- Recorrido del vault -----------------------------------------------------------------

// Notas indexables: .md bajo el vault, saltando CARPETAS_NO_INDEXADAS y cualquier entrada
// cuyo nombre empiece por "." o "_" (plantillas como Hubs/_proyecto.md). Devuelve
// { abs, rel } con `rel` en formato POSIX relativo al vault.
export function* walkVault(vault, dir = vault) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
        if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (CARPETAS_NO_INDEXADAS.has(e.name)) continue;
            yield* walkVault(vault, abs);
        } else if (e.name.toLowerCase().endsWith(".md")) {
            yield { abs, rel: path.relative(vault, abs).replace(/\\/g, "/") };
        }
    }
}

// Índice para resolver referencias: nombre sin extensión → [rel...], y el conjunto de rutas.
export function indiceDeNotas(archivos) {
    const porNombre = new Map();
    const rutas = new Set();
    for (const { rel } of archivos) {
        rutas.add(rel);
        const nombre = path.basename(rel, ".md");
        if (!porNombre.has(nombre)) porNombre.set(nombre, []);
        porNombre.get(nombre).push(rel);
    }
    return { porNombre, rutas };
}

// Resuelve "[[nota]]", "nota" o "Carpeta/nota(.md)" a la ruta de una nota del índice.
export function resolverNombreNota(ref, indice) {
    const n = normalizarReferencia(ref);
    if (!n) return { error: "no existe" };
    if (n.includes("/")) {
        const conExt = n.endsWith(".md") ? n : `${n}.md`;
        return indice.rutas.has(conExt) ? { source: conExt } : { error: "no existe" };
    }
    const candidatos = indice.porNombre.get(n) || [];
    if (candidatos.length === 0) return { error: "no existe" };
    if (candidatos.length > 1) return { error: "ambiguo: usa la ruta" };
    return { source: candidatos[0] };
}
