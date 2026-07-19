# ABSOLUTE-CLAUDE

One bash command. Every token-saver and UX/UI skill for Claude Code, wired and ready. Figma OAuth is the only manual step.

```bash
bash install.sh
```

## What's inside

| Component | What it does | Source |
|---|---|---|
| **RTK** | Rust proxy CLI that filters and compresses shell-command output before it hits the LLM. Wires a Claude Code hook. | [rtk-ai/rtk](https://github.com/rtk-ai/rtk) |
| **Caveman** | Terse-mode plugin, statusline badge, `caveman-shrink` MCP middleware, multi-agent fan-out. | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) |
| **Figma MCP** | Remote MCP server at `https://mcp.figma.com/mcp`, registered with Claude Code. OAuth is browser-based and manual. | [Figma docs](https://developers.figma.com/docs/figma-mcp-server/) |
| **ui-ux-pro-max skill** | First-party UI/UX design-intelligence skill — 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks. Consolidates what used to be separate `frontend-design`, `brand-guidelines`, and `taste` skills, plus motion guidance (Framer Motion, GSAP). Shipped in this repo; no upstream repo to auto-update from. | first-party (this repo) |
| **21st.dev magic MCP** | Live component generator from [21st.dev](https://21st.dev). | `@21st-dev/magic` (npx) |
| **Framer Motion + GSAP** | `npm install --save framer-motion gsap` in your project (skipped if no `package.json`). | [framer-motion](https://www.npmjs.com/package/framer-motion), [GSAP](https://gsap.com/docs/v3/) |
| **superpowers skill** | Cloned into `~/.claude/skills/superpowers/`. Meta-skill bundle. | [obra/superpowers](https://github.com/obra/superpowers) |
| **Engineering-discipline skills** | First-party: `architecture-principles` (merges the former `solid`, `design-patterns`, and `architecture-patterns` skills into one SOLID → GoF patterns → system-architecture skill) and `conventional-commits`. | this repo |

## Install

```bash
# From a clone of this repo:
bash install.sh

# Or, once published, one-liner:
curl -fsSL https://raw.githubusercontent.com/Curcolor/CLAUDEMAX/main/install.sh | bash
```

Re-runnable. Idempotent. Pass `--dry-run` to see exactly what would happen.

## Flags

| Flag | Effect |
|---|---|
| `--all` | Install every component (default). |
| `--only <id>` | One component only. Repeatable. ids: `rtk`, `caveman`, `figma`, `ui-ux`, `dev-skills`. |
| `--skip <id>` | Skip a component. Repeatable. |
| `--no-npm` | Skip `npm install framer-motion gsap`. |
| `--with-npm` | Force the npm step even if no `package.json` (runs `npm init -y`). |
| `--dry-run` | Print every command. Touches nothing. |
| `--force` | Reinstall components that detect themselves as already installed. |
| `--config-dir <path>` | Override `$CLAUDE_CONFIG_DIR` (default `~/.claude`). |
| `--uninstall` | Shell out to `uninstall.sh`. |
| `--no-color` | Disable ANSI colors. |

## After install

Only two things left, and one of them is just restarting your editor:

1. **Restart Claude Code** — hooks and skills load at session start.
2. **Finish Figma OAuth**: open Claude Code, run `/mcp`, select `figma`, complete the browser flow. ABSOLUTE-CLAUDE stores no Figma tokens. (This is the only step we can't automate — OAuth requires a browser.)
3. Try the commands:
   - `/caveman` — terse mode on.
   - `/superpowers` — meta-skill bundle (obra/superpowers).
   - `architecture-principles`, `conventional-commits` — engineering-discipline skills. Invoke by name or let their triggers fire automatically during a review/refactor/commit.
   - `ui-ux-pro-max` — UI/UX design intelligence. Triggers automatically on design/build/review prompts touching UI, or ask for it by name.

## Skills 2.0 format

Every first-party skill in `skills/<name>/` ships three files:

    skills/<name>/
    ├── SKILL.md      # frontmatter (name, description) for Claude Code discovery + prose body
    ├── skill.yaml    # structured config: version, kind (knowledge|tool), triggers,
    │                 # commands, scripts, dependencies, schema pointer
    └── schema.json   # JSON Schema (draft 2020-12) with definitions.inputs / definitions.outputs

Claude Code only enforces the SKILL.md frontmatter; the sidecars are a repo convention
the model reads on invocation and that tooling consumes as machine-readable artifacts.
Validate the whole tree with:

    node skills/validate-skills.mjs

## Uninstall

```bash
bash uninstall.sh
```

Symmetric teardown. Leaves per-repo files (Caveman's rule files written with `--with-init`, `framer-motion`/`gsap` in your project's `node_modules`) for you to delete by hand.

## Privacy

No telemetry. The installer makes no analytics calls. It does shell out to:

- `rtk-ai/rtk`'s install script (downloads the rtk binary from GitHub releases).
- `npx -y github:JuliusBrussee/caveman` (Caveman's installer fetches from GitHub and npm).
- `claude mcp add` (Anthropic CLI) for the Figma and 21st.dev magic MCP registrations.
- `git clone` for the superpowers skill (`obra/superpowers`). The other first-party skills (`architecture-principles`, `conventional-commits`, `ui-ux-pro-max`) are copied straight out of this repo — no network call.
- `npm install framer-motion gsap` in your cwd (only if a `package.json` exists or `--with-npm` is passed).

See `bin/components/*.sh` for every command line.

## Scope (what this is and isn't)

- ✅ Single bash installer, macOS / Linux / WSL / **Git Bash on Windows**.
- ✅ Windows-native: RTK ships an `rtk.exe` binary which the installer downloads automatically when it detects MINGW/MSYS/Cygwin. MCPs (`figma`, `magic`) register at user scope so they work in every project.
- ✅ Idempotent, dry-runnable, surgical uninstall.
- ❌ No native Windows PowerShell installer (use Git Bash — already shipped with Git for Windows).
- ❌ No Figma token storage. OAuth stays browser-based — this is the only manual step.

---

Issues / PRs welcome.
