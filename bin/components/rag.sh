#!/usr/bin/env bash
# Capa de conocimiento de CLAUDEMAX: vault V.A.U.L.T + stack R.A.G (pgvector vía Docker
# Compose, embeddings de Ollama bge-m3, CLI rag.mjs + wrapper MCP).
#
# Controlado por flags de entorno (el wizard interactivo los antepondrá):
#   RAG_ROOT=<path>                 carpeta raíz destino (REQUERIDO — se niega a adivinar)
#   VAULT_MODE=create|import|connect   (por defecto create)
#     import:  VAULT_SRC=<carpeta de vault existente>
#     connect: VAULT_REMOTE=<url git>
#   RAG_MODE=create|import|connect     (por defecto create)
#     import:  RAG_DUMP=<archivo pg dump>
#     connect: RAG_REMOTE_URL=<postgres://...>

ac_component_rag() {
    ac_step "RAG — V.A.U.L.T + PGVector + Ollama bge-m3 + MCP"

    if [ -z "${RAG_ROOT:-}" ]; then
        ac_warn "RAG_ROOT no está definido — se omite el componente rag."
        ac_warn "  Define RAG_ROOT=<raíz del workspace> (más opcionalmente VAULT_MODE/RAG_MODE) y vuelve a ejecutar --only rag."
        return 0
    fi

    ac_rag_vault
    ac_rag_stack
    ac_rag_register_mcp
}

ac_rag_vault() {
    local mode="${VAULT_MODE:-create}"
    local dst="$RAG_ROOT/V.A.U.L.T"

    case "$mode" in
        create)
            ac_info "Vault: crear en $dst"
            if [ -d "$dst" ] && [ -n "$(ls -A "$dst" 2>/dev/null)" ] && [ "${FORCE:-0}" != "1" ]; then
                ac_warn "  $dst existe y no está vacío — se deja intacto (usa --force para sobrescribir solo la config)."
                return 0
            fi
            ac_run mkdir -p "$dst"
            ac_run cp -R "$AC_REPO_DIR/templates/vault/." "$dst/"
            ;;
        import)
            if [ -z "${VAULT_SRC:-}" ] || [ ! -d "${VAULT_SRC:-}" ]; then
                ac_warn "VAULT_MODE=import necesita VAULT_SRC=<carpeta existente> — se omite el vault."
                return 0
            fi
            ac_info "Vault: importar $VAULT_SRC → $dst (notas intactas, config agregada si falta)"
            ac_run mkdir -p "$dst"
            ac_run cp -R "$VAULT_SRC/." "$dst/"
            if [ ! -f "$dst/.obsidian/graph.json" ]; then
                ac_run mkdir -p "$dst/.obsidian"
                ac_run cp "$AC_REPO_DIR/templates/vault/.obsidian/graph.json" "$dst/.obsidian/graph.json"
            fi
            ;;
        connect)
            if [ -z "${VAULT_REMOTE:-}" ]; then
                ac_warn "VAULT_MODE=connect necesita VAULT_REMOTE=<url git> — se omite el vault."
                return 0
            fi
            ac_info "Vault: conectar (clonar) $VAULT_REMOTE → $dst"
            if [ -d "$dst/.git" ]; then
                ac_run git -C "$dst" pull --ff-only
            else
                ac_run git clone "$VAULT_REMOTE" "$dst"
            fi
            ;;
        *) ac_warn "VAULT_MODE desconocido '$mode' (create|import|connect)"; return 0 ;;
    esac
}

ac_rag_stack() {
    local mode="${RAG_MODE:-create}"
    local dst="$RAG_ROOT/R.A.G"

    ac_info "Stack RAG: $mode en $dst"
    ac_run mkdir -p "$dst"
    # Copia las plantillas sin sobrescribir un .env existente
    for f in docker-compose.yml schema.sql .env.example package.json .gitignore rag.mjs mcp-server.mjs; do
        ac_run cp "$AC_REPO_DIR/templates/rag/$f" "$dst/$f"
    done
    [ -f "$dst/.env" ] || ac_run cp "$dst/.env.example" "$dst/.env"

    case "$mode" in
        connect)
            if [ -z "${RAG_REMOTE_URL:-}" ]; then
                ac_warn "RAG_MODE=connect necesita RAG_REMOTE_URL — se deja .env con los valores por defecto."
            elif [ "${DRY_RUN:-0}" = "1" ]; then
                ac_dim "\$ establecer PG_URL=$RAG_REMOTE_URL en $dst/.env"
            else
                sed -i.bak "s|^PG_URL=.*|PG_URL=$RAG_REMOTE_URL|" "$dst/.env"
            fi
            ;;
        create|import)
            if ! docker info >/dev/null 2>&1; then
                ac_warn "Docker no está corriendo — se omiten los pasos de compose/schema. Inicia Docker Desktop y vuelve a ejecutar --only rag."
            else
                ac_run docker compose -f "$dst/docker-compose.yml" up -d
                if [ "${DRY_RUN:-0}" != "1" ]; then
                    ac_info "  esperando el healthcheck de pg..."
                    local i=0
                    until docker inspect --format '{{.State.Health.Status}}' claudemax-ragdb 2>/dev/null | grep -q healthy; do
                        i=$((i+1)); [ $i -gt 30 ] && { ac_warn "  pg no está healthy tras 60s"; break; }
                        sleep 2
                    done
                fi
                ac_run docker exec -i claudemax-ragdb psql -U rag -d rag < "$dst/schema.sql" \
                    || ac_warn "falló la aplicación del schema — ejecuta manualmente: docker exec -i claudemax-ragdb psql -U rag -d rag < schema.sql"
                if [ "$mode" = "import" ]; then
                    if [ -n "${RAG_DUMP:-}" ] && [ -f "${RAG_DUMP:-}" ]; then
                        ac_run docker exec -i claudemax-ragdb psql -U rag -d rag < "$RAG_DUMP"
                    else
                        ac_warn "RAG_MODE=import necesita RAG_DUMP=<archivo> — se omite la restauración del dump."
                    fi
                fi
            fi
            if command -v ollama >/dev/null 2>&1; then
                ac_run ollama pull bge-m3
            else
                ac_warn "ollama no está en el PATH — descarga bge-m3 manualmente: ollama pull bge-m3"
            fi
            ;;
        *) ac_warn "RAG_MODE desconocido '$mode' (create|import|connect)" ;;
    esac

    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ (cd $dst && npm install)"
    else
        (cd "$dst" && npm install --no-fund --no-audit) || ac_warn "npm install falló en $dst — ejecútalo manualmente."
    fi
}

ac_rag_register_mcp() {
    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "El CLI claude no está en el PATH — registra el MCP de RAG manualmente más tarde."
        return 0
    fi
    if claude mcp list 2>/dev/null | grep -qi '^rag\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove rag || true
        else
            ac_info "El MCP rag ya está registrado; se omite. Usa --force para re-agregarlo."
            return 0
        fi
    fi
    ac_run claude mcp add -s user rag -- node "$RAG_ROOT/R.A.G/mcp-server.mjs" \
        || ac_warn "claude mcp add falló para rag — agrégalo manualmente."
}
