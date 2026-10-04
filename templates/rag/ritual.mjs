#!/usr/bin/env node
// Rituales manuales de ciclo de vida de CLAUDEMAX. Vive junto a rag.mjs (mismo .env, misma
// convención de ruta del vault) porque reutiliza su configuración y, en fin-ciclo, su acceso
// a la base de datos. Documentado por la skill skills/rituales.
//
//   node ritual.mjs                                                       ayuda
//   node ritual.mjs init-proyecto <ruta> [--proyecto n] [--descripcion t] [--sin-indexar] [--sin-gitignore] [--vault r]
//   node ritual.mjs fin-sesion [--resumen "texto"] [--proyecto n] [--siguiente "texto"] [--vault r]
//   node ritual.mjs fin-dia [--resumen "texto"] [--vault ruta]
//   node ritual.mjs fin-ciclo [--ciclo nombre] [--proyecto nombre] [--si] [--vault ruta]
//
// `pg` se importa dinámicamente y SOLO dentro de fin-ciclo con --si (para el resumen final
// por categoría) — init-proyecto, fin-sesion y fin-dia nunca tocan la base de datos, así que
// funcionan con Docker apagado.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import * as lib from "./rag-lib.mjs";
import * as proy from "./proyectos-lib.mjs";
import * as rit from "./rituales-lib.mjs";
import { indexarCodebaseMemory, extraerGraphify } from "./indices-lib.mjs";

const { resolverRagRoot } = lib;

const HERE = path.dirname(fileURLToPath(import.meta.url));
loadDotEnv(path.join(HERE, ".env"));

// --- Config compartida con rag.mjs (misma convención) ------------------------------------

function loadDotEnv(file) {
    try {
        for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
            const m = line.match(/^([A-Z_]+)=(.*)$/);
            if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
        }
    } catch {}
}

// Ruta del vault: por defecto ../V.A.U.L.T relativo a este script (misma convención que
// rag.mjs), sobrescribible con --vault.
function resolveVault(opt) {
    return path.resolve(opt || path.join(HERE, "..", "V.A.U.L.T"));
}

// Fecha local "YYYY-MM-DD" de un instante: los mtimes se comparan con la fecha de un commit, que
// git da en la zona del autor (toISOString sería UTC y de noche adelantaría un día).
function fechaLocal(ms = Date.now()) {
    const d = new Date(ms);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const hoyISO = () => fechaLocal();

function horaHHMM() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Igual que horaHHMM pero sin ":" — para usar en nombres de archivo (fin-sesion).
function horaHHMMCompacta() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// Busca una ruta libre "<dir>/<base>.md"; si ya existe (dos ejecuciones del mismo ritual en el
// mismo minuto), prueba "<base>-2.md", "<base>-3.md"... en vez de sobrescribir la anterior.
function rutaLibre(dir, base) {
    let candidato = path.join(dir, `${base}.md`);
    if (!fs.existsSync(candidato)) return candidato;
    let n = 2;
    while (fs.existsSync(candidato)) {
        candidato = path.join(dir, `${base}-${n}.md`);
        n++;
    }
    return candidato;
}

// Plantilla de .claude/proyectos/<nombre>.md en los dos layouts posibles:
//   - instalado:  <RAG_ROOT>/.claude/proyecto.md   (rules.sh copia templates/rules/ ahí)
//   - repo (dev): templates/rules/proyecto.md      (hermano de templates/rag/, este archivo)
function localizarPlantillaProyecto(ragRoot) {
    const candidatos = [
        path.join(ragRoot, ".claude", "proyecto.md"),
        path.join(HERE, "..", "rules", "proyecto.md"),
    ];
    return candidatos.find(c => fs.existsSync(c)) || null;
}

// proyectos/_indice.md se regenera entero desde el frontmatter de cada proyectos/*.md.
function regenerarIndice(proyectosDir) {
    const entradas = [];
    for (const f of fs.readdirSync(proyectosDir).filter(f => f.endsWith(".md") && !f.startsWith("_")).sort()) {
        const p = proy.leerProyecto(fs.readFileSync(path.join(proyectosDir, f), "utf8"), f);
        if (!p.legible) console.warn(`ritual: aviso — ${f} no tiene frontmatter con \`proyecto:\`; entra en el índice con valores por defecto.`);
        entradas.push(p);
    }
    const indice = path.join(proyectosDir, "_indice.md");
    fs.writeFileSync(indice, proy.generarIndice(entradas), "utf8");
    console.log(`ritual: regenerado ${indice} (${entradas.length} proyecto${entradas.length === 1 ? "" : "s"}).`);
}

// --- Contexto común de los rituales de cierre (spec 2026-09-13-rituales-design.md §2) -------

// Notas del vault con su frontmatter, título y fecha local de modificación.
function leerNotasVault(vaultDir) {
    const out = [];
    for (const { rel, abs } of lib.walkVault(vaultDir)) {
        const { meta, body } = lib.parseFrontmatter(fs.readFileSync(abs, "utf8"));
        out.push({ rel, abs, meta, titulo: lib.tituloDe(body, rel), mtime: fechaLocal(fs.statSync(abs).mtimeMs) });
    }
    return out;
}

function fichasDeProyectos(ragRoot) {
    const dir = path.join(ragRoot, ".claude", "proyectos");
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith(".md") && !f.startsWith("_"))
        .map(f => proy.leerProyecto(fs.readFileSync(path.join(dir, f), "utf8"), f));
}

