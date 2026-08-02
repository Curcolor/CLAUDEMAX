# Reglas Operativas y Rituales de Ciclo de Vida (Subproyectos E y D) — Especificación de Diseño

**Fecha:** 2026-08-01
**Padre:** [Diseño maestro CLAUDEMAX](2026-07-19-claudemax-master-design.md)
**Estado:** Diseño aprobado

## Objetivo

Cerrar los dos subproyectos que faltan, unidos en una sola entrega porque comparten infraestructura: las reglas de E viven en plantillas que el ritual de inicialización de proyecto de D copia a cada repo nuevo.

- **E — Reglas operativas:** las reglas de trabajo dejan de vivir solo en el `~/.claude/CLAUDE.md` personal del usuario y pasan a estar **empaquetadas en el repo**, instaladas por el instalador y propagadas a cada proyecto. Las que se pueden hacer cumplir de forma determinista se implementan como hooks.
- **D — Rituales de ciclo de vida:** inicio de sesión, inicialización de proyecto, fin de sesión, fin de día y fin de ciclo.

Principio rector: **el repo es la fuente de verdad**. Ninguna regla depende de la configuración personal de una máquina.

## Bloque E1 — Plantillas de reglas

Directorio nuevo `templates/rules/`:

| Archivo | Destino | Contenido |
|---|---|---|
| `CLAUDEMAX.md` | `<RAG_ROOT>/.claude/CLAUDEMAX.md` | Todas las reglas operativas, en español |
| `CLAUDE.md` | `<RAG_ROOT>/.claude/CLAUDE.md` | Archivo raíz mínimo que hace `@CLAUDEMAX.md` (para no pisar un CLAUDE.md que el usuario ya tenga: si existe, solo se le añade la línea `@CLAUDEMAX.md` si falta) |
| `proyecto.md` | `<repo>/.claude/CLAUDEMAX.md` | Plantilla por proyecto: mismas reglas base + huecos de contexto específico que rellena el ritual de init |

Reglas incluidas en `CLAUDEMAX.md`:

