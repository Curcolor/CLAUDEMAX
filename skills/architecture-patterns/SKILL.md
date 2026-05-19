---
name: architecture-patterns
description: Pick a system-level architecture (layered, hexagonal/ports-and-adapters, clean, onion, MVC/MVVM, microservices, monolith, event-driven, CQRS, serverless) when the user is starting a new project, restructuring an existing one, or asking "how should this be organized?". Trigger on phrases like "architecture", "structure the project", "layering", "hexagonal", "clean architecture", "microservices", "monolith".
---

# Architecture patterns

Patterns above the class level — how a whole system is organized. Pick one based on the *forces* in the project (team size, deploy cadence, failure isolation, change frequency). Don't pick by fashion. Most failures here are choosing distributed when monolith would do, or hexagonal when a 200-line script would do.

## When to invoke this skill

- User asks to lay out a new project or restructure an existing one.
- User mentions an architecture name and wants a comparison or recommendation.
- You're proposing a non-trivial refactor that crosses module boundaries.

## Pick-by-force quick guide

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

## The patterns, with the trade-off that bites

### Layered (n-tier)

Presentation → application → domain → infrastructure. Each layer depends only on the one below.

**Wins:** familiar to everyone; easy to onboard.
**Bites:** the "domain" layer almost always ends up depending on the ORM, defeating the layering. Layered without dependency inversion is just folders.

### Hexagonal (a.k.a. Ports and Adapters)

Domain in the center exposes **ports** (interfaces). External tech (DB, HTTP, queue, CLI) implements **adapters** behind those ports. Domain code has zero `import` of frameworks.

**Wins:** swap delivery channels and storage without touching business logic. Unit tests run with in-memory adapters.
**Bites:** more files, more ceremony. Wrong for a script or a tiny CRUD app. Right for systems where the domain rules live for years and the tech doesn't.

### Clean / Onion

Same idea as hexagonal, with a stricter ring discipline (entities → use cases → interface adapters → frameworks). Robert C. Martin's framing; the substance is hexagonal.

**Wins:** clear dependency rule (deps point inward, never outward).
**Bites:** when followed religiously, you write four classes to do one thing. Use it when complexity earns the structure.

### MVC / MVP / MVVM

UI patterns. View renders; Model holds state; Controller / Presenter / ViewModel mediates.

- **MVC** — controller takes input, updates model, picks view. Server-side web frameworks.
- **MVP** — presenter holds presentation state, view is dumb. Easier to test than MVC because the view's state is in the presenter.
- **MVVM** — viewmodel exposes observable state; view binds to it. Native pattern for data-bound UIs (WPF, SwiftUI, Vue, Knockout).

Bites: all three rot into "fat controller" / "fat viewmodel" if you don't push real logic down into the domain.

### Modular Monolith

One deployable, internal modules with explicit boundaries (one module = one folder + a public interface + private internals). Modules can become services later if forced.

**Wins:** simple ops; in-process calls; refactors stay local; you only pay distributed-system tax when you need it.
**Bites:** "modules" rot to spaghetti without enforced boundaries. Use a build-time tool (architecture tests, layered eslint rules, jdepend) to keep imports honest.

### Microservices

Many independently deployable services, each owning its data. Communicate via HTTP or events. Each service is small enough that a team can hold it in their head.

**Wins:** independent deploys, fault isolation, polyglot stacks, scale per service.
**Bites:** distributed transactions are *hard*. Network is unreliable. Observability bill is real. Debugging spans 12 services. Don't start here unless team size and product complexity demand it; **start with a modular monolith and extract services when seams emerge.**

### Event-driven architecture

Components publish events; others subscribe. Loose coupling; eventual consistency.

**Wins:** scaling, isolation, audit trail, late-binding new subscribers.
**Bites:** ordering, exactly-once delivery, schema evolution, "where did that event go?" debugging. Need an event bus and observability tooling. Don't sprinkle events into a CRUD app for fun.

### CQRS (Command Query Responsibility Segregation)

Write model handles commands; separate read model(s) serve queries. Often paired with event sourcing.

**Wins:** read model is shaped for queries (denormalized, projected); write model enforces invariants.
**Bites:** two models to keep in sync; eventual consistency surfaces to users; cognitive overhead. Worth it when read/write loads or shapes diverge dramatically.

### Event sourcing

Persist a sequence of immutable events. Current state is a fold over the events.

**Wins:** perfect audit, time-travel, rebuild projections.
**Bites:** schema evolution of events (events are immutable but their shape changes); replay performance; mental model shift. Heavy lift; only worth it when history *is* the product (banking, healthcare, regulatory).

### Serverless

Functions triggered by events (HTTP, queue, schedule). No long-running servers; provider handles scale.

**Wins:** pay per request; auto-scale; minimal ops.
**Bites:** cold starts, vendor lock-in, function size limits, debugging across functions, distributed-system problems at a finer granularity. Great for spiky workloads and glue code; risky for tight latency budgets.

## The "boring" decision is usually right

When in doubt:

- Start with a **modular monolith** using **hexagonal** boundaries.
- One database. One deploy. One service.
- Push side-effects (DB, HTTP, queue) behind ports.
- Apply [[solid]] inside modules; apply [[design-patterns]] within classes.
- Extract a service only when an actual force (independent deploy, isolation, scale) demands it, not because microservices are in the conference talk.

## How to recommend an architecture

1. State the *forces* (team size, deploy cadence, failure isolation, scale axis).
2. Name the pattern that fits *those* forces.
3. State what it costs (operational, cognitive, infrastructural).
4. If the cost outweighs the force, recommend the simpler option and say what would make you reconsider.

## Anti-patterns to avoid

- **Microservices for a 3-person team** — distributed monolith on hard mode.
- **Hexagonal for a 200-line script** — over-engineering.
- **MVC where the model is a database row** — that's just CRUD; call it that.
- **Event-driven because "events are cool"** — pick async only when async actually buys decoupling you need.
- **CQRS without the read/write divergence** — two models maintained for no benefit.

## See also

- [[solid]] — most architectures formalize SRP/DIP at the module boundary level.
- [[design-patterns]] — within-module structure.
- [[conventional-commits]] — `feat`, `refactor`, `chore` map cleanly to architectural changes.
