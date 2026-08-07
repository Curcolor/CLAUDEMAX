#!/usr/bin/env bash
# Desinstalador de CLAUDEMAX. Simétrico a install.sh.
#
# Elimina:
#   - binario de rtk en $HOME/.local/bin/rtk (NO elimina los hooks de Claude instalados por rtk
#     — `rtk init --global` escribe en tu settings; los dejamos para que `rtk` los administre)
#   - Caveman de instalaciones antiguas de CLAUDEMAX (delega a su propio --uninstall; ya no es un
#     componente de install.sh, pero instalaciones previas pudieron haberlo dejado activo)
#   - plugin DCP real (si opencode está presente)
#   - skill dcp-lite + hook PostToolUse + archivos de estado
#   - skill repo-map
#   - registros de los MCP Figma + magic en Claude Code
#   - directorio de la skill ui-ux-pro-max + hook PostToolUse de auditoría de UI (ui-audit.mjs)
#
# NO elimina:
#   - archivos por-repo que el --with-init de una instalación antigua de Caveman pudo haber escrito
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

ac_step "Desinstalando componentes de CLAUDEMAX"
[ "$DRY_RUN" = "1" ] && ac_warn "DRY-RUN — no se harán cambios."

# --- Caveman (heredado — ya no es un componente de install.sh; limpia instalaciones antiguas que lo activaron)
ac_step "Caveman (limpieza heredada, delega en su propio --uninstall)"
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

# --- dev-skills (superpowers + SOLID + design-patterns + conventional-commits + architecture-patterns + skill-mcp-builder + no-ai-slop)
ac_step "Skills de ingeniería (superpowers + architecture-principles + conventional-commits + skill-mcp-builder + no-ai-slop + nombres legados)"
for s in superpowers solid design-patterns conventional-commits architecture-patterns architecture-principles skill-mcp-builder no-ai-slop rituales; do
    ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/$s"
done

# --- ui-ux skill + magic MCP + hook de auditoría de UI
ac_step "UI/UX (skill + magic MCP + hook de auditoría)"
ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove magic 2>/dev/null || true
fi
ac_run rm -f "$CLAUDE_CONFIG_DIR/hooks/ui-audit.mjs"
if [ -f "$CLAUDE_CONFIG_DIR/settings.json" ]; then
    if [ "$DRY_RUN" = "1" ]; then
        ac_dim "\$ eliminar entradas de hook que contengan 'ui-audit.mjs' de $CLAUDE_CONFIG_DIR/settings.json"
    else
        ac_remove_hook "$CLAUDE_CONFIG_DIR/settings.json" "ui-audit.mjs"
        ac_info "Hook de auditoría de UI eliminado de settings.json (respaldo: $CLAUDE_CONFIG_DIR/settings.json.bak)"
    fi
fi

# --- Reglas y rituales: los cuatro hooks de cumplimiento y contexto.
# Las reglas del workspace (<RAG_ROOT>/.claude/) NO se borran: el usuario pudo editarlas.
ac_step "Reglas y rituales (hooks)"
for h in git-footer-guard loop-breaker skill-suggest session-start; do
    ac_run rm -f "$CLAUDE_CONFIG_DIR/hooks/$h.mjs"
    if [ -f "$CLAUDE_CONFIG_DIR/settings.json" ]; then
        if [ "$DRY_RUN" = "1" ]; then
            ac_dim "\$ eliminar entradas de hook que contengan '$h.mjs' de $CLAUDE_CONFIG_DIR/settings.json"
        else
            ac_remove_hook "$CLAUDE_CONFIG_DIR/settings.json" "$h.mjs"
        fi
    fi
done
ac_run rm -f "$CLAUDE_CONFIG_DIR/state/loop-breaker.json"
ac_run rm -f "$CLAUDE_CONFIG_DIR/state/skill-suggest.json"
ac_dim "  (se conservan: las reglas de <RAG_ROOT>/.claude/ — puedes haberlas editado)"

