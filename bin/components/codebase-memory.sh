#!/usr/bin/env bash
# codebase-memory-mcp (DeusData/codebase-memory-mcp, MIT): servidor MCP de inteligencia de
# código — indexa un repo en un grafo persistente (158 lenguajes) y expone search_graph,
# trace_path, get_code_snippet, get_architecture, search_code, index_repository...
# Es el tercer peldaño del orden de herramientas de contexto (rag → graphify →
# codebase-memory → grep): el detalle fino que graphify no da (llamantes reales, snippets).
#
# Se instala con `npm install -g codebase-memory-mcp` (Node ya es requisito de CLAUDEMAX) y
# se registra UNA vez a nivel usuario con el nombre `codebase-memory` (el que usan los
# recordatorios). Es multi-proyecto por diseño: el índice vive en ~/.cache/codebase-memory-mcp/
# (CBM_CACHE_DIR para moverlo), NUNCA dentro del repo — por eso no se usa `--persistence`, que
# escribe .codebase-memory/graph.db.zst (todo el código comprimido) en el repo.
#
# No indexa nada al instalar: el indexado es por proyecto y lo disparan los rituales
# init-proyecto y fin-ciclo con:
#   codebase-memory-mcp cli index_repository --repo-path <abs> --mode moderate
# Lección del setup de trabajo (2026-08-20): `index_status: ready` significa que HAY un índice,
# no que esté al día — reindexa al cerrar ciclo o cuando search_graph no encuentre algo recién
# escrito.

CBM_PKG="codebase-memory-mcp"

ac_component_codebase_memory() {
    ac_step "codebase-memory — grafo de código persistente (search_graph / trace_path / get_code_snippet)"

    if ! command -v npm >/dev/null 2>&1; then
        ac_warn "npm no está en el PATH — se omite codebase-memory. Instala Node.js y re-ejecuta --only codebase-memory."
        return 0
    fi
    ac_cbm_install
    ac_cbm_register_mcp
    ac_dim "  Indexa cada proyecto con: codebase-memory-mcp cli index_repository --repo-path <ruta absoluta> --mode moderate (nunca --persistence)."
    ac_dim "  'index_status: ready' no significa al día: reindexa al cerrar ciclo."
}

ac_cbm_install() {
    if [ "${FORCE:-0}" != "1" ] && command -v codebase-memory-mcp >/dev/null 2>&1; then
        ac_info "codebase-memory-mcp ya está instalado ($(codebase-memory-mcp --version 2>/dev/null | head -1)); se omite. Usa --force para reinstalar."
        return 0
    fi
    ac_info "Instalando $CBM_PKG con npm -g..."
    if ! ac_run npm install -g "$CBM_PKG" --no-fund --no-audit; then
        ac_warn "npm install -g $CBM_PKG falló — instálalo a mano (npm install -g $CBM_PKG) y re-ejecuta --only codebase-memory."
        return 1
    fi
    hash -r 2>/dev/null || true
}

ac_cbm_register_mcp() {
    if [ "${DRY_RUN:-0}" != "1" ] && ! command -v codebase-memory-mcp >/dev/null 2>&1; then
        ac_warn "codebase-memory-mcp no está en el PATH — se omite el registro del MCP."
        return 0
    fi
    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "El CLI claude no está en el PATH — registra el MCP a mano: claude mcp add -s user codebase-memory -- codebase-memory-mcp"
        return 0
    fi
    if claude mcp list 2>/dev/null | grep -qi '^codebase-memory\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove codebase-memory || true
        else
            ac_info "El MCP codebase-memory ya está registrado; se omite. Usa --force para re-agregarlo."
            return 0
        fi
    fi
    ac_run claude mcp add -s user codebase-memory -- codebase-memory-mcp \
        || ac_warn "claude mcp add falló para codebase-memory — agrégalo manualmente."
}
