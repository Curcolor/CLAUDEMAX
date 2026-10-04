// Funciones puras del contexto por proyecto (spec reglas-contexto): nombre de archivo, índice de
// proyectos, bloque del .gitignore del repo y detección del diseño anterior. Sin red ni procesos;
// las importan ritual.mjs y test/proyectos-lib.test.mjs. Se instala junto a rag.mjs en R.A.G/.
import path from "node:path";
import { parseFrontmatter } from "./rag-lib.mjs";

// Nombre de archivo de .claude/proyectos/<slug>.md. Sin espacios porque `@ruta` termina en el
// primer espacio; sin tildes para que el import no dependa de la normalización del disco.
export function slugProyecto(nombre) {
    return String(nombre ?? "")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9._-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "") || "proyecto";
}

// Ruta del repo tal como se escribe en el índice y en el frontmatter: relativa a RAG_ROOT con "/",
// "." si es la raíz, o absoluta (con "/") si el repo está fuera del workspace.
export function rutaParaIndice(ragRoot, rutaAbs) {
    const abs = path.resolve(rutaAbs);
    const rel = path.relative(path.resolve(ragRoot), abs);
    if (!rel) return ".";
    if (rel.startsWith("..") || path.isAbsolute(rel)) return abs.replace(/\\/g, "/");
    return rel.replace(/\\/g, "/");
}

export function sustituirMarcadores(texto, valores) {
    let out = String(texto);
    for (const [clave, valor] of Object.entries(valores)) out = out.split(`{{${clave}}}`).join(String(valor));
    return out;
}

export function marcadoresSinSustituir(texto) {
    return [...new Set(String(texto).match(/\{\{[A-Z_]+\}\}/g) || [])];
}

// Entrada del índice a partir del texto de proyectos/<archivo>. legible = tiene `proyecto:`.
// docsEnRepo = el repo publica sus specs y planes en docs/superpowers/ (fin-ciclo los copia al vault).
export function leerProyecto(texto, archivo) {
    const { meta } = parseFrontmatter(String(texto ?? ""));
    return {
        archivo,
        nombre: meta.proyecto || archivo.replace(/\.md$/i, ""),
        ruta: meta.ruta || "?",
        descripcion: meta.descripcion || "(sin descripción)",
        legible: Boolean(meta.proyecto),
        docsEnRepo: String(meta.docs_en_repo ?? "").trim().toLowerCase() === "true",
    };
}

export const CABECERA_INDICE = [
    "# Proyectos del workspace",
    "",
    "Un archivo por proyecto en `.claude/proyectos/`. Para añadir uno: `node R.A.G/ritual.mjs init-proyecto <ruta>`.",
    "",
].join("\n");

// Contenido de proyectos/_indice.md. El import va SIN "proyectos/": Claude Code resuelve `@ruta`
// relativa al archivo que la contiene, y el índice ya vive en proyectos/.
export function generarIndice(proyectos) {
    const lineas = [...proyectos]
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map(p => `- **${p.nombre}** — \`${p.ruta}\`${p.docsEnRepo ? " (docs en repo)" : ""} — ${p.descripcion} @${p.archivo}`);
    return lineas.length ? `${CABECERA_INDICE}\n${lineas.join("\n")}\n` : CABECERA_INDICE;
}

export const COMENTARIO_GITIGNORE = "# CLAUDEMAX: el contexto de Claude vive en el workspace, no en el repo";
export const LINEAS_GITIGNORE = ["/CLAUDE.md", "/CLAUDE.local.md", "/.claude/"];
const EQUIVALENTES = {
    "/CLAUDE.md": ["CLAUDE.md"],
    "/CLAUDE.local.md": ["CLAUDE.local.md"],
    "/.claude/": [".claude/", ".claude", "/.claude"],
};

// Añade al final del .gitignore las líneas que falten, ancladas a la raíz del repo (sin ancla,
// "CLAUDE.md" ignoraría también archivos legítimos en subcarpetas). Devuelve { texto, nuevas }.
export function completarGitignore(actual) {
    const texto = String(actual ?? "");
    const existentes = new Set(texto.split(/\r?\n/).map(l => l.trim()));
    const nuevas = LINEAS_GITIGNORE.filter(l => !existentes.has(l) && !EQUIVALENTES[l].some(e => existentes.has(e)));
    if (!nuevas.length) return { texto, nuevas };
    const bloque = [...(existentes.has(COMENTARIO_GITIGNORE) ? [] : [COMENTARIO_GITIGNORE]), ...nuevas];
    const sep = texto === "" ? "" : texto.endsWith("\n") ? "\n" : "\n\n";
    return { texto: `${texto}${sep}${bloque.join("\n")}\n`, nuevas };
}

// ¿Es el <repo>/.claude/CLAUDEMAX.md que escribía init-proyecto v1? Su primer título era
// "# Reglas de CLAUDEMAX — <proyecto>".
export function esClaudemaxViejo(texto) {
    const sinComentarios = String(texto ?? "").replace(/<!--[\s\S]*?-->/g, "");
    const primera = sinComentarios.split(/\r?\n/).find(l => l.trim());
    return Boolean(primera && /^# Reglas de CLAUDEMAX —/.test(primera.trim()));
}
