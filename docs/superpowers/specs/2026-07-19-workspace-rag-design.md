# Workspace + RAG (Sub-project B) — Design Spec

**Date:** 2026-07-19
**Parent:** [CLAUDEMAX master design](2026-07-19-claudemax-master-design.md)
**Status:** Approved design

## Goal

Build the CLAUDEMAX knowledge layer: the V.A.U.L.T Obsidian vault skeleton and the R.A.G retrieval stack (PostgreSQL + PGVector via Docker Compose, Ollama `bge-m3` embeddings, Node CLI + thin MCP wrapper), installable through a new `rag` installer component supporting create / import / connect modes for both vault and database.

## Decisions log

| Decision | Choice |
|---|---|
| Vector store deployment | Docker Compose, image `pgvector/pgvector:pg17`, persistent volume, host port 5433 (avoids clashing with any native PG on 5432) |
| Query interface | CLI core (`rag.mjs`) + thin MCP stdio wrapper (`mcp-server.mjs`) exposing the same functions as in-session tools |
| Embedding model | `bge-m3` via local Ollama HTTP API — multilingual (Spanish vault + English code), 1024 dims |
| Implementation language | Node ≥18. R.A.G/ carries its own `package.json` (deps: `pg`, `@modelcontextprotocol/sdk`) — exception to the repo's dep-free rule, justified: PG wire protocol and MCP need real libraries |
| Setup modes | Both vault and RAG support create-from-scratch / import-existing / connect-remote, driven by component flags now, by the interactive wizard later |

## Directory layout (created at the chosen root)

```
<root>/
├── V.A.U.L.T/
│   ├── .obsidian/graph.json    # color groups per project (committed template)
│   ├── 00-Inbox/
│   ├── Projects/               # one folder per project; tags #<project>/<subtopic>
│   └── Journal/                # daily logs (sub-project D writes here)
└── R.A.G/
    ├── docker-compose.yml
    ├── .env.example            # PG_URL, OLLAMA_URL, EMBED_MODEL=bge-m3
    ├── package.json
    ├── schema.sql
    ├── rag.mjs                 # CLI: init | ingest <path> | query "<text>" [--project P] [--json] [--topk N] | reindex | status
    └── mcp-server.mjs          # MCP stdio server: tools rag_query, rag_status
```

Templates for all of the above live in this repo under `templates/rag/` and `templates/vault/`; the installer component copies them to the chosen root.

## Database schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS chunks (
  id          BIGSERIAL PRIMARY KEY,
  source      TEXT NOT NULL,          -- absolute file path
  project     TEXT,                   -- derived from Projects/<name>/ or #tag
  heading     TEXT,                   -- nearest markdown heading
  content     TEXT NOT NULL,
  content_hash TEXT NOT NULL,         -- sha1; skip re-embed when unchanged
  mtime       TIMESTAMPTZ,
  embedding   vector(1024)
);
CREATE UNIQUE INDEX IF NOT EXISTS chunks_source_hash ON chunks(source, content_hash);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks
  USING hnsw (embedding vector_cosine_ops);
```

## Pipeline behavior

- **Ingest:** walk the given path (default: the vault) for `.md` files; split by markdown headings targeting ~500 tokens per chunk with ~50-token overlap; skip chunks whose `(source, content_hash)` already exist; embed via `POST {OLLAMA_URL}/api/embed` with model `bge-m3`; upsert. Delete DB rows whose source file disappeared.
- **Query:** embed the question, `SELECT ... ORDER BY embedding <=> $1 LIMIT k` (cosine), optional `WHERE project = $2`. Plain-text output for hooks/humans; `--json` for the MCP wrapper.
- **Reindex:** truncate + full re-ingest (this is what sub-project D's Context Dump Ritual calls).
- **Status:** row/chunk counts per project, last ingest time, DB and Ollama connectivity.

## Installer component (`bin/components/rag.sh`, id `rag`)

Env-flag driven (wizard will front-end these later):

- `RAG_ROOT` — target root folder (required; the component refuses to guess).
- `VAULT_MODE=create|import|connect` — create: copy `templates/vault/`; import: adopt existing folder at `VAULT_SRC` (copy config non-destructively, never overwrite notes); connect: `git clone VAULT_REMOTE` into `V.A.U.L.T/`.
- `RAG_MODE=create|import|connect` — create: copy `templates/rag/`, `docker compose up -d`, apply `schema.sql`, `ollama pull bge-m3`, `npm install`; import: same as create then restore `RAG_DUMP` via `psql < dump`; connect: copy templates but write `PG_URL` from `RAG_REMOTE_URL` into `.env`, skip Docker entirely.
- Registers the MCP: `claude mcp add -s user rag -- node <root>/R.A.G/mcp-server.mjs` (idempotent, same pattern as figma/magic).
- Added to `ALL_COMPONENTS` after `dev-skills`; skipped gracefully with a warning when `RAG_ROOT` is unset (so `--all` still works non-interactively).
- `uninstall.sh`: `docker compose down` (volume LEFT in place — data survives uninstall), `claude mcp remove rag`; vault and R.A.G folders are never deleted.

## MCP wrapper

`mcp-server.mjs` (stdio, `@modelcontextprotocol/sdk`): two tools —
- `rag_query { query: string, project?: string, topk?: number }` → shells into `rag.mjs query --json`, returns matched chunks with source/heading/score.
- `rag_status {}` → `rag.mjs status` output.
No direct DB access in the wrapper; the CLI is the single implementation.

## Vault conventions

- Notes only (markdown). Folder per project under `Projects/`; nested tags `#<project>/<subtopic>`.
- `graph.json` template ships color groups keyed by `path:Projects/<name>` with a documented palette slot per project and sub-colors by tag; user extends per project.
- `Journal/YYYY-MM-DD.md` naming for daily logs.

## Verification

1. `bash install.sh --only rag --config-dir /tmp/cm-test` with `RAG_ROOT=/tmp/cm-root VAULT_MODE=create RAG_MODE=create` → folders scaffolded, compose up, healthcheck green, schema applied, bge-m3 pulled.
2. Seed 3 Spanish test notes in the vault → `node rag.mjs ingest` → `status` shows chunks > 0.
3. `node rag.mjs query "<Spanish question>"` returns the correct chunk.
4. `rag_query` MCP tool answers inside a Claude Code session.
5. `bash uninstall.sh --dry-run` shows compose-down + mcp-remove, never a vault/RAG folder deletion.

## Out of scope

- Interactive wizard UI (installer sub-spec; this component exposes the flags it will drive).
- Non-markdown ingestion — MarkItDown / opendataloader-pdf / Whisper parsers (sub-project C; `rag.mjs ingest` accepts any path of `.md` files, so C's parsers just emit markdown into a staging dir).
- SessionStart hook querying the RAG (sub-project D).
