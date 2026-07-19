#!/usr/bin/env bash
# Resuelve $CLAUDE_CONFIG_DIR. Solo para source.
# Respeta el flag --config-dir si install.sh estableció AC_CONFIG_DIR_OVERRIDE.

ac_resolve_config_dir() {
    if [ -n "${AC_CONFIG_DIR_OVERRIDE:-}" ]; then
        CLAUDE_CONFIG_DIR="$AC_CONFIG_DIR_OVERRIDE"
    elif [ -n "${CLAUDE_CONFIG_DIR:-}" ]; then
        :
    else
        CLAUDE_CONFIG_DIR="$HOME/.claude"
    fi
    # Expande un ~ inicial si está presente.
    case "$CLAUDE_CONFIG_DIR" in
        "~/"*) CLAUDE_CONFIG_DIR="$HOME/${CLAUDE_CONFIG_DIR#~/}" ;;
        "~")   CLAUDE_CONFIG_DIR="$HOME" ;;
    esac
    export CLAUDE_CONFIG_DIR
    mkdir -p "$CLAUDE_CONFIG_DIR/skills" "$CLAUDE_CONFIG_DIR/hooks"
}
