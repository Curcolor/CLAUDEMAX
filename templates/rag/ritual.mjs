#!/usr/bin/env node
// Rituales manuales de ciclo de vida de CLAUDEMAX. Vive junto a rag.mjs (mismo .env, misma
// convención de ruta del vault) porque reutiliza su configuración y, en fin-ciclo, su acceso
// a la base de datos. Documentado por la skill skills/rituales.
//
//   node ritual.mjs                                                       ayuda
//   node ritual.mjs init-proyecto <ruta> [--proyecto n] [--descripcion t] [--vault r]
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

function hoyISO() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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

// Detecta el proyecto actual con la misma convención que hooks/session-start.mjs: nombre de
// la carpeta raíz del repo git (git rev-parse --show-toplevel), con fallback al cwd si no hay
// repo o el binario git falla/no existe. --proyecto siempre gana sobre esta detección.
function detectarProyectoActual() {
    let top = "";
    try {
        const res = spawnSync("git", ["rev-parse", "--show-toplevel"],
            { encoding: "utf8", timeout: 1500, windowsHide: true });
        if (res.status === 0 && res.stdout) top = res.stdout.trim();
    } catch {}
    const root = top || process.cwd();
    return path.basename(root) || "proyecto";
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

function sustituirMarcadores(texto, valores) {
    let out = texto;
    for (const [clave, valor] of Object.entries(valores)) {
        out = out.split(`{{${clave}}}`).join(valor);
    }
    return out;
}

// El comentario HTML inicial de proyecto.md documenta los marcadores para quien EDITA la
// plantilla en el repo — no es contenido del archivo instanciado. Se quita antes de escribir
// el CLAUDEMAX.md final; si no hay comentario de cabecera (plantilla ya editada sin él), no
// cambia nada.
function quitarComentarioCabecera(texto) {
    return texto.replace(/^<!--[\s\S]*?-->\s*\n+/, "");
}

// Localiza templates/rules/proyecto.md en los dos layouts posibles:
//   - instalado:  <RAG_ROOT>/.claude/proyecto.md   (rules.sh copia templates/rules/ ahí)
//   - repo (dev): templates/rules/proyecto.md      (hermano de templates/rag/, este archivo)
function localizarPlantillaProyecto() {
    const candidatos = [
        path.join(HERE, "..", ".claude", "proyecto.md"),
        path.join(HERE, "..", "rules", "proyecto.md"),
    ];
    for (const c of candidatos) {
        if (fs.existsSync(c)) return c;
    }
    return null;
}

// --- init-proyecto ------------------------------------------------------------------------

function cmdInitProyecto(rutaArg, opts) {
    if (!rutaArg) {
        console.error("ritual: falta <ruta> — uso: ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--vault ruta]");
        process.exitCode = 1;
        return;
    }
    const ruta = path.resolve(rutaArg);
    fs.mkdirSync(ruta, { recursive: true });
    const proyecto = opts.proyecto || path.basename(ruta);
    const descripcion = opts.descripcion || "(sin descripción)";
    const vaultDir = resolveVault(opts.vault);
    const fecha = hoyISO();

    const claudeDir = path.join(ruta, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });

    // 1. .claude/CLAUDEMAX.md desde templates/rules/proyecto.md, marcadores sustituidos.
    const claudemaxDest = path.join(claudeDir, "CLAUDEMAX.md");
    if (fs.existsSync(claudemaxDest)) {
        console.log(`ritual: ${claudemaxDest} ya existe — se respeta, no se sobrescribe.`);
    } else {
        const plantillaPath = localizarPlantillaProyecto();
        if (!plantillaPath) {
            console.warn("ritual: aviso — no se encontró templates/rules/proyecto.md (ni en el layout instalado <RAG_ROOT>/.claude/ ni en el del repo templates/rules/); se omite CLAUDEMAX.md y se continúa con el resto de pasos.");
        } else {
            const plantilla = quitarComentarioCabecera(fs.readFileSync(plantillaPath, "utf8"));
            const contenido = sustituirMarcadores(plantilla, {
                PROYECTO: proyecto,
                FECHA: fecha,
                VAULT: vaultDir,
                RAG: HERE,
                DESCRIPCION: descripcion,
            });
            fs.writeFileSync(claudemaxDest, contenido, "utf8");
            console.log(`ritual: creado ${claudemaxDest}`);
        }
    }

    // 2. .claude/CLAUDE.md — mínimo, solo @CLAUDEMAX.md; si ya existe, añade la línea si falta.
    const claudeMdDest = path.join(claudeDir, "CLAUDE.md");
    if (!fs.existsSync(claudeMdDest)) {
        fs.writeFileSync(claudeMdDest, "@CLAUDEMAX.md\n", "utf8");
        console.log(`ritual: creado ${claudeMdDest}`);
    } else {
        const actual = fs.readFileSync(claudeMdDest, "utf8");
        if (/^@CLAUDEMAX\.md\s*$/m.test(actual)) {
            console.log(`ritual: ${claudeMdDest} ya existe y ya referencia @CLAUDEMAX.md — se respeta.`);
        } else {
            const sep = actual.endsWith("\n") ? "" : "\n";
            fs.writeFileSync(claudeMdDest, actual + sep + "@CLAUDEMAX.md\n", "utf8");
            console.log(`ritual: ${claudeMdDest} ya existía sin @CLAUDEMAX.md — se añadió la línea (contenido previo intacto).`);
        }
    }

    // 3. Nota de índice del proyecto en el vault, con frontmatter de taxonomía.
    const notaDir = path.join(vaultDir, "Proyectos", proyecto);
    fs.mkdirSync(notaDir, { recursive: true });
    const notaPath = path.join(notaDir, "00-indice.md");
    if (fs.existsSync(notaPath)) {
        console.log(`ritual: ${notaPath} ya existe — se respeta, no se sobrescribe.`);
    } else {
        const nota = [
            "---",
            "categoria: proyectos",
            `proyecto: ${proyecto}`,
            "tags: []",
            `fecha: ${fecha}`,
            "---",
            "",
            `# ${proyecto}`,
            "",
            descripcion,
            "",
            `Inicializado por \`ritual.mjs init-proyecto\` el ${fecha}.`,
            "",
        ].join("\n");
        fs.writeFileSync(notaPath, nota, "utf8");
        console.log(`ritual: creada ${notaPath}`);
    }

    console.log(`ritual: init-proyecto completo para "${proyecto}".`);
}

