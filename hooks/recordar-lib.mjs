// Funciones puras del motor de recordatorios justo a tiempo (hooks/recordar.mjs). Sin
// dependencias y sin acceso a red; solo lee disco donde se indica. Se copia junto al hook a
// $CLAUDE_CONFIG_DIR/hooks/, así que no puede importar nada de templates/rag/.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// --- Frontmatter ---------------------------------------------------------------------------

function stripYamlComment(value) {
    const i = value.search(/\s#/);
    let v = (i >= 0 ? value.slice(0, i) : value).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v;
}

const CLAVES_LISTA = new Set(["tools", "patrones", "rutas", "siempre"]);

// Parsea el frontmatter mínimo que usan los recordatorios: listas (en línea "[a, b]" o en
// bloque "- a"), escalares, booleanos y un bloque plegado (`nota: >` seguido de líneas con
// sangría). Sin dependencias: no es YAML completo, es lo que la plantilla documenta.
function parseFrontmatter(text) {
    if (!/^---\r?\n/.test(text)) return { error: "sin frontmatter" };
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
    if (!m) return { error: "frontmatter sin cierre (---)" };
    const meta = {};
    const lines = m[1].split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const kv = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!kv) continue;
        const [, key, rawValue] = kv;
        const value = stripYamlComment(rawValue);
        if (CLAVES_LISTA.has(key)) {
            if (value.startsWith("[")) {
                meta[key] = value.replace(/^\[/, "").replace(/\]$/, "").split(",").map(s => stripYamlComment(s)).filter(Boolean);
            } else if (!value) {
                const items = [];
                let j = i + 1;
                while (j < lines.length && /^\s+-\s+/.test(lines[j])) { items.push(stripYamlComment(lines[j].replace(/^\s+-\s+/, ""))); j++; }
                meta[key] = items;
                i = j - 1;
            } else {
                meta[key] = [value];
            }
        } else if (value === ">" || value === "|" || value === "") {
            // bloque plegado: las líneas siguientes con sangría se unen con espacios
            const partes = [];
            let j = i + 1;
            while (j < lines.length && /^\s+\S/.test(lines[j]) && !/^\s+-\s+/.test(lines[j])) { partes.push(lines[j].trim()); j++; }
            meta[key] = partes.join(" ");
            i = j - 1;
        } else {
            meta[key] = value;
        }
    }
    return { meta, body: text.slice(m[0].length) };
}

function bool(v, porDefecto) {
    if (v === undefined || v === "") return porDefecto;
    return String(v).trim().toLowerCase() === "true";
}

// Devuelve { ok, nombre, tools, patrones (RegExp[]), rutas, siempre, unaVezPorSesion, activo,
// nota, cuerpo } o { ok: false, nombre, motivo }.
export function parseRecordatorio(texto, nombre) {
    const fm = parseFrontmatter(texto);
    if (fm.error) return { ok: false, nombre, motivo: fm.error };
    const { meta, body } = fm;
    const tools = Array.isArray(meta.tools) ? meta.tools.filter(Boolean) : [];
    if (!tools.length) return { ok: false, nombre, motivo: "falta `tools` (obligatorio)" };
    const patrones = [];
    for (const p of Array.isArray(meta.patrones) ? meta.patrones : []) {
        try { patrones.push(new RegExp(p, "i")); }
        catch (e) { return { ok: false, nombre, motivo: `regex inválida en patrones: ${p} (${e.message})` }; }
    }
    const cuerpo = body.trim();
    if (!cuerpo) return { ok: false, nombre, motivo: "cuerpo vacío: no hay nada que inyectar" };
    return {
        ok: true,
        nombre,
        tools,
        patrones,
        rutas: Array.isArray(meta.rutas) ? meta.rutas.filter(Boolean) : [],
        siempre: Array.isArray(meta.siempre) ? meta.siempre.filter(Boolean) : [],
        unaVezPorSesion: bool(meta.una_vez_por_sesion, false),
        activo: bool(meta.activo, true),
        nota: meta.nota || "",
        cuerpo,
    };
}
