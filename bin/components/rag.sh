#!/usr/bin/env bash
# CLAUDEMAX knowledge layer: V.A.U.L.T vault + R.A.G stack (pgvector via Docker
# Compose, Ollama bge-m3 embeddings, rag.mjs CLI + MCP wrapper).
#
# Driven by env flags (the interactive wizard will front-end these):
#   RAG_ROOT=<path>                 target root folder (REQUIRED — refuses to guess)
#   VAULT_MODE=create|import|connect   (default create)
#     import:  VAULT_SRC=<existing vault folder>
#     connect: VAULT_REMOTE=<git url>
#   RAG_MODE=create|import|connect     (default create)
#     import:  RAG_DUMP=<pg dump file>
#     connect: RAG_REMOTE_URL=<postgres://...>

ac_component_rag() {
    ac_step "RAG — V.A.U.L.T + PGVector + Ollama bge-m3 + MCP"

    if [ -z "${RAG_ROOT:-}" ]; then
        ac_warn "RAG_ROOT not set — skipping rag component."
        ac_warn "  Set RAG_ROOT=<workspace root> (plus optional VAULT_MODE/RAG_MODE) and re-run --only rag."
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
            ac_info "Vault: create at $dst"
            if [ -d "$dst" ] && [ -n "$(ls -A "$dst" 2>/dev/null)" ] && [ "${FORCE:-0}" != "1" ]; then
                ac_warn "  $dst exists and is not empty — leaving untouched (use --force to overwrite config only)."
                return 0
            fi
            ac_run mkdir -p "$dst"
            ac_run cp -R "$AC_REPO_DIR/templates/vault/." "$dst/"
            ;;
        import)
            if [ -z "${VAULT_SRC:-}" ] || [ ! -d "${VAULT_SRC:-}" ]; then
                ac_warn "VAULT_MODE=import needs VAULT_SRC=<existing folder> — skipping vault."
                return 0
            fi
            ac_info "Vault: import $VAULT_SRC → $dst (notes untouched, config added if missing)"
            ac_run mkdir -p "$dst"
            ac_run cp -R "$VAULT_SRC/." "$dst/"
            if [ ! -f "$dst/.obsidian/graph.json" ]; then
                ac_run mkdir -p "$dst/.obsidian"
                ac_run cp "$AC_REPO_DIR/templates/vault/.obsidian/graph.json" "$dst/.obsidian/graph.json"
            fi
            ;;
        connect)
            if [ -z "${VAULT_REMOTE:-}" ]; then
                ac_warn "VAULT_MODE=connect needs VAULT_REMOTE=<git url> — skipping vault."
                return 0
            fi
            ac_info "Vault: connect (clone) $VAULT_REMOTE → $dst"
            if [ -d "$dst/.git" ]; then
                ac_run git -C "$dst" pull --ff-only
            else
                ac_run git clone "$VAULT_REMOTE" "$dst"
            fi
            ;;
        *) ac_warn "Unknown VAULT_MODE '$mode' (create|import|connect)"; return 0 ;;
    esac
}

ac_rag_stack() {
    local mode="${RAG_MODE:-create}"
    local dst="$RAG_ROOT/R.A.G"

    ac_info "RAG stack: $mode at $dst"
    ac_run mkdir -p "$dst"
    # Copy templates without clobbering an existing .env
    for f in docker-compose.yml schema.sql .env.example package.json .gitignore rag.mjs mcp-server.mjs; do
        ac_run cp "$AC_REPO_DIR/templates/rag/$f" "$dst/$f"
    done
    [ -f "$dst/.env" ] || ac_run cp "$dst/.env.example" "$dst/.env"

    case "$mode" in
        connect)
            if [ -z "${RAG_REMOTE_URL:-}" ]; then
                ac_warn "RAG_MODE=connect needs RAG_REMOTE_URL — leaving .env at defaults."
            elif [ "${DRY_RUN:-0}" = "1" ]; then
                ac_dim "\$ set PG_URL=$RAG_REMOTE_URL in $dst/.env"
            else
                sed -i.bak "s|^PG_URL=.*|PG_URL=$RAG_REMOTE_URL|" "$dst/.env"
            fi
            ;;
        create|import)
            if ! docker info >/dev/null 2>&1; then
                ac_warn "Docker not running — compose/schema steps skipped. Start Docker Desktop and re-run --only rag."
            else
                ac_run docker compose -f "$dst/docker-compose.yml" up -d
                if [ "${DRY_RUN:-0}" != "1" ]; then
                    ac_info "  waiting for pg healthcheck..."
                    local i=0
                    until docker inspect --format '{{.State.Health.Status}}' claudemax-ragdb 2>/dev/null | grep -q healthy; do
                        i=$((i+1)); [ $i -gt 30 ] && { ac_warn "  pg not healthy after 60s"; break; }
                        sleep 2
                    done
                fi
                ac_run docker exec -i claudemax-ragdb psql -U rag -d rag < "$dst/schema.sql" \
                    || ac_warn "schema apply failed — run manually: docker exec -i claudemax-ragdb psql -U rag -d rag < schema.sql"
                if [ "$mode" = "import" ]; then
                    if [ -n "${RAG_DUMP:-}" ] && [ -f "${RAG_DUMP:-}" ]; then
                        ac_run docker exec -i claudemax-ragdb psql -U rag -d rag < "$RAG_DUMP"
                    else
                        ac_warn "RAG_MODE=import needs RAG_DUMP=<file> — dump restore skipped."
                    fi
                fi
            fi
            if command -v ollama >/dev/null 2>&1; then
                ac_run ollama pull bge-m3
            else
                ac_warn "ollama not on PATH — pull bge-m3 manually: ollama pull bge-m3"
            fi
            ;;
        *) ac_warn "Unknown RAG_MODE '$mode' (create|import|connect)" ;;
    esac

    if [ "${DRY_RUN:-0}" = "1" ]; then
        ac_dim "\$ (cd $dst && npm install)"
    else
        (cd "$dst" && npm install --no-fund --no-audit) || ac_warn "npm install failed in $dst — run it manually."
    fi
}

ac_rag_register_mcp() {
    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI not on PATH — register the RAG MCP manually later."
        return 0
    fi
    if claude mcp list 2>/dev/null | grep -qi '^rag\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove rag || true
        else
            ac_info "rag MCP already registered; skipping. Use --force to re-add."
            return 0
        fi
    fi
    ac_run claude mcp add -s user rag -- node "$RAG_ROOT/R.A.G/mcp-server.mjs" \
        || ac_warn "claude mcp add failed for rag — add manually."
}
