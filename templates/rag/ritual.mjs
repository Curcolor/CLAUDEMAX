#!/usr/bin/env node
// Rituales manuales de ciclo de vida de CLAUDEMAX. Vive junto a rag.mjs (mismo .env, misma
// convención de ruta del vault). Documentado por la skill skills/rituales; diseño de los rituales
// de cierre en docs/superpowers/specs/2026-09-13-rituales-design.md.
//
//   node ritual.mjs                                                       ayuda
//   node ritual.mjs init-proyecto <ruta> [--proyecto n] [--descripcion t] [--sin-indexar] [--sin-gitignore] [--vault r]
//   node ritual.mjs fin-sesion [--proyecto n] [--resumen t] [--siguiente t] [--desde ref] [--vault r]
//   node ritual.mjs fin-dia [--resumen t] [--vault r]
//   node ritual.mjs fin-ciclo [--ciclo n] [--proyecto n] [--desde ref] [--vault r]       preparar
//   node ritual.mjs fin-ciclo --cerrar [--si] [--proyecto n] [--sin-indexar] [--vault r]  cerrar
//
// El script hace la mecánica (rituales-lib.mjs) y deja la prosa al modelo. Ninguno toca la base de
// datos directamente: fin-ciclo --cerrar llama a `rag.mjs ingest`, `salud` y `status`, así que
// todo lo demás funciona con Docker apagado.

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

// Crea o completa la bitácora del día (§1.2): plantilla, enlace en su hub y la sección "Sesiones
// de hoy", que se reconstruye entera en cada llamada para no duplicar. No mira git ni índices.
function cmdFinDia(opts) {
    const vaultDir = resolveVault(opts.vault);
    if (!fs.existsSync(vaultDir)) throw new Error(`no existe el vault ${vaultDir} — pasa --vault o instala el componente rag.`);
    const fecha = hoyISO();
    const bitacorasDir = path.join(vaultDir, "Bitacoras");
    fs.mkdirSync(bitacorasDir, { recursive: true });
    const archivo = path.join(bitacorasDir, `${fecha}.md`);
    let texto;
    if (fs.existsSync(archivo)) {
        texto = fs.readFileSync(archivo, "utf8");
    } else {
        texto = rit.esqueletoNota(localizarPlantilla(vaultDir, "bitacora.md"), { fecha, frontmatter: { fecha } });
        console.log(`ritual: creada ${archivo}`);
    }

    const sesionesDir = path.join(vaultDir, "Superpowers", "Sesiones");
    const sesiones = fs.existsSync(sesionesDir)
        ? fs.readdirSync(sesionesDir).filter(f => f.startsWith(fecha) && f.endsWith(".md")).sort()
        : [];
    const enlaces = sesiones.map(f => {
        const { body } = lib.parseFrontmatter(fs.readFileSync(path.join(sesionesDir, f), "utf8"));
        return `- [[${f.replace(/\.md$/, "")}]] — ${lib.tituloDe(body, f)}`;
    });
    texto = ponerSeccion(texto, "Sesiones de hoy", enlaces.join("\n") || "-", "Próximo paso");
    if (opts.resumen) texto = `${texto.replace(/\n*$/, "\n\n")}## ${horaHHMM()}\n\n${opts.resumen}\n`;
    fs.writeFileSync(archivo, texto, "utf8");
    enlazarNota(vaultDir, path.relative(vaultDir, archivo));
    console.log(`ritual: ${archivo} — ${enlaces.length} sesión${enlaces.length === 1 ? "" : "es"} de hoy enlazada${enlaces.length === 1 ? "" : "s"}.`);
    console.log("ritual: rellena Objetivos, Decisiones, Hallazgos, Bloqueos y Próximo paso. fin-dia no reindexa el RAG.");
}

// --- fin-ciclo (ritual mayor, en dos fases) -------------------------------------------------
// Preparar crea la nota de cierre y lista qué revisar; el modelo escribe la prosa y pone al día
// esas notas y Pendientes.md; `--cerrar --si` enlaza, rota, copia, regenera los tres índices y
// graba el commit. La prosa tiene que existir antes de indexar (spec §1.3).

