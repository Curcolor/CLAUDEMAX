#!/usr/bin/env bash
# Graphify (Graphify-Labs/graphify): CLI de Python (tree-sitter + LLM opcional) que
# convierte un repo en un grafo de conocimiento navegable — nada de plugin del
# marketplace, es un binario que se instala con pip/pipx/uv. Genera, por proyecto:
#   <proyecto>/graphify-out/graph.json    formato node_link_data de NetworkX
#                                          (nodes + links + hyperedges + built_at_commit)
#   <proyecto>/graphify-out/graph.html    dashboard interactivo
#   <proyecto>/graphify-out/GRAPH_REPORT.md
#
# Sustituye al componente anterior, que por error instalaba el plugin
# Egonex-AI/Understand-Anything (nombre parecido, autor y proyecto distintos).
#
# Paquete PyPI: graphifyy (doble "y" — "graphify" a secas ya estaba tomado en PyPI).
# Upstream: https://github.com/Graphify-Labs/graphify (Apache-2.0). Requiere Python 3.10+.
#
# Registro en Claude Code: UN solo MCP `graphify` a nivel usuario, que apunta al envoltorio
# templates/mcp/graphify-auto.mjs (copiado a $CLAUDE_CONFIG_DIR/mcp/). El envoltorio localiza
# en cada sesión el graphify-out/graph.json del proyecto actual (CLAUDE_PROJECT_DIR, que Claude
# Code pasa al MCP) y lanza el servidor real de graphify; sin grafo o sin graphify, sirve una
# única tool `graphify_estado` que dice cómo arreglarlo. Ya NO se ejecuta `graphify claude
# install`: su hook PreToolUse duplicaba al recordatorio `orden-herramientas` y escribía
# CLAUDE.md + .claude/settings.json DENTRO del repo, contra la regla "contexto fuera de los
# repos". Ver docs/superpowers/specs/2026-09-13-grafo-en-vivo-design.md.

GRAPHIFY_PKG="graphifyy"
GRAPHIFY_OLD_PLUGIN="understand-anything"

ac_component_graphify() {
    ac_step "Graphify — grafo de conocimiento del codebase + MCP graphify (envoltorio por proyecto)"

    ac_graphify_migrar_plugin_viejo
    ac_graphify_limpiar_claude_install

    ac_graphify_ensure_python
    if ! ac_graphify_has_pip; then
        ac_warn "pip no disponible — se omite la instalación del CLI de Graphify. El MCP se registra igual: dirá cómo instalarlo."
    else
        ac_graphify_install_cli
    fi

    ac_graphify_install_mcp
    ac_dim "  Genera el grafo de cada proyecto con 'graphify extract . --code-only' dentro del repo (sin API key de LLM, 'graphify .' falla con los .md)."
}

