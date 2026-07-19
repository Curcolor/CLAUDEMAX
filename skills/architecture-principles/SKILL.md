---
name: architecture-principles
description: "Unified engineering-architecture skill: SOLID principles (SRP, OCP, LSP, ISP, DIP), GoF design patterns (creational/structural/behavioral), and system-level architectures (layered, hexagonal, clean, onion, MVC/MVVM, microservices, monolith, event-driven, CQRS, serverless). Trigger on \"SOLID\", \"design pattern\", \"factory\", \"strategy\", \"observer\", \"architecture\", \"structure the project\", \"hexagonal\", \"microservices\", \"refactor for cleaner design\", or when designing/reviewing/refactoring components and systems."
---

# Architecture Principles

Merged from the former `solid`, `design-patterns`, and `architecture-patterns` skills. Three altitude levels of one discipline: principles (SOLID) → component patterns (GoF) → system architectures.

## Part 1 — SOLID principles

Five object-oriented design principles. Use them as a *lens*, not a checklist — every principle has a cost (more files, more indirection) and the trade-off only pays off when the relevant change axis actually exists in this codebase.

### When to invoke this skill

- User mentions SOLID, SRP, OCP, LSP, ISP, DIP by name.
- User asks for a code review focused on design, not just bugs.
- User asks to refactor a class that "does too much" or "is hard to test".
- You're about to design a new class hierarchy or module boundary.

### The five principles, with a sniff test for each

#### S — Single Responsibility Principle

> A class should have one reason to change.

**Sniff test:** Can you describe what the class does without saying "and"? Are there two stakeholders who would ask for changes to different methods?

**Red flags:** a class with both `Order.calculateTotal()` *and* `Order.sendConfirmationEmail()`. Calculation logic changes for finance reasons; email logic changes for marketing reasons. Two reasons → split.

**Cost of over-applying:** 47 micro-classes for one workflow. SRP is about *reasons to change*, not *number of methods*.

#### O — Open/Closed Principle

> Open for extension, closed for modification.

**Sniff test:** When you add a new variant (new payment provider, new export format), do you edit an existing `switch`/`if` chain, or add a new file that the existing code discovers via a registry/strategy?

**Apply when:** new variants arrive frequently and existing variants must keep working untouched.
**Skip when:** you've added one variant in two years. YAGNI beats OCP for stable axes.

#### L — Liskov Substitution Principle

> Subtypes must be usable wherever the base type is expected, without surprising the caller.

**Sniff test:** Does the subclass throw `NotSupportedException` on any inherited method? Does it tighten preconditions (e.g. base accepts `int`, subclass demands positive int)? Does it weaken postconditions? Those are LSP violations.

**Classic violation:** `Square extends Rectangle`. Setting `width` independently of `height` breaks the subclass's invariant.

**Fix pattern:** prefer composition (`Rectangle` *contains* a `Sides` value object) over `extends` when the "is-a" relationship doesn't survive every method.

#### I — Interface Segregation Principle

> Clients shouldn't depend on methods they don't use.

**Sniff test:** Does a consumer take a fat interface but call only 2 of its 14 methods? Split the interface so the consumer depends only on what it uses — that minimizes recompiles and makes test doubles tiny.

**Trade-off:** more interfaces. Worth it when the fat interface forces unrelated consumers to share a fate.

#### D — Dependency Inversion Principle

> Depend on abstractions, not concretions. High-level policy shouldn't import low-level mechanism.

**Sniff test:** Does your domain layer `import psycopg2`? Your business logic shouldn't know what database it's talking to. Inject a `UserRepository` interface; concrete `PostgresUserRepository` lives at the edge of the system.

**Apply when:** you need to swap implementations (test doubles, alternate backends) or you're drawing a hexagonal/clean-architecture boundary.
**Skip when:** it's a script. DIP for a 100-line CLI is theater.

### How to apply these in a review

1. Read the change. Identify each class/module that was touched.
2. For each, ask: *which principle is most relevant here?* — usually exactly one.
3. State the violation concretely: name the principle, name the symptom, name the cost.
4. Propose the minimum refactor that resolves it. Don't bundle all five principles into one suggestion.
5. If applying a principle would create more indirection than it saves, say so out loud and skip it.

