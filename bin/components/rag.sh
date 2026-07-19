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

# Instala y arranca automáticamente las dependencias de sistema (Docker Desktop
# y Ollama) cuando faltan. En Windows usa winget; en otros SO solo avisa.
ac_rag_ensure_deps() {
    # --- Docker: instalar si falta el binario
    if ! command -v docker >/dev/null 2>&1; then
        if [ "$AC_OS" = "windows" ] && command -v winget >/dev/null 2>&1; then
            ac_info "Docker no encontrado — instalando Docker Desktop vía winget..."
            ac_run winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements \
                || ac_warn "winget no pudo instalar Docker Desktop — instálalo manualmente."
        else
            ac_warn "Docker no encontrado y no hay winget — instala Docker manualmente."
        fi
    fi
    # --- Docker: arrancar el daemon si está apagado
    if command -v docker >/dev/null 2>&1 && ! docker info >/dev/null 2>&1; then
        if [ "$AC_OS" = "windows" ]; then
            ac_info "Arrancando Docker Desktop..."
            if [ "${DRY_RUN:-0}" = "1" ]; then
                ac_dim "\$ powershell Start-Process 'Docker Desktop'"
            else
                powershell.exe -NoProfile -Command "Start-Process -FilePath \"\$env:ProgramFiles\\Docker\\Docker\\Docker Desktop.exe\"" 2>/dev/null || true
                ac_info "  esperando el daemon de Docker (hasta 120s)..."
                local i=0
                until docker info >/dev/null 2>&1; do
                    i=$((i+1)); [ $i -gt 60 ] && { ac_warn "  Docker no respondió tras 120s — los pasos de compose se omitirán."; break; }
                    sleep 2
                done
            fi
        else
            ac_warn "El daemon de Docker no responde — arráncalo manualmente."
        fi
    fi
    # --- Ollama: si el daemon ya responde, no hay nada que instalar ni arrancar
    if curl -s "http://localhost:11434/api/tags" >/dev/null 2>&1; then
        return 0
    fi
    # --- Ollama: instalar si falta
    if ! command -v ollama >/dev/null 2>&1; then
        if [ "$AC_OS" = "windows" ] && command -v winget >/dev/null 2>&1; then
            ac_info "Ollama no encontrado — instalando vía winget..."
            ac_run winget install -e --id Ollama.Ollama --accept-package-agreements --accept-source-agreements \
                || ac_warn "winget no pudo instalar Ollama — instálalo manualmente."
            hash -r 2>/dev/null || true
        else
            ac_warn "Ollama no encontrado y no hay winget — instálalo manualmente."
        fi
    fi
    # --- Ollama: arrancar el servicio si está apagado
    if command -v ollama >/dev/null 2>&1 && ! curl -s "http://localhost:11434/api/tags" >/dev/null 2>&1; then
        ac_info "Arrancando el servicio de Ollama..."
        if [ "${DRY_RUN:-0}" = "1" ]; then
            ac_dim "\$ ollama serve &"
        else
            if [ "$AC_OS" = "windows" ]; then
                powershell.exe -NoProfile -Command "Start-Process -WindowStyle Hidden ollama -ArgumentList 'serve'" 2>/dev/null || true
            else
                (ollama serve >/dev/null 2>&1 &) || true
            fi
            local j=0
            until curl -s "http://localhost:11434/api/tags" >/dev/null 2>&1; do
                j=$((j+1)); [ $j -gt 15 ] && { ac_warn "  Ollama no respondió tras 30s — descarga bge-m3 manualmente después."; break; }
                sleep 2
            done
        fi
    fi
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

    [ "$mode" != "connect" ] && ac_rag_ensure_deps

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
            elif curl -s "http://localhost:11434/api/tags" >/dev/null 2>&1; then
                ac_info "Descargando bge-m3 vía API de Ollama (el CLI no está en el PATH)..."
                if [ "${DRY_RUN:-0}" = "1" ]; then
                    ac_dim "\$ curl -s http://localhost:11434/api/pull -d '{\"name\":\"bge-m3\"}'"
                else
                    curl -s "http://localhost:11434/api/pull" -d '{"name":"bge-m3"}' >/dev/null \
                        && ac_info "bge-m3 descargado." \
                        || ac_warn "falló la descarga de bge-m3 vía API — ejecuta: ollama pull bge-m3"
                fi
            else
                ac_warn "ollama no disponible — descarga bge-m3 manualmente: ollama pull bge-m3"
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
