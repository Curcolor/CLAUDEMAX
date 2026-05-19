#!/usr/bin/env bash
# ABSOLUTE-CLAUDE — one-shot installer for the token-saving + UI/UX stack.
#
# Components: RTK, Caveman, DCP (real for opencode + dcp-lite skill for Claude Code),
# repo-map skill, Figma MCP, UI/UX bundle (ui-ux-pro-max skill + 21st.dev magic MCP
# + framer-motion/gsap npm).
#
# Usage:
#   bash install.sh                    # install everything
#   bash install.sh --only rtk         # one component
#   bash install.sh --skip ui-ux       # skip one
#   bash install.sh --dry-run          # print only
#   bash install.sh --uninstall        # tear down
#
# See README.md / INSTALL.md for full flag docs.

set -euo pipefail

# --- Resolve repo dir so this script works both as `bash install.sh` and as a curl pipe.
# When piped through curl|bash, BASH_SOURCE[0] is empty; we fall back to a temp clone.
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]:-}" ]; then
    AC_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    # Piped install path: clone the repo to a temp dir and re-exec from there.
    if [ -z "${AC_BOOTSTRAPPED:-}" ]; then
        TMP="$(mktemp -d)"
        echo "[INFO]  Piped install detected; cloning ABSOLUTE-CLAUDE to $TMP ..."
        git clone --depth 1 https://github.com/JuliusBrussee/ABSOLUTE-CLAUDE "$TMP/ABSOLUTE-CLAUDE" 2>/dev/null \
            || { echo "[ERR] Could not clone ABSOLUTE-CLAUDE. Clone manually and run bash install.sh."; exit 1; }
        export AC_BOOTSTRAPPED=1
        exec bash "$TMP/ABSOLUTE-CLAUDE/install.sh" "$@"
    fi
    AC_REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
fi
export AC_REPO_DIR

# --- Source helpers
# shellcheck source=bin/lib/log.sh
. "$AC_REPO_DIR/bin/lib/log.sh"
# shellcheck source=bin/lib/detect.sh
. "$AC_REPO_DIR/bin/lib/detect.sh"
# shellcheck source=bin/lib/claude-config.sh
. "$AC_REPO_DIR/bin/lib/claude-config.sh"
# shellcheck source=bin/lib/jsonc.sh
. "$AC_REPO_DIR/bin/lib/jsonc.sh"

# --- Parse flags
DRY_RUN=0
FORCE=0
NO_NPM=0
WITH_NPM=0
UNINSTALL=0
ONLY=()
SKIP=()
AC_CONFIG_DIR_OVERRIDE=""

ALL_COMPONENTS=(rtk caveman dcp repo-map figma ui-ux dev-skills)

usage() {
    cat <<EOF
ABSOLUTE-CLAUDE — install token-saving + UI/UX stack for Claude Code.

Usage: bash install.sh [flags]

Flags:
  --all                Install every component (default).
  --only <id>          Install only this component. Repeatable.
                       ids: ${ALL_COMPONENTS[*]}
  --skip <id>          Skip a component. Repeatable.
  --no-npm             Skip 'npm install framer-motion gsap'.
  --with-npm           Force the npm step (npm init -y if no package.json).
  --dry-run            Print every command, change nothing.
  --force              Re-run components even if already installed.
  --config-dir <path>  Override CLAUDE_CONFIG_DIR (default \$HOME/.claude).
  --uninstall          Run uninstall.sh.
  --no-color           Disable ANSI colors.
  -h | --help          This help.

Examples:
  bash install.sh
  bash install.sh --only rtk --only caveman
  bash install.sh --skip ui-ux --no-npm
  bash install.sh --dry-run --all
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --all)             ONLY=("${ALL_COMPONENTS[@]}"); shift ;;
        --only)            ONLY+=("$2"); shift 2 ;;
        --skip)            SKIP+=("$2"); shift 2 ;;
        --no-npm)          NO_NPM=1; shift ;;
        --with-npm)        WITH_NPM=1; shift ;;
        --dry-run)         DRY_RUN=1; shift ;;
        --force)           FORCE=1; shift ;;
        --config-dir)      AC_CONFIG_DIR_OVERRIDE="$2"; shift 2 ;;
        --uninstall)       UNINSTALL=1; shift ;;
        --no-color)        export ABSOLUTE_NO_COLOR=1; shift ;;
        -h|--help)         usage; exit 0 ;;
        *)                 ac_error "Unknown flag: $1"; usage; exit 1 ;;
    esac
done

export DRY_RUN FORCE NO_NPM WITH_NPM AC_CONFIG_DIR_OVERRIDE

