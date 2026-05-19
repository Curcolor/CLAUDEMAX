#!/usr/bin/env bash
# Install engineering-discipline skills:
#   - superpowers   (cloned from obra/superpowers — upstream meta-skill)
#   - solid                  (first-party)
#   - design-patterns        (first-party)
#   - conventional-commits   (first-party)
#   - architecture-patterns  (first-party)
#
# All go under $CLAUDE_CONFIG_DIR/skills/. First-party skills are copied;
# superpowers is git-cloned so upstream updates flow on re-run.

SUPERPOWERS_REPO="https://github.com/obra/superpowers"

FIRST_PARTY_SKILLS=(solid design-patterns conventional-commits architecture-patterns)

ac_component_dev_skills() {
    ac_step "Engineering skills — superpowers + SOLID + design-patterns + conventional-commits + architecture-patterns"

    ac_devskills_install_first_party
    ac_devskills_install_superpowers
}

ac_devskills_install_first_party() {
    for s in "${FIRST_PARTY_SKILLS[@]}"; do
        local src="$AC_REPO_DIR/skills/$s"
        local dst="$CLAUDE_CONFIG_DIR/skills/$s"

        if [ ! -d "$src" ]; then
            ac_warn "Source skill missing: $src — skipping."
            continue
        fi

        ac_info "Installing skill: $s → $dst"
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
    ac_info "Installing superpowers skill (clone from $SUPERPOWERS_REPO)"

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
            ac_info "  --force: removing existing clone and re-cloning"
            rm -rf "$dst"
            git clone --depth 1 "$SUPERPOWERS_REPO" "$dst" \
                || { ac_warn "git clone failed — skipping superpowers."; return 0; }
        else
            ac_info "  existing clone found; running git pull --ff-only"
            git -C "$dst" pull --ff-only \
                || ac_warn "  git pull failed; existing clone left in place."
        fi
    else
        mkdir -p "$CLAUDE_CONFIG_DIR/skills"
        git clone --depth 1 "$SUPERPOWERS_REPO" "$dst" \
            || { ac_warn "git clone failed — skipping superpowers."; return 0; }
    fi
}
