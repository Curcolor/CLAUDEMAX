---
name: design-patterns
description: Reach for a named design pattern (creational / structural / behavioral) when the user is designing a new component, refactoring a tangled one, or asks for "the right pattern" for a problem. Trigger on words like "factory", "strategy", "observer", "decorator", "what pattern", "GoF", "design pattern".
---

# Design patterns

A vocabulary for solutions to recurring design problems. Use the name only when the pattern actually applies — slapping "Factory" on a function that calls `new` is jargon, not engineering.

## When to invoke this skill

- User asks "which pattern fits this?" or names a pattern.
- You're proposing a refactor and want a concise label both sides understand.
- You're reviewing code that *could* be cleaned up by a known pattern.

## The 23 GoF patterns, grouped, with one-line triggers

### Creational — how objects come into existence

| Pattern | Use when |
|---|---|
| **Factory Method** | A class needs to create objects of a related family but the exact concrete class depends on subclass / runtime input. |
| **Abstract Factory** | You need to create *families* of related products (e.g. UI widgets for macOS vs Windows) and want to enforce consistency. |
| **Builder** | An object has many optional construction parameters; constructors are getting telescoping. Fluent API helps readability. |
| **Prototype** | Cloning an existing configured object is cheaper or clearer than constructing a new one from scratch. |
| **Singleton** | Genuinely one instance is needed system-wide (logger, config). **Caveat:** singletons are usually globals in disguise — prefer DI of a single instance via the container. |

### Structural — how objects compose

| Pattern | Use when |
|---|---|
| **Adapter** | Two interfaces don't match; you can't change either. Wrap one in the other's shape. |
| **Bridge** | Two orthogonal axes of variation are getting multiplied into a class explosion. Split them into separate hierarchies linked by composition. |
| **Composite** | You want client code to treat individual leaves and whole trees uniformly (filesystem, UI nodes, AST nodes). |
| **Decorator** | You want to add behavior to specific instances at runtime without subclassing every combination (`BufferedInputStream(FileInputStream(...))`). |
| **Facade** | A subsystem has many small classes; clients need a simple entry point hiding the inner detail. |
| **Flyweight** | Many fine-grained objects share most of their state; extract the shared part to save memory. |
| **Proxy** | You need an object that *acts like* the real one but adds access control, lazy loading, remoting, or caching. |

### Behavioral — how objects collaborate

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

## Modern / non-GoF patterns worth knowing

- **Repository** — abstracts persistence behind a collection-like interface. Pairs with [[solid]] DIP.
- **Unit of Work** — coordinates one logical transaction across multiple repositories.
- **CQRS** — separates read and write models for systems where their concerns diverge enough to justify the cost.
- **Result / Either** — return value carries success or failure; alternative to exceptions for expected error paths.
- **Pipeline / Middleware** — composition of `next`-calling handlers (HTTP middleware, validation chains).
- **Specification** — encapsulate business rules as composable predicates (`new InGoodStanding().and(new HasOpenOrders())`).

## How to recommend a pattern

1. State the *problem* in one sentence.
2. Name the pattern.
3. Sketch the smallest viable structure — usually 2-4 types and their relationships.
4. Mention what the pattern costs (extra indirection, harder navigation, learning curve for the team).
5. If a simpler alternative exists (a function, a closure, a config map), say so and let the user choose.

## Anti-patterns to avoid

- **Pattern-itis** — applying patterns because they're "good practice" rather than because the problem calls for them.
- **Singleton everywhere** — most "singletons" are global state in disguise; prefer a single instance managed by your DI container.
- **Manager / Helper / Util** classes — these are bag-of-functions classes with no single responsibility; usually a sign you skipped naming the real abstraction.
- **Pattern by name** — "make it a Strategy" is not a design discussion until you've stated *what's varying*.

## See also

- [[solid]] — most GoF patterns are concrete applications of SRP, OCP, or DIP.
- [[architecture-patterns]] — large-scale structural patterns (hexagonal, layered, microservices).