// ¿La `ruta:` de una ficha (relativa a RAG_ROOT o absoluta) es este repo?
function mismaRuta(ragRoot, repo, ruta) {
    if (!ruta || ruta === "?") return false;
    const norm = p => (process.platform === "win32" ? path.resolve(p).toLowerCase() : path.resolve(p));
    return norm(path.resolve(ragRoot, ruta)) === norm(repo);
}

// Vault, RAG_ROOT, repo git del cwd, proyecto y su ficha. Sin vault es el único error que aborta.
// Proyecto = --proyecto, o el de la ficha cuya `ruta:` es el repo, o el nombre de la carpeta.
function contexto(opts) {
    const vaultDir = resolveVault(opts.vault);
    if (!fs.existsSync(vaultDir)) throw new Error(`no existe el vault ${vaultDir} — pasa --vault o instala el componente rag.`);
    const ragRoot = resolverRagRoot(HERE);
    const repo = rit.detectarRepo(process.cwd());
    const exec = repo ? rit.gitReal(repo) : null;
    const ficha = repo ? fichasDeProyectos(ragRoot).find(f => mismaRuta(ragRoot, repo, f.ruta)) : null;
    const proyecto = String(opts.proyecto || ficha?.nombre || path.basename(repo || process.cwd()) || "proyecto").trim();
    const repoRel = repo ? proy.rutaParaIndice(ragRoot, repo) : null;
    return { vaultDir, ragRoot, repo, repoRel, exec, proyecto, docsEnRepo: ficha?.docsEnRepo === true };
}

const esCierre = rel => /-cierre-/.test(path.basename(rel));

// Rango del ciclo (§2.2). Candidatos: el `commit` de las notas de sesión del proyecto (o solo de
// sus cierres). Sin repo, rango vacío.
function rangoDe(ctx, notas, { soloCierres, desde }) {
    if (!ctx.repo) return { desde: null, fechaDesde: null, archivos: [], aviso: null };
    const candidatas = notas
        .filter(n => n.rel.startsWith("Superpowers/Sesiones/") && n.meta.proyecto === ctx.proyecto)
        .filter(n => !soloCierres || esCierre(n.rel))
        .map(n => ({ rel: n.rel, commit: n.meta.commit }));
    const rango = rit.rangoDelCiclo({ repo: ctx.repo, ragRoot: ctx.ragRoot, desde, notas: candidatas, exec: ctx.exec });
    if (rango.aviso) console.warn(`ritual: aviso — ${rango.aviso}`);
    return rango;
}

