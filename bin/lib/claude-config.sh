#!/usr/bin/env bash
# Resuelve $CLAUDE_CONFIG_DIR. Solo para source.
# Respeta el flag --config-dir si bin/install.sh estableció AC_CONFIG_DIR_OVERRIDE.
#
# OJO con exportarla: el CLI `claude` también la lee, y con CLAUDE_CONFIG_DIR definida escribe
# los MCP de `claude mcp add -s user` en $CLAUDE_CONFIG_DIR/.claude.json en vez de en
# ~/.claude.json, que es el archivo que usan las sesiones normales del usuario. Bug real del
# 2026-09-13: rag/graphify/codebase-memory quedaron registrados en ~/.claude/.claude.json y
# ninguna sesión los veía. Por eso solo se exporta cuando el valor vino del usuario (flag o
# entorno); si lo deducimos nosotros (~/.claude), queda como variable del instalador y el CLI
# usa su configuración por defecto — que apunta al mismo directorio.

ac_resolve_config_dir() {
    # Solo se exporta si vino del entorno o de --config-dir (ver la cabecera).
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

# Ruta nativa para argumentos que Claude Code ejecutará SIN shell (comandos de MCP): en Git
# Bash, /c/Users/... no le sirve a node.exe. cygpath existe en Git Bash/MSYS; en otros SO la
# ruta ya es nativa y se devuelve tal cual.
ac_ruta_nativa() {
    if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi
}