function ramaActual(exec) {
    const r = exec ? exec(["rev-parse", "--abbrev-ref", "HEAD"]) : null;
    return r && r !== "HEAD" ? r : null;
}

// La nota de cierre abierta del proyecto: la más reciente `*-cierre-*` con `commit` vacío.
function cierreAbierto(ctx, notas) {
    return notas
        .filter(n => n.rel.startsWith("Superpowers/Sesiones/") && esCierre(n.rel))
        .filter(n => n.meta.proyecto === ctx.proyecto && !n.meta.commit)
        .sort((a, b) => a.rel.localeCompare(b.rel))
        .pop() || null;
}

// Huérfanas nuevas del ciclo con un hub al que ir (§2.5); las demás solo se cuentan.
function huerfanasDelCiclo(vaultDir, notas, fechaDesde) {
    const { huerfanas } = lib.analizarHubs(vaultDir, notas.map(n => ({ rel: n.rel, abs: n.abs })));
    const mtime = new Map(notas.map(n => [n.rel, n.mtime]));
    const nuevas = huerfanas.filter(rel => rit.hubDeNota(rel) && (!fechaDesde || (mtime.get(rel) || "") >= fechaDesde));
    return { nuevas, resto: huerfanas.length - nuevas.length };
}

// Specs y planes del repo que --cerrar copia al vault (§2.7), y qué pasa con cada destino:
// "nueva", "actualiza" (ya era una copia) o "a-mano" (nota escrita a mano con ese nombre: no se toca).
function planCopias(ctx, rango) {
    if (!ctx.docsEnRepo || !rango.fechaDesde) return [];
    const r = rit.specsYPlanesDelCiclo({ docsEnRepo: true, repoRel: ctx.repoRel, archivos: rango.archivos, proyecto: ctx.proyecto });
    return [...r.specsRepo.map(o => [o, "Specs"]), ...r.planesRepo.map(o => [o, "Planes"])]
        .filter(([origen]) => fs.existsSync(path.resolve(ctx.ragRoot, origen)))
        .map(([origen, sub]) => {
            const destinoRel = `Superpowers/${sub}/${path.basename(origen)}`;
            const abs = path.join(ctx.vaultDir, destinoRel);
            const estado = !fs.existsSync(abs) ? "nueva" : rit.esCopia(fs.readFileSync(abs, "utf8")) ? "actualiza" : "a-mano";
            return { origen, destinoRel, estado };
        });
}

const lineaCopia = c => (c.estado === "a-mano"
    ? `${c.destinoRel} ya existe y no es una copia: no se toca`
    : `${c.origen} → ${c.destinoRel}${c.estado === "actualiza" ? " (actualiza la copia)" : ""}`);

function cmdFinCicloPreparar(opts) {
    const ctx = contexto(opts);
    const fecha = hoyISO();
    const notas = leerNotasVault(ctx.vaultDir);
    if (opts.si) console.warn("ritual: aviso — fin-ciclo ya no ejecuta con --si a secas: ahora prepara la nota de cierre; para cerrar, fin-ciclo --cerrar --si.");
    if (!ctx.repo) console.warn("ritual: aviso — no hay repo git aquí: la nota de cierre se crea sin rango, notas afectadas ni copias.");
    const abierta = cierreAbierto(ctx, notas);
    const rango = rangoDe(ctx, notas, { soloCierres: true, desde: opts.desde || abierta?.meta.desde || undefined });
    let notaRel;
    if (abierta) {
        notaRel = abierta.rel;
        console.log(`ritual: ya hay una nota de cierre abierta: ${notaRel} — se respeta.`);
    } else {
        const ciclo = String(opts.ciclo || ramaActual(ctx.exec) || "ciclo");
        const dir = path.join(ctx.vaultDir, "Superpowers", "Sesiones");
        fs.mkdirSync(dir, { recursive: true });
        const archivo = rutaLibre(dir, `${fecha}-cierre-${proy.slugProyecto(ciclo)}`);
        // `desde` se guarda como sha: un "HEAD~3" se movería con los commits siguientes
        const desde = rango.desde ? ctx.exec(["rev-parse", rango.desde]) || rango.desde : "";
        fs.writeFileSync(archivo, rit.esqueletoNota(localizarPlantilla(ctx.vaultDir, "cierre.md"), {
            fecha,
            frontmatter: { proyecto: ctx.proyecto, fecha, ciclo, desde, commit: "" },
            secciones: { "Documentos del ciclo": documentosDelCiclo(ctx, notas, rango, { wikilinks: true }) || "-" },
        }), "utf8");
        notaRel = path.relative(ctx.vaultDir, archivo).replace(/\\/g, "/");
        console.log(`ritual: creada la nota de cierre ${archivo}`);
        enlazarNota(ctx.vaultDir, notaRel);
    }
    imprimirTareas(ctx, notas, rango, notaRel);
}

