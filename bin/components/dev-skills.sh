#!/usr/bin/env bash
# Instala skills de disciplina de ingeniería:
#   - superpowers             (clonado de obra/superpowers — meta-skill upstream)
#   - architecture-principles (propia/first-party)
#   - conventional-commits    (propia/first-party)
#
# Todas van bajo $CLAUDE_CONFIG_DIR/skills/. Las skills propias se copian;
# superpowers se clona con git para que las actualizaciones upstream lleguen al re-ejecutar.

SUPERPOWERS_REPO="https://github.com/obra/superpowers"

FIRST_PARTY_SKILLS=(architecture-principles conventional-commits)

ac_component_dev_skills() {
    ac_step "Skills de ingeniería — superpowers + architecture-principles + conventional-commits"

    ac_devskills_install_first_party
    ac_devskills_install_superpowers
}

ac_devskills_install_first_party() {
    for s in "${FIRST_PARTY_SKILLS[@]}"; do
        local src="$AC_REPO_DIR/skills/$s"
        local dst="$CLAUDE_CONFIG_DIR/skills/$s"

        if [ ! -d "$src" ]; then
            ac_warn "Falta la skill de origen: $src — se omite."
            continue
        fi

        ac_info "Instalando skill: $s → $dst"
        if [ "${DRY_RUN:-0}" = "1" ]; then
            ac_dim "\$ cp -r $src $dst"
            continue
        fi

        mkdir -p "$CLAUDE_CONFIG_DIR/skills"
        rm -rf "$dst"
        cp -R "$src" "$dst"
    done
}

ac_devskills_install_superpowers() {
    local dst="$CLAUDE_CONFIG_DIR/skills/superpowers"
    ac_info "Instalando skill superpowers (clonando desde $SUPERPOWERS_REPO)"

    if [ "${DRY_RUN:-0}" = "1" ]; then
        if [ -d "$dst/.git" ]; then
            ac_dim "\$ git -C $dst pull --ff-only"
        else
            ac_dim "\$ git clone --depth 1 $SUPERPOWERS_REPO $dst"
        fi
        return 0
    fi

    if [ -d "$dst/.git" ]; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_info "  --force: eliminando el clon existente y re-clonando"
            rm -rf "$dst"
            git clone --depth 1 "$SUPERPOWERS_REPO" "$dst" \
                || { ac_warn "git clone falló — se omite superpowers."; return 0; }
        else
            ac_info "  se encontró un clon existente; ejecutando git pull --ff-only"
            git -C "$dst" pull --ff-only \
                || ac_warn "  git pull falló; se deja el clon existente intacto."
        fi
    else
        mkdir -p "$CLAUDE_CONFIG_DIR/skills"
        git clone --depth 1 "$SUPERPOWERS_REPO" "$dst" \
            || { ac_warn "git clone falló — se omite superpowers."; return 0; }
    fi
}
