---
name: conventional-commits
description: Write commit messages and PR titles that follow the Conventional Commits 1.0.0 spec. Trigger when the user asks to commit, write a commit message, generate a changelog, or asks "what should this commit be?". Apply automatically whenever you are drafting a `git commit -m` message.
---

# Conventional Commits

Spec: <https://www.conventionalcommits.org/en/v1.0.0/>. Machine-parseable commit format that enables automated semver bumps, changelogs, and release notes.

## Format

```
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

- **`<type>`** — required, lowercase, from the allow-list below.
- **`[scope]`** — optional, parenthesized, lowercase noun (`feat(auth):`, `fix(api):`). Use the smallest area the change touches; skip if the change is global.
- **`!`** — append after type/scope when the change introduces a **breaking change**: `feat(api)!: drop /v1 endpoints`.
- **`<description>`** — imperative, lowercase, no period, ≤72 chars. *"add OAuth"* not *"Added OAuth."*.
- **`body`** — wraps at 72 chars. Explains *why*, not *what*. Separated from description by a blank line.
- **`footer(s)`** — one per line, `Token: value` shape. Reserved tokens: `BREAKING CHANGE:` (the canonical form, equivalent to `!`), `Refs:`, `Closes:`, `Co-authored-by:`.

## Type allow-list (used by most tooling)

| Type | When to use it | semver impact* |
|---|---|---|
| `feat` | New user-visible capability | MINOR |
| `fix` | Bug fix (user-visible behavior corrected) | PATCH |
| `docs` | Documentation only | none |
| `style` | Formatting, whitespace, semicolons; no logic change | none |
| `refactor` | Code change that neither adds a feature nor fixes a bug | none |
| `perf` | Performance improvement | PATCH (some teams: MINOR) |
| `test` | Add/adjust tests; no production code changed | none |
| `build` | Build system, packaging, dependencies (`package.json`, `Cargo.toml`) | none |
| `ci` | CI config (`.github/workflows`, `circle.yml`) | none |
| `chore` | Maintenance with no source or test impact (lockfile bump, cleanup) | none |
| `revert` | Reverts a previous commit | matches the reverted commit |

*Tooling like `semantic-release` derives versions from this. `!` or `BREAKING CHANGE:` forces a MAJOR bump regardless of type.

## Examples (good)

```
feat(auth): add Google OAuth provider

Users on the public site can now sign in with their Google account.
Existing email accounts can link an OAuth identity from /settings.

Closes: #142
```

```
fix(api): treat empty Authorization header as anonymous

Previously the request fell through to the 401 path with a confusing
"malformed token" body. Now we short-circuit at the middleware.
```

```
feat(api)!: drop /v1 endpoints

BREAKING CHANGE: clients pinned to /v1 must migrate to /v2.
Migration guide: docs/migrations/v1-to-v2.md
```

```
refactor(orders): extract OrderTotalCalculator

No behavior change. Separates pricing logic from order persistence
so we can unit-test pricing without spinning up the DB.
```

## Examples (bad → fixed)

| Bad | Why it's bad | Fixed |
|---|---|---|
| `Updated stuff` | No type, vague | `chore: bump prettier to 3.2` |
| `feat: Added new login page.` | Past tense, capitalized, trailing period | `feat(auth): add login page` |
| `fix: bugfix` | "bugfix" describes the act of committing, not the bug | `fix(api): return 404 for unknown users instead of 500` |
| `feat: lots of changes` | Should be split into separate commits | (split per change) |
| `BREAKING: removed v1` | Wrong shape: missing type, breaking-marker is a footer or `!` | `feat(api)!: drop /v1 endpoints` (+ `BREAKING CHANGE:` footer) |

## When to invoke this skill

- The user asks you to commit anything.
- The user asks for a commit message, PR title, or changelog entry.
- You're about to call `git commit -m "..."` — format the message to this spec first.

## Workflow when writing a commit on the user's behalf

1. Run `git diff --staged --stat` to see what's actually staged.
2. Decide on **one** type that describes the *primary* change. If multiple types apply, the changes should probably be in separate commits — surface that.
3. Pick a scope from the touched directories (auth, api, core, ui). Skip the scope if the change is repo-wide.
4. Write the description in imperative mood: "add", "fix", "remove" — what the commit *does* when applied.
5. Body only if the *why* isn't obvious from the description and the diff. Don't restate the diff.
6. Add footers for issue links and breaking-change details.
7. If this is a session where the user signs commits with a `Co-Authored-By: Claude` trailer, add it.

## Common scope conventions

Pick what's already established in this repo (run `git log --oneline -50` to inspect). If nothing is established, default to: `feat(<top-level-dir>)` for monorepos; no scope for single-package repos.

## Tooling that depends on this format

- `semantic-release` / `release-please` — auto bumps version + writes `CHANGELOG.md`
- `commitlint` — pre-commit hook that rejects malformed messages
- `cz-cli` (Commitizen) — interactive commit prompt
- GitHub's "Squash and merge" PR title field — set the PR title to a conventional commit so the squash commit lands clean.

## See also

- [[architecture-principles]] — `refactor:` commits often pair with applying SOLID principles, and naming a pattern in the body explains the *why* concisely.

---

Config: skill.yaml · Schema: schema.json
