#!/usr/bin/env bash
# Register Figma's remote MCP server with Claude Code. OAuth is deferred to the user.
# Reference: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/#claude-code

ac_component_figma() {
    ac_step "Figma MCP — remote server (OAuth completed manually after install)"

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI not on PATH — skipping Figma MCP registration."
        ac_warn "Install Claude Code, then re-run: bash install.sh --only figma"
        return 0
    fi

    # Idempotent: 'claude mcp list' tells us if 'figma' already exists.
    if claude mcp list 2>/dev/null | grep -qi '^figma\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_info "figma MCP already registered — removing and re-adding (--force)."
            ac_run claude mcp remove figma || true
        else
            ac_info "figma MCP already registered; skipping. Use --force to re-add."
            ac_print_figma_oauth_hint
            return 0
        fi
    fi

    ac_info "Registering Figma MCP at https://mcp.figma.com/mcp (user scope)"
    if ac_run claude mcp add -s user --transport http figma https://mcp.figma.com/mcp; then
        ac_info "Figma MCP registered (available in every project)."
    else
        ac_warn "claude mcp add failed for figma — try manually:"
        ac_warn "  claude mcp add -s user --transport http figma https://mcp.figma.com/mcp"
        return 0
    fi

    ac_print_figma_oauth_hint
}

ac_print_figma_oauth_hint() {
    cat <<'EOF'

  → Finish Figma setup (manual, one time):
    1. Open Claude Code.
    2. Run: /mcp
    3. Select "figma" and follow the browser OAuth flow.
    4. Done. ABSOLUTE-CLAUDE does not store any Figma tokens.

EOF
}
