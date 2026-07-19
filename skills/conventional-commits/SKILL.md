---
name: conventional-commits
description: "Escribe mensajes de commit y títulos de PR que sigan el spec Conventional Commits 1.0.0. Trigger cuando el usuario pide hacer commit, escribir un commit message, generar un changelog, o pregunta \"what should this commit be?\" / \"cómo debería ser este commit?\". Aplícala automáticamente cada vez que estés redactando un mensaje para `git commit -m`."
---

# Conventional Commits

Spec: <https://www.conventionalcommits.org/en/v1.0.0/>. Formato de commit parseable por máquina que habilita bumps de semver automáticos, changelogs y release notes.

## Formato

```
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

- **`<type>`** — obligatorio, en minúsculas, de la lista permitida abajo.
- **`[scope]`** — opcional, entre paréntesis, sustantivo en minúsculas (`feat(auth):`, `fix(api):`). Usa el área más pequeña que toca el cambio; omítelo si el cambio es global.
- **`!`** — se agrega después del type/scope cuando el cambio introduce un **breaking change**: `feat(api)!: drop /v1 endpoints`.
- **`<description>`** — modo imperativo, minúsculas, sin punto final, ≤72 caracteres. *"add OAuth"* y no *"Added OAuth."*.
- **`body`** — se ajusta (wrap) a 72 caracteres. Explica el *por qué*, no el *qué*. Se separa de la description por una línea en blanco.
- **`footer(s)`** — uno por línea, con la forma `Token: value`. Tokens reservados: `BREAKING CHANGE:` (la forma canónica, equivalente a `!`), `Refs:`, `Closes:`, `Co-authored-by:`.

## Lista de tipos permitidos (usada por la mayoría del tooling)

| Type | Cuándo usarlo | impacto en semver* |
|---|---|---|
| `feat` | Nueva capacidad visible para el usuario | MINOR |
| `fix` | Corrección de bug (se corrige comportamiento visible para el usuario) | PATCH |
| `docs` | Solo documentación | ninguno |
| `style` | Formato, espacios en blanco, punto y coma; sin cambio de lógica | ninguno |
| `refactor` | Cambio de código que ni agrega una feature ni corrige un bug | ninguno |
| `perf` | Mejora de rendimiento | PATCH (algunos equipos: MINOR) |
| `test` | Agregar/ajustar tests; sin cambios en código de producción | ninguno |
| `build` | Sistema de build, empaquetado, dependencias (`package.json`, `Cargo.toml`) | ninguno |
| `ci` | Configuración de CI (`.github/workflows`, `circle.yml`) | ninguno |
| `chore` | Mantenimiento sin impacto en código fuente ni tests (bump de lockfile, limpieza) | ninguno |
| `revert` | Revierte un commit anterior | coincide con el commit revertido |

*Herramientas como `semantic-release` derivan versiones de esto. `!` o `BREAKING CHANGE:` fuerza un bump MAJOR sin importar el type.

## Ejemplos (buenos)

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

## Ejemplos (malos → corregidos)

| Malo | Por qué está mal | Corregido |
|---|---|---|
| `Updated stuff` | Sin type, vago | `chore: bump prettier to 3.2` |
| `feat: Added new login page.` | Tiempo pasado, con mayúscula, punto final | `feat(auth): add login page` |
| `fix: bugfix` | "bugfix" describe el acto de hacer commit, no el bug | `fix(api): return 404 for unknown users instead of 500` |
| `feat: lots of changes` | Debería dividirse en commits separados | (dividir por cambio) |
| `BREAKING: removed v1` | Forma incorrecta: falta el type, el marcador de breaking es un footer o `!` | `feat(api)!: drop /v1 endpoints` (+ footer `BREAKING CHANGE:`) |

## Cuándo invocar esta skill

- El usuario te pide hacer commit de cualquier cosa.
- El usuario pide un commit message, título de PR, o entrada de changelog.
- Estás a punto de llamar a `git commit -m "..."` — da formato al mensaje según este spec primero.

## Flujo de trabajo al escribir un commit en nombre del usuario

1. Ejecuta `git diff --staged --stat` para ver qué está realmente staged.
2. Decide **un** type que describa el cambio *primario*. Si aplican varios types, los cambios probablemente deberían estar en commits separados — hazlo notar.
3. Elige un scope a partir de los directorios tocados (auth, api, core, ui). Omite el scope si el cambio es de todo el repo.
4. Escribe la description en modo imperativo: "add", "fix", "remove" — lo que el commit *hace* al aplicarse.
5. Body solo si el *por qué* no es obvio a partir de la description y el diff. No repitas el diff.
6. Agrega footers para enlaces a issues y detalles de breaking changes.
7. Si esta es una sesión donde el usuario firma commits con un trailer `Co-Authored-By: Claude`, agrégalo.

## Convenciones comunes de scope

Usa lo que ya esté establecido en este repo (ejecuta `git log --oneline -50` para inspeccionar). Si no hay nada establecido, por defecto: `feat(<directorio-de-nivel-superior>)` para monorepos; sin scope para repos de un solo paquete.

## Tooling que depende de este formato

- `semantic-release` / `release-please` — hace bump de versión automáticamente y escribe `CHANGELOG.md`
- `commitlint` — hook de pre-commit que rechaza mensajes mal formados
- `cz-cli` (Commitizen) — prompt interactivo de commit
- El campo de título de PR de "Squash and merge" de GitHub — pon el título del PR como un conventional commit para que el commit de squash quede limpio.

## Ver también

- [[architecture-principles]] — los commits `refactor:` a menudo van de la mano con aplicar principios SOLID, y nombrar un patrón en el body explica el *por qué* de forma concisa.

---

Config: skill.yaml · Schema: schema.json
