#!/usr/bin/env bash
# Paquete UI/UX:
#   1. Copia la skill propia (first-party) ui-ux-pro-max de este repo a $CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max/
#   2. Registra el MCP magic de 21st.dev con Claude Code
#   3. npm install framer-motion gsap en el cwd (condicionado a la presencia de package.json + --no-npm)

ac_component_ui_ux() {
    ac_step "UI/UX — skill ui-ux-pro-max + MCP magic de 21st.dev + framer-motion/gsap"

    ac_uiux_install_skill
    ac_uiux_install_magic_mcp
    ac_uiux_install_npm_deps
}

ac_uiux_install_skill() {
    local src="$AC_REPO_DIR/skills/ui-ux-pro-max"
    local dst="$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max"
    ac_info "Instalando skill ui-ux-pro-max (propia) en $dst"

    if [ ! -d "$src" ]; then
        ac_warn "Falta la skill de origen: $src — se omite."
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
        ac_warn "El CLI claude no está en el PATH — se omite el registro del MCP magic de 21st.dev."
        return 0
    fi

    if claude mcp list 2>/dev/null | grep -qi '^magic\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove magic || true
        else
            ac_info "El MCP magic ya está registrado; se omite. Usa --force para re-agregarlo."
            return 0
        fi
    fi

    ac_info "Registrando el MCP magic de 21st.dev (npx @21st-dev/magic@latest, alcance de usuario)"
    if ac_run claude mcp add -s user magic -- npx -y @21st-dev/magic@latest; then
        ac_info "MCP magic registrado (disponible en todos los proyectos)."
    else
        ac_warn "claude mcp add falló para magic — intenta manualmente:"
        ac_warn "  claude mcp add -s user magic -- npx -y @21st-dev/magic@latest"
    fi
}

ac_uiux_install_npm_deps() {
    if [ "${NO_NPM:-0}" = "1" ]; then
        ac_info "--no-npm activado; se omite la instalación de framer-motion / gsap."
        return 0
    fi

    local cwd; cwd="$(pwd)"

    if [ ! -f "$cwd/package.json" ]; then
        if [ "${WITH_NPM:-0}" = "1" ]; then
            ac_info "No hay package.json en $cwd; --with-npm fuerza 'npm init -y'."
            ac_run npm init -y >/dev/null || { ac_warn "npm init falló — se omite."; return 0; }
        else
            ac_warn "No hay package.json en $cwd — se omite la instalación de framer-motion / gsap."
            ac_warn "  Ejecuta desde la raíz de tu proyecto, o pasa --with-npm para crear uno."
            return 0
        fi
    fi

    ac_info "Instalando framer-motion + gsap en $cwd"
    if ac_run npm install --save framer-motion gsap; then
        ac_info "framer-motion + gsap instalados."
    else
        ac_warn "npm install falló — instala manualmente: npm i framer-motion gsap"
    fi
}
