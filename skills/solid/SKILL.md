---
name: solid
description: Apply SOLID principles (SRP, OCP, LSP, ISP, DIP) when designing, reviewing, or refactoring object-oriented code. Trigger when the user asks about SOLID, mentions a specific principle, asks to refactor for "cleaner design", or reviews class/module structure.
---

# SOLID principles

Five object-oriented design principles. Use them as a *lens*, not a checklist — every principle has a cost (more files, more indirection) and the trade-off only pays off when the relevant change axis actually exists in this codebase.

## When to invoke this skill

- User mentions SOLID, SRP, OCP, LSP, ISP, DIP by name.
- User asks for a code review focused on design, not just bugs.
- User asks to refactor a class that "does too much" or "is hard to test".
- You're about to design a new class hierarchy or module boundary.

## The five principles, with a sniff test for each

### S — Single Responsibility Principle

> A class should have one reason to change.

**Sniff test:** Can you describe what the class does without saying "and"? Are there two stakeholders who would ask for changes to different methods?

**Red flags:** a class with both `Order.calculateTotal()` *and* `Order.sendConfirmationEmail()`. Calculation logic changes for finance reasons; email logic changes for marketing reasons. Two reasons → split.

**Cost of over-applying:** 47 micro-classes for one workflow. SRP is about *reasons to change*, not *number of methods*.

### O — Open/Closed Principle

> Open for extension, closed for modification.

**Sniff test:** When you add a new variant (new payment provider, new export format), do you edit an existing `switch`/`if` chain, or add a new file that the existing code discovers via a registry/strategy?

**Apply when:** new variants arrive frequently and existing variants must keep working untouched.
**Skip when:** you've added one variant in two years. YAGNI beats OCP for stable axes.

### L — Liskov Substitution Principle

> Subtypes must be usable wherever the base type is expected, without surprising the caller.

**Sniff test:** Does the subclass throw `NotSupportedException` on any inherited method? Does it tighten preconditions (e.g. base accepts `int`, subclass demands positive int)? Does it weaken postconditions? Those are LSP violations.

**Classic violation:** `Square extends Rectangle`. Setting `width` independently of `height` breaks the subclass's invariant.

**Fix pattern:** prefer composition (`Rectangle` *contains* a `Sides` value object) over `extends` when the "is-a" relationship doesn't survive every method.

### I — Interface Segregation Principle

> Clients shouldn't depend on methods they don't use.

**Sniff test:** Does a consumer take a fat interface but call only 2 of its 14 methods? Split the interface so the consumer depends only on what it uses — that minimizes recompiles and makes test doubles tiny.

**Trade-off:** more interfaces. Worth it when the fat interface forces unrelated consumers to share a fate.

### D — Dependency Inversion Principle

> Depend on abstractions, not concretions. High-level policy shouldn't import low-level mechanism.

**Sniff test:** Does your domain layer `import psycopg2`? Your business logic shouldn't know what database it's talking to. Inject a `UserRepository` interface; concrete `PostgresUserRepository` lives at the edge of the system.

**Apply when:** you need to swap implementations (test doubles, alternate backends) or you're drawing a hexagonal/clean-architecture boundary.
**Skip when:** it's a script. DIP for a 100-line CLI is theater.

## How to apply these in a review

1. Read the change. Identify each class/module that was touched.
2. For each, ask: *which principle is most relevant here?* — usually exactly one.
3. State the violation concretely: name the principle, name the symptom, name the cost.
4. Propose the minimum refactor that resolves it. Don't bundle all five principles into one suggestion.
5. If applying a principle would create more indirection than it saves, say so out loud and skip it.

## Anti-patterns to call out

- **"SRP" used to justify splitting every method into its own class.** SRP is about *axes of change*, not method count.
- **"DIP" used to wrap every concrete class in an interface "just in case".** Don't add abstractions until a second implementation exists or is imminent.
- **"OCP" used to demand a plugin architecture for a one-off feature.** Premature OCP costs real complexity for hypothetical future flexibility.

## Output format

When you find a SOLID issue, write it like:

> **[Principle]** — *symptom in one line*
> Cost: *what breaks today or will break soon*
> Fix: *smallest change that resolves it*

Example:

> **SRP** — `UserService` handles password hashing, email sending, and audit logging.
> Cost: changing the audit log format forces a rebuild of every consumer of `UserService`.
> Fix: extract `AuditLogger`; inject it.

## See also

- [[design-patterns]] — many design patterns are concrete applications of SOLID.
- [[architecture-patterns]] — hexagonal, clean, and onion architectures formalize DIP at the boundary level.
