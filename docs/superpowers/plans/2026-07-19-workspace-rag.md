# Workspace + RAG Implementation Plan (Sub-project B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `templates/vault/`, `templates/rag/` (compose + schema + CLI + MCP wrapper), and the `rag` installer component with create/import/connect modes.

**Architecture:** Templates live in the repo; the component copies them to a user-chosen root. CLI (`rag.mjs`) is the single implementation; MCP server shells into it. DB via Docker Compose (pgvector/pgvector:pg17, port 5433); embeddings via Ollama `bge-m3` (1024 dims).

**Tech Stack:** Node ≥18 (`pg`, `@modelcontextprotocol/sdk`), Bash installer, Docker Compose, PostgreSQL+pgvector, Ollama.

**Spec:** [2026-07-19-workspace-rag-design.md](../specs/2026-07-19-workspace-rag-design.md)

**Branch:** `feat/workspace-rag` off `main`. Commit rule: Conventional Commits, no AI-attribution footers.

**Environment note:** Docker Desktop and Ollama may be absent on the dev machine. Every verification step that needs them MUST first probe (`docker info`, `curl -s http://localhost:11434/api/tags`) and, if absent, print a SKIPPED warning and continue — never fail the task for a missing daemon. Full end-to-end runs happen in Task 6 only if both daemons are up.

---

### Task 1: Vault template

**Files:**
- Create: `templates/vault/.obsidian/graph.json`, `templates/vault/00-Inbox/.gitkeep`, `templates/vault/Projects/README.md`, `templates/vault/Journal/.gitkeep`, `templates/vault/README.md`

- [ ] **Step 1: Create the tree**

`templates/vault/.obsidian/graph.json`:

```json
{
  "collapse-filter": true, "search": "", "showTags": true,
  "showAttachments": false, "hideUnresolved": false, "showOrphans": true,
  "collapse-color-groups": false,
  "colorGroups": [
    { "query": "path:Projects/example-project", "color": { "a": 1, "rgb": 5431378 } },
    { "query": "tag:#example-project/api",      "color": { "a": 1, "rgb": 11621088 } },
    { "query": "path:Journal",                  "color": { "a": 1, "rgb": 14701138 } },
    { "query": "path:00-Inbox",                 "color": { "a": 1, "rgb": 9079434 } }
  ],
  "collapse-display": false, "showArrow": false, "textFadeMultiplier": 0,
  "nodeSizeMultiplier": 1, "lineSizeMultiplier": 1,
  "collapse-forces": false, "centerStrength": 0.52, "repelStrength": 10,
  "linkStrength": 1, "linkDistance": 250, "scale": 1, "close": true
}
```

`templates/vault/Projects/README.md`:

```markdown
# Projects

One folder per project: `Projects/<project-name>/`.
Tag notes with nested tags: `#<project-name>/<subtopic>` (e.g. `#claudemax/rag`).

Color coding (Obsidian → Settings → Appearance → Graph, or edit .obsidian/graph.json):
- One base color per project via a `path:Projects/<name>` group.
- Sub-colors per subtopic via `tag:#<name>/<subtopic>` groups.
Duplicate the example entries in graph.json for each new project.
```

`templates/vault/README.md`:

```markdown
# V.A.U.L.T

Obsidian vault — STRICTLY markdown notes.
- `00-Inbox/` unsorted captures
- `Projects/<name>/` per-project notes, tags `#<name>/<subtopic>`
- `Journal/YYYY-MM-DD.md` daily logs (written by the end-of-day ritual)
Indexed into the RAG by `R.A.G/rag.mjs ingest`.
```

`00-Inbox/.gitkeep` and `Journal/.gitkeep`: empty files.

- [ ] **Step 2: Commit**

```bash
git add templates/vault
git commit -m "feat(rag): add vault template"
```

---

### Task 2: RAG infra templates (compose, schema, env, package)

**Files:**
- Create: `templates/rag/docker-compose.yml`, `templates/rag/schema.sql`, `templates/rag/.env.example`, `templates/rag/package.json`, `templates/rag/.gitignore`

- [ ] **Step 1: docker-compose.yml**

```yaml
services:
  ragdb:
    image: pgvector/pgvector:pg17
    container_name: claudemax-ragdb
    restart: unless-stopped
    environment:
      POSTGRES_USER: rag
      POSTGRES_PASSWORD: rag
      POSTGRES_DB: rag
    ports:
      - "5433:5432"
    volumes:
      - ragdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rag -d rag"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  ragdata:
