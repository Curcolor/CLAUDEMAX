#!/usr/bin/env bash
# Parsers de ingesta para el RAG:
#   - MarkItDown (Microsoft): cualquier archivo → markdown. + MCP oficial.
#   - opendataloader-pdf: PDFs complejos → markdown/JSON (requiere JDK 11+).
#   - whisper-ctranslate2: audio → texto (motor faster-whisper, CPU).
# Auto-instala Python 3.12 y JDK 21 vía winget si faltan (Windows).
# También barre restos legacy de Context7 / Claude-Mem (conflicto con el RAG).

ac_component_parsers() {
    ac_step "Parsers — MarkItDown + opendataloader-pdf + whisper-ctranslate2"

    ac_parsers_ensure_python
    if ! ac_parsers_has_pip; then
        ac_warn "pip no disponible — se omiten los parsers. Instala Python y re-ejecuta --only parsers."
        return 0
    fi

    ac_parsers_markitdown
    ac_parsers_opendataloader
    ac_parsers_whisper
    ac_parsers_barrido_legacy
}

ac_parsers_has_pip() {
    python -m pip --version >/dev/null 2>&1 || py -m pip --version >/dev/null 2>&1
}

# pip con el intérprete que exista (python o py -3)
ac_pip() {
    if python -m pip --version >/dev/null 2>&1; then
        ac_run python -m pip "$@"
    else
        ac_run py -3 -m pip "$@"
    fi
}

ac_parsers_ensure_python() {
    if command -v python >/dev/null 2>&1 || command -v py >/dev/null 2>&1; then
        return 0
    fi
    if [ "$AC_OS" = "windows" ] && command -v winget >/dev/null 2>&1; then
        ac_info "Python no encontrado — instalando Python 3.12 vía winget..."
        ac_run winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements \
            || ac_warn "winget no pudo instalar Python — instálalo manualmente."
        hash -r 2>/dev/null || true
    else
        ac_warn "Python no encontrado y no hay winget — instálalo manualmente."
    fi
}

ac_parsers_markitdown() {
    ac_info "MarkItDown: instalando (pip)..."
    ac_pip install --upgrade "markitdown[all]" markitdown-mcp \
        || { ac_warn "pip install markitdown falló."; return 0; }

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI no disponible — registra el MCP luego: claude mcp add -s user markitdown -- markitdown-mcp"
        return 0
    fi
    if claude mcp list 2>/dev/null | grep -qi '^markitdown\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove markitdown || true
        else
            ac_info "MCP markitdown ya registrado; se omite. Usa --force para re-añadir."
            return 0
        fi
    fi
    ac_run claude mcp add -s user markitdown -- markitdown-mcp \
        || ac_warn "claude mcp add falló para markitdown — añádelo manualmente."
}

ac_parsers_opendataloader() {
    if ! java -version >/dev/null 2>&1; then
        if [ "$AC_OS" = "windows" ] && command -v winget >/dev/null 2>&1; then
            ac_info "Java no encontrado — instalando Temurin JDK 21 vía winget..."
            ac_run winget install -e --id EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements \
                || ac_warn "winget no pudo instalar el JDK."
            hash -r 2>/dev/null || true
        else
            ac_warn "Java 11+ no encontrado — opendataloader-pdf lo necesita; instálalo manualmente."
        fi
    fi
    if java -version >/dev/null 2>&1 || [ "${DRY_RUN:-0}" = "1" ]; then
        ac_info "opendataloader-pdf: instalando (pip)..."
        ac_pip install -U opendataloader-pdf || ac_warn "pip install opendataloader-pdf falló."
    else
        ac_warn "Sin Java funcional — se omite opendataloader-pdf (re-ejecuta --only parsers tras instalar JDK)."
    fi
}

ac_parsers_whisper() {
    ac_info "whisper-ctranslate2: instalando (pip)..."
    ac_pip install -U whisper-ctranslate2 || ac_warn "pip install whisper-ctranslate2 falló."
}

ac_parsers_barrido_legacy() {
    # Context7 y Claude-Mem entran en conflicto con el cerebro RAG (spec maestra).
    local encontrados=0
    for s in context7 claude-mem; do
        if [ -d "$CLAUDE_CONFIG_DIR/skills/$s" ]; then
            ac_info "Legacy: eliminando skill $s"
            ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/$s"
            encontrados=1
        fi
        if [ "$AC_HAS_CLAUDE" = "1" ] && claude mcp list 2>/dev/null | grep -qi "^$s\b"; then
            ac_info "Legacy: quitando MCP $s"
            ac_run claude mcp remove "$s" || true
            encontrados=1
        fi
    done
    [ "$encontrados" = "0" ] && ac_dim "  sin restos de Context7/Claude-Mem — nada que barrer."
}