### Anti-patterns to call out

- **"SRP" used to justify splitting every method into its own class.** SRP is about *axes of change*, not method count.
- **"DIP" used to wrap every concrete class in an interface "just in case".** Don't add abstractions until a second implementation exists or is imminent.
- **"OCP" used to demand a plugin architecture for a one-off feature.** Premature OCP costs real complexity for hypothetical future flexibility.

### Output format

When you find a SOLID issue, write it like:

> **[Principle]** — *symptom in one line*
> Cost: *what breaks today or will break soon*
> Fix: *smallest change that resolves it*

Example:

> **SRP** — `UserService` handles password hashing, email sending, and audit logging.
> Cost: changing the audit log format forces a rebuild of every consumer of `UserService`.
> Fix: extract `AuditLogger`; inject it.

### See also

- Design patterns (Part 2, above) — many design patterns are concrete applications of SOLID.
- System architectures (Part 3, above) — hexagonal, clean, and onion architectures formalize DIP at the boundary level.

## Part 2 — Design patterns

A vocabulary for solutions to recurring design problems. Use the name only when the pattern actually applies — slapping "Factory" on a function that calls `new` is jargon, not engineering.

### When to invoke this skill

- User asks "which pattern fits this?" or names a pattern.
- You're proposing a refactor and want a concise label both sides understand.
- You're reviewing code that *could* be cleaned up by a known pattern.

### The 23 GoF patterns, grouped, with one-line triggers

#### Creational — how objects come into existence

| Pattern | Use when |
|---|---|
| **Factory Method** | A class needs to create objects of a related family but the exact concrete class depends on subclass / runtime input. |
| **Abstract Factory** | You need to create *families* of related products (e.g. UI widgets for macOS vs Windows) and want to enforce consistency. |
| **Builder** | An object has many optional construction parameters; constructors are getting telescoping. Fluent API helps readability. |
| **Prototype** | Cloning an existing configured object is cheaper or clearer than constructing a new one from scratch. |
| **Singleton** | Genuinely one instance is needed system-wide (logger, config). **Caveat:** singletons are usually globals in disguise — prefer DI of a single instance via the container. |

#### Structural — how objects compose

| Pattern | Use when |
|---|---|
| **Adapter** | Two interfaces don't match; you can't change either. Wrap one in the other's shape. |
| **Bridge** | Two orthogonal axes of variation are getting multiplied into a class explosion. Split them into separate hierarchies linked by composition. |
| **Composite** | You want client code to treat individual leaves and whole trees uniformly (filesystem, UI nodes, AST nodes). |
| **Decorator** | You want to add behavior to specific instances at runtime without subclassing every combination (`BufferedInputStream(FileInputStream(...))`). |
| **Facade** | A subsystem has many small classes; clients need a simple entry point hiding the inner detail. |
| **Flyweight** | Many fine-grained objects share most of their state; extract the shared part to save memory. |
| **Proxy** | You need an object that *acts like* the real one but adds access control, lazy loading, remoting, or caching. |

#### Behavioral — how objects collaborate

| Pattern | Use when |
|---|---|
| **Chain of Responsibility** | A request should be tried by a sequence of handlers, each deciding to handle or pass on (middleware pipelines). |
| **Command** | You need to parameterize, queue, log, or undo operations — wrap each action as an object. |
| **Iterator** | Provide sequential access without exposing the underlying collection. (Most languages bake this in.) |
| **Mediator** | Many objects are talking to each other in a tangle; introduce a hub that owns the protocol. |
| **Memento** | You need undo/restore without exposing the object's internals (snapshot value object). |
| **Observer** | One subject; many dependents need to react when it changes. Caveat: cycles and update storms — consider event buses or reactive streams instead. |
| **State** | An object's behavior depends on its mode, and the mode-switch logic is a giant `switch`. Each state becomes a class. |
| **Strategy** | A family of algorithms is interchangeable; the caller picks one at runtime (sort order, payment method, retry policy). |
| **Template Method** | Outline an algorithm in a base class; subclasses fill in specific steps. Risk: rigid inheritance — prefer Strategy if subclasses don't share much. |
| **Visitor** | Operations need to be added across a stable type hierarchy without modifying the types. Double dispatch. |
| **Interpreter** | You're building a small DSL or expression evaluator; each grammar rule becomes a class. |

