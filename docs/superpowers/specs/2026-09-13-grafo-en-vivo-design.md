# Grafo de código en vivo — Especificación de Diseño (Sub-proyecto 3 de la mezcla con el setup de trabajo)

**Fecha:** 2026-09-13
**Padre:** [Vault + RAG v2](2026-09-13-vault-rag-v2-design.md) (preámbulo con las decisiones globales)
**Estado:** Diseño aprobado

## Objetivo

Que la estructura del código (qué llama a qué, qué hereda de qué) se consulte **en vivo** desde dos
MCP registrados una sola vez — `graphify` y `codebase-memory` — en vez de volcarse al vault (lo que
el setup de trabajo midió como 257 notas de ruido y retiró). Completa el orden de herramientas de
contexto que ya inyecta el recordatorio `orden-herramientas`: rag → graphify → codebase-memory →
grep.

## Por qué así

- **graphify sirve un solo `graph.json` por servidor.** Registrarlo por proyecto (como hacía el
  setup de trabajo en su `.mcp.json`) obliga a abrir Claude Code desde la raíz del workspace y a
  tocar configuración por cada repo. Un **envoltorio** que localiza el grafo del proyecto actual y
  lanza el servidor real elimina el registro por proyecto: Claude Code pasa `CLAUDE_PROJECT_DIR`
  al proceso del MCP ("para resolver rutas del proyecto sin depender del cwd", según la
  documentación de MCP de Claude Code), y el envoltorio cae a `process.cwd()` si falta.
- **codebase-memory es multi-proyecto por diseño** (índice en `~/.cache/codebase-memory-mcp/`,
  parámetro `--project`): un registro a nivel usuario basta. Se instala con `npm install -g`
  porque Node ya es requisito de CLAUDEMAX — un runtime menos, y `npm uninstall -g` lo revierte.
- **`graphify claude install` se retira**: su hook `PreToolUse` sugería consultar el grafo antes
  de `Grep`/`Read` — lo mismo que hoy hace el recordatorio `orden-herramientas`, con texto propio
  — y escribía `.claude/settings.json` + una sección de `CLAUDE.md` **dentro del repo** desde el
  que se ejecutaba, contra la regla "contexto fuera de los repos".

Fuentes: [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) (Apache-2.0; MCP con
`python -m graphify.serve <graph.json>`, tools `query_graph`, `get_node`, `get_neighbors`,
`shortest_path`, `list_prs`, `get_pr_impact`, `triage_prs`) y
[DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) (MIT; binario
único, 158 lenguajes; `npm install -g codebase-memory-mcp`; `cli index_repository --repo-path
<abs>`; caché `~/.cache/codebase-memory-mcp/`, override `CBM_CACHE_DIR`).

## 1. Componente `graphify` rediseñado (`bin/components/graphify.sh`)

1. Instala el CLI `graphifyy` como hoy: `uv tool install` → `pipx install` → `pip install --user`,
   idempotente (`graphify --version` responde y no hay `--force` → omite).
2. **Retira** `graphify claude install`. Limpieza best-effort de lo que dejó una instalación
   anterior en el repo de CLAUDEMAX: si `$AC_REPO_DIR/CLAUDE.md` tiene una sección `## graphify`,
   se elimina esa sección; si `$AC_REPO_DIR/.claude/settings.json` tiene hooks cuyo comando
   contenga `graphify hook-guard`, se quitan con `ac_remove_hook`. Sin `--force` no toca nada
   más; avisa de lo que quitó.
3. Copia `templates/mcp/graphify-auto.mjs` y `templates/mcp/graphify-auto-lib.mjs` a
   `$CLAUDE_CONFIG_DIR/mcp/` y registra `claude mcp add -s user graphify -- node <ruta absoluta>/graphify-auto.mjs`. Si `graphify`
   ya está registrado: con `--force` lo reemplaza (`claude mcp remove graphify` antes); sin él,
   avisa y respeta.
4. Mensaje final: "genera el grafo de cada proyecto con `graphify extract . --code-only` dentro del
   repo" (sin API key de LLM, `graphify .` falla con los `.md` — lección del setup de trabajo).

### El envoltorio `templates/mcp/graphify-auto.mjs`

Node puro, sin dependencias (vive en `$CLAUDE_CONFIG_DIR/mcp/`, no puede importar nada del repo).

**Resolución del grafo**, en orden: `GRAPHIFY_GRAPH` (ruta a un `graph.json`; pruebas y casos
raros) → `$CLAUDE_PROJECT_DIR/graphify-out/graph.json` → subiendo desde `process.cwd()` hasta 6
niveles buscando `graphify-out/graph.json`.