# --- Graphify (registro en Claude Code: sección de CLAUDE.md + hook PreToolUse, por-proyecto)
ac_step "Graphify (registro en Claude Code)"
if command -v graphify >/dev/null 2>&1; then
    ac_run bash -c "cd '$AC_REPO_DIR' && graphify claude uninstall" \
        || ac_warn "graphify claude uninstall falló — quita a mano la sección '## graphify' de CLAUDE.md y el hook PreToolUse de .claude/settings.json en cada proyecto donde lo hayas activado."
else
    ac_warn "El binario graphify no está en el PATH — no se puede desregistrar automáticamente. Si lo instalaste con pip --user, revisa INSTALL.md > Troubleshooting."
fi
ac_dim "  (se conserva: el paquete pip graphifyy — es una dependencia de sistema, igual que los parsers. Desinstálalo a mano con 'pip uninstall graphifyy' si quieres.)"

# --- Ponytail (plugin de marketplace de Claude Code)
# Orden importa: el script de limpieza (flags + statusLine) vive DENTRO del plugin, así
# que hay que ejecutarlo ANTES de quitar el plugin con `claude plugin uninstall` — una
# vez desinstalado, scripts/uninstall.js ya no está en disco. Localización defensiva
# porque el layout exacto de plugins/cache/ no está documentado públicamente.
ac_step "Ponytail (plugin de marketplace)"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ponytail_plugin_dir=""
    if [ -f "$CLAUDE_CONFIG_DIR/plugins/cache/ponytail/scripts/uninstall.js" ]; then
        ponytail_plugin_dir="$CLAUDE_CONFIG_DIR/plugins/cache/ponytail"
    elif [ -d "$CLAUDE_CONFIG_DIR/plugins/cache" ]; then
        ponytail_plugin_dir="$(find "$CLAUDE_CONFIG_DIR/plugins/cache" -mindepth 1 -maxdepth 3 -type d -iname '*ponytail*' 2>/dev/null | head -n1)"
        [ -n "$ponytail_plugin_dir" ] && [ -f "$ponytail_plugin_dir/scripts/uninstall.js" ] || ponytail_plugin_dir=""
    fi

    if [ -n "$ponytail_plugin_dir" ]; then
        ac_run node "$ponytail_plugin_dir/scripts/uninstall.js" \
            || ac_warn "El script de limpieza de ponytail (flags + statusLine) falló — se continúa igualmente (mejor esfuerzo)."
    else
        ac_dim "  No se localizó scripts/uninstall.js del plugin ponytail bajo $CLAUDE_CONFIG_DIR/plugins/cache/ — se omite (mejor esfuerzo; los dos comandos de abajo igual limpian el registro del plugin)."
    fi

    ac_run claude plugin uninstall ponytail -s user 2>/dev/null || true
    ac_run claude plugin marketplace remove ponytail 2>/dev/null || true
else
    ac_dim "  El CLI claude no está en el PATH — si tenías ponytail instalado, quítalo en sesión: /plugin uninstall ponytail"
fi
ac_run rm -f "$CLAUDE_CONFIG_DIR/.ponytail-active"
ac_run rm -f "$CLAUDE_CONFIG_DIR/.ponytail-statusline-nudged"
ac_dim "  (se conserva: ~/.config/ponytail/config.json — puedes haberlo editado a mano; bórralo tú si quieres.)"

# --- Limpieza heredada: plugin equivocado de instalaciones antiguas de CLAUDEMAX (Egonex-AI/Understand-Anything)
ac_step "Limpieza heredada: plugin understand-anything (versión anterior de este componente)"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude plugin uninstall understand-anything -s user 2>/dev/null || true
    ac_run claude plugin marketplace remove understand-anything 2>/dev/null || true
else
    ac_dim "  El CLI claude no está en el PATH — si tenías el plugin antiguo instalado, quítalo en sesión: /plugin uninstall understand-anything"
fi

# --- Cyber Neo (clon git aparte; no forma parte del loop de skills de ingeniería)
ac_step "Cyber Neo"
ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/cyber-neo"

# --- Parsers (solo el registro MCP; los paquetes pip y el JDK se quedan)
ac_step "Parsers (MCP markitdown)"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove markitdown 2>/dev/null || true
fi
ac_dim "  (se conservan: paquetes pip markitdown/opendataloader-pdf/whisper-ctranslate2 y el JDK — desinstálalos a mano si quieres)"

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
