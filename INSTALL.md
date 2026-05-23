# INSTALL.md — long-form install / layout / troubleshooting

For the short version, see [README.md](README.md). This document covers the file layout, what each component actually mutates on disk, and what to do when something breaks.

## Layout

```
ABSOLUTE-CLAUDE/
├── install.sh                  # entrypoint
├── uninstall.sh                # symmetric teardown
├── README.md                   # short version
├── INSTALL.md                  # this file
├── bin/
│   ├── lib/
│   │   ├── log.sh              # info/warn/error/dim/run-or-dry helpers
│   │   ├── detect.sh           # presence checks for curl/git/node/npm/claude/opencode
│   │   ├── claude-config.sh    # resolves $CLAUDE_CONFIG_DIR (default ~/.claude)
│   │   └── jsonc.sh            # JSONC-tolerant merge/remove for settings.json hooks
│   └── components/
│       ├── rtk.sh              # pipes rtk install + `rtk init --global`
│       ├── caveman.sh          # `npx -y github:JuliusBrussee/caveman -- --all`
│       ├── dcp.sh              # installs dcp-lite skill+hook; real DCP if opencode present
│       ├── repo-map.sh         # copies skills/repo-map → $CLAUDE_CONFIG_DIR/skills/
│       ├── figma-mcp.sh        # `claude mcp add --transport http figma ...`
│       ├── ui-ux.sh            # clone ui-ux-pro-max + register magic MCP + npm i
│       └── dev-skills.sh       # superpowers clone + 4 first-party engineering skills
├── skills/
│   ├── repo-map/
│   │   ├── SKILL.md
│   │   └── build-map.mjs
│   ├── dcp-lite/
│   │   ├── SKILL.md
│   │   └── dcp-lite.mjs
│   ├── solid/SKILL.md
│   ├── design-patterns/SKILL.md
│   ├── conventional-commits/SKILL.md
│   └── architecture-patterns/SKILL.md
└── hooks/
    └── dcp-lite-dedup.mjs      # PostToolUse hook for dcp-lite
```

## Where things land on your machine

| Path | Written by | Removed by `uninstall.sh`? |
|---|---|---|
| `$HOME/.local/bin/rtk` | RTK installer (upstream) | Yes |
| `$CLAUDE_CONFIG_DIR/settings.json` (hook entries) | Caveman, rtk init, dcp.sh | Caveman entries by Caveman; dcp-lite entry by us; rtk entries left alone |
| `$CLAUDE_CONFIG_DIR/hooks/*` | Caveman, dcp.sh | Caveman cleans its own; we remove `dcp-lite-dedup.mjs` |
| `$CLAUDE_CONFIG_DIR/skills/repo-map/` | repo-map.sh | Yes |
| `$CLAUDE_CONFIG_DIR/skills/dcp-lite/` | dcp.sh | Yes |
| `$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max/` | ui-ux.sh (`git clone`) | Yes |
| `$CLAUDE_CONFIG_DIR/skills/superpowers/` | dev-skills.sh (`git clone`) | Yes |
| `$CLAUDE_CONFIG_DIR/skills/{solid,design-patterns,conventional-commits,architecture-patterns}/` | dev-skills.sh (copy) | Yes |
| `$CLAUDE_CONFIG_DIR/state/dcp-lite-*.json` | dcp-lite hook at runtime | Yes |
| `$CLAUDE_CONFIG_DIR/.caveman-active` | Caveman | Caveman handles |
| Claude MCP registry: `figma`, `magic`, `caveman-shrink` | figma-mcp.sh, ui-ux.sh, Caveman | Yes for figma + magic; Caveman handles its own |
| `<cwd>/package.json`, `<cwd>/node_modules/` | ui-ux.sh `npm install` | **No** — we don't touch your project's deps on uninstall |
| `<cwd>/.claude/repo-map.md` | repo-map skill at runtime | **No** — left for you |
| opencode plugin: `@tarquinen/opencode-dcp` | dcp.sh (only if opencode present) | Best-effort via `opencode plugin uninstall` |

## Component install order (and why)

