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
│       ├── figma-mcp.sh        # `claude mcp add --transport http figma ...`
│       ├── ui-ux.sh            # copies skills/ui-ux-pro-max + registers magic MCP + npm i
│       └── dev-skills.sh       # superpowers clone + 2 first-party engineering skills
└── skills/
    ├── architecture-principles/
    │   ├── SKILL.md
    │   ├── skill.yaml
    │   └── schema.json
    ├── conventional-commits/
    │   ├── SKILL.md
    │   ├── skill.yaml
    │   └── schema.json
    ├── ui-ux-pro-max/
    │   ├── SKILL.md
    │   ├── skill.yaml
    │   ├── schema.json
    │   ├── data/            # CSVs: styles, colors, typography, ux-guidelines, per-stack, ...
    │   └── scripts/         # core.py, design_system.py, search.py
    └── validate-skills.mjs  # Skills 2.0 contract checker — run after any skill edit
```

## Where things land on your machine

| Path | Written by | Removed by `uninstall.sh`? |
|---|---|---|
| `$HOME/.local/bin/rtk` | RTK installer (upstream) | Yes |
| `$CLAUDE_CONFIG_DIR/settings.json` (hook entries) | Caveman, rtk init | Caveman entries by Caveman; rtk entries by us |
| `$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max/` | ui-ux.sh (`cp -R` from this repo) | Yes |
| `$CLAUDE_CONFIG_DIR/skills/superpowers/` | dev-skills.sh (`git clone`) | Yes |
| `$CLAUDE_CONFIG_DIR/skills/{architecture-principles,conventional-commits}/` | dev-skills.sh (`cp -R` from this repo) | Yes |
| `$CLAUDE_CONFIG_DIR/.caveman-active` | Caveman | Caveman handles |
| Claude MCP registry: `figma`, `magic`, `caveman-shrink` | figma-mcp.sh, ui-ux.sh, Caveman | Yes for figma + magic; Caveman handles its own |
| `<cwd>/package.json`, `<cwd>/node_modules/` | ui-ux.sh `npm install` | **No** — we don't touch your project's deps on uninstall |

`uninstall.sh` also best-effort removes a handful of legacy paths from older ABSOLUTE-CLAUDE installs (`skills/repo-map/`, `skills/dcp-lite/`, `hooks/dcp-lite-dedup.mjs`, `state/dcp-lite-*.json`, and the pre-2.0 skill names `solid`, `design-patterns`, `architecture-patterns`) so upgrading in place leaves nothing behind. None of those components are installed by current `install.sh`.

## Component install order (and why)

1. **rtk** — independent binary; install first so subsequent steps can verify PATH.
   - On macOS/Linux: runs the upstream `curl | sh` installer.
   - On Windows (MinGW/MSYS/Cygwin via Git Bash): downloads `rtk-x86_64-pc-windows-msvc.zip` from the latest GitHub release and extracts `rtk.exe` to `~/.local/bin/`. Tries `unzip`, then `powershell.exe Expand-Archive`, then `python -m zipfile` until one works.
   - The PreToolUse/Bash hook (`rtk hook claude`) is written directly into `~/.claude/settings.json` via our JSONC merger — we do not depend on `rtk init -g`'s interactive y/N prompt, which defaults to `N` in non-interactive shells.
2. **caveman** — wires hooks, statusline, `caveman-shrink` MCP. Idempotent. The `caveman-shrink` MCP registers at project scope (Caveman's own installer manages this).
3. **figma** — needs `claude` CLI; registers at **user scope** (`claude mcp add -s user`) so it works in every project.
4. **ui-ux** — also needs `claude` for the magic MCP (also registered at **user scope**); mutates cwd via `npm install` (gated).
5. **dev-skills** — pure file copy for `architecture-principles` / `conventional-commits`; `git clone`/`git pull` for `superpowers`. No order dependency on the others.

## Flag interactions

- `--dry-run` is honored by every component **and** is forwarded to Caveman's own `--dry-run`. RTK's upstream installer does not support dry-run; we print the curl command instead and skip it.
- `--force` does not blanket-reinstall — each component decides what "force" means for itself (rtk: re-pipe installer; Caveman: pass `--force`; Figma/magic: `mcp remove` then `mcp add`; ui-ux skill copy: `rm -rf` + `cp -R`; superpowers clone: `rm -rf` + re-clone instead of `git pull`).
- `--no-npm` only affects the framer-motion/gsap step in `ui-ux`. It does **not** suppress `npx`-based steps (`caveman`, `magic` MCP) — those use the npm registry but don't mutate your project.
- `--config-dir` propagates to Caveman (via Caveman's own `--config-dir`) and to where `dev-skills`/`ui-ux` copy skill directories. RTK and the Figma/magic MCP registrations don't take a config-dir override — they use the `claude` CLI's defaults.

## Troubleshooting

### "Preflight says I'm missing node, but `node --version` works in my shell"

`install.sh` runs `command -v node`. If your node is shimmed by a version manager that only loads in interactive shells (nvm, asdf), it won't be visible to a script. Source the version manager first, or symlink the node binary into `/usr/local/bin/` or `~/.local/bin/`.

### "`claude mcp add figma ...` failed with 'unknown command'"

Claude Code versions before MCP support don't have `claude mcp`. Upgrade Claude Code. Verify with `claude --version` (need a recent build).

### "Figma MCP shows in `/mcp` but never authenticates"

OAuth requires a default browser. If you're on a headless server, run the OAuth flow on a desktop machine signed into the same Claude account; the token syncs.

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

### "Re-running the installer keeps re-cloning superpowers"

If `--force` is set, `dev-skills.sh` deletes and re-clones. Without `--force`, it does `git pull --ff-only` in the existing checkout. If the pull is failing repeatedly, your local clone has diverged — `rm -rf $CLAUDE_CONFIG_DIR/skills/superpowers` then re-run.

### "`node skills/validate-skills.mjs` fails after I edited a skill"

Every skill under `skills/<name>/` needs all three files (`SKILL.md`, `skill.yaml`, `schema.json`), the `name` field in `SKILL.md` frontmatter and `skill.yaml` must match the directory name, `skill.yaml` needs a non-empty `triggers` list and a `kind` of `knowledge` or `tool`, and `schema.json` needs `definitions.inputs` / `definitions.outputs`. The validator prints exactly which check failed per skill.

## Manual install (no installer)

Every step `install.sh` runs is just a public command. If you'd rather audit and run them yourself, read `bin/components/*.sh` — each file is ~50 lines and self-contained.