# Instalaciones anteriores de CLAUDEMAX corrían `graphify claude install` en el propio repo:
# dejaba una sección "## graphify" en CLAUDE.md y un hook PreToolUse en .claude/settings.json.
# Se retiran si están; si no, no se dice nada.
ac_graphify_limpiar_claude_install() {
    local md="$AC_REPO_DIR/CLAUDE.md" settings="$AC_REPO_DIR/.claude/settings.json"
    if [ -f "$md" ] && grep -q '^## graphify' "$md"; then
        ac_info "Retirando la sección '## graphify' que dejó 'graphify claude install' en $md"
        if [ "${DRY_RUN:-0}" != "1" ]; then
            MD_FILE="$md" node -e '
                const fs = require("fs"); const f = process.env.MD_FILE;
                const t = fs.readFileSync(f, "utf8");
                const sin = t.replace(/^## graphify[\s\S]*?(?=^## |(?![\s\S]))/m, "").replace(/\n{3,}/g, "\n\n");
                if (sin.trim()) fs.writeFileSync(f, sin); else fs.unlinkSync(f);
            '
        fi
    fi
    if [ -f "$settings" ] && grep -q 'graphify hook-guard' "$settings"; then
        ac_info "Retirando el hook 'graphify hook-guard' de $settings"
        [ "${DRY_RUN:-0}" = "1" ] || ac_remove_hook "$settings" "graphify hook-guard"
    fi
}

# Ruta nativa para argumentos que Claude Code ejecutará sin shell (en Git Bash, /c/... no
# sirve para node.exe). cygpath existe en Git Bash/MSYS; en otros SO la ruta ya es nativa.
ac_ruta_nativa() {
    if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi
}

ac_graphify_install_mcp() {
    local dst="$CLAUDE_CONFIG_DIR/mcp"
    ac_run mkdir -p "$dst"
    ac_run cp -f "$AC_REPO_DIR/templates/mcp/graphify-auto.mjs" "$dst/graphify-auto.mjs"
    ac_run cp -f "$AC_REPO_DIR/templates/mcp/graphify-auto-lib.mjs" "$dst/graphify-auto-lib.mjs"

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "El CLI claude no está en el PATH — registra el MCP a mano: claude mcp add -s user graphify -- node $(ac_ruta_nativa "$dst/graphify-auto.mjs")"
        return 0
    fi
    if claude mcp list 2>/dev/null | grep -qi '^graphify\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove graphify || true
        else
            ac_info "El MCP graphify ya está registrado; se omite. Usa --force para re-agregarlo con el envoltorio."
            return 0
        fi
    fi
    ac_run claude mcp add -s user graphify -- node "$(ac_ruta_nativa "$dst/graphify-auto.mjs")" \
        || ac_warn "claude mcp add falló para graphify — agrégalo manualmente."
}

# Best-effort: si el plugin equivocado de una instalación anterior de CLAUDEMAX sigue
# presente, lo quita. Ambos comandos son best-effort (|| true) — si el CLI claude no
# soporta 'plugin' o el plugin no está, no pasa nada.
ac_graphify_migrar_plugin_viejo() {
    [ "$AC_HAS_CLAUDE" != "1" ] && return 0
    if claude plugin list 2>/dev/null | grep -qi "$GRAPHIFY_OLD_PLUGIN"; then
        ac_info "Migración: se detectó el plugin antiguo '$GRAPHIFY_OLD_PLUGIN' (Egonex-AI/Understand-Anything, ya no es el correcto) — se elimina."
        ac_run claude plugin uninstall "$GRAPHIFY_OLD_PLUGIN" -s user || true
        ac_run claude plugin marketplace remove "$GRAPHIFY_OLD_PLUGIN" || true
    fi
}

# Mismo patrón que ac_parsers_ensure_python (bin/components/parsers.sh): funciones
# locales propias en vez de sourcear ese archivo — cada component.sh de este repo es
# autocontenido y se carga bajo demanda (bin/install.sh solo sourcea el componente pedido).
ac_graphify_ensure_python() {
    if command -v python >/dev/null 2>&1 || command -v py >/dev/null 2>&1; then
        return 0
    fi
    if [ "$AC_OS" = "windows" ] && command -v winget >/dev/null 2>&1; then
        ac_info "Python no encontrado — instalando Python 3.12 vía winget..."
        ac_run winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements \
            || ac_warn "winget no pudo instalar Python — instálalo manualmente."
        hash -r 2>/dev/null || true
    else
        ac_warn "Python no encontrado y no hay winget — instálalo manualmente (Graphify necesita Python 3.10+)."
    fi
}

ac_graphify_has_pip() {
    python -m pip --version >/dev/null 2>&1 || py -3 -m pip --version >/dev/null 2>&1
}

ac_graphify_pip() {
    if python -m pip --version >/dev/null 2>&1; then
        ac_run python -m pip "$@"
    else
        ac_run py -3 -m pip "$@"
    fi
}

# Idempotente: si 'graphify --version' ya responde y no hay --force, informa y omite.
# Orden de intento: uv tool install -> pipx install -> pip install --user (cada uno
# solo si el binario correspondiente está en el PATH; el primero que exista se usa).
ac_graphify_install_cli() {
    if [ "${FORCE:-0}" != "1" ] && command -v graphify >/dev/null 2>&1; then
        ac_info "Graphify ya está instalado ($(graphify --version 2>/dev/null)); se omite. Usa --force para reinstalar."
        return 0
    fi

    ac_info "Instalando $GRAPHIFY_PKG (paquete PyPI del CLI de Graphify)..."
    if command -v uv >/dev/null 2>&1; then
        ac_run uv tool install "$GRAPHIFY_PKG" && { hash -r 2>/dev/null || true; return 0; }
        ac_warn "uv tool install falló — probando con pipx."
    fi
    if command -v pipx >/dev/null 2>&1; then
        ac_run pipx install "$GRAPHIFY_PKG" && { hash -r 2>/dev/null || true; return 0; }
        ac_warn "pipx install falló — probando con pip."
    fi
    if ! ac_graphify_pip install --user --upgrade "$GRAPHIFY_PKG"; then
        ac_warn "No se pudo instalar $GRAPHIFY_PKG con uv/pipx/pip — instálalo manualmente."
        return 0
    fi
    hash -r 2>/dev/null || true
    if [ "${DRY_RUN:-0}" != "1" ] && ! command -v graphify >/dev/null 2>&1; then
        ac_warn "graphify se instaló pero no aparece en el PATH todavía — abre una shell nueva, o añade el directorio de scripts de Python de usuario al PATH (ver INSTALL.md > Troubleshooting)."
    fi
}
