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
# `graphify claude install` registra Graphify POR PROYECTO, no globalmente: escribe una
# sección "## graphify" en ./CLAUDE.md y un hook PreToolUse (matchers Bash|Grep y
# Read|Glob → `graphify hook-guard search|read`) en ./.claude/settings.json del
# directorio DESDE el que se ejecuta el comando — a diferencia del resto de componentes
# de CLAUDEMAX, que escriben en $CLAUDE_CONFIG_DIR (global, para todos los proyectos).
# Aquí lo ejecutamos en $AC_REPO_DIR (el propio repo de CLAUDEMAX, destino determinista
# sin importar cómo se invocó bin/install.sh); para activarlo en cualquier otro proyecto,
# ejecuta `graphify claude install` dentro de ese proyecto (ver README/INSTALL).
# Instalado SIN --strict: el hook solo sugiere consultar el grafo antes de leer/grepear
# en crudo, nunca bloquea una herramienta.

GRAPHIFY_PKG="graphifyy"
GRAPHIFY_OLD_PLUGIN="understand-anything"

ac_component_graphify() {
    ac_step "Graphify — grafo de conocimiento del codebase (graphify-out/graph.json + graph.html)"

    ac_graphify_migrar_plugin_viejo

    ac_graphify_ensure_python
    if ! ac_graphify_has_pip; then
        ac_warn "pip no disponible — se omite Graphify. Instala Python y re-ejecuta --only graphify."
        return 0
    fi

    ac_graphify_install_cli

    if [ "${DRY_RUN:-0}" != "1" ] && ! command -v graphify >/dev/null 2>&1; then
        ac_warn "graphify no está disponible en el PATH tras el intento de instalación — se omite el registro en Claude Code."
        return 0
    fi

    ac_warn "Graphify registra un hook PreToolUse (matchers Bash|Grep y Read|Glob -> 'graphify hook-guard search|read') que SUGIERE consultar el grafo antes de leer/grepear en crudo. Se instala SIN --strict: nunca bloquea una herramienta, solo avisa."
    ac_run bash -c "cd '$AC_REPO_DIR' && graphify claude install" \
        || ac_warn "graphify claude install falló — ejecútalo manualmente dentro del proyecto que quieras integrar."
    # El verbo cambia según el modo: en dry-run nada se ha escrito todavía, y afirmarlo
    # sería mentirle al usuario sobre el estado real de su disco.
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "  Registro por-proyecto: escribiría en $AC_REPO_DIR/CLAUDE.md y $AC_REPO_DIR/.claude/settings.json."
    else
        ac_info "Registro por-proyecto: escrito en $AC_REPO_DIR/CLAUDE.md y $AC_REPO_DIR/.claude/settings.json."
    fi
    ac_dim "  Para activarlo en otro proyecto: 'graphify claude install' dentro de él, y 'graphify extract .' para generar su grafo."
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
