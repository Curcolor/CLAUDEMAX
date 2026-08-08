#!/usr/bin/env bash
# Impeccable (pbakaus/impeccable): plugin de Claude Code (Apache-2.0) que le da al modelo
# el vocabulario de diseño que le falta para que una UI generada por IA no se note generada
# por IA. Trae UNA skill (`impeccable`, marcada `user-invocable`) con 23 órdenes que se
# invocan como `/impeccable <orden> [objetivo]` — p. ej. `/impeccable audit el header`:
#
#   Trabajo nuevo      shape (planea UX/UI antes de escribir código), craft (alias heredado)
#   Contexto           init (escribe PRODUCT.md), document (DESIGN.md desde el código ya escrito),
#                      extract (saca tokens y componentes al sistema de diseño)
#   Revisión           critique (revisión de UX con puntuación), audit (accesibilidad,
#                      rendimiento, responsive), polish (última pasada antes de publicar)
#   Tono               bolder, quieter, distill, delight, overdrive
#   Materia            animate, colorize, typeset, layout
#   Producción         harden (errores, i18n, casos borde), onboard (primer arranque y
#                      estados vacíos), clarify (copy, etiquetas, mensajes de error),
#                      adapt (dispositivos y tamaños), optimize (rendimiento de UI)
#   Navegador          live (itera variantes visuales en la app corriendo y escribe el
#                      resultado en el código fuente)
#
# Además del skill trae 4 subagentes (asset-producer, documenter, finish-reviewer,
# manual-edit-applier) y dos hooks propios, declarados en el plugin, no en tu settings.json:
#   PostToolUse  Edit|Write|MultiEdit  (timeout 5s)  — 59 detectores deterministas de
#                anti-patrones sobre lo que se acaba de editar; sin llamadas a ninguna API.
#   Stop         (timeout 30s)                       — pasada de diseño al cerrar el turno.
#
# Convivencia con el resto de CLAUDEMAX:
#   - No usa PreToolUse, así que no choca con el hook de Graphify.
#   - Su PostToolUse SÍ comparte evento y matcher con nuestro hooks/ui-audit.mjs (componente
#     ui-ux). Los dos son informativos y ninguno bloquea la edición: Claude Code ejecuta
#     ambos y verás los dos avisos. Se solapan en parte — los 6 anti-patrones que
#     ui-ux-pro-max adaptó en su día vienen justo de este proyecto. Si el ruido molesta,
#     apaga el nuestro con CLAUDEMAX_UI_AUDIT=0 y quédate con los 59 de Impeccable.
#   - Su Stop no lo usa ningún otro componente.
#
# Estado que escribe en tus proyectos (no lo toca el desinstalador; es tuyo):
#   PRODUCT.md, DESIGN.md en la raíz, y .impeccable/ (config.json, design.json,
#   critique/*.md, más capturas y estado efímero de `live`).
#
# Requiere Node >= 22 para el hook. Sin él, el hook se auto-desactiva en silencio (deja
# $HOME/.impeccable/node-unsupported y avisa una sola vez); las 23 órdenes siguen
# funcionando igual porque son prompt, no script.
#
# Upstream: https://github.com/pbakaus/impeccable (Apache-2.0) — https://impeccable.style

IMPECCABLE_MARKETPLACE="pbakaus/impeccable"
IMPECCABLE_PLUGIN="impeccable"

ac_component_impeccable() {
    ac_step "Impeccable — vocabulario de diseño para UI/web de calidad (plugin)"

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI no está en el PATH — instala el plugin manualmente en una sesión:"
        ac_warn "  /plugin marketplace add $IMPECCABLE_MARKETPLACE"
        ac_warn "  /plugin install $IMPECCABLE_PLUGIN@$IMPECCABLE_PLUGIN"
        return 0
    fi

    # Idempotencia: ¿ya está instalado? (mismo criterio que ponytail.sh)
    if [ "${FORCE:-0}" != "1" ] && claude plugin list 2>/dev/null | grep -qi "$IMPECCABLE_PLUGIN"; then
        ac_info "Plugin $IMPECCABLE_PLUGIN ya instalado; se omite. Usa --force para reinstalar."
        ac_impeccable_check_node
        return 0
    fi

    ac_run claude plugin marketplace add "$IMPECCABLE_MARKETPLACE" \
        || ac_warn "No se pudo añadir el marketplace de impeccable automáticamente."

    if ac_run claude plugin install "$IMPECCABLE_PLUGIN@$IMPECCABLE_PLUGIN"; then
        ac_info "Plugin instalado. Empieza con /impeccable init (escribe PRODUCT.md) y luego /impeccable shape, /impeccable audit, /impeccable polish..."
    else
        ac_warn "Instalación automática fallida — hazlo en una sesión de Claude Code:"
        ac_warn "  /plugin marketplace add $IMPECCABLE_MARKETPLACE"
        ac_warn "  /plugin install $IMPECCABLE_PLUGIN@$IMPECCABLE_PLUGIN"
    fi

    ac_impeccable_check_node

    ac_dim "  Su hook PostToolUse convive con el nuestro (ui-audit.mjs): ninguno bloquea, pero verás dos avisos al editar UI. Silencia el nuestro con CLAUDEMAX_UI_AUDIT=0 si sobra."
}

# El hook de diseño exige Node >= 22 y, si no lo encuentra, se apaga solo sin decir nada más
# que un aviso único. Preferimos detectarlo aquí, cuando el usuario aún está mirando la
# instalación, en vez de que descubra semanas después que los 59 detectores nunca corrieron.
ac_impeccable_check_node() {
    local major
    major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || true)"

    case "$major" in
        ''|*[!0-9]*)
            ac_dim "  No se pudo leer la versión de Node — el hook de diseño de Impeccable necesita Node >= 22."
            return 0
            ;;
    esac

    if [ "$major" -lt 22 ]; then
        ac_warn "Node $major detectado; el hook de diseño de Impeccable necesita Node >= 22 y se auto-desactivará."
        ac_warn "  Las 23 órdenes de /impeccable funcionan igual — lo que se pierde son los 59 detectores automáticos al editar."
        ac_warn "  Actualiza Node y borra \$HOME/.impeccable/node-unsupported para que vuelva a intentarlo."
    fi
}
