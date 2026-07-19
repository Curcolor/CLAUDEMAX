# CLAUDEMAX — Master Upgrade Design Spec

**Date:** 2026-07-19
**Status:** Master design covering the full ABSOLUTE-CLAUDE → CLAUDEMAX upgrade. Sub-project A has its own approved spec ([2026-07-19-skills-2.0-migration-design.md](2026-07-19-skills-2.0-migration-design.md)); sub-projects B–E get their own detailed spec before implementation, using this document as the source of truth for scope and decisions.

## Vision

Evolve ABSOLUTE-CLAUDE into **CLAUDEMAX**: a context-aware, RAG-driven development environment. Knowledge lives in an Obsidian vault and a local vector database; sessions self-contextualize at startup; legacy context handlers (repo-map, dcp-lite, Context7, Claude-Mem) are deprecated in favor of the RAG brain; all first-party skills move to the Skills 2.0 format (YAML config + JSON Schema).

## Root workspace layout

**Naming:** this repo is renamed **CLAUDEMAX** (local folder + GitHub repository). The root workspace folder is **created automatically by the setup wizard at a location the user chooses** (default name: `WORKSPACE`). The wizard is the single entry point: a user needs only the installer to end up with everything below.

```
<chosen-root>/              # created by the wizard where the user picks (default: WORKSPACE)
├── V.A.U.L.T/              # Obsidian vault — STRICTLY markdown notes, nothing else
├── R.A.G/                  # vector DB + retrieval components (PGVector, Ollama, ingestion)
├── .claude/                # shared rules for sessions launched from the root
├── CLAUDEMAX-INSTALLER.cmd # setup wizard launcher (a file at the root, NOT a folder)
├── CLAUDEMAX-UNINSTALLER.cmd
├── <ProjectRepo1>/         # individual project code repositories
└── <ProjectRepo2>/
```

