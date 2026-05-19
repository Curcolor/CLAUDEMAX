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
| **DCP (opencode)** | Real Dynamic Context Pruning plugin — installed only if `opencode` is on PATH. | [Opencode-DCP](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning) |
| **dcp-lite (Claude Code)** | Skill + PostToolUse hook that simulates DCP's `/dcp-compress`, dedupe, and error-purge behaviors as far as Claude Code's extension points allow. | first-party (this repo) |
| **repo-map skill** | `/repomap` builds a compact `.claude/repo-map.md` (tree + symbols) for the cwd. Pure Node, no deps. | first-party (this repo) |
| **Figma MCP** | Remote MCP server at `https://mcp.figma.com/mcp`, registered with Claude Code. OAuth is browser-based and manual. | [Figma docs](https://developers.figma.com/docs/figma-mcp-server/) |
| **ui-ux-pro-max skill** | Cloned into `~/.claude/skills/ui-ux-pro-max/` so it tracks upstream. | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |
| **21st.dev magic MCP** | Live component generator from [21st.dev](https://21st.dev). | `@21st-dev/magic` (npx) |
| **Framer Motion + GSAP** | `npm install --save framer-motion gsap` in your project (skipped if no `package.json`). | [framer-motion](https://www.npmjs.com/package/framer-motion), [GSAP](https://gsap.com/docs/v3/) |
| **superpowers skill** | Cloned into `~/.claude/skills/superpowers/`. Meta-skill bundle. | [obra/superpowers](https://github.com/obra/superpowers) |
| **Engineering-discipline skills** | First-party: `solid`, `design-patterns`, `conventional-commits`, `architecture-patterns`. | this repo |

## Install

```bash
# From a clone of this repo:
bash install.sh

# Or, once published, one-liner:
curl -fsSL https://raw.githubusercontent.com/<owner>/ABSOLUTE-CLAUDE/main/install.sh | bash
```

Re-runnable. Idempotent. Pass `--dry-run` to see exactly what would happen.

## Flags

| Flag | Effect |
|---|---|
| `--all` | Install every component (default). |
| `--only <id>` | One component only. Repeatable. ids: `rtk`, `caveman`, `dcp`, `repo-map`, `figma`, `ui-ux`, `dev-skills`. |
| `--skip <id>` | Skip a component. Repeatable. |
| `--no-npm` | Skip `npm install framer-motion gsap`. |
| `--with-npm` | Force the npm step even if no `package.json` (runs `npm init -y`). |
| `--dry-run` | Print every command. Touches nothing. |
| `--force` | Reinstall components that detect themselves as already installed. |
| `--config-dir <path>` | Override `$CLAUDE_CONFIG_DIR` (default `~/.claude`). |
| `--uninstall` | Shell out to `uninstall.sh`. |
| `--no-color` | Disable ANSI colors. |

## After install

1. **Restart Claude Code** — hooks and skills load at session start.
2. **Finish Figma OAuth**: open Claude Code, run `/mcp`, select `figma`, complete the browser flow. ABSOLUTE-CLAUDE stores no Figma tokens.
3. Try the commands:
   - `/caveman` — terse mode on.
   - `/repomap` — builds `.claude/repo-map.md` for the current project.
   - `/dcp-compress test failures` — focused compression message.
   - `/dcp-context` — current-session pruning stats.
   - `/superpowers`, `/solid`, `/design-patterns`, `/conventional-commits`, `/architecture-patterns` — engineering-discipline skills.

## About `dcp-lite` (the honest part)

Real [DCP](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning) is an opencode plugin. It rewrites request payloads before they reach the model — that's how it actually frees tokens. Claude Code does not expose an equivalent plugin hook. So we ship two things:

- **`dcp-lite` skill** (always installed): skill + PostToolUse hook that *marks* duplicate / errored tool outputs as stale via `<system-reminder>` injections, and gives you `/dcp-compress` for focused summaries. It can guide the model, but it cannot delete tokens already in the window.
- **Real DCP plugin** (installed if `opencode` is detected): the genuine article, for opencode users.

For actual token pruning on Claude Code, lean on Caveman's `caveman-shrink` MCP middleware (auto-installed) plus Claude Code's native `/compact`. The `dcp-lite` skill is the UX bridge for users who already know DCP's commands.

## Uninstall

```bash
bash uninstall.sh
```

Symmetric teardown. Leaves per-repo files (`.claude/repo-map.md`, Caveman's rule files written with `--with-init`, `framer-motion`/`gsap` in your project's `node_modules`) for you to delete by hand.

## Privacy

No telemetry. The installer makes no analytics calls. It does shell out to:

- `rtk-ai/rtk`'s install script (downloads the rtk binary from GitHub releases).
- `npx -y github:JuliusBrussee/caveman` (Caveman's installer fetches from GitHub and npm).
- `claude mcp add` (Anthropic CLI).
- `git clone` for the ui-ux-pro-max skill.
- `npm install framer-motion gsap` in your cwd (only if a `package.json` exists or `--with-npm` is passed).

See `bin/components/*.sh` for every command line.

## Scope (what this is and isn't)

- ✅ Single bash installer, macOS / Linux / WSL / Git Bash.
- ✅ Idempotent, dry-runnable, surgical uninstall.
- ❌ No native Windows PowerShell installer (use WSL or Git Bash).
- ❌ No fork of real DCP for Claude Code. `dcp-lite` is a skill, not a port.
- ❌ No Figma token storage. OAuth stays browser-based.

---

Issues / PRs welcome.