```

- [ ] **Step 2: schema.sql**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS chunks (
  id           BIGSERIAL PRIMARY KEY,
  source       TEXT NOT NULL,
  project      TEXT,
  heading      TEXT,
  content      TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  mtime        TIMESTAMPTZ,
  embedding    vector(1024)
);
CREATE UNIQUE INDEX IF NOT EXISTS chunks_source_hash ON chunks(source, content_hash);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks
  USING hnsw (embedding vector_cosine_ops);
```

- [ ] **Step 3: .env.example**

```bash
PG_URL=postgres://rag:rag@localhost:5433/rag
OLLAMA_URL=http://localhost:11434
EMBED_MODEL=bge-m3
```

- [ ] **Step 4: package.json + .gitignore**

`package.json`:

```json
{
  "name": "claudemax-rag",
  "private": true,
  "type": "module",
  "engines": { "node": ">=18" },
  "dependencies": {
    "pg": "^8.13.0",
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

`.gitignore`:

```
node_modules/
.env
```

- [ ] **Step 5: Commit**

```bash
git add templates/rag
git commit -m "feat(rag): add compose, schema, env templates"
```

---

### Task 3: rag.mjs CLI

**Files:**
- Create: `templates/rag/rag.mjs`

- [ ] **Step 1: Write the CLI**

`templates/rag/rag.mjs`:

```js
#!/usr/bin/env node
// CLAUDEMAX RAG CLI. Single implementation for ingest/query/status; the MCP
// wrapper shells into this. Config from .env next to this file (fallback: env vars).
//   node rag.mjs init                 apply schema.sql
//   node rag.mjs ingest [path]        default path: ../V.A.U.L.T
//   node rag.mjs query "<text>" [--project P] [--topk N] [--json]
//   node rag.mjs reindex [path]       truncate + full ingest
//   node rag.mjs status

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
loadDotEnv(path.join(HERE, ".env"));
const PG_URL = process.env.PG_URL || "postgres://rag:rag@localhost:5433/rag";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.EMBED_MODEL || "bge-m3";
const DIMS = 1024;

function loadDotEnv(file) {
    try {
        for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
            const m = line.match(/^([A-Z_]+)=(.*)$/);
            if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
        }
    } catch {}
}

async function embed(texts) {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: EMBED_MODEL, input: texts })
    });
    if (!res.ok) throw new Error(`ollama embed HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const vecs = data.embeddings;
    if (!Array.isArray(vecs) || vecs.length !== texts.length || vecs[0].length !== DIMS) {
        throw new Error(`unexpected embedding shape from ${EMBED_MODEL}`);
    }
    return vecs;
}

function toVec(v) { return `[${v.join(",")}]`; }

// Split a markdown file into ~500-token chunks (~4 chars/token heuristic) on
// heading boundaries, with ~50-token overlap between adjacent chunks.
function chunkMarkdown(text) {
    const MAX = 2000, OVERLAP = 200;
    const lines = text.split(/\r?\n/);
    const out = [];
    let heading = "", buf = [];
    const flush = () => {
        const body = buf.join("\n").trim();
        if (!body) { buf = []; return; }
        for (let i = 0; i < body.length; i += MAX - OVERLAP) {
            const piece = body.slice(i, i + MAX).trim();
            if (piece) out.push({ heading, content: piece });
            if (i + MAX >= body.length) break;
        }
        buf = [];
    };
    for (const line of lines) {
        const h = line.match(/^#{1,6}\s+(.*)$/);
        if (h) { flush(); heading = h[1].trim(); }
        buf.push(line);
    }
    flush();
    return out;
}

function projectOf(file, root) {
    const rel = path.relative(root, file).split(path.sep);
    const i = rel.indexOf("Projects");
    if (i >= 0 && rel[i + 1]) return rel[i + 1];
    if (rel[0] === "Journal") return "journal";
    return null;
}

function* walkMd(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith(".") || e.name === "node_modules") continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) yield* walkMd(p);
        else if (e.name.endsWith(".md")) yield p;
    }
}

async function withDb(fn) {
    const client = new pg.Client({ connectionString: PG_URL });
    await client.connect();
    try { return await fn(client); } finally { await client.end(); }
}

async function cmdInit() {
    await withDb(async db => {
        await db.query(fs.readFileSync(path.join(HERE, "schema.sql"), "utf8"));
    });
    console.log("rag: schema applied");
}

async function cmdIngest(root) {
    root = path.resolve(root || path.join(HERE, "..", "V.A.U.L.T"));
    let added = 0, skipped = 0;
    const seen = new Set();
    await withDb(async db => {
        for (const file of walkMd(root)) {
            seen.add(file);
            const text = fs.readFileSync(file, "utf8");
            const mtime = fs.statSync(file).mtime;
            const project = projectOf(file, root);
            const chunks = chunkMarkdown(text);
            const fresh = [];
            for (const c of chunks) {
                const hash = crypto.createHash("sha1").update(c.content).digest("hex");
                const { rowCount } = await db.query(
                    "SELECT 1 FROM chunks WHERE source=$1 AND content_hash=$2", [file, hash]);
                if (rowCount) { skipped++; } else { fresh.push({ ...c, hash }); }
            }
            if (fresh.length) {
                const vecs = await embed(fresh.map(c => c.content));
                await db.query("DELETE FROM chunks WHERE source=$1", [file]);
                for (let i = 0; i < fresh.length; i++) {
                    const c = fresh[i];
                    await db.query(
                        `INSERT INTO chunks (source, project, heading, content, content_hash, mtime, embedding)
                         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                        [file, project, c.heading, c.content, c.hash, mtime, toVec(vecs[i])]);
                    added++;
                }
            }
        }
        const { rows } = await db.query("SELECT DISTINCT source FROM chunks");
        for (const r of rows) {
            if (r.source.startsWith(root) && !seen.has(r.source)) {
                await db.query("DELETE FROM chunks WHERE source=$1", [r.source]);
            }
        }
    });
    console.log(`rag: ingest done — ${added} chunks added, ${skipped} unchanged`);
}