1. **rtk** — independent binary; install first so subsequent steps can verify PATH.
   - On macOS/Linux: runs the upstream `curl | sh` installer.
   - On Windows (MinGW/MSYS/Cygwin via Git Bash): downloads `rtk-x86_64-pc-windows-msvc.zip` from the latest GitHub release and extracts `rtk.exe` to `~/.local/bin/`. Tries `unzip`, then `powershell.exe Expand-Archive`, then `python -m zipfile` until one works.
   - The PreToolUse/Bash hook (`rtk hook claude`) is written directly into `~/.claude/settings.json` via our JSONC merger — we do not depend on `rtk init -g`'s interactive y/N prompt, which defaults to `N` in non-interactive shells.
2. **caveman** — wires hooks, statusline, `caveman-shrink` MCP. Idempotent. The `caveman-shrink` MCP registers at project scope (Caveman's own installer manages this).
3. **dcp** — needs `$CLAUDE_CONFIG_DIR/settings.json` to exist; Caveman's earlier merge ensures it does.
4. **repo-map** — pure file copy; no order dependency.
5. **figma** — needs `claude` CLI; registers at **user scope** (`claude mcp add -s user`) so it works in every project.
6. **ui-ux** — also needs `claude` for the magic MCP (also registered at **user scope**); mutates cwd via `npm install` (gated).

## Flag interactions

- `--dry-run` is honored by every component **and** is forwarded to Caveman's own `--dry-run`. RTK's upstream installer does not support dry-run; we print the curl command instead and skip it.
- `--force` does not blanket-reinstall — each component decides what "force" means for itself (rtk: re-pipe installer; Caveman: pass `--force`; Figma/magic: `mcp remove` then `mcp add`; ui-ux clone: `rm -rf` + clone).
- `--no-npm` only affects the framer-motion/gsap step in `ui-ux`. It does **not** suppress `npx`-based steps (`caveman`, `magic` MCP) — those use the npm registry but don't mutate your project.
- `--config-dir` propagates to dcp-lite, repo-map, and Caveman (via Caveman's own `--config-dir`). RTK and the Figma/magic MCP registrations don't take a config-dir override — they use the `claude` CLI's defaults.

## Troubleshooting

### "Preflight says I'm missing node, but `node --version` works in my shell"

`install.sh` runs `command -v node`. If your node is shimmed by a version manager that only loads in interactive shells (nvm, asdf), it won't be visible to a script. Source the version manager first, or symlink the node binary into `/usr/local/bin/` or `~/.local/bin/`.

### "`claude mcp add figma ...` failed with 'unknown command'"

Claude Code versions before MCP support don't have `claude mcp`. Upgrade Claude Code. Verify with `claude --version` (need a recent build).

### "Figma MCP shows in `/mcp` but never authenticates"

OAuth requires a default browser. If you're on a headless server, run the OAuth flow on a desktop machine signed into the same Claude account; the token syncs.

### "`/dcp-compress` does nothing"

`dcp-lite` is a skill, not a hook that auto-fires. The model has to invoke it. Try a more explicit prompt: "Use the dcp-lite skill to compress the tool outputs since my last message, focused on test failures."

### "The PostToolUse hook is spamming `<system-reminder>` lines"

The hook only emits when it detects a duplicate or stale-error pattern. If you're seeing them constantly, you probably have a loop. Run `/dcp-context` to inspect, and `/dcp-stats` for cumulative numbers. To reset: `node $CLAUDE_CONFIG_DIR/skills/dcp-lite/dcp-lite.mjs reset`.

### "My `settings.json` got mangled"

`bin/lib/jsonc.sh` writes a `.bak` next to `settings.json` before every merge. Restore with:

```bash
cp ~/.claude/settings.json.bak ~/.claude/settings.json
```

Open an issue with the broken file (redacted) — the JSONC merger surviving but breaking Claude Code is a bug worth fixing.

### "I want to skip RTK because I'm on a managed env that blocks `$HOME/.local/bin`"

```bash
bash install.sh --skip rtk
```

Everything else still installs.

### "I want only the UI/UX bits, not the token-savers"

```bash
bash install.sh --only figma --only ui-ux
```

### "Re-running the installer keeps re-cloning ui-ux-pro-max"

If `--force` is set, ui-ux.sh deletes and re-clones. Without `--force`, it does `git pull --ff-only` in the existing checkout. If the pull is failing repeatedly, your local clone has diverged — `rm -rf $CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max` then re-run.

## Manual install (no installer)

Every step `install.sh` runs is just a public command. If you'd rather audit and run them yourself, read `bin/components/*.sh` — each file is ~50 lines and self-contained.
