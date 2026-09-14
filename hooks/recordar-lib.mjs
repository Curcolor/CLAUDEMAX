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

// --- Coincidencia (spec §1) -----------------------------------------------------------------

// Glob → RegExp sobre rutas normalizadas a "/": "**/" = cualquier prefijo de directorios
// (incluido ninguno), "**" = cualquier cosa, "*" = un segmento, "?" = un carácter.
export function globARegex(glob) {
    const g = String(glob).replace(/\\/g, "/");
    const esc = s => s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    let out = "";
    for (let i = 0; i < g.length; i++) {
        if (g.startsWith("**/", i)) { out += "(?:.*/)?"; i += 2; continue; }
        if (g.startsWith("**", i)) { out += ".*"; i += 1; continue; }
        if (g[i] === "*") { out += "[^/]*"; continue; }
        if (g[i] === "?") { out += "[^/]"; continue; }
        out += esc(g[i]);
    }
    return new RegExp(`^${out}$`, "i");
}

// Texto contra el que se prueban los `patrones` de un recordatorio, según la tool.
export function textoDelTool(tool, input = {}) {
    const norm = v => String(v ?? "").replace(/\\/g, "/");
    switch (tool) {
        case "Bash":
        case "PowerShell":
            return String(input.command ?? "");
        case "Grep":
            return [input.pattern, input.path].filter(Boolean).map(String).join(" ");
        case "Glob":
            return String(input.pattern ?? "");
        case "Edit":
        case "Write":
        case "MultiEdit":
        case "Read":
            return norm(input.file_path);
        default:
            return "";
    }
}

export function coincide(rec, tool, input = {}) {
    if (!rec.ok || !rec.activo) return false;
    if (!rec.tools.includes(tool)) return false;
    if (rec.siempre.includes(tool)) return true;
    if (!rec.patrones.length && !rec.rutas.length) return true;
    const texto = textoDelTool(tool, input);
    if (rec.patrones.some(re => re.test(texto))) return true;
    const ruta = String(input.file_path ?? "").replace(/\\/g, "/");
    if (ruta && rec.rutas.some(g => globARegex(g).test(ruta))) return true;
    return false;
}

// --- Búsqueda y carga (spec §2) -------------------------------------------------------------

const MAX_NIVELES = 4;

// Directorios `.claude/recordatorios/` desde `cwd` hacia arriba (hasta 4 niveles), del más
// cercano al más lejano. CLAUDEMAX_RECORDATORIOS_DIR anula la búsqueda (pruebas, casos raros).
export function buscarDirectorios(cwd, env = process.env) {
    if (env.CLAUDEMAX_RECORDATORIOS_DIR) return [env.CLAUDEMAX_RECORDATORIOS_DIR];
    const out = [];
    let dir = path.resolve(cwd || process.cwd());
    for (let nivel = 0; nivel <= MAX_NIVELES; nivel++) {
        const candidato = path.join(dir, ".claude", "recordatorios");
        try { if (fs.statSync(candidato).isDirectory()) out.push(candidato); } catch {}
        const padre = path.dirname(dir);
        if (padre === dir) break;
        dir = padre;
    }
    return out;
}

// Carga los *.md (sin los "_") de los directorios dados; ante el mismo nombre gana el primer
// directorio (el más cercano al cwd). Devuelve { recordatorios (ordenados por nombre), rotos }.
export function cargarRecordatorios(dirs) {
    const porNombre = new Map();
    const rotos = [];
    for (const dir of dirs) {
        let entradas;
        try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
        for (const e of entradas) {
            if (!e.isFile() || !e.name.endsWith(".md") || e.name.startsWith("_")) continue;
            if (porNombre.has(e.name)) continue;   // ya lo aportó un directorio más cercano
            const archivo = path.join(dir, e.name);
            let r;
            try { r = parseRecordatorio(fs.readFileSync(archivo, "utf8"), e.name); }
            catch (err) { r = { ok: false, nombre: e.name, motivo: err.message }; }
            if (r.ok) porNombre.set(e.name, r);
            else { porNombre.set(e.name, null); rotos.push({ archivo, motivo: r.motivo }); }
        }
    }
    const recordatorios = [...porNombre.values()].filter(Boolean).sort((a, b) => a.nombre.localeCompare(b.nombre));
    return { recordatorios, rotos };
}
