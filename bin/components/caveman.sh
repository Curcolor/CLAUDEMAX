#!/usr/bin/env bash
# Install Caveman (multi-agent fan-out, statusline badge, caveman-shrink MCP).
# Upstream: https://github.com/JuliusBrussee/caveman — see INSTALL-CAVEMAN.md.

ac_component_caveman() {
    ac_step "Caveman — terse-mode + multi-agent fan-out + caveman-shrink MCP"

    local args=("--all")
    [ "${FORCE:-0}" = "1" ]   && args+=("--force")
    [ "${DRY_RUN:-0}" = "1" ] && args+=("--dry-run")

    # --non-interactive: Caveman skips prompts when stdin isn't a TTY; we set it explicitly
    # because piping our install.sh through curl|bash already detaches stdin.
    args+=("--non-interactive")

    if [ -n "${AC_CONFIG_DIR_OVERRIDE:-}" ]; then
        args+=("--config-dir" "$AC_CONFIG_DIR_OVERRIDE")
    fi

    ac_info "Running: npx -y github:JuliusBrussee/caveman -- ${args[*]}"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ npx -y github:JuliusBrussee/caveman -- ${args[*]}"
        return 0
    fi

    if npx -y github:JuliusBrussee/caveman -- "${args[@]}"; then
        ac_info "Caveman installed."
    else
        ac_warn "Caveman installer exited non-zero — check output above. Re-run with --force to retry."
    fi
}