// Plantillas del vault. Un vault de una instalación anterior puede no tenerlas: entonces un
// esqueleto mínimo con las mismas secciones, y aviso.
const ESQUELETOS = {
    "sesion.md": "---\nproyecto:\ntags: [sesion]\nfecha: {{date:YYYY-MM-DD}}\ncommit:\n---\n\n# Sesión — {{date:YYYY-MM-DD}} · <proyecto>\n\n## Qué se hizo de verdad\n\n## Documentos del ciclo\n\n## Qué sigue\n-\n",
    "bitacora.md": "---\ntags: [bitacora]\nfecha: {{date:YYYY-MM-DD}}\n---\n\n# Bitácora — {{date:YYYY-MM-DD}}\n\n## Sesiones de hoy\n-\n\n## Próximo paso (primera tarea de mañana)\n-\n",
    "cierre.md": "---\nproyecto:\ntags: [sesion, cierre-ciclo]\nfecha: {{date:YYYY-MM-DD}}\nciclo:\ndesde:\ncommit:\n---\n\n# Cierre de ciclo — {{date:YYYY-MM-DD}}\n\n## Qué se hizo de verdad\n\n## Documentos del ciclo\n\n## Notas de Codigo/ revisadas\n\n## Cerrado en este ciclo\n\n## Qué sigue\n-\n",
};

function localizarPlantilla(vaultDir, nombre) {
    const p = path.join(vaultDir, "Plantillas", nombre);
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
    console.warn(`ritual: aviso — falta ${p}; se usa un esqueleto mínimo (install.sh --only rag repone las plantillas que falten).`);
    return ESQUELETOS[nombre];
}

// Pone `contenido` bajo "## titulo". Si la nota (de una plantilla anterior) no tiene esa sección,
// la añade antes de "## antesDe…" o al final.
function ponerSeccion(texto, titulo, contenido, antesDe = null) {
    const t = String(texto).replace(/\r\n/g, "\n");
    if (t.split("\n").some(l => l.trim() === `## ${titulo}`)) return rit.esqueletoNota(t, { secciones: { [titulo]: contenido } });
    const bloque = `## ${titulo}\n${contenido}\n\n`;
    const i = antesDe ? t.indexOf(`\n## ${antesDe}`) : -1;
    if (i >= 0) return t.slice(0, i + 1) + bloque + t.slice(i + 1);
    return `${t.replace(/\n*$/, "\n\n")}${bloque.trimEnd()}\n`;
}

// Enlaza una nota en el hub de su carpeta (§2.6). Hub inexistente → aviso: la nota queda huérfana
// y `rag.mjs salud` la seguirá listando. Nombre repetido en el vault → wikilink con ruta.
function enlazarNota(vaultDir, relNota) {
    const rel = relNota.replace(/\\/g, "/");
    const hubRel = rit.hubDeNota(rel);
    if (!hubRel) return false;
    const hubAbs = path.join(vaultDir, hubRel);
    if (!fs.existsSync(hubAbs)) {
        console.warn(`ritual: aviso — no existe ${hubRel}: ${rel} queda huérfana (crea el hub desde Plantillas/hub.md).`);
        return false;
    }
    const nombre = path.basename(rel, ".md");
    const { body } = lib.parseFrontmatter(fs.readFileSync(path.join(vaultDir, rel), "utf8"));
    const ambiguo = (lib.indiceDeNotas([...lib.walkVault(vaultDir)]).porNombre.get(nombre) || []).length > 1;
    const { texto, cambiado } = rit.enlazarEnHub(fs.readFileSync(hubAbs, "utf8"),
        { nombre, ruta: rel, titulo: lib.tituloDe(body, rel), ambiguo });
    if (cambiado) {
        fs.writeFileSync(hubAbs, texto, "utf8");
        console.log(`ritual: enlazada ${rel} en ${hubRel}`);
    }
    return cambiado;
}