async function cmdQuery(text, opts) {
    const [vec] = await embed([text]);
    const params = [toVec(vec)];
    let where = "";
    if (opts.project) { params.push(opts.project); where = "WHERE project = $2"; }
    const topk = opts.topk || 5;
    const rows = await withDb(db => db.query(
        `SELECT source, project, heading, content, 1 - (embedding <=> $1) AS score
         FROM chunks ${where} ORDER BY embedding <=> $1 LIMIT ${Number(topk)}`,
        params).then(r => r.rows));
    if (opts.json) { console.log(JSON.stringify(rows, null, 2)); return; }
    for (const r of rows) {
        console.log(`--- ${r.source}${r.heading ? " · " + r.heading : ""} (score ${Number(r.score).toFixed(3)})`);
        console.log(r.content.slice(0, 600) + (r.content.length > 600 ? " …" : ""));
    }
    if (!rows.length) console.log("rag: no results");
}

async function cmdReindex(root) {
    await withDb(db => db.query("TRUNCATE chunks"));
    await cmdIngest(root);
}

async function cmdStatus() {
    let ollama = "down";
    try {
        const r = await fetch(`${OLLAMA_URL}/api/tags`);
        if (r.ok) ollama = (await r.json()).models?.some(m => m.name.startsWith(EMBED_MODEL))
            ? `up (${EMBED_MODEL} present)` : `up (${EMBED_MODEL} MISSING — run: ollama pull ${EMBED_MODEL})`;
    } catch {}
    try {
        await withDb(async db => {
            const tot = await db.query("SELECT count(*) FROM chunks");
            const per = await db.query(
                "SELECT coalesce(project,'(none)') p, count(*) c, max(mtime) m FROM chunks GROUP BY 1 ORDER BY 2 DESC");
            console.log(`db: up — ${tot.rows[0].count} chunks | ollama: ${ollama}`);
            for (const r of per.rows) console.log(`  ${r.p}: ${r.c} chunks (latest note ${r.m ? r.m.toISOString().slice(0, 10) : "-"})`);
        });
    } catch (e) {
        console.log(`db: DOWN (${e.message}) | ollama: ${ollama}`);
        process.exitCode = 1;
    }
}

const [cmd, ...rest] = process.argv.slice(2);
const opts = { json: rest.includes("--json") };
const pi = rest.indexOf("--project"); if (pi >= 0) opts.project = rest[pi + 1];
const ki = rest.indexOf("--topk"); if (ki >= 0) opts.topk = Number(rest[ki + 1]);
const positional = rest.filter((a, i) =>
    !a.startsWith("--") && rest[i - 1] !== "--project" && rest[i - 1] !== "--topk");