### Modern / non-GoF patterns worth knowing

- **Repository** — abstracts persistence behind a collection-like interface. Pairs with DIP (Part 1, above).
- **Unit of Work** — coordinates one logical transaction across multiple repositories.
- **CQRS** — separates read and write models for systems where their concerns diverge enough to justify the cost.
- **Result / Either** — return value carries success or failure; alternative to exceptions for expected error paths.
- **Pipeline / Middleware** — composition of `next`-calling handlers (HTTP middleware, validation chains).
- **Specification** — encapsulate business rules as composable predicates (`new InGoodStanding().and(new HasOpenOrders())`).

### How to recommend a pattern

1. State the *problem* in one sentence.
2. Name the pattern.
3. Sketch the smallest viable structure — usually 2-4 types and their relationships.
4. Mention what the pattern costs (extra indirection, harder navigation, learning curve for the team).
5. If a simpler alternative exists (a function, a closure, a config map), say so and let the user choose.

### Anti-patterns to avoid

- **Pattern-itis** — applying patterns because they're "good practice" rather than because the problem calls for them.
- **Singleton everywhere** — most "singletons" are global state in disguise; prefer a single instance managed by your DI container.
- **Manager / Helper / Util** classes — these are bag-of-functions classes with no single responsibility; usually a sign you skipped naming the real abstraction.
- **Pattern by name** — "make it a Strategy" is not a design discussion until you've stated *what's varying*.

### See also

- SOLID principles (Part 1, above) — most GoF patterns are concrete applications of SRP, OCP, or DIP.
- System architectures (Part 3, above) — large-scale structural patterns (hexagonal, layered, microservices).

## Part 3 — System architectures

Patterns above the class level — how a whole system is organized. Pick one based on the *forces* in the project (team size, deploy cadence, failure isolation, change frequency). Don't pick by fashion. Most failures here are choosing distributed when monolith would do, or hexagonal when a 200-line script would do.

### When to invoke this skill

- User asks to lay out a new project or restructure an existing one.
- User mentions an architecture name and wants a comparison or recommendation.
- You're proposing a non-trivial refactor that crosses module boundaries.

### Pick-by-force quick guide

| Force in the project | Strong fit |
|---|---|
| Small team, single deploy, one DB | **Modular monolith** |
| Domain logic dominates; multiple delivery channels (web + CLI + queue) | **Hexagonal / Clean / Onion** |
| Independent deploy cadence per area, separate teams, separate scale needs | **Microservices** |
| Read load ≫ write load and read model differs from write model | **CQRS** (often with event sourcing) |
| State *is* the history (audit, finance, regulatory) | **Event sourcing** |
| Loose coupling between bounded contexts; async OK | **Event-driven** |
| Highly variable, spiky load; pay-per-request | **Serverless** |
| UI app with clear view/state/logic separation | **MVC / MVP / MVVM** |

### The patterns, with the trade-off that bites

#### Layered (n-tier)

Presentation → application → domain → infrastructure. Each layer depends only on the one below.

**Wins:** familiar to everyone; easy to onboard.
**Bites:** the "domain" layer almost always ends up depending on the ORM, defeating the layering. Layered without dependency inversion is just folders.

#### Hexagonal (a.k.a. Ports and Adapters)

Domain in the center exposes **ports** (interfaces). External tech (DB, HTTP, queue, CLI) implements **adapters** behind those ports. Domain code has zero `import` of frameworks.

**Wins:** swap delivery channels and storage without touching business logic. Unit tests run with in-memory adapters.
**Bites:** more files, more ceremony. Wrong for a script or a tiny CRUD app. Right for systems where the domain rules live for years and the tech doesn't.

#### Clean / Onion

Same idea as hexagonal, with a stricter ring discipline (entities → use cases → interface adapters → frameworks). Robert C. Martin's framing; the substance is hexagonal.

**Wins:** clear dependency rule (deps point inward, never outward).
**Bites:** when followed religiously, you write four classes to do one thing. Use it when complexity earns the structure.

#### MVC / MVP / MVVM