// Líneas "- Spec: …" / "- Plan: …" de los documentos del ciclo (§2.4). Los del repo van como
// wikilink solo en la nota de cierre (--cerrar crea su copia en el vault); en la de sesión, como
// ruta entre backticks, para no dejar enlaces rotos.
function documentosDelCiclo(ctx, notas, rango, { wikilinks }) {
    if (!rango.fechaDesde) return "";
    const r = rit.specsYPlanesDelCiclo({
        docsEnRepo: ctx.docsEnRepo, repoRel: ctx.repoRel, archivos: rango.archivos,
        notasVault: notas.map(n => ({ rel: n.rel, proyecto: n.meta.proyecto, fecha: n.mtime })),
        proyecto: ctx.proyecto, fechaDesde: rango.fechaDesde,
    });
    const nombre = p => path.basename(p, ".md");
    const existe = p => fs.existsSync(path.resolve(ctx.ragRoot, p));   // un spec borrado en el ciclo no se lista
    const delRepo = (tipo, rutas) => rutas.filter(existe).map(p => `- ${tipo}: ${wikilinks ? `[[${nombre(p)}]]` : `\`${p}\``}`);
    const enRepo = new Set([...r.specsRepo, ...r.planesRepo].map(nombre));
    const delVault = r.vault.filter(p => !enRepo.has(nombre(p)))
        .map(p => `- ${p.startsWith("Superpowers/Planes/") ? "Plan" : "Spec"}: [[${nombre(p)}]]`);
    return [...delRepo("Spec", r.specsRepo), ...delRepo("Plan", r.planesRepo), ...delVault].join("\n");
}

// --- init-proyecto ------------------------------------------------------------------------
// El contexto del proyecto vive en <RAG_ROOT>/.claude/proyectos/, nunca dentro del repo (regla 6
// de CLAUDEMAX.md; spec docs/superpowers/specs/2026-09-13-reglas-contexto-design.md).

function cmdInitProyecto(rutaArg, opts) {
    if (!rutaArg) {
        console.error("ritual: falta <ruta> — uso: ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar] [--sin-gitignore] [--vault ruta]");
        process.exitCode = 1;
        return;
    }
    const ruta = path.resolve(rutaArg);
    fs.mkdirSync(ruta, { recursive: true });
    const proyecto = String(opts.proyecto || path.basename(ruta)).trim();
    const descripcion = String(opts.descripcion || "(sin descripción)").replace(/\s+/g, " ").trim();
    const ragRoot = resolverRagRoot(HERE);
    const vaultDir = resolveVault(opts.vault);
    const fecha = hoyISO();
    const slug = proy.slugProyecto(proyecto);
    const proyectosDir = path.join(ragRoot, ".claude", "proyectos");
    fs.mkdirSync(proyectosDir, { recursive: true });

    // 1. .claude/proyectos/<slug>.md — el contexto del proyecto, fuera del repo.
    const contextoPath = path.join(proyectosDir, `${slug}.md`);
    if (fs.existsSync(contextoPath)) {
        const previo = proy.leerProyecto(fs.readFileSync(contextoPath, "utf8"), `${slug}.md`);
        if (previo.legible && previo.nombre !== proyecto) {
            console.warn(`ritual: aviso — ${contextoPath} ya existe y es de "${previo.nombre}": el nombre "${proyecto}" da el mismo archivo. Se respeta; usa --proyecto con otro nombre.`);
        } else {
            console.log(`ritual: ${contextoPath} ya existe — se respeta, no se sobrescribe.`);
        }
    } else {
        const plantillaPath = localizarPlantillaProyecto(ragRoot);
        if (!plantillaPath) {
            console.warn("ritual: aviso — no se encontró la plantilla proyecto.md (ni en <RAG_ROOT>/.claude/ ni en templates/rules/); se omite el contexto del proyecto y se continúa.");
        } else {
            const contenido = proy.sustituirMarcadores(fs.readFileSync(plantillaPath, "utf8"), {
                PROYECTO: proyecto,
                RUTA: proy.rutaParaIndice(ragRoot, ruta),
                RUTA_ABS: ruta.replace(/\\/g, "/"),
                DESCRIPCION: descripcion,
                FECHA: fecha,
            });
            const sueltos = proy.marcadoresSinSustituir(contenido);
            if (sueltos.length) console.warn(`ritual: aviso — la plantilla tiene marcadores desconocidos sin sustituir: ${sueltos.join(", ")}`);
            fs.writeFileSync(contextoPath, contenido, "utf8");
            console.log(`ritual: creado ${contextoPath}`);
        }
    }

    // 2. proyectos/_indice.md, que CLAUDEMAX.md importa.
    regenerarIndice(proyectosDir);

    // 3. Hub del proyecto en Hubs/<Proyecto>.md desde Hubs/_proyecto.md (plantilla del vault).
    const hubsDir = path.join(vaultDir, "Hubs");
    fs.mkdirSync(hubsDir, { recursive: true });
    const hubPath = path.join(hubsDir, `${proyecto}.md`);
    if (fs.existsSync(hubPath)) {
        console.log(`ritual: ${hubPath} ya existe — se respeta, no se sobrescribe.`);
    } else {
        const plantillaHub = path.join(hubsDir, "_proyecto.md");
        let contenido;
        if (fs.existsSync(plantillaHub)) {
            contenido = proy.sustituirMarcadores(fs.readFileSync(plantillaHub, "utf8"), {
                PROYECTO: proyecto, FECHA: fecha, DESCRIPCION: descripcion, RUTA: ruta,
            });
        } else {
            contenido = [
                "---", "tags: [hub]", `titulo: ${proyecto}`, `actualizado: ${fecha}`, "---", "",
                `# ${proyecto}`, "", descripcion, "", `Ruta: \`${ruta}\`. Inicializado el ${fecha}.`, "",
                "## Notas del proyecto", "-", "", "Relacionado: [[Bienvenida]]", "",
            ].join("\n");
        }
        fs.writeFileSync(hubPath, contenido, "utf8");
        console.log(`ritual: creado el hub ${hubPath} — enlázalo desde Hubs/Bienvenida.md (sección Negocio).`);
    }

    // 4. .gitignore del repo: CLAUDE.md, CLAUDE.local.md y .claude/ anclados a la raíz.
    if (opts["sin-gitignore"]) {
        console.log("ritual: --sin-gitignore — no se toca el .gitignore del repo.");
    } else if (!fs.existsSync(path.join(ruta, ".git"))) {
        console.log(`ritual: ${ruta} no es un repo git — no se toca ningún .gitignore.`);
    } else {
        const gi = path.join(ruta, ".gitignore");
        const { texto, nuevas } = proy.completarGitignore(fs.existsSync(gi) ? fs.readFileSync(gi, "utf8") : "");
        if (nuevas.length) {
            fs.writeFileSync(gi, texto, "utf8");
            console.log(`ritual: .gitignore del repo — añadidas ${nuevas.join(", ")} (el contexto de Claude vive en el workspace).`);
        } else {
            console.log("ritual: el .gitignore del repo ya ignora CLAUDE.md, CLAUDE.local.md y .claude/.");
        }
    }

    // 5. Diseño anterior: <repo>/.claude/CLAUDEMAX.md de init-proyecto v1. Se avisa, no se borra.
    const viejo = path.join(ruta, ".claude", "CLAUDEMAX.md");
    if (fs.existsSync(viejo) && proy.esClaudemaxViejo(fs.readFileSync(viejo, "utf8"))) {
        console.warn(`ritual: aviso — diseño anterior: ${viejo} es del init-proyecto v1. El contexto va ahora en ${contextoPath}; copia lo que valga y borra ${viejo} (y ${path.join(ruta, ".claude", "CLAUDE.md")} si solo contiene @CLAUDEMAX.md).`);
    }

    // 6. Índices de código: codebase-memory y graphify, con su salida en vivo.
    if (opts["sin-indexar"]) {
        console.log("ritual: --sin-indexar — no se indexa con codebase-memory ni se extrae el grafo de graphify.");
    } else {
        console.log(`ritual: indexando ${ruta} con codebase-memory (index_repository, modo moderate)...`);
        const cbm = indexarCodebaseMemory(ruta);
        console.log(cbm.ok ? "ritual: índice de codebase-memory listo." : `ritual: aviso — ${cbm.aviso}`);
        console.log(`ritual: extrayendo el grafo de graphify en ${path.join(ruta, "graphify-out")} (--code-only)...`);
        const gfy = extraerGraphify(ruta);
        console.log(gfy.ok ? "ritual: grafo de graphify listo." : `ritual: aviso — ${gfy.aviso}`);
    }

    console.log(`ritual: init-proyecto completo para "${proyecto}". Abre una sesión en ${ruta} y rellena las secciones de .claude/proyectos/${slug}.md consultando el grafo (skill rituales, §2).`);
}