// --- fin-sesion (ritual menor) --------------------------------------------------------------
// Continuidad entre sesiones de Claude Code: qué se hizo y qué sigue. Escribe en 00-Inbox/
// (categoria: personal, tag personal/sesion) — no en Journal/, que es la bitácora del día
// completo (fin-dia). Ver skills/rituales para la diferencia completa entre ambos.

function cmdFinSesion(opts) {
    const vaultDir = resolveVault(opts.vault);
    const fecha = hoyISO();
    const hora = horaHHMM();
    const inboxDir = path.join(vaultDir, "00-Inbox");
    fs.mkdirSync(inboxDir, { recursive: true });

    const proyecto = opts.proyecto || detectarProyectoActual();
    const base = `${fecha}-${horaHHMMCompacta()}-${proyecto}`;
    const archivo = rutaLibre(inboxDir, base);

    const queSeHizo = opts.resumen ? opts.resumen : "_(sin resumen — completa esto a mano)_";

    const partes = [
        "---",
        "categoria: personal",
        `proyecto: ${proyecto}`,
        "tags: [personal/sesion]",
        `fecha: ${fecha}`,
        "---",
        "",
        `# Sesión — ${proyecto} · ${hora}`,
        "",
        "## Qué se hizo",
        "",
        queSeHizo,
        "",
    ];
    if (opts.siguiente) {
        partes.push("## Siguiente paso", "", opts.siguiente, "");
    }

    fs.writeFileSync(archivo, partes.join("\n"), "utf8");

    if (opts.resumen) {
        console.log(`ritual: creado ${archivo}.`);
    } else {
        console.log(`ritual: creado ${archivo} con una plantilla vacía (sin --resumen) — complétala a mano.`);
    }
    console.log("ritual: fin-sesion NO reindexa el RAG ni reconstruye Graphify (igual que fin-dia — ver skills/rituales). El contenido se indexará en el próximo `rag.mjs ingest`.");
}