UI patterns. View renders; Model holds state; Controller / Presenter / ViewModel mediates.

- **MVC** — controller takes input, updates model, picks view. Server-side web frameworks.
- **MVP** — presenter holds presentation state, view is dumb. Easier to test than MVC because the view's state is in the presenter.
- **MVVM** — viewmodel exposes observable state; view binds to it. Native pattern for data-bound UIs (WPF, SwiftUI, Vue, Knockout).

Bites: all three rot into "fat controller" / "fat viewmodel" if you don't push real logic down into the domain.

#### Modular Monolith

One deployable, internal modules with explicit boundaries (one module = one folder + a public interface + private internals). Modules can become services later if forced.

**Wins:** simple ops; in-process calls; refactors stay local; you only pay distributed-system tax when you need it.
**Bites:** "modules" rot to spaghetti without enforced boundaries. Use a build-time tool (architecture tests, layered eslint rules, jdepend) to keep imports honest.

#### Microservices

Many independently deployable services, each owning its data. Communicate via HTTP or events. Each service is small enough that a team can hold it in their head.

**Wins:** independent deploys, fault isolation, polyglot stacks, scale per service.
**Bites:** distributed transactions are *hard*. Network is unreliable. Observability bill is real. Debugging spans 12 services. Don't start here unless team size and product complexity demand it; **start with a modular monolith and extract services when seams emerge.**

#### Event-driven architecture

Components publish events; others subscribe. Loose coupling; eventual consistency.

**Wins:** scaling, isolation, audit trail, late-binding new subscribers.
**Bites:** ordering, exactly-once delivery, schema evolution, "where did that event go?" debugging. Need an event bus and observability tooling. Don't sprinkle events into a CRUD app for fun.

#### CQRS (Command Query Responsibility Segregation)

Write model handles commands; separate read model(s) serve queries. Often paired with event sourcing.

**Wins:** read model is shaped for queries (denormalized, projected); write model enforces invariants.
**Bites:** two models to keep in sync; eventual consistency surfaces to users; cognitive overhead. Worth it when read/write loads or shapes diverge dramatically.

#### Event sourcing

Persist a sequence of immutable events. Current state is a fold over the events.

**Wins:** perfect audit, time-travel, rebuild projections.
**Bites:** schema evolution of events (events are immutable but their shape changes); replay performance; mental model shift. Heavy lift; only worth it when history *is* the product (banking, healthcare, regulatory).

#### Serverless

Functions triggered by events (HTTP, queue, schedule). No long-running servers; provider handles scale.

**Wins:** pay per request; auto-scale; minimal ops.
**Bites:** cold starts, vendor lock-in, function size limits, debugging across functions, distributed-system problems at a finer granularity. Great for spiky workloads and glue code; risky for tight latency budgets.

### The "boring" decision is usually right

When in doubt:

- Start with a **modular monolith** using **hexagonal** boundaries.
- One database. One deploy. One service.
- Push side-effects (DB, HTTP, queue) behind ports.
- Apply the SOLID principles (Part 1, above) inside modules; apply design patterns (Part 2, above) within classes.
- Extract a service only when an actual force (independent deploy, isolation, scale) demands it, not because microservices are in the conference talk.

### How to recommend an architecture

1. State the *forces* (team size, deploy cadence, failure isolation, scale axis).
2. Name the pattern that fits *those* forces.
3. State what it costs (operational, cognitive, infrastructural).
4. If the cost outweighs the force, recommend the simpler option and say what would make you reconsider.

### Anti-patterns to avoid

- **Microservices for a 3-person team** — distributed monolith on hard mode.
- **Hexagonal for a 200-line script** — over-engineering.
- **MVC where the model is a database row** — that's just CRUD; call it that.
- **Event-driven because "events are cool"** — pick async only when async actually buys decoupling you need.
- **CQRS without the read/write divergence** — two models maintained for no benefit.

### See also

- SOLID principles (Part 1, above) — most architectures formalize SRP/DIP at the module boundary level.
- Design patterns (Part 2, above) — within-module structure.
- [[conventional-commits]] — `feat`, `refactor`, `chore` map cleanly to architectural changes.

---

Config: skill.yaml · Schema: schema.json
