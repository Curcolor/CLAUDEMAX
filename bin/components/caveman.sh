#!/usr/bin/env bash
# Instala Caveman (fan-out multi-agente, badge de statusline, MCP caveman-shrink).
# Upstream: https://github.com/JuliusBrussee/caveman — ver INSTALL-CAVEMAN.md.

ac_component_caveman() {
    ac_step "Caveman — modo terso + fan-out multi-agente + MCP caveman-shrink"

    local args=("--all")
    [ "${FORCE:-0}" = "1" ]   && args+=("--force")
    [ "${DRY_RUN:-0}" = "1" ] && args+=("--dry-run")

    # --non-interactive: Caveman omite los prompts cuando stdin no es un TTY; lo establecemos explícitamente
    # porque pasar nuestro install.sh por curl|bash ya desconecta stdin.
    args+=("--non-interactive")

    if [ -n "${AC_CONFIG_DIR_OVERRIDE:-}" ]; then
        args+=("--config-dir" "$AC_CONFIG_DIR_OVERRIDE")
    fi

    ac_info "Ejecutando: npx -y github:JuliusBrussee/caveman -- ${args[*]}"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ npx -y github:JuliusBrussee/caveman -- ${args[*]}"
        return 0
    fi

    if npx -y github:JuliusBrussee/caveman -- "${args[@]}"; then
        ac_info "Caveman instalado."
    else
        ac_warn "El instalador de Caveman salió con código distinto de cero — revisa la salida anterior. Vuelve a ejecutar con --force para reintentar."
    fi
}