// Lista de tareas de la preparación (§1.3), en el orden en que conviene hacerlas.
function imprimirTareas(ctx, notas, rango, notaRel) {
    const n = rango.archivos.length;
    const resumen = rango.desde ? `desde ${rango.desde.slice(0, 10)}, ${n} archivo${n === 1 ? "" : "s"} en el ciclo` : "sin rango git";
    console.log(`\nritual: fin-ciclo — qué revisar antes de cerrar (${ctx.proyecto}, ${resumen}):`);

    const afectadas = rit.notasAfectadas(notas.map(x => ({ rel: x.rel, fuentes: x.meta.fuentes || [] })), rango.archivos);
    console.log(`\n  1. Notas cuyas fuentes cambiaron${afectadas.length ? " — reléelas contra el grafo antes de editarlas:" : ": ninguna."}`);
    for (const a of afectadas) {
        console.log(`     - ${a.rel}`);
        for (const f of a.archivos) console.log(`         ${f}`);
        if (a.total > a.archivos.length) console.log(`         (y ${a.total - a.archivos.length} más)`);
    }

    const h = huerfanasDelCiclo(ctx.vaultDir, notas, rango.fechaDesde);
    console.log(`\n  2. Huérfanas nuevas${h.nuevas.length ? " — --cerrar las enlaza en su hub:" : ": ninguna."}`);
    for (const rel of h.nuevas) console.log(`     - ${rel} → ${rit.hubDeNota(rel)}`);
    if (h.resto) console.log(`     (y ${h.resto} huérfana${h.resto === 1 ? "" : "s"} anterior${h.resto === 1 ? "" : "es"} al ciclo o sin hub: rag.mjs salud las lista)`);

    const pendPath = path.join(ctx.vaultDir, "Hubs", "Pendientes.md");
    const avisos = fs.existsSync(pendPath) ? lib.analizarPendientes(fs.readFileSync(pendPath, "utf8"), hoyISO()).avisos : [];
    console.log(`\n  3. Hubs/Pendientes.md${avisos.length ? " — corrige el formato antes de cerrar (antiguo es solo informativo):" : ": sin avisos."}`);
    for (const a of avisos) console.log(`     - línea ${a.linea}: ${a.tipo} — ${a.texto}`);

    const copias = planCopias(ctx, rango);
    if (copias.length) {
        console.log("\n  4. Specs y planes del repo que --cerrar copiará al vault (docs_en_repo):");
        for (const c of copias) console.log(`     - ${lineaCopia(c)}`);
    }

    console.log(`\nritual: escribe la prosa de ${notaRel} (Qué se hizo de verdad, Notas de Codigo/ revisadas, Qué sigue), pon al día esas notas y Hubs/Pendientes.md (lo cerrado baja a «Cerrado recientemente» con su fecha de cierre); después: node ritual.mjs fin-ciclo --cerrar --si`);
}

// Ejecuta `node rag.mjs <args>` con la salida en vivo. Un fallo es un aviso con el comando exacto.
function correrRag(args) {
    const ragScript = path.join(HERE, "rag.mjs");
    const comando = `node ${ragScript} ${args.join(" ")}`;
    if (!fs.existsSync(ragScript)) {
        console.warn(`ritual: aviso — no se encontró ${ragScript}; se omite \`rag.mjs ${args[0]}\`.`);
        return false;
    }
    const res = spawnSync(process.execPath, [ragScript, ...args], { stdio: "inherit" });
    if (res.error || res.status !== 0) {
        console.warn(`ritual: aviso — \`rag.mjs ${args[0]}\` no terminó bien (¿Docker/Postgres activo?). Reintenta con: ${comando}`);
        return false;
    }
    return true;
}

