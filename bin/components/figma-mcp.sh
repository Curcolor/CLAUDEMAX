#!/usr/bin/env bash
# Registra el servidor MCP remoto de Figma con Claude Code. El OAuth queda a cargo del usuario.
# Referencia: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/#claude-code

ac_component_figma() {
    ac_step "Figma MCP — servidor remoto (OAuth completado manualmente tras la instalación)"

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "El CLI claude no está en el PATH — se omite el registro del MCP de Figma."
        ac_warn "Instala Claude Code y vuelve a ejecutar: bash install.sh --only figma"
        return 0
    fi

    # Idempotente: 'claude mcp list' nos dice si 'figma' ya existe.
    if claude mcp list 2>/dev/null | grep -qi '^figma\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_info "El MCP figma ya está registrado — eliminando y re-agregando (--force)."
            ac_run claude mcp remove figma || true
        else
            ac_info "El MCP figma ya está registrado; se omite. Usa --force para re-agregarlo."
            ac_print_figma_oauth_hint
            return 0
        fi
    fi

    ac_info "Registrando el MCP de Figma en https://mcp.figma.com/mcp (alcance de usuario)"
    if ac_run claude mcp add -s user --transport http figma https://mcp.figma.com/mcp; then
        ac_info "MCP de Figma registrado (disponible en todos los proyectos)."
    else
        ac_warn "claude mcp add falló para figma — intenta manualmente:"
        ac_warn "  claude mcp add -s user --transport http figma https://mcp.figma.com/mcp"
        return 0
    fi

    ac_print_figma_oauth_hint
}

ac_print_figma_oauth_hint() {
    cat <<'EOF'

  → Termina la configuración de Figma (manual, una sola vez):
    1. Abre Claude Code.
    2. Ejecuta: /mcp
    3. Selecciona "figma" y sigue el flujo de OAuth en el navegador.
    4. Listo. ABSOLUTE-CLAUDE no almacena ningún token de Figma.

EOF
}
