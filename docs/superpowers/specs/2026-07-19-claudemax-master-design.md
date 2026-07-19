# CLAUDEMAX — Especificación de Diseño Maestra de la Actualización

**Fecha:** 2026-07-19
**Estado:** Diseño maestro que cubre toda la actualización de ABSOLUTE-CLAUDE → CLAUDEMAX. El subproyecto A tiene su propia especificación aprobada ([2026-07-19-skills-2.0-migration-design.md](2026-07-19-skills-2.0-migration-design.md)); los subproyectos B–E tendrán su propia especificación detallada antes de implementarse, usando este documento como fuente de verdad para el alcance y las decisiones.

## Visión

Evolucionar ABSOLUTE-CLAUDE hacia **CLAUDEMAX**: un entorno de desarrollo consciente del contexto, impulsado por RAG. El conocimiento vive en un vault de Obsidian y una base de datos vectorial local; las sesiones se autocontextualizan al arrancar; los manejadores de contexto legados (repo-map, dcp-lite, Context7, Claude-Mem) quedan obsoletos en favor del cerebro RAG; todos los skills propios pasan al formato Skills 2.0 (config YAML + JSON Schema).

## Disposición del workspace raíz

**Nomenclatura:** este repo se renombra **CLAUDEMAX** (carpeta local + repositorio de GitHub). La carpeta raíz del workspace se **crea automáticamente mediante el wizard de instalación en la ubicación que elija el usuario** (nombre por defecto: `WORKSPACE`). El wizard es el único punto de entrada: al usuario le basta con el instalador para terminar con todo lo de abajo.

```
<chosen-root>/              # created by the wizard where the user picks (default: WORKSPACE)
├── V.A.U.L.T/              # Obsidian vault — STRICTLY markdown notes, nothing else
├── R.A.G/                  # vector DB + retrieval components (PGVector, Ollama, ingestion)
├── .claude/                # shared rules for sessions launched from the root
├── CLAUDEMAX-INSTALLER.cmd # setup wizard launcher (a file at the root, NOT a folder)
├── CLAUDEMAX-UNINSTALLER.cmd
├── <ProjectRepo1>/         # individual project code repositories
└── <ProjectRepo2>/
```

