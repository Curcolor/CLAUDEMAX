// Funciones puras de los rituales de cierre (spec 2026-09-13-rituales-design.md): esqueletos de
// nota, enlazado en hubs, cruce de `fuentes:` con los archivos del ciclo, rango git, rotación de
// Pendientes.md y copias de specs. Sin red; git entra como `exec(args)` inyectable para que las
// pruebas no necesiten un repo. Se instala junto a rag.mjs en R.A.G/ (importa rag-lib.mjs).
import path from "node:path";
import { spawnSync } from "node:child_process";
import { analizarPendientes } from "./rag-lib.mjs";

const sinComentarios = texto => String(texto).replace(/<!--[\s\S]*?-->/g, "");

// --- Globs y notas afectadas ---------------------------------------------------------------

// Misma semántica que globARegex de hooks/recordar-lib.mjs (duplicada: viven en directorios
// distintos). Trabaja sobre texto, así que también casa archivos borrados, que ya no están en disco.
export function casaGlob(patron, ruta) {
    const g = String(patron).replace(/\\/g, "/");
    const esc = s => s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    let out = "";
    for (let i = 0; i < g.length; i++) {
        if (g.startsWith("**/", i)) { out += "(?:.*/)?"; i += 2; continue; }
        if (g.startsWith("**", i)) { out += ".*"; i += 1; continue; }
        if (g[i] === "*") { out += "[^/]*"; continue; }
        if (g[i] === "?") { out += "[^/]"; continue; }
        out += esc(g[i]);
    }
    return new RegExp(`^${out}$`, "i").test(String(ruta).replace(/\\/g, "/"));
}

// notas: [{ rel, fuentes }] → [{ rel, archivos (hasta `tope`), total }]
export function notasAfectadas(notas, archivos, { tope = 5 } = {}) {
    const out = [];
    for (const nota of notas) {
        const fuentes = nota.fuentes || [];
        if (!fuentes.length) continue;
        const casan = archivos.filter(a => fuentes.some(f => casaGlob(f, a)));
        if (casan.length) out.push({ rel: nota.rel, archivos: casan.slice(0, tope), total: casan.length });
    }
    return out;
}

// --- Hubs -----------------------------------------------------------------------------------

// Hub al que pertenece una nota, o null si no le toca ninguno (Hubs/, Plantillas/, raíz).
export function hubDeNota(rel) {
    const partes = String(rel).replace(/\\/g, "/").split("/");
    if (partes.length < 2) return null;
    const [primera, segunda] = partes;
    if (primera === "Hubs" || primera === "Plantillas") return null;
    if (primera === "00-Inbox") return "Hubs/Inbox.md";
    if (primera === "Superpowers") return `Hubs/Superpowers-${segunda}.md`;
    return `Hubs/${primera}.md`;
}

