#!/usr/bin/env bash
# Merge tolerante a JSONC para el settings.json de Claude Code. Solo para source.
# Usa node -e con un pequeño script inline — sin dependencias externas.
#
# ac_merge_hook <settings.json> <event> <hook-command> [matcher]
#   Agrega {event:[{hooks:[{type:"command",command:"<cmd>"}]}]} si no está ya presente.
#   Si se provee [matcher], el grupo obtiene un campo "matcher" (ej. "Bash" para PreToolUse).
#   Escribe un .bak antes de mutar.
#
# ac_remove_hook <settings.json> <substring>
#   Elimina cualquier hook cuyo string de comando contenga <substring>.
#
# ac_drop_stale_msys_hook <settings.json> <ruta-del-hook>
#   Migración para instalaciones de Windows anteriores al fix de cygpath.

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
        // Elimina comentarios // y /* */ + comas finales antes de parsear (tolerante a JSONC).
        const stripped = raw
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/(^|[^:])\/\/[^\n]*/g, "$1")
            .replace(/,(\s*[}\]])/g, "$1");
        let cfg = {};
        try { cfg = JSON.parse(stripped || "{}"); } catch (e) {
            console.error("[ERR] settings.json no se pudo parsear incluso tras limpiar JSONC: " + e.message);
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

# Una instalación de Windows anterior al fix de cygpath registró el hook con la ruta
# MSYS (node /c/Users/...), que node resuelve como C:\c\Users\... y falla en cada
# disparo. ac_merge_hook compara el comando literal, así que registrar la ruta buena
# deja la vieja conviviendo: hook duplicado, uno de ellos siempre en error. Se quita
# aquí antes de registrar. No-op donde no hay cygpath (macOS/Linux).
# El comando bueno ("node C:/Users/...") no contiene el needle ("/c/Users/..."), así
# que no se autoelimina.
ac_drop_stale_msys_hook() {
    local file="$1" hook_path="$2"
    [ -f "$file" ] || return 0
    command -v cygpath >/dev/null 2>&1 || return 0
    ac_remove_hook "$file" "$(cygpath -u "$hook_path")"
}

ac_remove_hook() {
    local file="$1" needle="$2"
    [ -f "$file" ] || return 0
    cp -f "$file" "$file.bak"

    # MSYS2_ENV_CONV_EXCL: en Git Bash, MSYS reescribe toda variable de entorno cuyo
    # valor empiece por "/" antes de pasarla a un .exe nativo — NEEDLE=/c/Users/... le
    # llega a node.exe como C:/Users/..., y entonces ac_remove_hook busca justo lo
    # contrario de lo que se le pidió. Solo afecta al valor completo, no a rutas
    # embebidas ("node /c/..." pasa intacto), por eso basta con excluir NEEDLE.
    SETTINGS_FILE="$file" NEEDLE="$needle" MSYS2_ENV_CONV_EXCL="NEEDLE" node -e '
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
            console.error("[WARN] settings.json no se pudo parsear; se omite la eliminación.");
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