// --- fin-dia (ritual menor) -----------------------------------------------------------------

function cmdFinDia(opts) {
    const vaultDir = resolveVault(opts.vault);
    const fecha = hoyISO();
    const hora = horaHHMM();
    const journalDir = path.join(vaultDir, "Journal");
    fs.mkdirSync(journalDir, { recursive: true });
    const archivo = path.join(journalDir, `${fecha}.md`);

    const entrada = opts.resumen
        ? `## ${hora}\n\n${opts.resumen}\n`
        : `## ${hora}\n\n_(sin resumen)_\n`;

    if (!fs.existsSync(archivo)) {
        const cabecera = [
            "---",
            "categoria: personal",
            "proyecto: journal",
            "tags: [personal/bitacora]",
            `fecha: ${fecha}`,
            "---",
            "",
            `# Journal — ${fecha}`,
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

    console.log("ritual: fin-dia NO reindexa el RAG ni reconstruye Graphify (a propósito — ver skills/rituales). El contenido se indexará en el próximo `rag.mjs ingest`.");
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
    console.log(`  1. Escribir la nota de cierre en ${path.join(vaultDir, "Proyectos", proyecto, "ciclos", ciclo + ".md")}`);
    console.log(`  2. Ejecutar rag.mjs reindex sobre ${vaultDir} (backend actual: ${backend})`);
    console.log("  3. Recordar ejecutar 'graphify extract .' en los repos activos y volver a ingerir sus grafos");
    console.log("  4. Imprimir un resumen final de documentos indexados por categoría");
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
    const ciclosDir = path.join(vaultDir, "Proyectos", proyecto, "ciclos");
    fs.mkdirSync(ciclosDir, { recursive: true });
    const notaPath = path.join(ciclosDir, `${ciclo}.md`);
    if (fs.existsSync(notaPath)) {
        console.log(`ritual: ${notaPath} ya existe — se respeta, no se sobrescribe la nota de cierre.`);
    } else {
        const nota = [
            "---",
            "categoria: proyectos",
            `proyecto: ${proyecto}`,
            "tags: []",
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
    }

    console.log("ritual: recuerda ejecutar 'graphify extract .' en cada repo activo para regenerar sus grafos de Graphify, y luego rag.mjs ingest para volver a indexarlos.");

    // Resumen final por categoría (best-effort): si la BD no responde, se avisa y se omite
    // solo esta parte — el resto del ritual ya se ejecutó.
    try {
        const { default: pg } = await import("pg");
        const PG_URL = process.env.PG_URL || "postgres://rag:rag@localhost:5433/rag";
        const client = new pg.Client({ connectionString: PG_URL });
        await client.connect();
        try {
            const { rows } = await client.query(
                "SELECT coalesce(categoria,'(sin categoría)') cat, count(*) c FROM chunks GROUP BY 1 ORDER BY 2 DESC");
            console.log("ritual: resumen final — documentos indexados por categoría:");
            for (const r of rows) console.log(`  ${r.cat}: ${r.c} chunks`);
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
  ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--vault ruta]
  ritual.mjs fin-sesion [--resumen "texto"] [--proyecto nombre] [--siguiente "texto"] [--vault ruta]
  ritual.mjs fin-dia [--resumen "texto"] [--vault ruta]
  ritual.mjs fin-ciclo [--ciclo nombre] [--proyecto nombre] [--si] [--vault ruta]

Ver skills/rituales para cuándo se dispara cada uno y qué hace (y qué NO hace).`);
}

function parseArgs(rest) {
    const valueFlags = ["--proyecto", "--descripcion", "--vault", "--resumen", "--ciclo", "--siguiente"];
    const opts = {};
    const positional = [];
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        if (a === "--si") { opts.si = true; continue; }
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