try {
    if (cmd === "init") await cmdInit();
    else if (cmd === "ingest") await cmdIngest(positional[0]);
    else if (cmd === "query") await cmdQuery(positional[0], opts);
    else if (cmd === "reindex") await cmdReindex(positional[0]);
    else if (cmd === "status") await cmdStatus();
    else {
        console.log("usage: rag.mjs init | ingest [path] | query \"<text>\" [--project P] [--topk N] [--json] | reindex [path] | status");
        process.exitCode = cmd ? 1 : 0;
    }
} catch (e) {
    console.error(`rag: error — ${e.message}`);
    process.exitCode = 1;
}
```

- [ ] **Step 2: Syntax check (no daemons needed)**

```bash
node --check templates/rag/rag.mjs
```

Expected: exit 0. Then run `node templates/rag/rag.mjs` (no args) → prints usage, exit 0. Run `node templates/rag/rag.mjs status` → if no DB running, prints `db: DOWN ...` and exits 1 — acceptable offline behavior, do not "fix".

- [ ] **Step 3: Unit-test chunker offline**

```bash
node -e "
import('./templates/rag/rag.mjs').catch(()=>{});
" 2>/dev/null
node - <<'EOF'
const fs = require('fs');
const src = fs.readFileSync('templates/rag/rag.mjs','utf8');
// extract chunkMarkdown for a standalone smoke test
const fnMatch = src.match(/function chunkMarkdown[\s\S]*?\n}\n/);
eval(fnMatch[0]);
const md = "# T\n" + "hola mundo español. ".repeat(300) + "\n## Sub\ncorto";
const out = chunkMarkdown(md);
if (out.length < 2) throw new Error("expected multiple chunks, got " + out.length);
if (out[out.length-1].heading !== "Sub") throw new Error("heading tracking broken");
console.log("chunker OK:", out.length, "chunks");
EOF
```

Expected: `chunker OK: <n> chunks` with n ≥ 2.

- [ ] **Step 4: Commit**

```bash
git add templates/rag/rag.mjs
git commit -m "feat(rag): add rag.mjs CLI (ingest/query/status)"
```

---

### Task 4: MCP wrapper

**Files:**
- Create: `templates/rag/mcp-server.mjs`

- [ ] **Step 1: Write the server**

`templates/rag/mcp-server.mjs`:

```js
#!/usr/bin/env node
// Thin MCP stdio wrapper over rag.mjs — no direct DB access here.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAG = path.join(HERE, "rag.mjs");

function run(args) {
    return new Promise(resolve => {
        execFile(process.execPath, [RAG, ...args], { timeout: 60000 },
            (err, stdout, stderr) => resolve({ ok: !err, out: stdout || stderr || String(err) }));
    });
}

const server = new Server(
    { name: "claudemax-rag", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "rag_query",
            description: "Semantic search over the CLAUDEMAX knowledge base (V.A.U.L.T notes indexed in PGVector). Returns matching chunks with source, heading and score.",
            inputSchema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Natural-language question (Spanish or English)" },
                    project: { type: "string", description: "Optional project filter (folder name under Projects/)" },
                    topk: { type: "number", description: "Max results, default 5" }
                },
                required: ["query"]
            }
        },
        {
            name: "rag_status",
            description: "RAG health: DB/Ollama connectivity and chunk counts per project.",
            inputSchema: { type: "object", properties: {} }
        }
    ]
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
    const { name, arguments: a = {} } = req.params;
    let res;
    if (name === "rag_query") {
        const args = ["query", a.query, "--json"];
        if (a.project) args.push("--project", a.project);
        if (a.topk) args.push("--topk", String(a.topk));
        res = await run(args);
    } else if (name === "rag_status") {
        res = await run(["status"]);
    } else {
        return { content: [{ type: "text", text: `unknown tool ${name}` }], isError: true };
    }
    return { content: [{ type: "text", text: res.out }], isError: !res.ok };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Syntax check**

```bash
node --check templates/rag/mcp-server.mjs
```

Expected: exit 0. (Runtime import of the SDK only works after `npm install` at the deployed location — Task 6 covers that; do not `npm install` inside `templates/`.)

- [ ] **Step 3: Commit**

```bash
git add templates/rag/mcp-server.mjs
git commit -m "feat(rag): add MCP stdio wrapper"
```

---

### Task 5: Installer component `rag`

**Files:**
- Create: `bin/components/rag.sh`
- Modify: `install.sh` (ALL_COMPONENTS, component_run case, usage/help, final message), `uninstall.sh`

- [ ] **Step 1: Write bin/components/rag.sh**

```bash
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
```

- [ ] **Step 2: Wire install.sh**

- `ALL_COMPONENTS=(rtk caveman figma ui-ux dev-skills)` → `ALL_COMPONENTS=(rtk caveman figma ui-ux dev-skills rag)`
- Add case to `component_run()`:

```bash
        rag)
            . "$AC_REPO_DIR/bin/components/rag.sh"
            ac_component_rag
            ;;
```

- Usage heredoc: add under Flags examples:

