#!/usr/bin/env node
// Hook PreToolUse de CLAUDEMAX: bloquea commits de git que lleven atribución de IA
// (Co-authored-by: Claude, "Generated with Claude Code", el emoji 🤖, noreply@anthropic.com...).
// Es el único de los tres hooks de cumplimiento de CLAUDEMAX que bloquea; los otros dos
// (loop-breaker.mjs, skill-suggest.mjs) solo avisan.
//
// Lee el evento del hook por stdin (JSON), tolerante a variantes de nombres de campo entre
// versiones de Claude Code — mismo criterio que hooks/ui-audit.mjs. Solo actúa si el comando
// contiene un `git commit` (con flags globales, `--amend`, heredocs incluidos); cualquier
// otro comando pasa sin ruido, sin tocar stdout ni stderr.
//
// Formato de bloqueo: imprime la decisión estructurada de PreToolUse por stdout —
//   {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"..."}}
// — y, como respaldo por si la versión del CLI no soporta ese formato, además sale con
// código 2 y repite el motivo por stderr (en Claude Code, exit 2 en PreToolUse bloquea la
// herramienta y devuelve el contenido de stderr al modelo). Se implementan ambos caminos.
//
// Registrado por bin/components/rules.sh como PreToolUse con matcher "Bash".
// Variable de escape: CLAUDEMAX_GIT_GUARD=0 desactiva el hook sin desinstalar nada.

import process from "node:process";

// Salida inmediata si el usuario desactivó el hook — ni siquiera leemos stdin.
if (String(process.env.CLAUDEMAX_GIT_GUARD || "") === "0") {
    process.exit(0);
}

function readAllStdin() {
    return new Promise(resolve => {
        let buf = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", c => { buf += c; });
        process.stdin.on("end", () => resolve(buf));
        process.stdin.on("error", () => resolve(buf));
        // Seguridad: si stdin es una TTY (invocación manual), no cuelgues para siempre.
        if (process.stdin.isTTY) resolve("");
    });
}

// Toma el primer campo presente entre varios nombres posibles — el schema del evento
// de hooks de Claude Code ha usado snake_case y camelCase en distintas versiones.
function pick(obj, keys) {
    if (!obj || typeof obj !== "object") return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
}

// `git` con flags globales opcionales (-C dir, --no-pager, -c x=y...) seguido de `commit`.
// No exige que el comando empiece por "git": detecta también `git add x && git commit -m ...`.
const GIT_COMMIT_RE = /\bgit\b(?:\s+(?:--[\w-]+(?:=\S+)?|-\w+\s+\S+|-\w+))*\s+commit\b/i;

const FOOTER_PATTERNS = [
    { re: /co-authored-by:\s*claude/i, label: "Co-authored-by: Claude" },
    { re: /generated with claude code/i, label: "Generated with Claude Code" },
    { re: /noreply@anthropic\.com/i, label: "noreply@anthropic.com" },
    { re: /🤖/u, label: "emoji 🤖" },
];

function findFooter(command) {
    for (const { re, label } of FOOTER_PATTERNS) {
        if (re.test(command)) return label;
    }
    return null;
}

function deny(reason) {
    const payload = {
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: reason,
        },
    };
    process.stdout.write(JSON.stringify(payload) + "\n");
    process.stderr.write(reason + "\n");
    process.exit(2);
}

async function main() {
    const raw = await readAllStdin();
    if (!raw) { process.exit(0); return; }

    let evt;
    try { evt = JSON.parse(raw); } catch { process.exit(0); return; }

    const tool = pick(evt, ["tool_name", "toolName", "tool", "name"]);
    if (tool && !/^bash$/i.test(String(tool))) { process.exit(0); return; }

    const input = pick(evt, ["tool_input", "toolInput", "input", "arguments"]) || {};
    const command = pick(input, ["command", "cmd", "script"]);
    if (!command || typeof command !== "string") { process.exit(0); return; }

    if (!GIT_COMMIT_RE.test(command)) { process.exit(0); return; }

    const footer = findFooter(command);
    if (!footer) { process.exit(0); return; }

    deny(
        `CLAUDEMAX: commit bloqueado — el mensaje incluye atribución de IA (${footer}). ` +
        "Reintenta el commit sin ese footer/emoji: Conventional Commits, subject en español, " +
        "sin \"Co-authored-by: Claude\" ni ninguna mención equivalente a Claude/Anthropic. " +
        "Si esto es un falso positivo, exporta CLAUDEMAX_GIT_GUARD=0 antes de este comando."
    );
}

main().catch(() => process.exit(0));
