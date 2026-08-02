#!/usr/bin/env bash
# CLAUDEMAX — instalador de un solo paso para el stack de ahorro de tokens + UI/UX.
#
# Componentes: RTK, Figma MCP, paquete UI/UX (skill ui-ux-pro-max
# + MCP magic de 21st.dev + framer-motion/gsap vía npm).
#
# Uso:
#   bash install.sh                    # instala todo
#   bash install.sh --only rtk         # un solo componente
#   bash install.sh --skip ui-ux       # omite uno
#   bash install.sh --dry-run          # solo imprime
#   bash install.sh --uninstall        # desinstala
#
# Ver README.md / INSTALL.md para la documentación completa de flags.

set -euo pipefail

# --- Resuelve el directorio del repo para que este script funcione tanto como `bash install.sh` como en un pipe de curl.
# Cuando se ejecuta vía curl|bash, BASH_SOURCE[0] está vacío; usamos un clon temporal como respaldo.
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]:-}" ]; then
    AC_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    # Ruta de instalación por pipe: clona el repo a un directorio temporal y re-ejecuta desde ahí.
    if [ -z "${AC_BOOTSTRAPPED:-}" ]; then
        TMP="$(mktemp -d)"
        echo "[INFO]  Instalación por pipe detectada; clonando CLAUDEMAX en $TMP ..."
        git clone --depth 1 https://github.com/Curcolor/CLAUDEMAX "$TMP/CLAUDEMAX" 2>/dev/null \
            || { echo "[ERR] No se pudo clonar CLAUDEMAX. Clónalo manualmente y ejecuta bash install.sh."; exit 1; }
        export AC_BOOTSTRAPPED=1
        exec bash "$TMP/CLAUDEMAX/install.sh" "$@"
    fi
    AC_REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
fi
export AC_REPO_DIR

# --- Carga los helpers (source)
# shellcheck source=bin/lib/log.sh
. "$AC_REPO_DIR/bin/lib/log.sh"
# shellcheck source=bin/lib/detect.sh
. "$AC_REPO_DIR/bin/lib/detect.sh"
# shellcheck source=bin/lib/claude-config.sh
. "$AC_REPO_DIR/bin/lib/claude-config.sh"
# shellcheck source=bin/lib/jsonc.sh
. "$AC_REPO_DIR/bin/lib/jsonc.sh"

# --- Parseo de flags
DRY_RUN=0
FORCE=0
NO_NPM=0
WITH_NPM=0
UNINSTALL=0
ONLY=()
SKIP=()
AC_CONFIG_DIR_OVERRIDE=""

ALL_COMPONENTS=(rtk figma ui-ux dev-skills rag graphify cyber-neo parsers rules)

usage() {
    cat <<EOF
CLAUDEMAX — instala el stack de ahorro de tokens + UI/UX para Claude Code.

Uso: bash install.sh [flags]

Flags:
  --all                Instala todos los componentes (por defecto).
  --only <id>          Instala solo este componente. Repetible.
                       ids: ${ALL_COMPONENTS[*]}
  --skip <id>          Omite un componente. Repetible.
  --no-npm             Omite 'npm install framer-motion gsap'.
  --with-npm           Fuerza el paso de npm (npm init -y si no hay package.json).
  --dry-run            Imprime cada comando, no cambia nada.
  --force              Reejecuta componentes aunque ya estén instalados.
  --config-dir <path>  Sobrescribe CLAUDE_CONFIG_DIR (por defecto \$HOME/.claude).
  --uninstall          Ejecuta uninstall.sh.
  --no-color           Desactiva los colores ANSI.
  -h | --help          Esta ayuda.

Ejemplos:
  bash install.sh
  bash install.sh --only rtk --only figma
  bash install.sh --skip ui-ux --no-npm
  bash install.sh --dry-run --all

  Flags de entorno para RAG (componente 'rag'):
    RAG_ROOT=<path>            raíz del workspace (requerido para rag)
    VAULT_MODE=create|import|connect   RAG_MODE=create|import|connect
    VAULT_SRC / VAULT_REMOTE / RAG_DUMP / RAG_REMOTE_URL según el modo
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
        --no-color)        export CLAUDEMAX_NO_COLOR=1; shift ;;
        -h|--help)         usage; exit 0 ;;
        *)                 ac_error "Flag desconocido: $1"; usage; exit 1 ;;
    esac
done

export DRY_RUN FORCE NO_NPM WITH_NPM AC_CONFIG_DIR_OVERRIDE