**Resolución del servidor**, en orden: `graphify-mcp` en el `PATH` (entrypoint del paquete; el
setup de trabajo usaba `graphify-mcp.exe`) → `python -m graphify.serve` → `py -3 -m graphify.serve`.
Se comprueba con `spawnSync(cmd, ["--help"])` (o `python -c "import graphify.serve"`), 3 s de tope.

**Con grafo y servidor:** `spawn(servidor, [...args, rutaDelGrafo], { stdio: "inherit" })` —
proxy transparente; el envoltorio termina con el código de salida del hijo y reenvía `SIGTERM`.

**Sin grafo o sin servidor:** mini-servidor MCP de aviso por stdio (JSON-RPC 2.0, una línea por
mensaje):

| Método | Respuesta |
|---|---|
| `initialize` | `{ protocolVersion: <la del cliente>, capabilities: { tools: {} }, serverInfo: { name: "graphify-auto", version: "1.0.0" } }` |
| `notifications/initialized` | (sin respuesta) |
| `ping` | `{}` |
| `tools/list` | una tool `graphify_estado` ("Diagnóstico del grafo de código de este proyecto y cómo generarlo") sin parámetros |
| `tools/call` `graphify_estado` | texto: `Sin grafo: no existe graphify-out/graph.json en <proyecto>. Genera el grafo con: graphify extract . --code-only` **o** `graphify no está instalado (falta graphify-mcp y python -m graphify.serve). Instálalo con: uv tool install graphifyy (o pipx install graphifyy / pip install --user graphifyy) y vuelve a abrir la sesión.` |
| cualquier otro método con `id` | error `-32601 método no soportado` |

Así el MCP `graphify` nunca aparece caído en `/mcp` y el modelo recibe la instrucción exacta en vez de
un error opaco. El envoltorio nunca escribe por stderr salvo `GRAPHIFY_AUTO_DEBUG=1`.

## 2. Componente nuevo `codebase-memory` (`bin/components/codebase-memory.sh`)

1. `npm install -g codebase-memory-mcp` (idempotente: si `codebase-memory-mcp --version` responde y
   no hay `--force`, omite). Sin `npm` → avisa y omite.
2. `claude mcp add -s user codebase-memory -- codebase-memory-mcp`. Nombre `codebase-memory`: el
   que usan los recordatorios y el setup de trabajo. Ya registrado: `--force` reemplaza; sin él,
   avisa y respeta. Sin CLI `claude` → avisa con el comando manual.
3. **No indexa nada** en la instalación: el indexado es por proyecto y lo disparan `init-proyecto`
   (sub-proyecto 4) y `fin-ciclo` (5) con
   `codebase-memory-mcp cli index_repository --repo-path <abs> --mode moderate`.
   **Nunca `--persistence`**: escribe `.codebase-memory/graph.db.zst` (todo el código propietario
   comprimido) dentro del repo. El índice vive en `~/.cache/codebase-memory-mcp/`
   (`CBM_CACHE_DIR` para moverlo).
4. Mensaje final con la advertencia del setup de trabajo (2026-08-20): "`index_status: ready`
   significa que hay un índice, no que esté al día — reindexa al cerrar ciclo o cuando
   `search_graph` no encuentre algo recién escrito".
5. `ALL_COMPONENTS` de `bin/install.sh`: `codebase-memory` entra después de `graphify` y antes de
   `rules` (rules va último). `bin/wizard/wizard.mjs`: fila en la tabla de componentes.
   `bin/wizard/test-componentes.mjs` verifica la sincronía.
6. `bin/uninstall.sh`: `claude mcp remove codebase-memory` + `npm uninstall -g codebase-memory-mcp`;
   avisa que conserva `~/.cache/codebase-memory-mcp/` (índices; se borran a mano si se quiere).
   Para `graphify`: `claude mcp remove graphify` + `rm $CLAUDE_CONFIG_DIR/mcp/graphify-auto.mjs`
   y `graphify-auto-lib.mjs` (el CLI de graphify ya se desinstalaba antes; se mantiene).

## 3. Recordatorio `orden-herramientas`

`templates/recordatorios/orden-herramientas.md`, punto 2, gana una frase al final: "`codebase-memory`
NO se refresca solo: `ready` significa que hay un índice, no que esté al día. Si `search_graph` no
encuentra algo recién escrito, reindexa (`index_repository`) antes de concluir que no existe."
Solo cambia la plantilla del repo; el archivo instalado en `<RAG_ROOT>/.claude/recordatorios/` es
del usuario y no se pisa (quien quiera la frase la copia).