1. **Idioma:** todo el contenido en español (docs, comentarios, mensajes, commits). Skills en modo bilingüe. Identificadores de código y tipos de Conventional Commits en inglés.
2. **Política de modelos:** los spawns de Agent para desarrollo dirigido por subagentes usan Sonnet 5 (`model: "sonnet"` explícito). Las revisiones de código nunca se delegan: se hacen en la sesión principal con el modelo activo.
3. **Cortacircuitos de 3 intentos:** tras 3 intentos fallidos de arreglar el mismo error, PARAR. Resumir el contexto al usuario y esperar su respuesta en vez de quemar tokens.
4. **Commits:** Conventional Commits, subject en español, y **nunca** incluir el footer `Co-authored-by: Claude` ni ninguna atribución de IA.
5. **Ahorro de tokens / búsqueda de skills:** cuando entra en la conversación un lenguaje, framework o táctica nuevos (C#, .NET, WinUI 3, XAML, Python…), preguntar si crear/buscar una Skill 2.0 para esa tecnología, advirtiendo del compromiso de saltársela.
6. **Memoria:** el cerebro RAG es la única fuente de retención de contexto. No reinstalar Context7 ni Claude-Mem.
7. **Taxonomía:** toda nota que se escriba en el vault lleva el frontmatter de categoría (ver `V.A.U.L.T/_plantilla.md`).

## Bloque E2 — Hooks de cumplimiento

Tres hooks nuevos en `hooks/`, todos Node sin dependencias, tolerantes a variaciones del esquema del evento y con variable de escape propia. Ninguno bloquea salvo el que debe hacerlo.

### `hooks/git-footer-guard.mjs` — `PreToolUse` / matcher `Bash`

- Inspecciona el comando. Si es un `git commit` cuyo mensaje contiene `Co-authored-by: Claude`, `Generated with Claude Code`, `🤖`, o similar, **bloquea** la ejecución devolviendo la decisión de denegar con un motivo en español que le dice al modelo que reintente sin el footer.
- Cualquier otro comando pasa sin tocarse. Escape: `CLAUDEMAX_GIT_GUARD=0`.
- Es el único hook que bloquea; el resto solo avisan.

### `hooks/loop-breaker.mjs` — `PostToolUse`

- Mantiene estado por sesión en `$CLAUDE_CONFIG_DIR/state/loop-breaker.json`.
- Calcula una firma del fallo: `(herramienta, primeros 200 caracteres normalizados del error)`. Normaliza rutas absolutas, números de línea y timestamps para que dos intentos del mismo error colisionen.
- Al tercer fallo con la misma firma emite un `<system-reminder>` contundente: parar, resumir lo intentado y preguntar al usuario. Al sexto lo repite con más énfasis.
- Una firma distinta o un éxito de la misma herramienta reinicia su contador. Escape: `CLAUDEMAX_LOOP_BREAKER=0`.

### `hooks/skill-suggest.mjs` — `UserPromptSubmit`

- Diccionario de ~40 tecnologías con sus patrones de detección (C#, .NET, WinUI 3, XAML, Rust, Go, Kotlin, Swift, Flutter, Django, Laravel, Unity…).
- Si el prompt menciona una tecnología que **no** tiene skill instalada en `$CLAUDE_CONFIG_DIR/skills/` y que no se ha avisado ya en esta sesión, inyecta **una sola vez** un recordatorio para que el modelo pregunte al usuario si quiere una Skill 2.0 para ella, mencionando el compromiso.
- Estado por sesión en `$CLAUDE_CONFIG_DIR/state/skill-suggest.json`. Escape: `CLAUDEMAX_SKILL_SUGGEST=0`.

## Bloque D1 — Hook de inicio de sesión

### `hooks/session-start.mjs` — `SessionStart`

Autocontextualiza la sesión, siempre de forma no bloqueante y con presupuesto de tiempo acotado (~5 s en total; si algo tarda más, se omite en silencio):

1. Detecta el proyecto: nombre de la carpeta del repo actual (`git rev-parse --show-toplevel`, con fallback al cwd).
2. **Graphify:** si existe `.ua/knowledge-graph.json` en el repo, emite un resumen compacto — número de nodos y aristas, las capas/tipos principales y los 10 nodos de mayor complejidad o grado. No vuelca el grafo entero.
3. **RAG:** si el MCP `rag` está configurado y la base responde, ejecuta `rag.mjs query "<nombre del proyecto>" --proyecto <nombre> --topk 3` y emite los resultados. Si la base no responde, se omite sin avisar (Docker apagado es un caso normal).
4. Emite todo como un único bloque de contexto, con una cabecera que deja claro que es contexto automático de CLAUDEMAX.

Escape: `CLAUDEMAX_SESSION_CONTEXT=0`. Localización del `rag.mjs`: variable `CLAUDEMAX_RAG_DIR`, con fallback a buscar `R.A.G/rag.mjs` subiendo desde el cwd.

## Bloque D2 — Rituales manuales

Script nuevo `templates/rag/ritual.mjs` (vive junto a `rag.mjs` porque reutiliza su configuración y su acceso a la base):

```bash
node ritual.mjs init-proyecto <ruta> [--categoria codigo] [--proyecto nombre]
node ritual.mjs fin-sesion [--resumen "texto"] [--proyecto nombre] [--siguiente "texto"]
node ritual.mjs fin-dia [--resumen "texto"]
node ritual.mjs fin-ciclo [--ciclo "sprint-12"]
```

### `init-proyecto <ruta>`

- Crea `<ruta>/.claude/` si no existe.
- Copia `templates/rules/proyecto.md` a `<ruta>/.claude/CLAUDEMAX.md`, sustituyendo los huecos: nombre del proyecto, fecha, ruta del vault y del RAG.
- Crea (o añade la línea `@CLAUDEMAX.md` a) `<ruta>/.claude/CLAUDE.md`.
- Crea la nota del proyecto en el vault: `V.A.U.L.T/Proyectos/<nombre>/00-indice.md` con el frontmatter de taxonomía relleno (`categoria: proyectos`, `proyecto: <nombre>`).
- Nunca sobrescribe archivos existentes: si algo ya está, lo respeta y lo informa.

### `fin-sesion` (ritual menor)

> Añadido 2026-08-02, junto con el refinamiento de la semántica de categorías — ver
> `2026-08-01-taxonomia-backends-skills-design.md`.

- Escribe una nota nueva en `V.A.U.L.T/00-Inbox/YYYY-MM-DD-HHMM-<proyecto>.md` con
  frontmatter (`categoria: personal`, tag `personal/sesion`, `proyecto: <detectado o pasado>`).
- Detecta el proyecto igual que `hooks/session-start.mjs` (`git rev-parse --show-toplevel`,
  fallback al cwd); `--proyecto` lo sobrescribe.
- Contenido: título con proyecto y hora, sección "Qué se hizo" (`--resumen`), sección
  "Siguiente paso" (`--siguiente`) si se pasa. Sin `--resumen`, escribe una plantilla vacía
  lista para rellenar a mano en vez de fallar.
- Dos ejecuciones en el mismo minuto no se pisan: la ruta se resuelve con sufijo `-2`, `-3`...
  si el nombre base ya existe.
- **No** dispara reindexado del RAG ni reconstrucción de Graphify, igual que `fin-dia`.
- Es el ritual de continuidad *entre sesiones*; `fin-dia` es la bitácora del *día completo*
  — no son intercambiables.

### `fin-dia` (ritual menor)

- Escribe/actualiza `V.A.U.L.T/Journal/YYYY-MM-DD.md` con frontmatter (`categoria: personal`, tag `personal/bitacora`, `proyecto: <detectado o journal>`).
- Contenido: cabecera del día, y si se pasa `--resumen`, lo añade como sección. Si el archivo ya existe, **añade** una entrada con la hora en vez de sobrescribir.
- **No** dispara reindexado del RAG ni reconstrucción de Graphify — es la diferencia deliberada con el ritual mayor, para ahorrar cómputo.
- Recuerda al final que el contenido se indexará en el próximo `ingest`.

### `fin-ciclo` (ritual mayor)

- Es un ritual **con confirmación**: imprime lo que va a hacer y exige `--si` (o responder `si` por stdin si es interactivo) antes de ejecutar, porque reindexa toda la base.
- Escribe la nota de cierre de ciclo en `V.A.U.L.T/Proyectos/<proyecto>/ciclos/<ciclo>.md`.
- Ejecuta `rag.mjs reindex` (respetando `EMBED_BACKEND`; sugiere `--backend kaggle` si hay muchos documentos y las credenciales están configuradas).
- Recuerda ejecutar `/understand` en cada repo activo para regenerar los grafos, y vuelve a ingerirlos.
- Imprime un resumen final: documentos indexados por categoría.

### Skill `skills/rituales/`

Skill 2.0 (`kind: tool`) que documenta los cinco rituales, cuándo se disparan y los comandos exactos. Es lo que el modelo lee cuando el usuario dice "terminamos por hoy" o "cerramos el sprint". Triggers bilingües: "fin de sesión", "cerramos la sesión", "end of session", "retomar el hilo", "dónde quedamos", "fin del día", "terminamos por hoy", "end of day", "cierre de ciclo", "fin de sprint", "context dump", "nuevo proyecto", "init project".

## Bloque E3/D3 — Componente del instalador

Componente nuevo `bin/components/rules.sh` (id `rules`), **último** en el orden:

- Copia `templates/rules/` a `<RAG_ROOT>/.claude/` (requiere `RAG_ROOT`; si falta, avisa y se omite igual que `rag`).
- Si `<RAG_ROOT>/.claude/CLAUDE.md` ya existe, no lo pisa: solo le añade la línea `@CLAUDEMAX.md` si falta.
- Copia los cuatro hooks nuevos a `$CLAUDE_CONFIG_DIR/hooks/` y los registra con `ac_merge_hook`:
  - `PreToolUse` / `Bash` → `node <hooks>/git-footer-guard.mjs`
  - `PostToolUse` → `node <hooks>/loop-breaker.mjs`
  - `UserPromptSubmit` → `node <hooks>/skill-suggest.mjs`
  - `SessionStart` → `node <hooks>/session-start.mjs`
- Copia `templates/rag/ritual.mjs` junto a `rag.mjs` (lo hace el componente `rag`, no este).
- `uninstall.sh`: elimina los cuatro archivos y sus entradas de `settings.json` con `ac_remove_hook`. **No** borra `<RAG_ROOT>/.claude/` (contiene reglas que el usuario pudo editar).

La skill `rituales` se instala por `dev-skills.sh` como una skill propia más; el validador pasa a `OK (6 skills)`.

## Verificación

1. `node skills/validate-skills.mjs` → `OK (6 skills)`.
2. `bash -n` de todo y `node --check` de los cuatro hooks + `ritual.mjs`; dry-runs `--all`, `--only rules` y `uninstall --dry-run` en verde.
3. **git-footer-guard**: alimentar por stdin un evento con `git commit -m "feat: x\n\nCo-authored-by: Claude <...>"` → decisión de bloqueo; un `git commit` limpio → pasa; un `ls` → pasa; con `CLAUDEMAX_GIT_GUARD=0` → pasa siempre.
4. **loop-breaker**: tres eventos con el mismo error → el tercero emite el aviso; un error distinto no lo dispara; un éxito intermedio reinicia el contador.
5. **skill-suggest**: prompt con "vamos a hacer esto en WinUI 3" → un aviso; el mismo prompt otra vez en la misma sesión → nada; prompt sin tecnología nueva → nada.
6. **session-start**: en un repo con `.ua/knowledge-graph.json` → emite el resumen del grafo; sin base de datos levantada → no falla ni tarda; con `CLAUDEMAX_SESSION_CONTEXT=0` → no emite nada.
7. **ritual.mjs**: `init-proyecto` sobre una carpeta temporal crea `.claude/` y la nota del vault sin pisar nada; `fin-sesion` sin argumentos escribe una plantilla vacía y dos ejecuciones seguidas no se pisan (sufijo `-2`); `fin-dia` dos veces el mismo día añade dos entradas al mismo archivo; `fin-ciclo` sin `--si` no reindexa.

## Fuera de alcance

- Wizard interactivo del instalador (sub-spec propia pendiente).
- Cualquier automatización que dispare `fin-dia` o `fin-ciclo` sola: ambos son deliberadamente manuales.