# Vuelve a cargar log.sh ahora que CLAUDEMAX_NO_COLOR pudo haberse establecido.
# shellcheck source=bin/lib/log.sh
. "$AC_REPO_DIR/bin/lib/log.sh"

if [ "$UNINSTALL" = "1" ]; then
    exec bash "$AC_REPO_DIR/uninstall.sh" ${DRY_RUN:+--dry-run}
fi

# Usa --all por defecto si no hay flags --only
if [ ${#ONLY[@]} -eq 0 ]; then
    ONLY=("${ALL_COMPONENTS[@]}")
fi

# Aplica --skip
FINAL_LIST=()
for c in "${ONLY[@]}"; do
    skip=0
    for s in "${SKIP[@]:-}"; do
        [ "$c" = "$s" ] && skip=1
    done
    [ $skip -eq 0 ] && FINAL_LIST+=("$c")
done

cat <<'BANNER'

  ___ _      _   _   _ ___  ___ __  __  _   __  __
 / __| |    /_\ | | | |   \| __|  \/  | /_\  \ \/ /
| (__| |__ / _ \ |_| | |) | _|| |\/| |/ _ \  >  <
 \___|____/_/ \_\___/|___/|___|_|  |_/_/ \_\/_/\_\

  Una sola instalación. Ahorro de tokens + UI/UX + cerebro RAG + análisis.

BANNER

ac_step "Verificación previa"
ac_detect_all
ac_require_tools
ac_resolve_config_dir
ac_summary
ac_info "Componentes: ${FINAL_LIST[*]}"
ac_info "Directorio de configuración de Claude: $CLAUDE_CONFIG_DIR"
[ "$DRY_RUN" = "1" ] && ac_warn "DRY-RUN — no se harán cambios."

# --- Carga los componentes bajo demanda
component_run() {
    local id="$1"
    case "$id" in
        rtk)
            . "$AC_REPO_DIR/bin/components/rtk.sh"
            ac_component_rtk
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
        rag)
            . "$AC_REPO_DIR/bin/components/rag.sh"
            ac_component_rag
            ;;
        graphify)
            . "$AC_REPO_DIR/bin/components/graphify.sh"
            ac_component_graphify
            ;;
        cyber-neo)
            . "$AC_REPO_DIR/bin/components/cyber-neo.sh"
            ac_component_cyber_neo
            ;;
        parsers)
            . "$AC_REPO_DIR/bin/components/parsers.sh"
            ac_component_parsers
            ;;
        rules)
            . "$AC_REPO_DIR/bin/components/rules.sh"
            ac_component_rules
            ;;
        *)
            ac_warn "Componente desconocido: $id (válidos: ${ALL_COMPONENTS[*]})"
            ;;
    esac
}

for c in "${FINAL_LIST[@]}"; do
    component_run "$c" || ac_warn "El componente '$c' tuvo errores — continuando."
done

# --- Resumen de verificación
ac_step "Verificar"

if ac_have rtk; then
    ac_info "rtk: $(rtk --version 2>/dev/null | head -n1)"
else
    ac_warn "rtk: no está en el PATH"
fi

if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_info "claude mcp list:"
    claude mcp list 2>/dev/null | sed 's/^/    /' || ac_warn "  claude mcp list falló"
fi

ac_info "Skills instaladas en $CLAUDE_CONFIG_DIR/skills/:"
ls -1 "$CLAUDE_CONFIG_DIR/skills/" 2>/dev/null | sed 's/^/    /' || true

DONE_MSG=$(cat <<EOF

${AC_GREEN}Listo.${AC_NC} Próximos pasos:

  1. Reinicia Claude Code para que carguen los hooks/skills.
  2. Completa el OAuth de Figma: abre Claude Code → /mcp → selecciona figma → navegador.
  3. Prueba los comandos:
       /ui-ux-pro-max     — (el nombre de la skill puede variar; revisa tu selector de skills)
       /superpowers       — paquete de meta-skills (obra/superpowers)
       /architecture-principles /conventional-commits
       /mcp → rag            — búsqueda semántica sobre tu V.A.U.L.T (rag_query)
       /understand           — grafo de conocimiento del proyecto (Graphify)
       /cyber-neo <ruta>     — auditoría de seguridad OWASP/CWE
       markitdown / whisper-ctranslate2 / opendataloader-pdf — parsers de ingesta (Bash)

  Ver README.md para la documentación completa. Para eliminar todo: bash uninstall.sh
EOF
)
printf '%b\n' "$DONE_MSG"
