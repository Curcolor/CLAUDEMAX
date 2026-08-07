#!/usr/bin/env bash
# Reglas operativas + rituales de ciclo de vida (subproyectos E y D).
#
#   1. Copia templates/rules/ a <RAG_ROOT>/.claude/ (reglas del workspace).
#      Nunca pisa un CLAUDE.md existente: solo le añade la línea @CLAUDEMAX.md si falta.
#   2. Copia y registra los cuatro hooks de cumplimiento y contexto:
#        PreToolUse/Bash   → git-footer-guard.mjs  (bloquea footers de atribución IA)
#        PostToolUse       → loop-breaker.mjs      (corta bucles de 3 fallos idénticos)
#        UserPromptSubmit  → skill-suggest.mjs     (sugiere Skills 2.0 para tecnologías nuevas)
#        SessionStart      → session-start.mjs     (contexto automático: RAG + grafo de Graphify)
#
# Requiere RAG_ROOT para el paso 1 (igual que el componente `rag`). Sin él, instala
# solo los hooks y avisa.
#
# Variables de escape (desactivan un hook sin desinstalar nada):
#   CLAUDEMAX_GIT_GUARD=0  CLAUDEMAX_LOOP_BREAKER=0
#   CLAUDEMAX_SKILL_SUGGEST=0  CLAUDEMAX_SESSION_CONTEXT=0

ac_component_rules() {
    ac_step "Reglas operativas + rituales — plantillas y hooks"

    ac_rules_install_templates
    ac_rules_install_hooks
}

ac_rules_install_templates() {
    if [ -z "${RAG_ROOT:-}" ]; then
        ac_warn "RAG_ROOT no está definido — se omiten las plantillas de reglas del workspace."
        ac_warn "  Define RAG_ROOT=<raíz del workspace> y vuelve a ejecutar --only rules."
        return 0
    fi

    local src="$AC_REPO_DIR/templates/rules"
    local dst="$RAG_ROOT/.claude"

    if [ ! -d "$src" ]; then
        ac_warn "Faltan las plantillas de origen: $src — se omite."
        return 0
    fi

    ac_info "Instalando reglas del workspace en $dst"
    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ mkdir -p $dst"
        ac_dim "\$ cp $src/CLAUDEMAX.md $src/proyecto.md $dst/"
        ac_dim "\$ (CLAUDE.md: se crea si falta; si existe, solo se le añade '@CLAUDEMAX.md')"
        return 0
    fi

    mkdir -p "$dst"
    # CLAUDEMAX.md y proyecto.md son nuestros: se sobrescriben en cada instalación.
    cp -f "$src/CLAUDEMAX.md" "$dst/CLAUDEMAX.md"
    cp -f "$src/proyecto.md"  "$dst/proyecto.md"

    # CLAUDE.md puede ser del usuario: solo lo creamos si falta, y si existe nos
    # limitamos a añadir la referencia cuando no esté ya.
    if [ ! -f "$dst/CLAUDE.md" ]; then
        cp -f "$src/CLAUDE.md" "$dst/CLAUDE.md"
        ac_info "  CLAUDE.md creado con la referencia a @CLAUDEMAX.md"
    elif grep -q '@CLAUDEMAX.md' "$dst/CLAUDE.md" 2>/dev/null; then
        ac_info "  CLAUDE.md ya referencia @CLAUDEMAX.md — se respeta tal cual."
    else
        printf '\n@CLAUDEMAX.md\n' >> "$dst/CLAUDE.md"
        ac_info "  CLAUDE.md existente: se le añadió la línea @CLAUDEMAX.md al final."
    fi
}

# Copia un hook y lo registra en settings.json. Argumentos:
#   $1 nombre de archivo   $2 evento   $3 matcher (vacío = sin matcher)   $4 variable de escape
ac_rules_hook() {
    local name="$1" evento="$2" matcher="$3" escape="$4"
    local hook_src="$AC_REPO_DIR/hooks/$name"
    local hook_dst="$CLAUDE_CONFIG_DIR/hooks/$name"
    local settings="$CLAUDE_CONFIG_DIR/settings.json"

    if [ ! -f "$hook_src" ]; then
        ac_warn "Falta el hook de origen: $hook_src — se omite."
        return 0
    fi

    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ cp $hook_src $hook_dst"
        ac_dim "\$ ac_drop_stale_msys_hook $settings $hook_dst  (migración Windows)"
        ac_dim "\$ ac_merge_hook $settings $evento 'node $hook_dst' '$matcher'"
        return 0
    fi

    mkdir -p "$CLAUDE_CONFIG_DIR/hooks"
    cp -f "$hook_src" "$hook_dst"
    chmod +x "$hook_dst" 2>/dev/null || true

    ac_drop_stale_msys_hook "$settings" "$hook_dst"
    ac_merge_hook "$settings" "$evento" "node $hook_dst" "$matcher"
    ac_info "Hook $evento${matcher:+/$matcher} registrado → $name"
    ac_dim "  (desactivar sin desinstalar: $escape=0)"
}

ac_rules_install_hooks() {
    ac_info "Instalando hooks de reglas y contexto en $CLAUDE_CONFIG_DIR/hooks/"

    ac_rules_hook "git-footer-guard.mjs" "PreToolUse"       "Bash" "CLAUDEMAX_GIT_GUARD"
    ac_rules_hook "loop-breaker.mjs"     "PostToolUse"      ""     "CLAUDEMAX_LOOP_BREAKER"
    ac_rules_hook "skill-suggest.mjs"    "UserPromptSubmit" ""     "CLAUDEMAX_SKILL_SUGGEST"
    ac_rules_hook "session-start.mjs"    "SessionStart"     ""     "CLAUDEMAX_SESSION_CONTEXT"
}
