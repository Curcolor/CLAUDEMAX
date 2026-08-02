#!/usr/bin/env node
// Hook PostToolUse de CLAUDEMAX: corta bucles de reintento. Detecta fallos repetidos con la
// misma firma (herramienta + error normalizado) y, a partir del tercero, inyecta un
// <system-reminder> contundente para que el modelo pare, resuma lo intentado y pregunte al
// usuario en vez de seguir quemando tokens con variaciones menores del mismo intento.
// Nunca bloquea — es aviso puro, igual que skill-suggest.mjs; el único hook que bloquea es
// git-footer-guard.mjs.
//
// Estado por sesión en $CLAUDE_CONFIG_DIR/state/loop-breaker.json (fallback $HOME/.claude si
// CLAUDE_CONFIG_DIR no está definido — mismo criterio que bin/lib/claude-config.sh). "Por
// sesión" es literal: el estado guarda el session_id del evento y, si en una invocación
// posterior llega uno distinto, las firmas de la sesión anterior se descartan antes de seguir
// contando — así una sesión nueva no hereda fallos de una conversación ya cerrada. Lee el
// evento del hook por stdin (JSON), tolerante a variantes de nombres de campo entre versiones
// de Claude Code, igual que hooks/ui-audit.mjs.
//
// Registrado por bin/components/rules.sh como PostToolUse (sin matcher: todas las
// herramientas). Variable de escape: CLAUDEMAX_LOOP_BREAKER=0 desactiva el hook.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";

// Salida inmediata si el usuario desactivó el hook — ni siquiera leemos stdin.
if (String(process.env.CLAUDEMAX_LOOP_BREAKER || "") === "0") {
    process.exit(0);
}

const MAX_SIGNATURES = 50;   // tope de firmas retenidas en el estado (LRU por orden de toque)
const ERROR_PREVIEW_LEN = 200; // "primeros 200 caracteres normalizados del error" (spec E2)

function readAllStdin() {
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
    if (!obj || typeof obj !== "object") return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
}

// --- Resolución de $CLAUDE_CONFIG_DIR (con el mismo fallback que bin/lib/claude-config.sh) --

function configDir() {
    const envDir = process.env.CLAUDE_CONFIG_DIR;
    if (envDir && envDir.trim()) return envDir;
    return path.join(os.homedir(), ".claude");
}

function statePath() {
    return path.join(configDir(), "state", "loop-breaker.json");
}

function loadState() {
    try {
        const raw = fs.readFileSync(statePath(), "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && parsed.signatures && Array.isArray(parsed.order)) {
            if (typeof parsed.sessionId !== "string") parsed.sessionId = null;
            return parsed;
        }
    } catch { /* sin estado previo o corrupto: empezamos de cero, no es un error del hook */ }
    return { sessionId: null, signatures: {}, order: [] };
}

// Estado "por sesión" (spec E2): si el evento trae session_id y no coincide con el que quedó
// guardado, la sesión cambió — se descartan las firmas de la sesión anterior en vez de seguir
// acumulando fallos de una conversación que ya terminó. Sin session_id en el evento, se sigue
// usando el estado tal cual (mejor conservar memoria que perderla por un campo ausente).
function resetIfNewSession(state, sessionId) {
    if (typeof sessionId === "string" && sessionId && state.sessionId !== sessionId) {
        state.sessionId = sessionId;
        state.signatures = {};
        state.order = [];
        return true;
    }
    return false;
}

function saveState(state) {
    try {
        fs.mkdirSync(path.dirname(statePath()), { recursive: true });
        fs.writeFileSync(statePath(), JSON.stringify(state, null, 2), "utf8");
    } catch { /* si no se puede persistir, el hook sigue sin romperse — solo pierde memoria */ }
}

// --- Normalización y firma del error --------------------------------------------------
// Normaliza rutas absolutas, números de línea, hexadecimales largos y timestamps antes de
// hashear, para que dos intentos del "mismo" error colisionen aunque cambien detalles
// incidentales (una ruta temporal distinta, otra línea de la misma traza, otro timestamp...).

function normalizeError(text) {
    return String(text)
        // timestamps ISO-ish: 2026-08-01T12:34:56.789Z / "2026-08-01 12:34:56"
        .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g, "<timestamp>")
        // rutas absolutas Windows: C:\... o C:/...
        .replace(/[A-Za-z]:[\\/][^\s"'`:]+/g, "<path>")
        // rutas absolutas Unix: /algo/algo/archivo.ext
        .replace(/(?<![\w.])\/(?:[\w.-]+\/)+[\w.-]*/g, "<path>")
        // números de línea: "archivo.js:42" / "archivo.js:42:10" / "line 42"
        .replace(/:\d{1,6}(?::\d{1,6})?\b/g, ":<line>")
        .replace(/\bline\s+\d+/gi, "line <line>")
        // hexadecimales largos: direcciones de memoria, hashes, ids
        .replace(/\b0x[0-9a-fA-F]{4,}\b/g, "<hex>")
        .replace(/\b[0-9a-fA-F]{8,}\b/g, "<hex>")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, ERROR_PREVIEW_LEN);
}

function signatureFor(tool, normalizedError) {
    return crypto.createHash("sha256").update(`${tool}\u0000${normalizedError}`).digest("hex").slice(0, 24);
}

// --- Clasificación del resultado de la herramienta --------------------------------------
// Devuelve { failed: true, text } | { failed: false } | { failed: null } (sin señal clara,
// en cuyo caso no tocamos el estado — mejor no contar nada que contar mal).

