#!/usr/bin/env bash
# Ponytail (DietrichGebert/ponytail): plugin de Claude Code (MIT, ~97k estrellas) que
# fuerza minimalismo al escribir código mediante una "escalera" de 7 peldaños: ¿hace
# falta? -> ¿ya existe en el repo? -> ¿stdlib? -> ¿feature nativa? -> ¿dependencia ya
# instalada? -> ¿cabe en una línea? -> el mínimo que funcione. Trae 6 skills:
#   ponytail          modo activo (niveles lite/full/ultra)
#   ponytail-review   revisa el diff contra la escalera
#   ponytail-audit    audita el repo completo
#   ponytail-debt     cosecha comentarios `ponytail:` en una libreta de deuda técnica
#   ponytail-gain
#   ponytail-help
#
# Hooks que registra: SessionStart (matcher startup|resume|clear|compact), SubagentStart
# y UserPromptSubmit — ninguno es PreToolUse, así que no choca con el hook PreToolUse
# que registra Graphify. Escribe flags propios en $CLAUDE_CONFIG_DIR
# (.ponytail-active, .ponytail-statusline-nudged) y su configuración en
# ~/.config/ponytail/config.json. Requiere Node en el PATH (ya lo garantiza install.sh).
#
# Upstream: https://github.com/DietrichGebert/ponytail (MIT)

PONYTAIL_MARKETPLACE="DietrichGebert/ponytail"
PONYTAIL_PLUGIN="ponytail"

ac_component_ponytail() {
    ac_step "Ponytail — escalera de minimalismo al escribir código (plugin)"

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI no está en el PATH — instala el plugin manualmente en una sesión:"
        ac_warn "  /plugin marketplace add $PONYTAIL_MARKETPLACE"
        ac_warn "  /plugin install $PONYTAIL_PLUGIN@$PONYTAIL_PLUGIN"
        return 0
    fi

    # Idempotencia: ¿ya está instalado?
    if [ "${FORCE:-0}" != "1" ] && claude plugin list 2>/dev/null | grep -qi "$PONYTAIL_PLUGIN"; then
        ac_info "Plugin $PONYTAIL_PLUGIN ya instalado; se omite. Usa --force para reinstalar."
        return 0
    fi

    # Intento no interactivo — verificado por experiencia propia de este repo: tanto
    # 'marketplace add' como 'install' funcionan sin prompts (es lo mismo que hacía
    # el componente graphify para instalar su plugin en su día).
    ac_run claude plugin marketplace add "$PONYTAIL_MARKETPLACE" \
        || ac_warn "No se pudo añadir el marketplace de ponytail automáticamente."

    if ac_run claude plugin install "$PONYTAIL_PLUGIN@$PONYTAIL_PLUGIN"; then
        ac_info "Plugin instalado. Skills: /ponytail, /ponytail-review, /ponytail-audit, /ponytail-debt, /ponytail-gain, /ponytail-help."
    else
        ac_warn "Instalación automática fallida — hazlo en una sesión de Claude Code:"
        ac_warn "  /plugin marketplace add $PONYTAIL_MARKETPLACE"
        ac_warn "  /plugin install $PONYTAIL_PLUGIN@$PONYTAIL_PLUGIN"
    fi

    ac_dim "  Arranca en modo 'full'. Cambia la intensidad con PONYTAIL_DEFAULT_MODE=lite|full|ultra|off, o edita ~/.config/ponytail/config.json (niveles lite/full/ultra/off)."
}
