#!/usr/bin/env node
// PostToolUse hook for dcp-lite. Reads the hook event from stdin (JSON),
// updates a per-session log, and emits a <system-reminder> on stdout when:
//   1. The same (tool, normalized-args) tuple has been called before — flag the older copy stale.
//   2. A tool call errored AND was last seen >= DCP_LITE_PURGE_TURNS turns ago — flag the input as no longer relevant.
//
// Hook is registered by bin/components/dcp.sh under settings.json -> hooks.PostToolUse.
//
// Claude Code passes the event payload on stdin. We read it best-effort: if the schema
// shifts, we degrade silently so we never block tool execution.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const PURGE_TURNS = Number(process.env.DCP_LITE_PURGE_TURNS || 4);

const cfgDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const stateDir = path.join(cfgDir, "state");
fs.mkdirSync(stateDir, { recursive: true });

const sessionFile = path.join(stateDir, "dcp-lite-session.json");
const cumFile = path.join(stateDir, "dcp-lite-cumulative.json");

function readAllStdin() {
    return new Promise(resolve => {
        let buf = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", c => { buf += c; });
        process.stdin.on("end", () => resolve(buf));
        // Safety: if stdin is a TTY (manual invocation), don't hang forever.
        if (process.stdin.isTTY) resolve("");
    });
}

function loadJson(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); }
    catch { return fallback; }
}

function saveJson(file, data) {
    try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
    catch {}
}

function normalizeArgs(input) {
    if (input == null) return "";
    try {
        if (typeof input === "string") return input.trim();
        return JSON.stringify(input, Object.keys(input).sort());
    } catch { return String(input); }
}

function hash(s) {
    return crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
}

(async () => {
    const raw = await readAllStdin();
    if (!raw) process.exit(0);

    let evt;
    try { evt = JSON.parse(raw); } catch { process.exit(0); }

    // Try a handful of likely field names. Claude Code's hook payload schema
    // has shifted over versions — we degrade silently if nothing matches.
    const tool = evt.tool_name || evt.toolName || evt.tool || (evt.tool_input && evt.tool_input.tool);
    const input = evt.tool_input || evt.toolInput || evt.input || evt.arguments;
    const output = evt.tool_response || evt.toolResponse || evt.output || evt.result;
    const errored = !!(evt.is_error || evt.isError || evt.error || (output && output.is_error));
    const sessionId = evt.session_id || evt.sessionId || "default";

    if (!tool) process.exit(0);

    const key = `${tool}:${hash(normalizeArgs(input))}`;
    const now = Date.now();

    const s = loadJson(sessionFile, {
        sessionId,
        calls: [],
        index: {},
        dups: 0,
        errors: 0,
        lastUserAt: 0
    });

    // Reset session log when sessionId changes.
    if (s.sessionId !== sessionId) {
        const cum = loadJson(cumFile, { sessions: 0, totalCalls: 0, totalDups: 0, totalErrors: 0 });
        cum.sessions += 1;
        cum.totalCalls += s.calls.length;
        cum.totalDups += s.dups;
        cum.totalErrors += s.errors;
        saveJson(cumFile, cum);

        s.sessionId = sessionId;
        s.calls = [];
        s.index = {};
        s.dups = 0;
        s.errors = 0;
        s.lastUserAt = 0;
    }

    const prior = s.index[key];
    const reminders = [];

    if (prior && !errored) {
        s.dups += 1;
        const turnsAgo = s.calls.length - prior.turn;
        reminders.push(
            `dcp-lite: duplicate of \`${tool}\` call ~${turnsAgo} tool-turns ago (same arguments). ` +
            `The earlier output is now stale — rely on this most recent result.`
        );
    }

    if (errored) {
        s.errors += 1;
        const sameErroredEarlier = s.calls.filter(c =>
            c.key === key && c.errored && (s.calls.length - c.turn) >= PURGE_TURNS
        );
        if (sameErroredEarlier.length > 0) {
            reminders.push(
                `dcp-lite: prior errored \`${tool}\` call (>=${PURGE_TURNS} turns ago) is no longer relevant. ` +
                `Disregard its input payload; only the recovery action since then matters.`
            );
        }
    }

    s.calls.push({ key, tool, errored, ts: now, turn: s.calls.length });
    s.index[key] = { turn: s.calls.length - 1 };

    // Cap memory: keep last 500 calls.
    if (s.calls.length > 500) {
        s.calls = s.calls.slice(-500);
        s.index = {};
        s.calls.forEach((c, i) => { s.index[c.key] = { turn: i }; });
    }

    saveJson(sessionFile, s);

    if (reminders.length > 0) {
        // Claude Code reads stdout from PostToolUse hooks as additional context appended to the tool result.
        for (const r of reminders) {
            process.stdout.write(`<system-reminder>${r}</system-reminder>\n`);
        }
    }

    process.exit(0);
})();
