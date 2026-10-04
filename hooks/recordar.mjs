#!/usr/bin/env node
// Hook PreToolUse de CLAUDEMAX: recordatorios justo a tiempo. Lee los recordatorios en
// markdown de `.claude/recordatorios/` (del proyecto y del workspace, subiendo desde el cwd) y,
// cuando la tool y el comando/ruta casan, inyecta el texto como additionalContext — en el
// instante de la decisión, no al arranque de la sesión. Nunca bloquea; exit 0 siempre.
//
// Por qué existe: en el setup de trabajo del autor, las reglas escritas en CLAUDE.md y en la
// memoria se olvidaban igual a mitad de una tarea larga. El problema era de TIEMPOS, no de
// conocimiento: el recordatorio tiene que llegar cuando se va a ejecutar el comando. Y dispara
// cada vez a propósito — la búsqueda que importa casi nunca es la primera.
//
// Formato de un recordatorio y semántica de coincidencia: templates/recordatorios/_plantilla.md
// y docs/superpowers/specs/2026-09-13-recordatorios-jit-design.md. Funciones puras en
// recordar-lib.mjs (se instala junto a este archivo).
//
// Recordatorios rotos (frontmatter inválido, regex mala) se ignoran y se anotan en
// $CLAUDE_CONFIG_DIR/state/recordar.log — nunca por stderr, que iría al modelo.
//
// Registrado por bin/components/rules.sh como PreToolUse con matcher
// Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read y timeout 5. Escape: CLAUDEMAX_RECORDAR=0.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
    buscarDirectorios, cargarRecordatorios, coincide, dirEstado,
    leerEstado, filtrarPorSesion, guardarEstado,
} from "./recordar-lib.mjs";

if (String(process.env.CLAUDEMAX_RECORDAR || "") === "0") process.exit(0);

function leerStdin() {
    return new Promise(resolve => {
        let buf = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", c => { buf += c; });
        process.stdin.on("end", () => resolve(buf));
        process.stdin.on("error", () => resolve(buf));
        if (process.stdin.isTTY) resolve("");
    });
}

function pick(obj, keys) {
    for (const k of keys) if (obj && obj[k] !== undefined) return obj[k];
    return undefined;
}

// Anota recordatorios rotos en state/recordar.log, truncado a las últimas 200 líneas.
function anotarRotos(rotos) {
    if (!rotos.length) return;
    try {
        const dir = dirEstado(process.env);
        fs.mkdirSync(dir, { recursive: true });
        const archivo = path.join(dir, "recordar.log");
        const fecha = new Date().toISOString();
        let previas = [];
        try { previas = fs.readFileSync(archivo, "utf8").split("\n").filter(Boolean); } catch {}
        const nuevas = rotos.map(r => `${fecha} ${r.archivo}: ${r.motivo}`);
        fs.writeFileSync(archivo, [...previas, ...nuevas].slice(-200).join("\n") + "\n", "utf8");
    } catch {}
}

async function main() {
    const raw = await leerStdin();
    if (!raw.trim()) return;
    let evt;
    try { evt = JSON.parse(raw); } catch { return; }
    const tool = pick(evt, ["tool_name", "toolName"]);
    if (typeof tool !== "string" || !tool) return;
    const input = pick(evt, ["tool_input", "toolInput"]) || {};
    const cwd = pick(evt, ["cwd", "cwd_path", "cwdPath"]) || process.cwd();
    const sessionId = pick(evt, ["session_id", "sessionId"]);

    const dirs = buscarDirectorios(cwd, process.env);
    if (!dirs.length) return;
    const { recordatorios, rotos } = cargarRecordatorios(dirs);
    anotarRotos(rotos);

    const coincidentes = recordatorios.filter(r => coincide(r, tool, input));
    if (!coincidentes.length) return;

    const sid = typeof sessionId === "string" && sessionId ? sessionId : null;
    const { visibles, estado } = filtrarPorSesion(coincidentes, sid, leerEstado(process.env));
    if (sid && coincidentes.some(r => r.unaVezPorSesion)) guardarEstado(process.env, estado);
    if (!visibles.length) return;

    const texto = visibles.map(r => r.cuerpo).join("\n\n");
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: texto },
        suppressOutput: true,
    }) + "\n");
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