The CLAUDEMAX repo itself (wizard source, skills, components) lives wherever it was cloned — currently `Desktop\WORKSPACE\Herramientas\` — and the wizard self-bootstraps (clone-and-run, like the current `install.sh` curl-mode), so its location is irrelevant to end users.

- **V.A.U.L.T** is visually and logically divided by project using Obsidian color-coding (graph-view color groups keyed by project tag), with sub-colors for subtopics within each project (nested tags, e.g. `#proj-alpha/api`).
- **R.A.G** holds the vector infrastructure and ingestion/query scripts; never notes.
- **.claude/** at the root carries the base rules; the project-init ritual (sub-project D) propagates them into each new project repo's own `.claude/`.

## Sub-projects and order

| # | Sub-project | Status | Depends on |
|---|---|---|---|
| A | Skills 2.0 migration + pruning | Spec approved | — |
| B | CLAUDEMAX workspace + RAG stack | This master spec → own spec | — |
| C | Tooling integrations | This master spec → own spec | A (skill format), B (parsers feed RAG) |
| E | Operational rules | This master spec → own spec | — (cheap, can interleave) |
| D | Lifecycle rituals | This master spec → own spec | B, C (queries what they build) |

Implementation order: **A → B → C → E → D**.

## A — Skills 2.0 migration (approved, summarized)

See [dedicated spec](2026-07-19-skills-2.0-migration-design.md). Key outcomes:

- Format: SKILL.md (discovery) + `skill.yaml` + `schema.json` sidecars, `validate-skills.mjs` validator.
- Final inventory: `architecture-principles` (physical merge of solid + design-patterns + architecture-patterns), `conventional-commits`, `ui-ux-pro-max` (first-party fork consolidating Taste, Frontend Design, Webarticast, Brand Guidelines + motion section for transitions with Framer Motion + GSAP).
- Removed: `repo-map` (→ Graphify, sub-project C) and `dcp-lite` entirely (RAG brain takes over context/memory).
- Model policy already live in `~/.claude/CLAUDE.md`: subagent-driven Agent spawns use Sonnet 5; code reviews stay in-session on the current model (Fable 5 / Opus 4.8).

## B — Workspace + RAG stack

**Obsidian vault (V.A.U.L.T):**
- Markdown notes only. Folder-per-project, tag taxonomy `#<project>/<subtopic>`.
- Graph-view color groups: one base color per project, sub-colors per subtopic tag. Config committed as part of the vault (`.obsidian/graph.json`) so the scheme survives reinstalls.

**RAG (R.A.G):**
- **Embeddings:** local via Ollama (open-source model; candidate `nomic-embed-text` — final choice in sub-spec B after benchmarking on the user's hardware).
- **Vector store:** PostgreSQL + PGVector. Deployment mode (Docker container vs native Windows install) decided in sub-spec B.
- **Ingestion pipeline:** source file → parser (MarkItDown for standard files, `opendataloader-pdf` for PDFs, Whisper for audio) → markdown → chunk → embed (Ollama) → upsert into PGVector. Vault notes ingest directly (already markdown).
- **Query interface:** a retrieval entry point callable from Claude Code sessions (CLI script vs local MCP server — decided in sub-spec B; MCP preferred if SessionStart hooks can consume it cleanly).
- All R.A.G scripts follow the repo convention: dependency-free where possible, Node or Python, no cloud calls — fully local.

## C — Tooling integrations

New components installed by CLAUDEMAX-INSTALLER (each as an `ac_component_<id>` following existing installer architecture):

| Tool | Purpose | Source |
|---|---|---|
| **Graphify** (Understand-Anything) | Interactive codebase knowledge graphs; replaces repo-map; its output is read at SessionStart | github.com/Egonex-AI/Understand-Anything |
| **Cyber Neo** | OWASP 2025 / CWE Top 25 vulnerability scanning and security audits | github.com/Hainrixz/cyber-neo |
| **opendataloader-pdf** | PDF parsing (also feeds RAG ingestion) | github.com/opendataloader-project/opendataloader-pdf |
| **MarkItDown** | General file → markdown parsing (also feeds RAG ingestion) | Microsoft open source |
| **Whisper** | Audio transcription (also feeds RAG ingestion) | OpenAI open source, run locally |
| **Meta-dev skill** | Unified "Skill Creator + MCP Builder": creating Skills 2.0 and MCP servers as one workflow, in Skills 2.0 format | first-party, new |

Kept as-is: superpowers (obra/superpowers), Figma MCP (https://mcp.figma.com/mcp), 21st.dev Magic MCP (`npx -y @21st-dev/magic@latest`), RTK proxy (rtk-ai/rtk), Caveman.

Removed from the ecosystem: Context7 and Claude-Mem (conflict with the RAG brain; not present in this repo — sub-spec C includes an environment sweep to remove them from `~/.claude/` if found).

## D — Lifecycle rituals

All implemented as Claude Code hooks (registered in settings.json via the existing `ac_merge_hook` JSONC merger) plus CLAUDE.md rules where a hook cannot express the behavior:

| Ritual | Trigger | Behavior |
|---|---|---|
| **Session start** | SessionStart hook | Query the RAG for project context + read the latest Graphify output; inject both as session context |
| **New project init** | User creates a project (skill/command) | Generate `.claude/` inside the new repo: base rules (conventional-commits, model policy, operational rules) + project-specific context |
| **End of day (minor)** | User signals end of workday | Write a daily log/journal note into V.A.U.L.T. Do NOT trigger RAG re-index or Graphify rebuild (compute saving) |
| **End of cycle (major)** | User signals end of sprint/cycle | Prompt the user to run the **Context Dump Ritual**: permanently index all accumulated knowledge into the RAG and the vault; rebuild Graphify |

## E — Operational rules

Live in WORKSPACE root `.claude/` rules (propagated to projects by the init ritual) and, where enforceable, as hooks:

- **3-attempt loop breaker:** after 3 failed fix attempts on the same error, STOP; summarize context for the user and wait for manual input instead of burning tokens.
- **Git commits:** always strip any "Co-authored-by: Claude" footer from generated commits (rule + optional commit-msg hook for enforcement).
- **Token-saver / skill search:** whenever a new language, framework, or tactic enters the conversation (C#, .NET, WinUI 3, XAML, Python, …), pause and ask: "Would you like me to search/create a specific Skill 2.0 for this technology, or should we proceed without it to save tokens?" — including a brief warning about the trade-offs of skipping the skill.
- **Model policy:** subagent-driven Agent spawns use Sonnet 5; code reviews stay in-session on the current model (Fable 5 / Opus 4.8). Already applied to the user's `~/.claude/CLAUDE.md`, but the canonical copy MUST ship inside the CLAUDEMAX repo (rules templates installed by the wizard into the root `.claude/` and propagated to projects) — same for every rule in this section. The repo, not any personal config, is the source of truth.
- Legacy memory tooling (Context7 / Claude-Mem) must not be reinstalled; the RAG brain is the single source of context retention.

## Interactive installer (setup wizard)

The upgrade replaces the flag-driven `install.sh` UX with an **interactive, application-style setup wizard**:

- **Entry point:** launcher files placed at the chosen root (`CLAUDEMAX-INSTALLER.cmd` + `CLAUDEMAX-UNINSTALLER.cmd`) — files, not folders. They invoke the wizard shipped inside the CLAUDEMAX repo; the wizard also self-bootstraps for first-time users (download → clone → run).
- **Experience:** visual step-by-step flow like a desktop app installer — welcome screen, **destination picker** (the wizard creates the root folder wherever the user chooses, default name `WORKSPACE`), dependency checklist with live detected/missing status, per-component selection (install everything or piece by piece), progress per step, final summary. Recommended tech: Node TUI (dependency-free `readline`-based menus, repo convention) — final choice in the installer sub-spec.
- **Vault setup step:** the user picks one of three modes for V.A.U.L.T — **(1) create from scratch** (skeleton + Obsidian color config), **(2) import an existing vault** (point at a folder, wizard adopts it and applies the tag/color conventions non-destructively), or **(3) connect to a remote vault** (synced/Git-hosted vault: wizard clones/links it).
- **RAG setup step:** same three modes for R.A.G — **(1) create from scratch** (fresh PostgreSQL + PGVector schema, Ollama model pull), **(2) import existing** (restore a database dump / reuse an existing local instance), or **(3) connect to remote** (connection string to an existing PostgreSQL+PGVector server; embeddings stay local via Ollama or point at a remote Ollama endpoint).
- **System dependencies it detects and offers to install** (via `winget` on Windows): Obsidian, Docker Desktop (+ WSL2 if missing), Ollama, PostgreSQL + PGVector (or the Docker route), Git, Node.js, Python. Each is optional and individually skippable.
- **Then the CLAUDEMAX components:** everything from sub-projects A/C (skills, MCPs, RTK, Caveman, Graphify, Cyber Neo, parsers) plus root scaffolding: V.A.U.L.T skeleton with Obsidian color config, R.A.G skeleton, root `.claude/` rules, sub-project D hooks.
- **Internals preserved:** `bin/lib/*` helpers, `bin/components/*` with `ac_component_<id>` functions, JSONC settings merger with `.bak` backups. The wizard orchestrates these same components; non-interactive flags (`--all/--only/--skip/--dry-run/--force/--config-dir`) remain for scripted use.

## Open questions (inputs to sub-specs, not blockers for A)

1. **B:** embedding model final choice; PGVector via Docker vs native; RAG query interface (CLI vs local MCP server).
2. **Installer:** final wizard tech (dependency-free Node TUI recommended) and exact `winget` package ids per system dependency.
3. **C:** whether Graphify and Cyber Neo install as skills, MCP servers, or plain CLIs (depends on what upstream ships).
4. **D:** exact hook events for "end of day" / "end of cycle" signals (likely skill/slash-command triggered rather than automatic).
5. **Installer:** whether existing repos under `WORKSPACE\` move into `CLAUDEMAX/` or stay and get symlinked/referenced.

## Master verification

1. Each sub-project passes its own spec verification before the next starts.
2. End-to-end smoke after D: fresh run of the setup wizard (`CLAUDEMAX-INSTALLER.cmd`, full install) on a clean config dir → new session inside a project repo self-contextualizes (RAG query + Graphify) → end-of-day journal lands in V.A.U.L.T → Context Dump Ritual indexes into PGVector.
3. `CLAUDEMAX-UNINSTALLER.cmd` removes everything the wizard installed, including legacy artifacts (repo-map, dcp-lite, Context7/Claude-Mem remnants); system dependencies (Obsidian, Docker, WSL) are listed but left for manual removal.