## 4. Documentación

- `README.md`: fila `graphify` reescrita (CLI + MCP envoltorio; sin `claude install`) y fila nueva
  `codebase-memory` en la tabla de componentes; sección "Grafo de código en vivo" tras "Reglas
  operativas": los tres peldaños con sus tools (`rag_query`/`rag_leer` · `query_graph`/`get_node`/
  `get_neighbors`/`shortest_path` · `search_graph`/`trace_path`/`get_code_snippet`/`search_code`),
  cuándo regenerar cada índice (`graphify extract . --code-only`, `index_repository`, `rag.mjs
  ingest`) y la regla "lo generado se queda en su herramienta; lo narrado va al vault". Sección
  Privacidad: `npm install -g codebase-memory-mcp`.
- `INSTALL.md`: árbol (`templates/mcp/graphify-auto.mjs`, `templates/mcp/test/`,
  `bin/components/codebase-memory.sh`), párrafo del componente 11, troubleshooting: "`/mcp` muestra
  `graphify` conectado pero solo tiene la tool `graphify_estado` → no hay grafo en este proyecto o
  graphify no está instalado; la tool dice cuál de las dos".
- `docs/superpowers/specs/2026-09-13-vault-rag-v2-design.md`: nada (la fila 3 de la descomposición
  ya describe esto).

## 5. Errores

| Situación | Comportamiento |
|---|---|
| Sesión en un proyecto sin `graphify-out/graph.json` | MCP `graphify` conectado; única tool `graphify_estado` con la instrucción de generar el grafo |
| graphify no instalado (pip/uv/pipx fallaron) | Igual, con la instrucción de instalar; el componente avisa y no falla |
| `CLAUDE_PROJECT_DIR` ausente (cliente antiguo) | cae a `process.cwd()` |
| `graphify-mcp` muere o sale con error | el envoltorio sale con su código; Claude Code lo marca caído — no se enmascara |
| `npm install -g` falla (permisos, red) | avisa con el comando manual y omite el registro |
| CLI `claude` ausente | avisa "registra a mano: `claude mcp add -s user …`" (mismo criterio que `rag`) |
| MCP ya registrado con otro comando | `--force` reemplaza; sin `--force` avisa y respeta |
| `CLAUDE.md` del repo sin sección `## graphify` / sin `.claude/settings.json` | la limpieza no hace nada y no avisa |

## 6. Pruebas

`templates/mcp/test/graphify-auto.test.mjs` (`node --test`, sin red). El envoltorio exporta sus
funciones puras desde `templates/mcp/graphify-auto-lib.mjs` (que también se instala junto a él):

- **Resolución del grafo:** `GRAPHIFY_GRAPH` > `CLAUDE_PROJECT_DIR` > cwd subiendo; fixture con
  `proy/graphify-out/graph.json` y cwd en `proy/src`; sin nada → `null`.
- **Resolución del servidor:** con un `graphify-mcp` falso en un `PATH` temporal → `{ cmd, args }`
  con ese binario; sin él y con `python` inexistente en el `PATH` temporal → `null`.
- **Mini-servidor de aviso, extremo a extremo por stdin** (proceso hijo, sin grafo): `initialize` →
  `serverInfo.name === "graphify-auto"`; `tools/list` → `["graphify_estado"]`; `tools/call` →
  texto con `graphify extract . --code-only`; `notifications/initialized` → sin respuesta; `ping`
  → `{}`; método desconocido → error `-32601`. Y la variante "sin servidor" (grafo presente, PATH
  vacío) → texto con `uv tool install graphifyy`.
- **Proxy:** con un `graphify-mcp` falso (script Node que imprime `argv` y sale 0) en el `PATH` →
  el envoltorio lo lanza con la ruta del grafo como último argumento, reenvía su salida y sale 0;
  si el falso sale 3 → el envoltorio sale 3.
- **Instalador:** `bin/wizard/test-componentes.mjs` en verde con `codebase-memory` en
  `ALL_COMPONENTS`; dry-run de `--only graphify --only codebase-memory` muestra
  `claude mcp add -s user graphify` y `claude mcp add -s user codebase-memory` y **no** muestra
  `graphify claude install`; dry-run del uninstall muestra ambos `claude mcp remove`.

## 7. Fuera de alcance

Indexado automático en `init-proyecto` y `fin-ciclo` (sub-proyectos 4 y 5); la ruta del grafo en
`Hubs/<Proyecto>.md` (4); `.mcp.json` por workspace; hook `PostToolUse` propio que sustituya al
`hook-guard` de graphify (lo cubre el recordatorio); soporte de `graphify serve --transport http`.
