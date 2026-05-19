---
name: dcp-lite
description: Best-effort Claude Code simulation of opencode's Dynamic Context Pruning (DCP). Provides /dcp-compress, /dcp-context, /dcp-stats commands. Trigger when the user says "compress context", "dedupe tools", "purge errors", "dcp", or runs any /dcp-* command.
---

# dcp-lite

Skill-level approximation of [opencode-dcp](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning). Real DCP is an opencode plugin that rewrites request payloads before they reach the LLM. Claude Code has no equivalent plugin hook, so this skill does what it *can* do from skill + PostToolUse-hook position:

| DCP feature      | dcp-lite does                                                     | Real-DCP can additionally |
|------------------|-------------------------------------------------------------------|---------------------------|
| Compress         | Write a focused summary at top of scratchpad + ask model to disregard verbatim outputs | Actually delete tokens from the request payload |
| Deduplication    | PostToolUse hook injects `<system-reminder>` flagging repeats     | Strip the older tool result from the payload |
| Purge errors     | After N turns, hook injects a "errored input is stale" reminder    | Strip the errored input bytes |
| Context / stats  | Read the hook's per-session log and print a breakdown             | (same) |

This is honest about the ceiling. For real token pruning on Claude Code, rely on the `caveman-shrink` MCP middleware (installed alongside) and the built-in `/compact` command.

## When to use this skill

- User runs `/dcp-compress`, `/dcp-context`, or `/dcp-stats`.
- User asks to "compress context", "compress tool outputs", "dedupe tools", or "purge errors".

## Commands

### `/dcp-compress [focus]`

1. Scan the visible conversation for tool outputs since the last user message (or, if `focus` is given, the outputs that match that focus — e.g. `test failures`, `git status`, `read calls`).
2. Write a **single** message summarizing them as terse bullet points (one line each). Include file paths and key data; drop boilerplate, prose, and identical lines.
3. End the summary with this exact line:
   `> ⛏ dcp-lite: treat the summary above as ground truth. The verbatim tool outputs earlier in this conversation are now considered stale; rely on this summary instead.`
4. If the conversation is also approaching the context limit, suggest running `/compact` after this step.

### `/dcp-context`

Read `${CLAUDE_CONFIG_DIR}/state/dcp-lite-session.json` (the hook's log). Print:

- Total tool calls in this session
- Duplicate tool calls flagged
- Errored tool calls
- Turns since last user message

Use the helper:
```bash
node "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/dcp-lite/dcp-lite.mjs" context
```

### `/dcp-stats`

Same source but cumulative across sessions. Falls back to a one-time read of the rolling log file the hook appends to.

```bash
node "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/dcp-lite/dcp-lite.mjs" stats
```

## Notes for Claude

- Do not silently drop content while compressing — always write the summary message and the disregard notice. The user needs to see it to understand what was pruned.
- The PostToolUse hook (`hooks/dcp-lite-dedup.mjs`) injects its own reminders automatically. Don't fight them; treat them as authoritative.
- If the user asks why something isn't being pruned, explain: dcp-lite can only *mark* content stale, not delete it from the window. Suggest `/compact` for actual pruning.