# Re-source log.sh now that ABSOLUTE_NO_COLOR may be set.
# shellcheck source=bin/lib/log.sh
. "$AC_REPO_DIR/bin/lib/log.sh"

if [ "$UNINSTALL" = "1" ]; then
    exec bash "$AC_REPO_DIR/uninstall.sh" ${DRY_RUN:+--dry-run}
fi

# Default to --all if no --only flags
if [ ${#ONLY[@]} -eq 0 ]; then
    ONLY=("${ALL_COMPONENTS[@]}")
fi

# Apply --skip
FINAL_LIST=()
for c in "${ONLY[@]}"; do
    skip=0
    for s in "${SKIP[@]:-}"; do
        [ "$c" = "$s" ] && skip=1
    done
    [ $skip -eq 0 ] && FINAL_LIST+=("$c")
done

cat <<'BANNER'

  _   ___ ___  ___  _   _   _ _____ ___    ___ _      _   _   _ ___  ___
 /_\ | _ ) __|/ _ \| | | | | |_   _| __|  / __| |    /_\ | | | |   \| __|
/ _ \| _ \__ \ (_) | |_| |_| | | | | _|  | (__| |__ / _ \| |_| | |) | _|
/_/ \_\___/___/\___/|____\___/  |_| |___|  \___|____/_/ \_\___/|___/|___|

  One install. Every token-saver + UI/UX skill.

BANNER

ac_step "Preflight"
ac_detect_all
ac_require_tools
ac_resolve_config_dir
ac_summary
ac_info "Components: ${FINAL_LIST[*]}"
ac_info "Claude config dir: $CLAUDE_CONFIG_DIR"
[ "$DRY_RUN" = "1" ] && ac_warn "DRY-RUN — no changes will be made."

# --- Load components on demand
component_run() {
    local id="$1"
    case "$id" in
        rtk)
            . "$AC_REPO_DIR/bin/components/rtk.sh"
            ac_component_rtk
            ;;
        caveman)
            . "$AC_REPO_DIR/bin/components/caveman.sh"
            ac_component_caveman
            ;;
        dcp)
            . "$AC_REPO_DIR/bin/components/dcp.sh"
            ac_component_dcp
            ;;
        repo-map)
            . "$AC_REPO_DIR/bin/components/repo-map.sh"
            ac_component_repo_map
            ;;
        figma)
            . "$AC_REPO_DIR/bin/components/figma-mcp.sh"
            ac_component_figma
            ;;
        ui-ux)
            . "$AC_REPO_DIR/bin/components/ui-ux.sh"
            ac_component_ui_ux
            ;;
        dev-skills)
            . "$AC_REPO_DIR/bin/components/dev-skills.sh"
            ac_component_dev_skills
            ;;
        *)
            ac_warn "Unknown component: $id (valid: ${ALL_COMPONENTS[*]})"
            ;;
    esac
}

for c in "${FINAL_LIST[@]}"; do
    component_run "$c" || ac_warn "Component '$c' had errors — continuing."
done

# --- Verify summary
ac_step "Verify"

if ac_have rtk; then
    ac_info "rtk: $(rtk --version 2>/dev/null | head -n1)"
else
    ac_warn "rtk: not on PATH"
fi

if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_info "claude mcp list:"
    claude mcp list 2>/dev/null | sed 's/^/    /' || ac_warn "  claude mcp list failed"
fi

if [ -f "$CLAUDE_CONFIG_DIR/.caveman-active" ]; then
    ac_info "caveman: $(cat "$CLAUDE_CONFIG_DIR/.caveman-active")"
fi

ac_info "Installed skills under $CLAUDE_CONFIG_DIR/skills/:"
ls -1 "$CLAUDE_CONFIG_DIR/skills/" 2>/dev/null | sed 's/^/    /' || true

cat <<EOF

${AC_GREEN}Done.${AC_NC} Next steps:

  1. Restart Claude Code so hooks/skills load.
  2. Finish Figma OAuth: open Claude Code → /mcp → select figma → browser.
  3. Try the commands:
       /caveman           — terse mode (Caveman)
       /repomap           — build .claude/repo-map.md for this project
       /dcp-compress      — focused context compression (dcp-lite)
       /dcp-context       — current-session pruning stats
       /ui-ux-pro-max     — (skill name may differ; see your skill picker)
       /superpowers       — meta-skill bundle (obra/superpowers)
       /solid /design-patterns /conventional-commits /architecture-patterns

  See README.md for full docs. To remove everything: bash uninstall.sh
EOF