function cmdFinCicloCerrar(opts) {
    const ctx = contexto(opts);
    const notas = leerNotasVault(ctx.vaultDir);
    const nota = cierreAbierto(ctx, notas);
    if (!nota) {
        console.error(`ritual: no hay una nota de cierre abierta de "${ctx.proyecto}" — corre primero: node ritual.mjs fin-ciclo`);
        process.exitCode = 1;
        return;
    }
    const rango = rangoDe(ctx, notas, { soloCierres: true, desde: opts.desde || nota.meta.desde || undefined });
    const huerfanas = huerfanasDelCiclo(ctx.vaultDir, notas, rango.fechaDesde).nuevas;
    const pendPath = path.join(ctx.vaultDir, "Hubs", "Pendientes.md");
    const pendTexto = fs.existsSync(pendPath) ? fs.readFileSync(pendPath, "utf8") : null;
    // una línea de Pendientes ya está archivada si alguna nota de cierre del proyecto la contiene
    const textosCierre = notas.filter(x => esCierre(x.rel) && x.meta.proyecto === ctx.proyecto).map(x => fs.readFileSync(x.abs, "utf8"));
    const yaArchivado = linea => textosCierre.some(t => t.includes(linea));
    const rot = pendTexto === null ? null
        : rit.rotarPendientes(pendTexto, { proyecto: ctx.proyecto, fechaDesde: rango.fechaDesde, yaArchivado });
    const copias = planCopias(ctx, rango);
    const indexar = !opts["sin-indexar"];
    const head = ctx.repo ? ctx.exec(["rev-parse", "HEAD"]) || "" : "";

    if (!opts.si) {
        console.log(`ritual: fin-ciclo --cerrar — plan para ${nota.rel} (nada se ha tocado; añade --si para ejecutarlo):`);
        for (const rel of huerfanas) console.log(`  - enlazar ${rel} en ${rit.hubDeNota(rel)}`);
        if (!rot) console.log("  - no hay Hubs/Pendientes.md: nada que rotar");
        else if (rot.bloqueado) console.log(`  - Hubs/Pendientes.md tiene párrafos en las líneas ${rot.lineas.join(", ")}: no se rotará`);
        else if (rot.texto !== pendTexto.replace(/\r\n/g, "\n") || rot.cerradosCiclo.length) {
            console.log(`  - rotar Hubs/Pendientes.md: ${rot.cerradosCiclo.length} cerrado(s) en este ciclo a la nota; lo de ciclos anteriores sale del índice (${rot.archivar.length} sin archivar se guardan en la nota)`);
        }
        for (const c of copias) console.log(`  - copiar ${lineaCopia(c)}`);
        console.log(indexar ? "  - regenerar los tres índices: codebase-memory, graphify y rag.mjs ingest" : "  - --sin-indexar: no se regeneran los índices");
        console.log("  - rag.mjs salud y rag.mjs status");
        console.log(`  - grabar commit: ${head || "sin-git"} en la nota (cierra el ciclo)`);
        return;
    }

    // 1. Huérfanas nuevas → su hub
    for (const rel of huerfanas) enlazarNota(ctx.vaultDir, rel);

    // 2. Pendientes.md: rotar y llevar lo cerrado a la nota de cierre
    let textoNota = fs.readFileSync(nota.abs, "utf8");
    if (rot?.bloqueado) {
        console.warn(`ritual: aviso — Hubs/Pendientes.md tiene párrafos en las líneas ${rot.lineas.join(", ")}: no se rota. Pásalos al formato de una línea; el próximo cierre lo rotará.`);
    } else if (rot) {
        if (rot.texto !== pendTexto) fs.writeFileSync(pendPath, rot.texto, "utf8");
        textoNota = ponerSeccion(textoNota, "Cerrado en este ciclo", rot.cerradosCiclo.join("\n") || "-", "Qué sigue");
        if (rot.archivar.length) textoNota = ponerSeccion(textoNota, "Archivado de Pendientes", rot.archivar.join("\n"), "Qué sigue");
        fs.writeFileSync(nota.abs, textoNota, "utf8");
        console.log(`ritual: Hubs/Pendientes.md rotado — ${rot.cerradosCiclo.length} cerrado(s) del ciclo en la nota${rot.archivar.length ? `, ${rot.archivar.length} archivado(s)` : ""}.`);
    }

    // 3. Copias de specs y planes (docs_en_repo)
    for (const c of copias) {
        if (c.estado === "a-mano") { console.warn(`ritual: aviso — ${lineaCopia(c)}.`); continue; }
        const destino = path.join(ctx.vaultDir, c.destinoRel);
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.writeFileSync(destino, rit.copiaDeSpec(fs.readFileSync(path.resolve(ctx.ragRoot, c.origen), "utf8"),
            { proyecto: ctx.proyecto, fuente: c.origen }), "utf8");
        console.log(`ritual: copiado ${lineaCopia(c)}`);
        enlazarNota(ctx.vaultDir, c.destinoRel);
    }

    // 4. Los tres índices juntos: se desincronizan a la vez y se arreglan a la vez
    if (!indexar) {
        console.log("ritual: --sin-indexar — no se regeneran codebase-memory, graphify ni el RAG.");
    } else {
        if (ctx.repo) {
            console.log(`ritual: indexando ${ctx.repo} con codebase-memory...`);
            const cbm = indexarCodebaseMemory(ctx.repo);
            console.log(cbm.ok ? "ritual: índice de codebase-memory listo." : `ritual: aviso — ${cbm.aviso}`);
            console.log(`ritual: extrayendo el grafo de graphify en ${path.join(ctx.repo, "graphify-out")}...`);
            const gfy = extraerGraphify(ctx.repo);
            console.log(gfy.ok ? "ritual: grafo de graphify listo." : `ritual: aviso — ${gfy.aviso}`);
        }
        if (correrRag(["ingest", ctx.vaultDir])) console.log("ritual: RAG al día (ingest incremental).");
    }

    // 5. Estado final
    correrRag(["salud", ctx.vaultDir]);
    correrRag(["status"]);

    // 6. El commit va lo último: marca el ciclo como cerrado aunque un índice haya fallado
    fs.writeFileSync(nota.abs, rit.grabarCommit(fs.readFileSync(nota.abs, "utf8"), head || "sin-git"), "utf8");
    console.log(`ritual: ciclo cerrado — ${nota.rel} (commit ${head ? head.slice(0, 10) : "sin-git"}).`);
}

