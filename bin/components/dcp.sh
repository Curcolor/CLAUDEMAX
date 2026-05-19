#!/usr/bin/env bash
# DCP component:
#   - Always installs the dcp-lite skill + PostToolUse hook into $CLAUDE_CONFIG_DIR.
#   - If opencode is on PATH, also installs the real DCP plugin globally.
#
# Real DCP is an opencode plugin (see README-DCP.md). Claude Code lacks the plugin
# hook DCP needs, so dcp-lite is a best-effort skill+hook simulation. The dcp-lite
# files themselves live in the repo's skills/dcp-lite/ and hooks/ dirs; this
# component just copies them into place and registers the hook in settings.json.

ac_component_dcp() {
    ac_step "DCP — opencode plugin (if detected) + dcp-lite skill for Claude Code"

    # --- Always: dcp-lite for Claude Code ---
    local skill_src="$AC_REPO_DIR/skills/dcp-lite"
    local hook_src="$AC_REPO_DIR/hooks/dcp-lite-dedup.mjs"
    local skill_dst="$CLAUDE_CONFIG_DIR/skills/dcp-lite"
    local hook_dst="$CLAUDE_CONFIG_DIR/hooks/dcp-lite-dedup.mjs"

    ac_info "Installing dcp-lite skill into $skill_dst"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ cp -r $skill_src $skill_dst"
        ac_dim "\$ cp $hook_src $hook_dst"
    else
        mkdir -p "$CLAUDE_CONFIG_DIR/skills" "$CLAUDE_CONFIG_DIR/hooks"
        rm -rf "$skill_dst"
        cp -R "$skill_src" "$skill_dst"
        cp -f "$hook_src" "$hook_dst"
        chmod +x "$hook_dst" 2>/dev/null || true

        # Register the PostToolUse hook in settings.json (idempotent).
        local settings="$CLAUDE_CONFIG_DIR/settings.json"
        ac_merge_hook "$settings" "PostToolUse" "node $hook_dst"
        ac_info "Registered PostToolUse hook in $settings (backup: ${settings}.bak)"
    fi

    # --- Conditionally: real DCP plugin for opencode ---
    if [ "$AC_HAS_OPENCODE" = "1" ]; then
        ac_info "opencode detected — installing real DCP plugin globally"
        if [ "${DRY_RUN:-0}" = "1" ]; then
            ac_dim "\$ opencode plugin @tarquinen/opencode-dcp@latest --global"
        else
            opencode plugin @tarquinen/opencode-dcp@latest --global \
                || ac_warn "opencode plugin install failed — dcp-lite skill is still installed for Claude Code."
        fi
    else
        ac_info "opencode not detected — real DCP plugin skipped. dcp-lite skill installed for Claude Code."
        ac_dim "  (caveman-shrink MCP + native /compact handle actual token pruning on Claude Code.)"
    fi
}
