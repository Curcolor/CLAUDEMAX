#!/usr/bin/env bash
# Resolve $CLAUDE_CONFIG_DIR. Source-only.
# Honors --config-dir flag if AC_CONFIG_DIR_OVERRIDE was set by install.sh.

ac_resolve_config_dir() {
    if [ -n "${AC_CONFIG_DIR_OVERRIDE:-}" ]; then
        CLAUDE_CONFIG_DIR="$AC_CONFIG_DIR_OVERRIDE"
    elif [ -n "${CLAUDE_CONFIG_DIR:-}" ]; then
        :
    else
        CLAUDE_CONFIG_DIR="$HOME/.claude"
    fi
    # Expand a leading ~ if present.
    case "$CLAUDE_CONFIG_DIR" in
        "~/"*) CLAUDE_CONFIG_DIR="$HOME/${CLAUDE_CONFIG_DIR#~/}" ;;
        "~")   CLAUDE_CONFIG_DIR="$HOME" ;;
    esac
    export CLAUDE_CONFIG_DIR
    mkdir -p "$CLAUDE_CONFIG_DIR/skills" "$CLAUDE_CONFIG_DIR/hooks"
}