// --- fin-sesion (ritual menor) --------------------------------------------------------------
// Continuidad entre sesiones de Claude Code: qué se hizo de verdad y qué sigue. Escribe en
// Superpowers/Sesiones/ (colección sesiones) — no en Bitacoras/, que es el diario del día
// completo (fin-dia). El script pone la mecánica; la prosa la escribe el modelo (§1.1).

function cmdFinSesion(opts) {
    const ctx = contexto(opts);
    const fecha = hoyISO();
    const sesionesDir = path.join(ctx.vaultDir, "Superpowers", "Sesiones");
    fs.mkdirSync(sesionesDir, { recursive: true });
    const notas = leerNotasVault(ctx.vaultDir);
    if (!ctx.repo) console.warn("ritual: aviso — no hay repo git aquí: la nota se crea sin rango ni documentos del ciclo.");
    const rango = rangoDe(ctx, notas, { soloCierres: false, desde: opts.desde });
    const head = ctx.repo ? ctx.exec(["rev-parse", "HEAD"]) || "" : "";

    const secciones = { "Documentos del ciclo": documentosDelCiclo(ctx, notas, rango, { wikilinks: false }) || "-" };
    if (opts.resumen) secciones["Qué se hizo de verdad"] = opts.resumen;
    if (opts.siguiente) secciones["Qué sigue"] = opts.siguiente;
    const archivo = rutaLibre(sesionesDir, `${fecha}-${horaHHMMCompacta()}-${proy.slugProyecto(ctx.proyecto)}`);
    const plantilla = localizarPlantilla(ctx.vaultDir, "sesion.md").split("<proyecto>").join(ctx.proyecto);
    fs.writeFileSync(archivo, rit.esqueletoNota(plantilla, {
        fecha,
        frontmatter: { proyecto: ctx.proyecto, fecha, commit: head },
        secciones,
    }), "utf8");
    console.log(`ritual: creado ${archivo}`);
    enlazarNota(ctx.vaultDir, path.relative(ctx.vaultDir, archivo));
    console.log("ritual: escribe en esa nota \"Qué se hizo de verdad\" (desvíos y errores incluidos) y \"Qué sigue\". fin-sesion no reindexa el RAG: lo hace el arranque de la próxima sesión.");
}

