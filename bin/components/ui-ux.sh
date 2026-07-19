#!/usr/bin/env bash
# UI/UX bundle:
#   1. Copy the first-party ui-ux-pro-max skill from this repo into $CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max/
#   2. Register 21st.dev's magic MCP with Claude Code
#   3. npm install framer-motion gsap into cwd (gated by package.json presence + --no-npm)

ac_component_ui_ux() {
    ac_step "UI/UX — ui-ux-pro-max skill + 21st.dev magic MCP + framer-motion/gsap"

    ac_uiux_install_skill
    ac_uiux_install_magic_mcp
    ac_uiux_install_npm_deps
}

ac_uiux_install_skill() {
    local src="$AC_REPO_DIR/skills/ui-ux-pro-max"
    local dst="$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max"
    ac_info "Installing ui-ux-pro-max skill (first-party) into $dst"

    if [ ! -d "$src" ]; then
        ac_warn "Source skill missing: $src — skipping."
        return 0
    fi
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ cp -R $src $dst"
        return 0
    fi
    mkdir -p "$CLAUDE_CONFIG_DIR/skills"
    rm -rf "$dst"
    cp -R "$src" "$dst"
}

ac_uiux_install_magic_mcp() {
    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI not on PATH — skipping 21st.dev magic MCP registration."
        return 0
    fi

    if claude mcp list 2>/dev/null | grep -qi '^magic\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove magic || true
        else
            ac_info "magic MCP already registered; skipping. Use --force to re-add."
            return 0
        fi
    fi

    ac_info "Registering 21st.dev magic MCP (npx @21st-dev/magic@latest, user scope)"
    if ac_run claude mcp add -s user magic -- npx -y @21st-dev/magic@latest; then
        ac_info "magic MCP registered (available in every project)."
    else
        ac_warn "claude mcp add failed for magic — try manually:"
        ac_warn "  claude mcp add -s user magic -- npx -y @21st-dev/magic@latest"
    fi
}

ac_uiux_install_npm_deps() {
    if [ "${NO_NPM:-0}" = "1" ]; then
        ac_info "--no-npm set; skipping framer-motion / gsap install."
        return 0
    fi

    local cwd; cwd="$(pwd)"

    if [ ! -f "$cwd/package.json" ]; then
        if [ "${WITH_NPM:-0}" = "1" ]; then
            ac_info "No package.json in $cwd; --with-npm forces 'npm init -y'."
            ac_run npm init -y >/dev/null || { ac_warn "npm init failed — skipping."; return 0; }
        else
            ac_warn "No package.json in $cwd — skipping framer-motion / gsap install."
            ac_warn "  Run from your project root, or pass --with-npm to create one."
            return 0
        fi
    fi

    ac_info "Installing framer-motion + gsap into $cwd"
    if ac_run npm install --save framer-motion gsap; then
        ac_info "framer-motion + gsap installed."
    else
        ac_warn "npm install failed — install manually: npm i framer-motion gsap"
    fi
}
