#!/usr/bin/env node
// dcp-lite / dcp-lite.mjs — helpers for /dcp-context and /dcp-stats commands.
// Reads the per-session log written by hooks/dcp-lite-dedup.mjs.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const cfgDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const stateDir = path.join(cfgDir, "state");
const sessionFile = path.join(stateDir, "dcp-lite-session.json");
const cumFile = path.join(stateDir, "dcp-lite-cumulative.json");

const cmd = process.argv[2] || "context";

function loadJson(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); }
    catch { return fallback; }
}

if (cmd === "context") {
    const s = loadJson(sessionFile, { calls: [], dups: 0, errors: 0, sessionId: "(none)" });
    const lastUser = s.lastUserAt || 0;
    const turnsSince = s.calls.filter(c => c.ts > lastUser).length;
    console.log("# dcp-lite — current session");
    console.log("");
    console.log(`- Session: \`${s.sessionId}\``);
    console.log(`- Total tool calls: ${s.calls.length}`);
    console.log(`- Duplicate calls flagged: ${s.dups}`);
    console.log(`- Errored calls flagged: ${s.errors}`);
    console.log(`- Turns since last user message: ${turnsSince}`);
    console.log("");
    console.log("Tip: run `/dcp-compress` to summarize stale tool outputs, then `/compact` to actually free tokens.");
    process.exit(0);
}

if (cmd === "stats") {
    const c = loadJson(cumFile, { sessions: 0, totalCalls: 0, totalDups: 0, totalErrors: 0 });
    console.log("# dcp-lite — cumulative stats");
    console.log("");
    console.log(`- Sessions tracked: ${c.sessions}`);
    console.log(`- Total tool calls: ${c.totalCalls}`);
    console.log(`- Total duplicates flagged: ${c.totalDups}`);
    console.log(`- Total errored calls flagged: ${c.totalErrors}`);
    process.exit(0);
}

if (cmd === "reset") {
    try { fs.unlinkSync(sessionFile); } catch {}
    console.log("dcp-lite: session log reset.");
    process.exit(0);
}

console.error(`Unknown command: ${cmd}. Use: context | stats | reset`);
process.exit(2);