// --- fin-dia (ritual menor) -----------------------------------------------------------------

function cmdFinDia(opts) {
    const vaultDir = resolveVault(opts.vault);
    const fecha = hoyISO();
    const hora = horaHHMM();
    const bitacorasDir = path.join(vaultDir, "Bitacoras");
    fs.mkdirSync(bitacorasDir, { recursive: true });
    const archivo = path.join(bitacorasDir, `${fecha}.md`);

    const entrada = opts.resumen
        ? `## ${hora}\n\n${opts.resumen}\n`
        : `## ${hora}\n\n_(sin resumen)_\n`;

    if (!fs.existsSync(archivo)) {
        const cabecera = [
            "---",
            "tags: [bitacora]",
            `fecha: ${fecha}`,
            "---",
            "",
            `# Bitácora — ${fecha}`,
            "",
        ].join("\n");
        fs.writeFileSync(archivo, cabecera + "\n" + entrada, "utf8");
        console.log(`ritual: creado ${archivo} con la primera entrada de hoy (${hora}).`);
    } else {
        const actual = fs.readFileSync(archivo, "utf8");
        const sep = actual.endsWith("\n\n") ? "" : actual.endsWith("\n") ? "\n" : "\n\n";
        fs.writeFileSync(archivo, actual + sep + entrada, "utf8");
        console.log(`ritual: añadida una nueva entrada (${hora}) a ${archivo}.`);
    }

    console.log("ritual: enlaza la bitácora desde Hubs/Bitacoras.md. fin-dia NO reindexa el RAG (lo hará el arranque de la próxima sesión).");
}

