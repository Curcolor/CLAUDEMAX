#!/usr/bin/env bash
# JSONC-tolerant merge for Claude Code's settings.json. Source-only.
# Uses node -e with a tiny inline script — no external deps.
#
# ac_merge_hook <settings.json> <event> <hook-command> [matcher]
#   Adds {event:[{hooks:[{type:"command",command:"<cmd>"}]}]} if not already present.
#   If [matcher] is provided, the group gets a "matcher" field (e.g. "Bash" for PreToolUse).
#   Writes a .bak before mutating.
#
# ac_remove_hook <settings.json> <substring>
#   Removes any hook whose command string contains <substring>.

ac_merge_hook() {
    local file="$1" event="$2" cmd="$3" matcher="${4:-}"
    [ -f "$file" ] || printf "{}\n" > "$file"
    cp -f "$file" "$file.bak"

    SETTINGS_FILE="$file" HOOK_EVENT="$event" HOOK_CMD="$cmd" HOOK_MATCHER="$matcher" node -e '
        const fs = require("fs");
        const file = process.env.SETTINGS_FILE;
        const event = process.env.HOOK_EVENT;
        const cmd = process.env.HOOK_CMD;
        const matcher = process.env.HOOK_MATCHER || "";
        let raw = fs.readFileSync(file, "utf8");
        // Strip // and /* */ comments + trailing commas before parsing (JSONC-tolerant).
        const stripped = raw
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/(^|[^:])\/\/[^\n]*/g, "$1")
            .replace(/,(\s*[}\]])/g, "$1");
        let cfg = {};
        try { cfg = JSON.parse(stripped || "{}"); } catch (e) {
            console.error("[ERR] settings.json unparseable even after JSONC strip: " + e.message);
            process.exit(2);
        }
        cfg.hooks = cfg.hooks || {};
        cfg.hooks[event] = cfg.hooks[event] || [];
        const exists = cfg.hooks[event].some(group => {
            const groupMatcher = group && typeof group.matcher === "string" ? group.matcher : "";
            if (groupMatcher !== matcher) return false;
            return Array.isArray(group.hooks) && group.hooks.some(h => h && h.command === cmd);
        });
        if (!exists) {
            const group = { hooks: [{ type: "command", command: cmd }] };
            if (matcher) group.matcher = matcher;
            cfg.hooks[event].push(group);
        }
        fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
    '
}

ac_remove_hook() {
    local file="$1" needle="$2"
    [ -f "$file" ] || return 0
    cp -f "$file" "$file.bak"

    SETTINGS_FILE="$file" NEEDLE="$needle" node -e '
        const fs = require("fs");
        const file = process.env.SETTINGS_FILE;
        const needle = process.env.NEEDLE;
        let raw = fs.readFileSync(file, "utf8");
        const stripped = raw
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/(^|[^:])\/\/[^\n]*/g, "$1")
            .replace(/,(\s*[}\]])/g, "$1");
        let cfg;
        try { cfg = JSON.parse(stripped || "{}"); } catch (e) {
            console.error("[WARN] settings.json unparseable; skipping removal.");
            process.exit(0);
        }
        if (!cfg.hooks) { process.exit(0); }
        for (const event of Object.keys(cfg.hooks)) {
            cfg.hooks[event] = (cfg.hooks[event] || [])
                .map(group => {
                    if (!group || !Array.isArray(group.hooks)) return group;
                    group.hooks = group.hooks.filter(h => !(h && typeof h.command === "string" && h.command.includes(needle)));
                    return group;
                })
                .filter(group => group && Array.isArray(group.hooks) && group.hooks.length > 0);
            if (cfg.hooks[event].length === 0) delete cfg.hooks[event];
        }
        if (Object.keys(cfg.hooks).length === 0) delete cfg.hooks;
        fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
    '
}
