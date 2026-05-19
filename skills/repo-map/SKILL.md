---
name: repo-map
description: Build or refresh a compact project map at .claude/repo-map.md (directory tree + exported symbols). Trigger when the user says "map the repo", "build repo map", "refresh repo map", or runs /repomap.
---

# repo-map

Generates a token-efficient project map for the current working directory and saves it at `.claude/repo-map.md` in that project. Use this when context is tight, when starting work in an unfamiliar repo, or when the user explicitly asks for a repo map.

## When to use this skill

- User asks to "map", "scan", "index", or "summarize" the repository structure.
- User runs the slash command `/repomap`.
- You're about to do exploration work in a large repo and want a cheap orientation pass.

## What to do

Run the bundled builder script. It walks the cwd (honoring `.gitignore`), produces a directory tree (depth-limited) plus a regex-extracted symbol table for JS/TS/Python/Go/Rust files, and writes the result to `.claude/repo-map.md` in the cwd.

```bash
node "$CLAUDE_CONFIG_DIR/skills/repo-map/build-map.mjs"
```

If `$CLAUDE_CONFIG_DIR` is not set, fall back to `~/.claude`:

```bash
node "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/repo-map/build-map.mjs"
```

Options the script accepts (positional or `--flag=value`):

- `--depth=N` — max tree depth (default 4)
- `--max-files=N` — cap on total files scanned (default 2000)
- `--out=PATH` — output file (default `.claude/repo-map.md`)

After running, read the produced file and use it as your orientation. Do NOT paste the whole file back to the user unless they asked — instead summarize the top-level layout and the 3-5 most important entry points.

## Slash command

The `/repomap` slash command invokes this skill directly. The optional first argument is the depth (e.g. `/repomap 3`).