// --- fin-ciclo (ritual mayor, con confirmación) --------------------------------------------

const UMBRAL_MUCHOS_DOCUMENTOS = 150;

function contarNotas(dir) {
    let n = 0;
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return 0;
    }
    for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) n += contarNotas(p);
        else if (e.name.endsWith(".md")) n++;
    }
    return n;
}

function imprimirPlanFinCiclo(ciclo, proyecto, vaultDir) {
    const backend = process.env.EMBED_BACKEND || "ollama";
    console.log("ritual: fin-ciclo — plan (nada se ha tocado todavía; añade --si para ejecutarlo):");
    console.log(`  1. Escribir la nota de cierre en ${path.join(vaultDir, "Superpowers", "Sesiones", "cierre-" + ciclo + ".md")}`);
    console.log(`  2. Ejecutar rag.mjs reindex sobre ${vaultDir} (backend actual: ${backend}) y rag.mjs salud`);
    console.log("  3. Recordar ejecutar 'graphify extract .' en los repos activos");
    console.log("  4. Imprimir un resumen final de documentos indexados por colección y estado");
    console.log("ritual: no se conectó a la base de datos ni se modificó ningún archivo.");
}

async function cmdFinCiclo(opts) {
    const vaultDir = resolveVault(opts.vault);
    const proyecto = opts.proyecto || path.basename(process.cwd());
    const ciclo = opts.ciclo || `ciclo-${hoyISO()}`;

    if (!opts.si) {
        imprimirPlanFinCiclo(ciclo, proyecto, vaultDir);
        process.exitCode = 0;
        return;
    }

    // --- Ejecución confirmada ---------------------------------------------------------
    const fecha = hoyISO();
    const sesionesDir = path.join(vaultDir, "Superpowers", "Sesiones");
    fs.mkdirSync(sesionesDir, { recursive: true });
    const notaPath = path.join(sesionesDir, `cierre-${ciclo}.md`);
    if (fs.existsSync(notaPath)) {
        console.log(`ritual: ${notaPath} ya existe — se respeta, no se sobrescribe la nota de cierre.`);
    } else {
        const nota = [
            "---",
            `proyecto: ${proyecto}`,
            "tags: [sesion, cierre-ciclo]",
            `fecha: ${fecha}`,
            "---",
            "",
            `# Cierre de ciclo — ${ciclo}`,
            "",
            `Ciclo cerrado el ${fecha} para el proyecto **${proyecto}**.`,
            "",
        ].join("\n");
        fs.writeFileSync(notaPath, nota, "utf8");
        console.log(`ritual: creada la nota de cierre ${notaPath}`);
    }

    // Sugerencia (no automática) de backend kaggle si hay credenciales y muchas notas.
    const backendActual = (process.env.EMBED_BACKEND || "ollama").trim().toLowerCase();
    const kaggleConfigurado = Boolean(process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY);
    const totalDocs = contarNotas(vaultDir);
    if (kaggleConfigurado && backendActual !== "kaggle" && totalDocs > UMBRAL_MUCHOS_DOCUMENTOS) {
        console.log(`ritual: sugerencia — hay ${totalDocs} notas en el vault y hay credenciales de Kaggle configuradas; considera "rag.mjs reindex --backend kaggle" para acelerar el reindexado.`);
    }

    // Reindexado — respeta EMBED_BACKEND del .env compartido (no se fuerza ningún backend).
    console.log(`ritual: ejecutando rag.mjs reindex sobre ${vaultDir}...`);
    const ragScript = path.join(HERE, "rag.mjs");
    if (!fs.existsSync(ragScript)) {
        console.warn(`ritual: aviso — no se encontró ${ragScript}; se omite el reindexado. Ejecútalo manualmente cuando esté disponible.`);
    } else {
        const res = spawnSync(process.execPath, [ragScript, "reindex", vaultDir], { stdio: "inherit" });
        if (res.error || res.status !== 0) {
            console.warn("ritual: aviso — el reindexado no terminó bien (¿está Docker/Postgres activo?). Revisa el mensaje de rag.mjs de arriba y reintenta manualmente con: node rag.mjs reindex");
        } else {
            console.log("ritual: reindexado completo.");
        }
        const res2 = spawnSync(process.execPath, [ragScript, "salud", vaultDir], { stdio: "inherit" });
        if (res2.error) console.warn("ritual: aviso — no se pudo ejecutar rag.mjs salud.");
    }

    console.log("ritual: recuerda ejecutar 'graphify extract .' en cada repo activo para regenerar sus grafos de Graphify.");

    // Resumen final por categoría (best-effort): si la BD no responde, se avisa y se omite
    // solo esta parte — el resto del ritual ya se ejecutó.
    try {
        const { default: pg } = await import("pg");
        const PG_URL = process.env.PG_URL || "postgres://rag:rag@localhost:5433/rag";
        const client = new pg.Client({ connectionString: PG_URL });
        await client.connect();
        try {
            const { rows } = await client.query(
                "SELECT coleccion, estado, count(*)::int AS c FROM documentos GROUP BY 1, 2 ORDER BY 1, 2");
            console.log("ritual: resumen final — documentos indexados por colección y estado:");
            for (const r of rows) console.log(`  ${r.coleccion} · ${r.estado}: ${r.c}`);
        } finally {
            await client.end();
        }
    } catch (e) {
        console.warn(`ritual: aviso — no se pudo generar el resumen final (la base de datos no respondió: ${e.message}). El resto del ritual ya se ejecutó.`);
    }

    console.log(`ritual: fin-ciclo completo para "${proyecto}" / "${ciclo}".`);
}