El propio repo de CLAUDEMAX (fuente del wizard, skills, componentes) vive donde se haya clonado — actualmente `Desktop\WORKSPACE\Herramientas\` — y el wizard se autoarranca (clone-and-run, como el actual modo curl de `install.sh`), así que su ubicación es irrelevante para los usuarios finales.

- **V.A.U.L.T** está dividido visual y lógicamente por proyecto mediante el código de color de Obsidian (grupos de color en graph-view asociados a la etiqueta del proyecto), con subcolores para subtemas dentro de cada proyecto (tags anidados, p. ej. `#proj-alpha/api`).
- **R.A.G** contiene la infraestructura vectorial y los scripts de ingesta/consulta; nunca notas.
- **.claude/** en la raíz lleva las reglas base; el ritual de inicialización de proyecto (subproyecto D) las propaga al `.claude/` propio de cada nuevo repo de proyecto.

## Subproyectos y orden

| # | Subproyecto | Estado | Depende de |
|---|---|---|---|
| A | Migración y poda a Skills 2.0 | Especificación aprobada | — |
| B | Workspace CLAUDEMAX + stack RAG | Esta spec maestra → spec propia | — |
| C | Integraciones de herramientas | Esta spec maestra → spec propia | A (formato de skill), B (los parsers alimentan el RAG) |
| E | Reglas operativas | Esta spec maestra → spec propia | — (barata, puede intercalarse) |
| D | Rituales de ciclo de vida | Esta spec maestra → spec propia | B, C (consulta lo que construyen) |

Orden de implementación: **A → B → C → E → D**.

## A — Migración a Skills 2.0 (aprobado, resumido)

Ver la [spec dedicada](2026-07-19-skills-2.0-migration-design.md). Resultados clave:

- Formato: SKILL.md (descubrimiento) + sidecars `skill.yaml` + `schema.json`, validador `validate-skills.mjs`.
- Inventario final: `architecture-principles` (fusión física de solid + design-patterns + architecture-patterns), `conventional-commits`, `ui-ux-pro-max` (fork propio que consolida Taste, Frontend Design, Webarticast, Brand Guidelines + sección de motion para transiciones con Framer Motion + GSAP).
- Eliminados: `repo-map` (→ Graphify, subproyecto C) y `dcp-lite` por completo (el cerebro RAG asume el contexto/memoria).
- Política de modelos ya vigente en `~/.claude/CLAUDE.md`: los spawns de Agent para desarrollo dirigido por subagentes usan Sonnet 5; las revisiones de código permanecen en la sesión actual con el modelo activo (Fable 5 / Opus 4.8).

## B — Workspace + stack RAG

**Vault de Obsidian (V.A.U.L.T):**
- Solo notas markdown. Una carpeta por proyecto, taxonomía de tags `#<project>/<subtopic>`.
- Grupos de color en graph-view: un color base por proyecto, subcolores por tag de subtema. La configuración se commitea como parte del vault (`.obsidian/graph.json`) para que el esquema sobreviva a las reinstalaciones.

**RAG (R.A.G):**
- **Embeddings:** locales vía Ollama (modelo open-source; candidato `nomic-embed-text` — elección final en la sub-spec B tras hacer benchmarking en el hardware del usuario).
- **Almacén vectorial:** PostgreSQL + PGVector. El modo de despliegue (contenedor Docker vs instalación nativa en Windows) se decide en la sub-spec B.
- **Pipeline de ingesta:** archivo fuente → parser (MarkItDown para archivos estándar, `opendataloader-pdf` para PDFs, Whisper para audio) → markdown → chunk → embed (Ollama) → upsert en PGVector. Las notas del vault se ingieren directamente (ya son markdown).
- **Interfaz de consulta:** un punto de entrada de recuperación invocable desde sesiones de Claude Code (script CLI vs servidor MCP local — se decide en la sub-spec B; se prefiere MCP si los hooks de SessionStart pueden consumirlo limpiamente).
- Todos los scripts de R.A.G siguen la convención del repo: sin dependencias cuando sea posible, Node o Python, sin llamadas a la nube — totalmente local.

## C — Integraciones de herramientas

Nuevos componentes instalados por CLAUDEMAX-INSTALLER (cada uno como un `ac_component_<id>` siguiendo la arquitectura existente del instalador):

| Herramienta | Propósito | Fuente |
|---|---|---|
| **Graphify** (Understand-Anything) | Grafos de conocimiento interactivos del codebase; reemplaza a repo-map; su salida se lee en SessionStart | github.com/Egonex-AI/Understand-Anything |
| **Cyber Neo** | Escaneo de vulnerabilidades y auditorías de seguridad OWASP 2025 / CWE Top 25 | github.com/Hainrixz/cyber-neo |
| **opendataloader-pdf** | Parsing de PDF (también alimenta la ingesta del RAG) | github.com/opendataloader-project/opendataloader-pdf |
| **MarkItDown** | Parsing general de archivo → markdown (también alimenta la ingesta del RAG) | Open source de Microsoft |
| **Whisper** | Transcripción de audio (también alimenta la ingesta del RAG) | Open source de OpenAI, ejecutado localmente |
| **Meta-dev skill** | "Skill Creator + MCP Builder" unificado: crear Skills 2.0 y servidores MCP como un único flujo, en formato Skills 2.0 | propio, nuevo |

Se conservan tal cual: superpowers (obra/superpowers), Figma MCP (https://mcp.figma.com/mcp), 21st.dev Magic MCP (`npx -y @21st-dev/magic@latest`), proxy RTK (rtk-ai/rtk), Caveman.

Eliminados del ecosistema: Context7 y Claude-Mem (entran en conflicto con el cerebro RAG; no están presentes en este repo — la sub-spec C incluye un barrido del entorno para eliminarlos de `~/.claude/` si se encuentran).

## D — Rituales de ciclo de vida

Todos implementados como hooks de Claude Code (registrados en settings.json vía el merger JSONC existente `ac_merge_hook`) más reglas de CLAUDE.md donde un hook no pueda expresar el comportamiento:

| Ritual | Disparador | Comportamiento |
|---|---|---|
| **Inicio de sesión** | Hook SessionStart | Consultar el RAG para el contexto del proyecto + leer la última salida de Graphify; inyectar ambos como contexto de la sesión |
| **Inicialización de nuevo proyecto** | El usuario crea un proyecto (skill/comando) | Generar `.claude/` dentro del nuevo repo: reglas base (conventional-commits, política de modelos, reglas operativas) + contexto específico del proyecto |
| **Fin de día (menor)** | El usuario indica el fin de la jornada | Escribir una nota de log/diario diario en V.A.U.L.T. NO disparar el re-indexado del RAG ni la reconstrucción de Graphify (ahorro de cómputo) |
| **Fin de ciclo (mayor)** | El usuario indica el fin de un sprint/ciclo | Pedir al usuario que ejecute el **Context Dump Ritual**: indexar de forma permanente todo el conocimiento acumulado en el RAG y el vault; reconstruir Graphify |

## E — Reglas operativas

Viven en las reglas de `.claude/` en la raíz de WORKSPACE (propagadas a los proyectos por el ritual de inicialización) y, donde sea posible, como hooks:

- **Freno de bucle a los 3 intentos:** tras 3 intentos fallidos de arreglar el mismo error, DETENERSE; resumir el contexto para el usuario y esperar entrada manual en vez de quemar tokens.
- **Commits de git:** siempre eliminar cualquier footer "Co-authored-by: Claude" de los commits generados (regla + hook opcional de commit-msg para reforzarlo).
- **Ahorro de tokens / búsqueda de skill:** cada vez que entra en la conversación un lenguaje, framework o técnica nuevos (C#, .NET, WinUI 3, XAML, Python, …), pausar y preguntar: "¿Quieres que busque/cree un Skill 2.0 específico para esta tecnología, o seguimos sin él para ahorrar tokens?" — incluyendo una breve advertencia sobre las contrapartidas de omitir el skill.
- **Política de modelos:** los spawns de Agent para desarrollo dirigido por subagentes usan Sonnet 5; las revisiones de código permanecen en la sesión actual con el modelo activo (Fable 5 / Opus 4.8). Ya aplicado en el `~/.claude/CLAUDE.md` del usuario, pero la copia canónica DEBE distribuirse dentro del repo de CLAUDEMAX (plantillas de reglas instaladas por el wizard en el `.claude/` raíz y propagadas a los proyectos) — igual que cada regla de esta sección. El repo, no ninguna configuración personal, es la fuente de verdad.
- **Idioma:** TODO el contenido del proyecto en español — README, INSTALL, specs, planes, comentarios de código, mensajes del instalador y salidas al usuario. Skills en modo bilingüe: cuerpo en español, triggers/descriptions con keywords en inglés Y español para el matching del modelo. Identificadores de código y términos técnicos quedan en inglés. Los tipos de Conventional Commits (feat/fix/docs...) quedan en inglés; el subject del commit en español.
- La herramienta de memoria legada (Context7 / Claude-Mem) no debe reinstalarse; el cerebro RAG es la única fuente de retención de contexto.

## Instalador interactivo (setup wizard)

La actualización reemplaza la UX de `install.sh` basada en flags por un **setup wizard interactivo, tipo aplicación**:

- **Punto de entrada:** archivos lanzadores colocados en la raíz elegida (`CLAUDEMAX-INSTALLER.cmd` + `CLAUDEMAX-UNINSTALLER.cmd`) — archivos, no carpetas. Invocan al wizard distribuido dentro del repo de CLAUDEMAX; el wizard también se autoarranca para usuarios primerizos (descargar → clonar → ejecutar).
- **Experiencia:** flujo visual paso a paso como el instalador de una app de escritorio — pantalla de bienvenida, **selector de destino** (el wizard crea la carpeta raíz donde el usuario elija, nombre por defecto `WORKSPACE`), checklist de dependencias con estado detectado/faltante en vivo, selección por componente (instalar todo o pieza por pieza), progreso por paso, resumen final. Tecnología recomendada: TUI en Node (menús basados en `readline` sin dependencias, convención del repo) — elección final en la sub-spec del instalador.
- **Paso de configuración del vault:** el usuario elige uno de tres modos para V.A.U.L.T — **(1) crear desde cero** (esqueleto + configuración de color de Obsidian), **(2) importar un vault existente** (apuntar a una carpeta, el wizard lo adopta y aplica las convenciones de tags/color de forma no destructiva), o **(3) conectar a un vault remoto** (vault sincronizado/alojado en Git: el wizard lo clona/enlaza).
- **Paso de configuración del RAG:** los mismos tres modos para R.A.G — **(1) crear desde cero** (esquema nuevo de PostgreSQL + PGVector, pull del modelo de Ollama), **(2) importar existente** (restaurar un dump de base de datos / reusar una instancia local existente), o **(3) conectar a remoto** (cadena de conexión a un servidor PostgreSQL+PGVector existente; los embeddings siguen siendo locales vía Ollama o apuntan a un endpoint remoto de Ollama).
- **Dependencias del sistema que detecta y ofrece instalar** (vía `winget` en Windows): Obsidian, Docker Desktop (+ WSL2 si falta), Ollama, PostgreSQL + PGVector (o la vía Docker), Git, Node.js, Python. Cada una es opcional y se puede omitir individualmente.
- **Luego los componentes de CLAUDEMAX:** todo lo de los subproyectos A/C (skills, MCPs, RTK, Caveman, Graphify, Cyber Neo, parsers) más el andamiaje raíz: esqueleto de V.A.U.L.T con configuración de color de Obsidian, esqueleto de R.A.G, reglas de `.claude/` raíz, hooks del subproyecto D.
- **Internos preservados:** los helpers `bin/lib/*`, `bin/components/*` con funciones `ac_component_<id>`, el merger JSONC de settings con backups `.bak`. El wizard orquesta estos mismos componentes; los flags no interactivos (`--all/--only/--skip/--dry-run/--force/--config-dir`) se mantienen para uso scripteado.

## Preguntas abiertas (insumos para las sub-specs, no bloqueantes para A)

1. **B:** elección final del modelo de embeddings; PGVector vía Docker vs nativo; interfaz de consulta del RAG (CLI vs servidor MCP local).
2. **Instalador:** tecnología final del wizard (se recomienda TUI en Node sin dependencias) e ids exactos de paquete `winget` por dependencia del sistema.
3. **C:** si Graphify y Cyber Neo se instalan como skills, servidores MCP o CLIs planas (depende de lo que distribuya el upstream).
4. **D:** eventos de hook exactos para las señales de "fin de día" / "fin de ciclo" (probablemente disparados por skill/slash-command en vez de automáticos).
5. **Instalador:** si los repos existentes bajo `WORKSPACE\` se mueven a `CLAUDEMAX/` o se quedan y se enlazan/referencian mediante symlink.

## Verificación maestra

1. Cada subproyecto pasa la verificación de su propia spec antes de que empiece el siguiente.
2. Smoke end-to-end tras D: ejecución limpia del setup wizard (`CLAUDEMAX-INSTALLER.cmd`, instalación completa) en un config dir limpio → una nueva sesión dentro de un repo de proyecto se autocontextualiza (consulta RAG + Graphify) → el diario de fin de día aterriza en V.A.U.L.T → el Context Dump Ritual indexa en PGVector.
3. `CLAUDEMAX-UNINSTALLER.cmd` elimina todo lo que instaló el wizard, incluidos los artefactos legados (repo-map, dcp-lite, restos de Context7/Claude-Mem); las dependencias del sistema (Obsidian, Docker, WSL) se listan pero se dejan para eliminación manual.
