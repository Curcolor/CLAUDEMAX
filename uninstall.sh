#!/usr/bin/env bash
# Desinstalador de ABSOLUTE-CLAUDE. Simétrico a install.sh.
#
# Elimina:
#   - binario de rtk en $HOME/.local/bin/rtk (NO elimina los hooks de Claude instalados por rtk
#     — `rtk init --global` escribe en tu settings; los dejamos para que `rtk` los administre)
#   - Caveman (delega a su propio --uninstall)
#   - plugin DCP real (si opencode está presente)
#   - skill dcp-lite + hook PostToolUse + archivos de estado
#   - skill repo-map
#   - registros de los MCP Figma + magic en Claude Code
#   - directorio de la skill ui-ux-pro-max
#
# NO elimina:
#   - archivos por-repo que el --with-init de Caveman pudo haber escrito
#   - framer-motion / gsap del node_modules de tu proyecto — desinstálalos tú mismo con npm si quieres

set -euo pipefail

AC_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export AC_REPO_DIR

. "$AC_REPO_DIR/bin/lib/log.sh"
. "$AC_REPO_DIR/bin/lib/detect.sh"
. "$AC_REPO_DIR/bin/lib/claude-config.sh"
. "$AC_REPO_DIR/bin/lib/jsonc.sh"

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1
export DRY_RUN

ac_detect_all
ac_resolve_config_dir

ac_step "Desinstalando componentes de ABSOLUTE-CLAUDE"
[ "$DRY_RUN" = "1" ] && ac_warn "DRY-RUN — no se harán cambios."

# --- Caveman (delega)
ac_step "Caveman"
if [ "$DRY_RUN" = "1" ]; then
    ac_dim "\$ npx -y github:JuliusBrussee/caveman -- --uninstall --non-interactive"
else
    npx -y github:JuliusBrussee/caveman -- --uninstall --non-interactive \
        || ac_warn "Caveman uninstall returned non-zero."
fi

# --- DCP (real, para opencode)
if [ "$AC_HAS_OPENCODE" = "1" ]; then
    ac_step "DCP (plugin de opencode)"
    if [ "$DRY_RUN" = "1" ]; then
        ac_dim "\$ opencode plugin uninstall @tarquinen/opencode-dcp --global  (mejor esfuerzo)"
    else
        opencode plugin uninstall @tarquinen/opencode-dcp --global 2>/dev/null \
            || ac_warn "No se pudo desinstalar opencode-dcp automáticamente. Elimínalo manualmente con el gestor de plugins de opencode."
    fi
fi

# --- dcp-lite (skill + hook + estado)
ac_step "dcp-lite (skill + hook + estado)"
ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/dcp-lite"
ac_run rm -f  "$CLAUDE_CONFIG_DIR/hooks/dcp-lite-dedup.mjs"
ac_run rm -f  "$CLAUDE_CONFIG_DIR/state/dcp-lite-session.json"
ac_run rm -f  "$CLAUDE_CONFIG_DIR/state/dcp-lite-cumulative.json"
if [ -f "$CLAUDE_CONFIG_DIR/settings.json" ]; then
    if [ "$DRY_RUN" = "1" ]; then
        ac_dim "\$ eliminar entradas de hook que contengan 'dcp-lite-dedup.mjs' de $CLAUDE_CONFIG_DIR/settings.json"
    else
        ac_remove_hook "$CLAUDE_CONFIG_DIR/settings.json" "dcp-lite-dedup.mjs"
        ac_info "Hook de dcp-lite eliminado de settings.json (respaldo: $CLAUDE_CONFIG_DIR/settings.json.bak)"
    fi
fi

# --- repo-map
ac_step "skill repo-map"
ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/repo-map"

# --- dev-skills (superpowers + SOLID + design-patterns + conventional-commits + architecture-patterns)
ac_step "Skills de ingeniería (superpowers + architecture-principles + conventional-commits + nombres legados)"
for s in superpowers solid design-patterns conventional-commits architecture-patterns architecture-principles; do
    ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/$s"
done

# --- ui-ux skill + magic MCP
ac_step "UI/UX (skill + magic MCP)"
ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove magic 2>/dev/null || true
fi

# --- Figma MCP
ac_step "Figma MCP"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove figma 2>/dev/null || true
fi

# --- RAG (MCP + contenedor; el volumen de datos y las carpetas se preservan)
ac_step "RAG (registro de MCP + contenedor)"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove rag 2>/dev/null || true
fi
if docker info >/dev/null 2>&1 && docker ps -a --format '{{.Names}}' | grep -q '^claudemax-ragdb$'; then
    ac_run docker stop claudemax-ragdb
    ac_run docker rm claudemax-ragdb
    ac_info "Contenedor ragdb eliminado. El volumen de datos 'ragdata' y las carpetas V.A.U.L.T/R.A.G se dejaron intactas."
fi

# --- Binario de RTK + hook
ac_step "Binario de RTK + hook PreToolUse"
removed_any=0
for bin in "$HOME/.local/bin/rtk" "$HOME/.local/bin/rtk.exe"; do
    if [ -f "$bin" ]; then
        ac_run rm -f "$bin"
        ac_info "Eliminado $bin"
        removed_any=1
    fi
done
[ "$removed_any" = "0" ] && ac_info "El binario de rtk no está en \$HOME/.local/bin; nada que eliminar."

if [ -f "$CLAUDE_CONFIG_DIR/settings.json" ]; then
    if [ "$DRY_RUN" = "1" ]; then
        ac_dim "\$ eliminar entradas de hook que contengan 'rtk hook claude' de $CLAUDE_CONFIG_DIR/settings.json"
    else
        ac_remove_hook "$CLAUDE_CONFIG_DIR/settings.json" "rtk hook claude"
        ac_info "Hook PreToolUse de rtk eliminado de settings.json (respaldo: $CLAUDE_CONFIG_DIR/settings.json.bak)"
    fi
fi

# RTK.md + la referencia @RTK.md que rtk agregó a CLAUDE.md están gestionados upstream; se dejan intactos.
if [ -f "$CLAUDE_CONFIG_DIR/RTK.md" ]; then
    ac_dim "  (se dejó intacto: $CLAUDE_CONFIG_DIR/RTK.md — elimínalo a mano si ya no lo quieres)"
fi

ac_step "Listo."
ac_info "Los archivos por-repo (.claude/repo-map.md, .cursor/rules/, etc.) se dejan intactos intencionalmente. Elimínalos a mano si lo deseas."