// --- Ayuda y despacho -----------------------------------------------------------------------

function imprimirAyuda() {
    console.log(`Rituales manuales de ciclo de vida de CLAUDEMAX.

Uso:
  ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar] [--sin-gitignore] [--vault ruta]
  ritual.mjs fin-sesion [--resumen "texto"] [--proyecto nombre] [--siguiente "texto"] [--vault ruta]
  ritual.mjs fin-dia [--resumen "texto"] [--vault ruta]
  ritual.mjs fin-ciclo [--ciclo nombre] [--proyecto nombre] [--si] [--vault ruta]

Ver skills/rituales para cuándo se dispara cada uno y qué hace (y qué NO hace).`);
}

function parseArgs(rest) {
    const valueFlags = ["--proyecto", "--descripcion", "--vault", "--resumen", "--ciclo", "--siguiente", "--desde"];
    const opts = {};
    const positional = [];
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        if (a === "--si") { opts.si = true; continue; }
        if (a === "--sin-indexar" || a === "--sin-gitignore") { opts[a.slice(2)] = true; continue; }
        if (valueFlags.includes(a)) { opts[a.slice(2)] = rest[++i]; continue; }
        if (a.startsWith("--")) continue; // flag desconocido: se ignora
        positional.push(a);
    }
    return { opts, positional };
}

const [cmd, ...rest] = process.argv.slice(2);
const { opts, positional } = parseArgs(rest);

try {
    if (!cmd) {
        imprimirAyuda();
        process.exitCode = 0;
    } else if (cmd === "init-proyecto") {
        cmdInitProyecto(positional[0], opts);
    } else if (cmd === "fin-sesion") {
        cmdFinSesion(opts);
    } else if (cmd === "fin-dia") {
        cmdFinDia(opts);
    } else if (cmd === "fin-ciclo") {
        await cmdFinCiclo(opts);
    } else {
        console.error(`ritual: subcomando desconocido "${cmd}"`);
        imprimirAyuda();
        process.exitCode = 1;
    }
} catch (e) {
    console.error(`ritual: error — ${e.message}`);
    process.exitCode = 1;
}
