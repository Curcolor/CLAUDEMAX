#!/usr/bin/env bash
# Install the repo-map skill into $CLAUDE_CONFIG_DIR/skills/repo-map/.

ac_component_repo_map() {
    ac_step "Repo-map skill — emits .claude/repo-map.md for the current project"

    local src="$AC_REPO_DIR/skills/repo-map"
    local dst="$CLAUDE_CONFIG_DIR/skills/repo-map"

    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ cp -r $src $dst"
        return 0
    fi

    mkdir -p "$CLAUDE_CONFIG_DIR/skills"
    rm -rf "$dst"
    cp -R "$src" "$dst"
    chmod +x "$dst/build-map.mjs" 2>/dev/null || true
    ac_info "Skill installed at $dst"
    ac_info "Trigger in Claude Code: /repomap   (or say 'build the repo map')"
}