// --- Ayuda y despacho -----------------------------------------------------------------------

function imprimirAyuda() {
    console.log(`Rituales manuales de ciclo de vida de CLAUDEMAX.

Uso:
  ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar] [--sin-gitignore] [--vault ruta]
  ritual.mjs fin-sesion [--proyecto nombre] [--resumen "texto"] [--siguiente "texto"] [--desde ref] [--vault ruta]
  ritual.mjs fin-dia [--resumen "texto"] [--vault ruta]
  ritual.mjs fin-ciclo [--ciclo nombre] [--proyecto nombre] [--desde ref] [--vault ruta]          preparar
  ritual.mjs fin-ciclo --cerrar [--si] [--proyecto nombre] [--sin-indexar] [--vault ruta]       cerrar

El script hace la mecánica (nota desde la plantilla, enlace en su hub, rango git del ciclo,
notas afectadas, rotación de Pendientes.md, los tres índices); la prosa la escribe el modelo.
Ver skills/rituales para cuándo se dispara cada uno y qué hace (y qué NO hace).`);
}

function parseArgs(rest) {
    const valueFlags = ["--proyecto", "--descripcion", "--vault", "--resumen", "--ciclo", "--siguiente", "--desde"];
    const opts = {};
    const positional = [];
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        if (a === "--si" || a === "--cerrar") { opts[a.slice(2)] = true; continue; }
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
        if (opts.cerrar) cmdFinCicloCerrar(opts);
        else cmdFinCicloPreparar(opts);
    } else {
        console.error(`ritual: subcomando desconocido "${cmd}"`);
        imprimirAyuda();
        process.exitCode = 1;
    }
} catch (e) {
    console.error(`ritual: error — ${e.message}`);
    process.exitCode = 1;
}
