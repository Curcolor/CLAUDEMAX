#!/usr/bin/env bash
# Resuelve $CLAUDE_CONFIG_DIR. Solo para source.
# Respeta el flag --config-dir si bin/install.sh estableció AC_CONFIG_DIR_OVERRIDE.

ac_resolve_config_dir() {
    # CLAUDE_CONFIG_DIR no es solo nuestro: el CLI `claude` lo lee y, cuando está
    # definido, mueve TODO su estado ahí — incluido .claude.json, el archivo donde
    # `claude mcp add` registra los servidores. Exportarlo cuando el usuario no lo
    # había definido hace que los MCP (rag, figma, ...) acaben en
    # $HOME/.claude/.claude.json, que las sesiones normales no leen: quedan huérfanos.
    # Solo lo exportamos si venía del entorno o de --config-dir.
    AC_EXPORT_CONFIG_DIR=0
    if [ -n "${AC_CONFIG_DIR_OVERRIDE:-}" ]; then
        CLAUDE_CONFIG_DIR="$AC_CONFIG_DIR_OVERRIDE"
        AC_EXPORT_CONFIG_DIR=1
    elif [ -n "${CLAUDE_CONFIG_DIR:-}" ]; then
        AC_EXPORT_CONFIG_DIR=1
    else
        CLAUDE_CONFIG_DIR="$HOME/.claude"
    fi
    # Expande un ~ inicial si está presente.
    case "$CLAUDE_CONFIG_DIR" in
        "~/"*) CLAUDE_CONFIG_DIR="$HOME/${CLAUDE_CONFIG_DIR#~/}" ;;
        "~")   CLAUDE_CONFIG_DIR="$HOME" ;;
    esac
    # En Windows la ruta acaba en $CLAUDE_CONFIG_DIR/hooks/*.mjs dentro de comandos
    # `node ...` que Claude Code ejecuta con un shell de Windows, no con Git Bash. La
    # forma MSYS (/c/Users/...) hace que node resuelva C:\c\Users\... y el hook nunca
    # corre. cygpath -m devuelve C:/Users/..., que funciona en ambos shells.
    if [ "${AC_OS:-}" = "windows" ] && command -v cygpath >/dev/null 2>&1; then
        CLAUDE_CONFIG_DIR="$(cygpath -m "$CLAUDE_CONFIG_DIR")"
    fi
    if [ "$AC_EXPORT_CONFIG_DIR" = "1" ]; then
        export CLAUDE_CONFIG_DIR
    else
        export -n CLAUDE_CONFIG_DIR 2>/dev/null || true
    fi
    mkdir -p "$CLAUDE_CONFIG_DIR/skills" "$CLAUDE_CONFIG_DIR/hooks"
}