function extractErrorText(evt, resp) {
    const direct = pick(evt, ["error", "errorMessage", "error_message"]);
    if (typeof direct === "string" && direct.trim()) return direct;
    if (resp && typeof resp === "object") {
        const nested = pick(resp, ["error", "errorMessage", "error_message", "message", "content", "stderr"]);
        if (typeof nested === "string" && nested.trim()) return nested;
        if (Array.isArray(nested)) {
            return nested
                .map(b => (b && typeof b === "object" ? pick(b, ["text", "content"]) : b))
                .filter(v => typeof v === "string")
                .join(" ");
        }
    }
    if (typeof resp === "string") return resp;
    return "";
}

function classifyOutcome(evt) {
    const resp = pick(evt, ["tool_response", "toolResponse", "output", "result"]);

    const topErrFlag = pick(evt, ["is_error", "isError"]);
    const respErrFlag = resp && typeof resp === "object" ? pick(resp, ["is_error", "isError"]) : undefined;
    const errFlag = topErrFlag !== undefined ? topErrFlag : respErrFlag;

    if (errFlag === true) {
        const text = extractErrorText(evt, resp);
        return { failed: true, text: text || "error" };
    }
    if (errFlag === false) return { failed: false };

    if (resp && typeof resp === "object") {
        const errField = pick(resp, ["error", "errorMessage", "error_message"]);
        if (typeof errField === "string" && errField.trim()) {
            return { failed: true, text: errField };
        }

        const exitCode = pick(resp, ["exit_code", "exitCode", "returncode", "return_code"]);
        if (exitCode !== undefined) {
            const n = Number(exitCode);
            if (Number.isFinite(n) && n !== 0) {
                const stderr = pick(resp, ["stderr", "stdErr"]);
                return { failed: true, text: (typeof stderr === "string" && stderr.trim()) ? stderr : `exit code ${n}` };
            }
            if (Number.isFinite(n) && n === 0) return { failed: false };
        }
    }

    if (typeof resp === "string" && /^\s*error\b/i.test(resp)) {
        return { failed: true, text: resp };
    }

    return { failed: null };
}

// --- Mensajes ------------------------------------------------------------------------

function reminderText(tool, count, preview) {
    const strong = count >= 6;
    const header = strong
        ? `CLAUDEMAX loop-breaker: ${count}º fallo IDÉNTICO seguido con ${tool}. Esto ya no es un problema de ejecución, es un problema de diagnóstico.`
        : `CLAUDEMAX loop-breaker: 3 fallos seguidos con la misma firma de error en ${tool}.`;
    const body = strong
        ? "DETENTE. No reintentes ni una variación más. Resume al usuario, en una lista breve, qué probaste y por qué crees que falló cada intento, y pregúntale explícitamente cómo quiere seguir antes de tocar nada más."
        : "Para antes del cuarto intento (regla 3 de CLAUDEMAX.md). Resume brevemente qué has probado y por qué crees que falló, y pregunta al usuario cómo prefiere seguir en vez de intentar otra variación menor.";
    return `<system-reminder>${header} ${body} Error normalizado: "${preview}"</system-reminder>`;
}

// --- Programa principal ---------------------------------------------------------------

async function main() {
    const raw = await readAllStdin();
    if (!raw) { process.exit(0); return; }

    let evt;
    try { evt = JSON.parse(raw); } catch { process.exit(0); return; }

    const tool = pick(evt, ["tool_name", "toolName", "tool", "name"]);
    if (!tool || typeof tool !== "string") { process.exit(0); return; }

    const outcome = classifyOutcome(evt);
    if (outcome.failed === null) { process.exit(0); return; }

    const sessionId = pick(evt, ["session_id", "sessionId"]);
    const state = loadState();
    let changed = resetIfNewSession(state, sessionId);

    if (outcome.failed === false) {
        // Éxito: reinicia el contador de todas las firmas activas de esta herramienta.
        for (const sig of Object.keys(state.signatures)) {
            if (state.signatures[sig].tool === tool) {
                delete state.signatures[sig];
                const idx = state.order.indexOf(sig);
                if (idx !== -1) state.order.splice(idx, 1);
                changed = true;
            }
        }
        if (changed) saveState(state);
        process.exit(0);
        return;
    }

    // Fallo: calcula la firma (herramienta + error normalizado) e incrementa su contador.
    const normalized = normalizeError(outcome.text);
    const sig = signatureFor(tool, normalized);

    if (state.signatures[sig]) {
        state.signatures[sig].count += 1;
        state.signatures[sig].updatedAt = new Date().toISOString();
        const idx = state.order.indexOf(sig);
        if (idx !== -1) state.order.splice(idx, 1);
        state.order.push(sig);
    } else {
        state.signatures[sig] = { tool, count: 1, preview: normalized, updatedAt: new Date().toISOString() };
        state.order.push(sig);
        while (state.order.length > MAX_SIGNATURES) {
            const oldest = state.order.shift();
            delete state.signatures[oldest];
        }
    }

    const count = state.signatures[sig].count;
    saveState(state);

    // Al 3er fallo idéntico, aviso; al 6º y cada 3 más allá, se repite con más énfasis.
    if (count === 3 || (count >= 6 && count % 3 === 0)) {
        process.stdout.write(reminderText(tool, count, normalized) + "\n");
    }

    process.exit(0);
}

main().catch(() => process.exit(0));