```
  RAG env flags (component 'rag'):
    RAG_ROOT=<path>            workspace root (required for rag)
    VAULT_MODE=create|import|connect   RAG_MODE=create|import|connect
    VAULT_SRC / VAULT_REMOTE / RAG_DUMP / RAG_REMOTE_URL per mode
```

- Final "Try the commands" heredoc: add line `       /mcp → rag            — semantic search over your V.A.U.L.T (rag_query)`.

- [ ] **Step 3: Wire uninstall.sh**

After the Figma MCP block add:

```bash
# --- RAG (MCP + container; data volume and folders are preserved)
ac_step "RAG (MCP registration + container)"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove rag 2>/dev/null || true
fi
if docker info >/dev/null 2>&1 && docker ps -a --format '{{.Names}}' | grep -q '^claudemax-ragdb$'; then
    ac_run docker stop claudemax-ragdb
    ac_run docker rm claudemax-ragdb
    ac_info "ragdb container removed. Data volume 'ragdata' and V.A.U.L.T/R.A.G folders left in place."
fi
```

- [ ] **Step 4: Verify**

```bash
bash -n install.sh && bash -n uninstall.sh && bash -n bin/components/rag.sh && echo SYNTAX-OK
bash install.sh --dry-run --all                      # rag step prints "RAG_ROOT not set — skipping" warning, exit 0
RAG_ROOT=/tmp/cm-root bash install.sh --dry-run --only rag   # prints vault create + template copies + compose/npm dims
bash uninstall.sh --dry-run                          # includes RAG step
```

Expected: all exit 0 with the outputs noted. (Docker/Ollama probes inside dry-run must not fail the run when daemons are absent.)

- [ ] **Step 5: Commit**

```bash
git add bin/components/rag.sh install.sh uninstall.sh
git commit -m "feat(installer): add rag component (vault+pgvector+mcp)"
```

---

### Task 6: End-to-end verification + docs

**Files:**
- Modify: `README.md`, `INSTALL.md`

- [ ] **Step 1: Probe daemons**

```bash
docker info >/dev/null 2>&1 && echo DOCKER-UP || echo DOCKER-DOWN
curl -s http://localhost:11434/api/tags >/dev/null && echo OLLAMA-UP || echo OLLAMA-DOWN
```

If either is DOWN: skip Steps 2–3, note it in the report (docs still get updated), and the human runs the E2E later.

- [ ] **Step 2 (daemons up): Real install to a temp root**

```bash
RAG_ROOT=/tmp/cm-root VAULT_MODE=create RAG_MODE=create \
  bash install.sh --only rag --config-dir /tmp/cm-cfg
ls /tmp/cm-root/V.A.U.L.T /tmp/cm-root/R.A.G
```

Expected: vault tree + R.A.G files present; compose container `claudemax-ragdb` healthy; `bge-m3` pulled; `npm install` done.

- [ ] **Step 3 (daemons up): Spanish E2E**

```bash
mkdir -p /tmp/cm-root/V.A.U.L.T/Projects/demo
cat > /tmp/cm-root/V.A.U.L.T/Projects/demo/nota.md <<'EOF'
# Decisiones del proyecto demo
El modelo de embeddings elegido es bge-m3 porque el vault está en español.
## Base de datos
Usamos PostgreSQL con la extensión pgvector en Docker, puerto 5433.
EOF
cd /tmp/cm-root/R.A.G
node rag.mjs init
node rag.mjs ingest
node rag.mjs status                       # expect: chunks > 0, project 'demo'
node rag.mjs query "¿qué base de datos usa el proyecto?" --topk 2
```

Expected: query top result is the "Base de datos" chunk. Then cleanup:

```bash
docker compose -f /tmp/cm-root/R.A.G/docker-compose.yml down -v
rm -rf /tmp/cm-root /tmp/cm-cfg
claude mcp remove rag 2>/dev/null || true
```

- [ ] **Step 4: Docs**

README.md: add a `rag` row to the components table ("V.A.U.L.T vault + PGVector RAG + bge-m3 + rag MCP — first-party") and a short "RAG quickstart" block (the env-flag one-liner from Task 5 Step 2's dry-run, plus `rag.mjs` commands). INSTALL.md: add `templates/` and `bin/components/rag.sh` to the layout tree, a "Where things land" row (`<RAG_ROOT>/V.A.U.L.T`, `<RAG_ROOT>/R.A.G`, MCP `rag` at user scope, docker volume `ragdata` — uninstall removes container+MCP only), and a troubleshooting entry: "Docker not running / ollama missing → component warns and skips; re-run `--only rag` after starting them."

- [ ] **Step 5: Commit**

```bash
git add README.md INSTALL.md
git commit -m "docs: add rag component"
```
