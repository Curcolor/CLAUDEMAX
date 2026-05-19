#!/usr/bin/env bash
# ABSOLUTE-CLAUDE uninstaller. Symmetric to install.sh.
#
# Removes:
#   - rtk binary at $HOME/.local/bin/rtk (does NOT remove rtk-installed Claude hooks
#     — `rtk init --global` writes into your settings; we leave them for `rtk` to manage)
#   - Caveman (delegates to its own --uninstall)
#   - real DCP plugin (if opencode present)
#   - dcp-lite skill + PostToolUse hook + state files
#   - repo-map skill
#   - Figma + magic MCP registrations in Claude Code
#   - ui-ux-pro-max skill dir
#
# Does NOT remove:
#   - per-repo files Caveman's --with-init may have written
#   - framer-motion / gsap from your project's node_modules — npm uninstall those yourself if you want

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

ac_step "Uninstalling ABSOLUTE-CLAUDE components"
[ "$DRY_RUN" = "1" ] && ac_warn "DRY-RUN — no changes will be made."

# --- Caveman (delegates)
ac_step "Caveman"
if [ "$DRY_RUN" = "1" ]; then
    ac_dim "\$ npx -y github:JuliusBrussee/caveman -- --uninstall --non-interactive"
else
    npx -y github:JuliusBrussee/caveman -- --uninstall --non-interactive \
        || ac_warn "Caveman uninstall returned non-zero."
fi

# --- DCP (real, for opencode)
if [ "$AC_HAS_OPENCODE" = "1" ]; then
    ac_step "DCP (opencode plugin)"
    if [ "$DRY_RUN" = "1" ]; then
        ac_dim "\$ opencode plugin uninstall @tarquinen/opencode-dcp --global  (best-effort)"
    else
        opencode plugin uninstall @tarquinen/opencode-dcp --global 2>/dev/null \
            || ac_warn "Could not uninstall opencode-dcp automatically. Remove manually with opencode's plugin manager."
    fi
fi

# --- dcp-lite (skill + hook + state)
ac_step "dcp-lite (skill + hook + state)"
ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/dcp-lite"
ac_run rm -f  "$CLAUDE_CONFIG_DIR/hooks/dcp-lite-dedup.mjs"
ac_run rm -f  "$CLAUDE_CONFIG_DIR/state/dcp-lite-session.json"
ac_run rm -f  "$CLAUDE_CONFIG_DIR/state/dcp-lite-cumulative.json"
if [ -f "$CLAUDE_CONFIG_DIR/settings.json" ]; then
    if [ "$DRY_RUN" = "1" ]; then
        ac_dim "\$ remove hook entries containing 'dcp-lite-dedup.mjs' from $CLAUDE_CONFIG_DIR/settings.json"
    else
        ac_remove_hook "$CLAUDE_CONFIG_DIR/settings.json" "dcp-lite-dedup.mjs"
        ac_info "Cleaned dcp-lite hook from settings.json (backup: $CLAUDE_CONFIG_DIR/settings.json.bak)"
    fi
fi

# --- repo-map
ac_step "repo-map skill"
ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/repo-map"

# --- dev-skills (superpowers + SOLID + design-patterns + conventional-commits + architecture-patterns)
ac_step "Engineering skills (superpowers + SOLID + design-patterns + conventional-commits + architecture-patterns)"
for s in superpowers solid design-patterns conventional-commits architecture-patterns; do
    ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/$s"
done

# --- ui-ux skill + magic MCP
ac_step "UI/UX (skill + magic MCP)"
ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove magic 2>/dev/null || true
fi

# --- Figma MCP
ac_step "Figma MCP"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove figma 2>/dev/null || true
fi

# --- RTK binary
ac_step "RTK binary"
if [ -x "$HOME/.local/bin/rtk" ]; then
    ac_run rm -f "$HOME/.local/bin/rtk"
    ac_info "Removed $HOME/.local/bin/rtk"
    ac_warn "If 'rtk init --global' wrote hooks into your Claude settings.json, remove them manually (search for 'rtk')."
else
    ac_info "rtk binary not at $HOME/.local/bin/rtk; nothing to remove."
fi

ac_step "Done."
ac_info "Per-repo files (.claude/repo-map.md, .cursor/rules/, etc.) are intentionally left in place. Delete by hand if desired."
