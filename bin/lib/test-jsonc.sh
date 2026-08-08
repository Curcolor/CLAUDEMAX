#!/usr/bin/env bash
# Check de bin/lib/jsonc.sh. Sin framework: bash bin/lib/test-jsonc.sh
#
# Cubre los dos puntos donde este archivo se equivocaba en silencio:
#   - ac_remove_hook con un needle que empieza por "/" (MSYS lo reescribía y borraba
#     justo la entrada contraria a la pedida).
#   - ac_drop_stale_msys_hook: quita la entrada MSYS del hook que se va a registrar
#     sin tocar hooks ajenos, y es idempotente al re-ejecutar el instalador.
set -euo pipefail

AC_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export AC_REPO_DIR
. "$AC_REPO_DIR/bin/lib/log.sh"
. "$AC_REPO_DIR/bin/lib/jsonc.sh"

if ! command -v cygpath >/dev/null 2>&1; then
    echo "sin cygpath (no es Git Bash) — ac_drop_stale_msys_hook es no-op aquí; test omitido."
    exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
S="$TMP/settings.json"

# Rutas ficticias: el test no debe depender del usuario ni de la máquina.
HOOK="C:/fake/.claude/hooks/git-footer-guard.mjs"
HOOK_MSYS="$(cygpath -u "$HOOK")"
AJENO="node /c/fake/.claude/hooks/hook-del-usuario.mjs"

cat > "$S" <<JSON
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "rtk hook claude" }] },
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "node $HOOK_MSYS" }] },
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "$AJENO" }] }
    ]
  }
}
JSON

# Dos pasadas = re-ejecutar el instalador. Debe converger, no acumular.
for _ in 1 2; do
    ac_drop_stale_msys_hook "$S" "$HOOK"
    ac_merge_hook "$S" "PreToolUse" "node $HOOK" "Bash"
done

cmds="$(node -e '
const c = require(process.argv[1]);
console.log(c.hooks.PreToolUse.flatMap(g => g.hooks.map(h => h.command)).join("\n"));
' "$S")"

fallos=0
check() { # <descripción> <nº esperado> <comando literal>
    local n; n="$(printf '%s\n' "$cmds" | grep -cFx "$3" || true)"
    if [ "$n" = "$2" ]; then
        echo "  ok    $1"
    else
        echo "  FALLO $1 — esperaba $2, encontró $n"
        fallos=$((fallos + 1))
    fi
}

echo "comandos resultantes:"
printf '%s\n' "$cmds" | sed 's/^/    /'
check "entrada MSYS obsoleta eliminada"          0 "node $HOOK_MSYS"
check "entrada Windows registrada, sin duplicar" 1 "node $HOOK"
check "hook ajeno del usuario intacto"           1 "$AJENO"
check "hook de rtk intacto"                      1 "rtk hook claude"

if [ "$fallos" = "0" ]; then
    echo "test-jsonc: OK"
else
    echo "test-jsonc: FALLÓ ($fallos)"
    exit 1
fi
