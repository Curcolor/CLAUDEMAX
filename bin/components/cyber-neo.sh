#!/usr/bin/env bash
# Cyber Neo: auditoría de seguridad OWASP 2025 / CWE Top 25 como skill de
# Claude Code. Solo lectura; el reporte queda en ~/Desktop/cyber-neo-report-*.md
# Upstream: https://github.com/Hainrixz/cyber-neo (MIT). Commit fijado por
# reproducibilidad (proyecto joven).

CYBER_NEO_REPO="https://github.com/Hainrixz/cyber-neo"
CYBER_NEO_COMMIT="dcac0a8f111954e543e1e66e02a222c0c489ca74"

ac_component_cyber_neo() {
    ac_step "Cyber Neo — auditoría de seguridad (skill)"

    local dst="$CLAUDE_CONFIG_DIR/skills/cyber-neo"

    if [ "${DRY_RUN:-0}" = "1" ]; then
        if [ -d "$dst/.git" ]; then
            ac_dim "\$ git -C $dst fetch && git -C $dst checkout $CYBER_NEO_COMMIT"
        else
            ac_dim "\$ git clone $CYBER_NEO_REPO $dst && git -C $dst checkout $CYBER_NEO_COMMIT"
        fi
        return 0
    fi

    if [ -d "$dst/.git" ]; then
        ac_info "Clon existente; sincronizando al commit fijado..."
        git -C "$dst" fetch --quiet 2>/dev/null || true
        git -C "$dst" checkout --quiet "$CYBER_NEO_COMMIT" \
            || ac_warn "No se pudo hacer checkout de $CYBER_NEO_COMMIT — se deja el clon como está."
    else
        mkdir -p "$CLAUDE_CONFIG_DIR/skills"
        if git clone "$CYBER_NEO_REPO" "$dst"; then
            git -C "$dst" checkout --quiet "$CYBER_NEO_COMMIT" \
                || ac_warn "Checkout del commit fijado falló; queda en main."
            ac_info "Skill instalada. Uso: /cyber-neo <ruta-del-proyecto> (solo lectura)."
        else
            ac_warn "git clone falló — instala manualmente en $dst"
        fi
    fi
}