// Añade "- [[nombre]] — titulo" al final de la sección "## Notas" del hub. Idempotente; un
// enlace de ejemplo dentro de un comentario HTML no cuenta como "ya enlazada".
export function enlazarEnHub(textoHub, { nombre, ruta, titulo, ambiguo = false }) {
    const destino = ambiguo ? String(ruta).replace(/\\/g, "/").replace(/\.md$/i, "") : nombre;
    const wikilink = `[[${destino}]]`;
    const texto = String(textoHub);
    if (sinComentarios(texto).includes(wikilink)) return { texto, cambiado: false };
    const entrada = `- ${wikilink}${titulo ? ` — ${titulo}` : ""}`;
    const lineas = texto.split(/\r?\n/);
    const iNotas = lineas.findIndex(l => /^##\s+Notas\b/i.test(l.trim()));
    if (iNotas < 0) {
        const iRel = lineas.findIndex(l => /^Relacionado:/i.test(l.trim()));
        const bloque = ["## Notas", entrada, ""];
        const corte = iRel < 0 ? lineas.length : iRel;
        lineas.splice(corte, 0, ...bloque);
        return { texto: lineas.join("\n"), cambiado: true };
    }
    let fin = iNotas + 1;
    while (fin < lineas.length && !/^##\s/.test(lineas[fin].trim()) && !/^Relacionado:/i.test(lineas[fin].trim())) fin++;
    const cuerpo = lineas.slice(iNotas + 1, fin);
    const soloGuion = cuerpo.findIndex(l => l.trim() === "-");
    if (soloGuion >= 0) cuerpo[soloGuion] = entrada;
    else {
        let ultima = cuerpo.length;
        while (ultima > 0 && !cuerpo[ultima - 1].trim()) ultima--;
        cuerpo.splice(ultima, 0, entrada);
    }
    lineas.splice(iNotas + 1, fin - iNotas - 1, ...cuerpo);
    return { texto: lineas.join("\n"), cambiado: true };
}

// --- Esqueleto de nota ----------------------------------------------------------------------

// Rellena una plantilla del vault: sustituye {{date:YYYY-MM-DD}}, reescribe las claves de
// frontmatter dadas (conservando las demás y su orden) y pone el contenido de las secciones.
export function esqueletoNota(plantilla, { fecha, frontmatter = {}, secciones = {} } = {}) {
    let texto = String(plantilla).replace(/\r\n/g, "\n");
    if (fecha) texto = texto.split("{{date:YYYY-MM-DD}}").join(fecha);
    const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
    if (m) {
        const pendientes = new Map(Object.entries(frontmatter));
        const lineas = m[1].split("\n").map(l => {
            const kv = l.match(/^([A-Za-z_][\w-]*):/);
            if (kv && pendientes.has(kv[1])) {
                const valor = pendientes.get(kv[1]);
                pendientes.delete(kv[1]);
                return `${kv[1]}: ${valor}`.trimEnd();
            }
            return l;
        });
        for (const [k, v] of pendientes) lineas.push(`${k}: ${v}`.trimEnd());
        texto = `---\n${lineas.join("\n")}\n---\n` + texto.slice(m[0].length);
    }
    for (const [titulo, contenido] of Object.entries(secciones)) {
        const lineas = texto.split("\n");
        const i = lineas.findIndex(l => l.trim() === `## ${titulo}`);
        if (i < 0) continue;
        let fin = i + 1;
        while (fin < lineas.length && !/^##\s/.test(lineas[fin])) fin++;
        const cola = lineas[fin - 1].trim() === "" ? [""] : [];
        lineas.splice(i + 1, fin - i - 1, contenido, ...cola);
        texto = lineas.join("\n");
    }
    return texto;
}

// Escribe `commit: <sha>` en el frontmatter (sustituye el valor si la clave ya está).
export function grabarCommit(texto, sha) {
    const t = String(texto).replace(/\r\n/g, "\n");
    const m = t.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) return t;
    const lineas = m[1].split("\n");
    const i = lineas.findIndex(l => /^commit:/.test(l.trim()));
    if (i >= 0) lineas[i] = `commit: ${sha}`;
    else lineas.push(`commit: ${sha}`);
    return `---\n${lineas.join("\n")}\n---\n` + t.slice(m[0].length);
}

// --- Git ------------------------------------------------------------------------------------
// Toda llamada a git pasa por `exec(args)`, que devuelve stdout sin el salto final, o null si git
// falla. Las pruebas inyectan el suyo; en producción se usa este. Solo se recorta por la derecha:
// la primera línea de `status --porcelain` puede empezar por espacio (" M ruta").
export function gitReal(cwd) {
    return (args) => {
        try {
            const r = spawnSync("git", ["-c", "core.quotepath=false", ...args],
                { cwd, encoding: "utf8", timeout: 10_000, windowsHide: true });
            if (r.status !== 0) return null;
            return String(r.stdout || "").replace(/\s+$/, "");
        } catch { return null; }
    };
}

export function detectarRepo(cwd, exec = gitReal(cwd)) {
    const top = exec(["rev-parse", "--show-toplevel"]);
    return top ? path.resolve(top) : null;
}

// De las notas con `commit`, la del commit que exista con fecha más reciente. null si ninguna vale.
export function ultimaNotaConCommit(notas, exec) {
    let mejor = null;
    for (const nota of notas) {
        if (!nota.commit) continue;
        const ts = Number(exec(["show", "-s", "--format=%ct", nota.commit]) || "");
        if (!Number.isFinite(ts) || !ts) continue;
        if (!mejor || ts > mejor.ts) mejor = { rel: nota.rel, commit: nota.commit, ts };
    }
    return mejor;
}

const rutaDelWorkspace = (ragRoot, repo, rel) => {
    const abs = path.resolve(repo, rel);
    const r = path.relative(path.resolve(ragRoot), abs);
    return (r.startsWith("..") ? abs : r).replace(/\\/g, "/");
};

// { desde, fechaDesde, archivos (rutas relativas a RAG_ROOT), aviso }. Los archivos son los que
// cambiaron entre `desde` y HEAD más los que aún no se commitearon.
export function rangoDelCiclo({ repo, ragRoot, desde, notas = [], exec = gitReal(repo) }) {
    let aviso = null;
    let ref = desde;
    if (!ref) {
        const ultima = ultimaNotaConCommit(notas, exec);
        if (ultima) ref = ultima.commit;
        else if (notas.some(n => n.commit)) aviso = "el commit del último cierre ya no existe (¿rebase?); se usa la base de la rama";
    }
    if (!ref) ref = exec(["merge-base", "HEAD", "main"]) || exec(["merge-base", "HEAD", "master"])
        || (exec(["rev-list", "--max-parents=0", "HEAD"]) || "").split("\n")[0].trim() || null;
    if (!ref) return { desde: null, fechaDesde: null, archivos: [], aviso: aviso || "sin historia git" };
    const diff = exec(["diff", "--name-only", `${ref}..HEAD`]) || "";
    const porcelain = exec(["status", "--porcelain"]) || "";
    const sinCommitear = porcelain.split("\n").map(l => l.slice(3).trim()).filter(Boolean)
        .map(l => (l.includes(" -> ") ? l.split(" -> ")[1] : l).replace(/^"|"$/g, ""));
    const rels = [...new Set([...diff.split("\n").map(l => l.trim()).filter(Boolean), ...sinCommitear])].sort();
    const fechaIso = exec(["show", "-s", "--format=%cI", ref]);
    return {
        desde: ref,
        fechaDesde: fechaIso ? fechaIso.slice(0, 10) : null,
        archivos: rels.map(r => rutaDelWorkspace(ragRoot, repo, r)),
        aviso,
    };
}

// { specsRepo, planesRepo, vault }: documentos del ciclo. Los del repo solo cuentan si el proyecto
// declara docs_en_repo; los del vault, por `proyecto:` y `fecha:` desde el inicio del ciclo.
export function specsYPlanesDelCiclo({ docsEnRepo, repoRel, archivos = [], notasVault = [], proyecto, fechaDesde }) {
    const bajo = sub => archivos.filter(a => casaGlob(`${repoRel}/docs/superpowers/${sub}/*.md`, a));
    return {
        specsRepo: docsEnRepo ? bajo("specs") : [],
        planesRepo: docsEnRepo ? bajo("plans") : [],
        vault: notasVault
            .filter(n => /^Superpowers\/(Specs|Planes)\//.test(n.rel))
            .filter(n => !proyecto || n.proyecto === proyecto)
            .filter(n => !fechaDesde || String(n.fecha || "") >= fechaDesde)
            .map(n => n.rel),
    };
}

// --- Pendientes -----------------------------------------------------------------------------

// Localiza [inicio, fin) de las líneas de la sección "## Cerrado recientemente" que pertenecen al
// proyecto: su "### <proyecto>" si lo hay, o toda la sección si no existen subsecciones. La sección
// termina en el siguiente "## " o en el pie "Relacionado:" del hub.
function zonaCerrado(lineas, proyecto) {
    const iSec = lineas.findIndex(l => /^##\s+Cerrado\b/i.test(l.trim()));
    if (iSec < 0) return null;
    let fin = iSec + 1;
    while (fin < lineas.length && !/^##\s/.test(lineas[fin].trim()) && !/^Relacionado:/i.test(lineas[fin].trim())) fin++;
    const subs = [];
    for (let i = iSec + 1; i < fin; i++) if (/^###\s/.test(lineas[i].trim())) subs.push(i);
    if (!subs.length) return { inicio: iSec + 1, fin };
    const i = subs.find(j => lineas[j].trim().replace(/^###\s+/, "") === proyecto);
    if (i === undefined) return null;
    const siguiente = subs.find(j => j > i);
    return { inicio: i + 1, fin: siguiente === undefined ? fin : siguiente };
}

// Rotación del cierre de ciclo: lo cerrado en este ciclo (cierre >= fechaDesde) se queda y se
// devuelve en `cerradosCiclo` para copiarlo a la nota de cierre; lo de ciclos anteriores sale del
// índice, y lo que no esté ya en ninguna nota de cierre (`yaArchivado`) se devuelve en `archivar`
// para no perderlo. Si la zona tiene párrafos narrativos no toca nada: `bloqueado` + sus líneas.
// { texto, cerradosCiclo, archivar, bloqueado, lineas }
export function rotarPendientes(texto, { proyecto, fechaDesde, yaArchivado = () => true }) {
    const original = String(texto);
    const lineas = original.split(/\r?\n/);
    const zona = zonaCerrado(lineas, proyecto);
    if (!zona) return { texto: original, cerradosCiclo: [], archivar: [], bloqueado: false, lineas: [] };
    const parrafos = analizarPendientes(original).avisos
        .filter(a => a.tipo === "parrafo" && a.linea > zona.inicio && a.linea <= zona.fin)
        .map(a => a.linea);
    if (parrafos.length) return { texto: original, cerradosCiclo: [], archivar: [], bloqueado: true, lineas: parrafos };

    const cerradosCiclo = [], archivar = [], conservadas = [];
    for (let i = zona.inicio; i < zona.fin; i++) {
        const l = lineas[i];
        const m = l.trim().match(/^-\s*\((\d{4}-\d{2}-\d{2})\s*(?:→|->)\s*(\d{4}-\d{2}-\d{2})\)/);
        if (!m) { conservadas.push(l); continue; }
        if (!fechaDesde || m[2] >= fechaDesde) { cerradosCiclo.push(l.trim()); conservadas.push(l); continue; }
        if (!yaArchivado(l.trim())) archivar.push(l.trim());
    }
    const utiles = conservadas.filter(l => l.trim() && l.trim() !== "-");
    const cuerpo = utiles.length ? [...utiles, ""] : ["-", ""];
    lineas.splice(zona.inicio, zona.fin - zona.inicio, ...cuerpo);
    return { texto: lineas.join("\n"), cerradosCiclo, archivar, bloqueado: false, lineas: [] };
}

// --- Copias de specs y planes ---------------------------------------------------------------

// Una copia lleva `espejo_de:` en su frontmatter (no basta con que aparezca en el cuerpo: un spec
// puede mostrar un frontmatter de ejemplo).
export function esCopia(texto) {
    const m = String(texto).replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n/);
    return !!m && /^espejo_de:\s*\S/m.test(m[1]);
}

// Copia para el vault: frontmatter propio (proyecto, fuentes, espejo_de) + aviso de origen.
export function copiaDeSpec(texto, { proyecto, fuente }) {
    const t = String(texto).replace(/\r\n/g, "\n");
    if (esCopia(t)) return t;
    const m = t.match(/^---\n([\s\S]*?)\n---\n/);
    // conserva el resto del frontmatter; de las claves propias de la copia se salta también su lista
    const previas = [];
    let saltando = false;
    for (const l of m ? m[1].split("\n") : []) {
        if (/^\s/.test(l) && l.trim()) { if (!saltando) previas.push(l); continue; }
        saltando = /^(proyecto|fuentes|espejo_de):/.test(l);
        if (!saltando) previas.push(l);
    }
    const cuerpo = m ? t.slice(m[0].length).replace(/^\n+/, "") : t.replace(/^\n+/, "");
    const cabecera = ["---", `proyecto: ${proyecto}`, "fuentes:", `  - ${fuente}`, `espejo_de: ${fuente}`,
        ...previas, "---", "", `> Copia de \`${fuente}\` generada por fin-ciclo — edita el original.`, ""];
    return `${cabecera.join("\n")}\n${cuerpo}`;
}
