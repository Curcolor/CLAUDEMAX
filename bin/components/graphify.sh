#!/usr/bin/env bash
# Understand-Anything ("Graphify"): grafos de conocimiento interactivos del
# codebase, como plugin de Claude Code. Genera .ua/knowledge-graph.json por
# proyecto (lo consume el ritual SessionStart del subproyecto D).
# Upstream: https://github.com/Egonex-AI/Understand-Anything (MIT)

GRAPHIFY_MARKETPLACE="Egonex-AI/Understand-Anything"
GRAPHIFY_PLUGIN="understand-anything"

ac_component_graphify() {
    ac_step "Graphify (Understand-Anything) — grafos de conocimiento del codebase"

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI no está en el PATH — instala el plugin manualmente en una sesión:"
        ac_warn "  /plugin marketplace add $GRAPHIFY_MARKETPLACE"
        ac_warn "  /plugin install $GRAPHIFY_PLUGIN"
        return 0
    fi

    # Idempotencia: ¿ya está instalado?
    if claude plugin list 2>/dev/null | grep -qi "$GRAPHIFY_PLUGIN"; then
        ac_info "Plugin $GRAPHIFY_PLUGIN ya instalado; no se hace nada. Usa --force para reinstalar."
        [ "${FORCE:-0}" != "1" ] && return 0
    fi

    # Intento no interactivo; si el CLI no soporta estos subcomandos, damos instrucciones.
    if claude plugin --help >/dev/null 2>&1; then
        ac_run claude plugin marketplace add "$GRAPHIFY_MARKETPLACE" \
            || ac_warn "No se pudo añadir el marketplace automáticamente."
        if ac_run claude plugin install "$GRAPHIFY_PLUGIN"; then
            ac_info "Plugin instalado. En cualquier proyecto: /understand genera .ua/knowledge-graph.json"
        else
            ac_warn "Instalación automática fallida — hazlo en una sesión de Claude Code:"
            ac_warn "  /plugin marketplace add $GRAPHIFY_MARKETPLACE"
            ac_warn "  /plugin install $GRAPHIFY_PLUGIN"
        fi
    else
        ac_warn "Este claude CLI no soporta 'claude plugin' no interactivo — hazlo en sesión:"
        ac_warn "  /plugin marketplace add $GRAPHIFY_MARKETPLACE"
        ac_warn "  /plugin install $GRAPHIFY_PLUGIN"
    fi
}
