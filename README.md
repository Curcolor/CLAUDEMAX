# CLAUDEMAX

Un solo comando bash. Todos los ahorradores de tokens, skills de UX/UI, el cerebro RAG y las herramientas de análisis para Claude Code, cableados y listos. El OAuth de Figma es el único paso manual.

En Windows, doble clic en `CLAUDEMAX-INSTALLER.cmd`. En macOS/Linux/WSL:

```bash
bash bin/install.sh
```

## Qué incluye

| Componente | Qué hace | Fuente |
|---|---|---|
| **RTK** | CLI proxy en Rust que filtra y comprime la salida de comandos de shell antes de que llegue al LLM. Cablea un hook de Claude Code. | [rtk-ai/rtk](https://github.com/rtk-ai/rtk) |
| **Figma MCP** | Servidor MCP remoto en `https://mcp.figma.com/mcp`, registrado con Claude Code. El OAuth es manual y basado en navegador. | [Figma docs](https://developers.figma.com/docs/figma-mcp-server/) |
| **skill ui-ux-pro-max** | Skill propia de inteligencia de diseño UI/UX — 50+ estilos, 161 paletas de color, 57 combinaciones tipográficas, 161 tipos de producto y 99 guías de UX en 10 stacks. Consolida lo que antes eran skills separadas (`frontend-design`, `brand-guidelines` y `taste`), incluidos 6 anti-patrones nuevos adaptados de `pbakaus/impeccable` (Apache-2.0: gradient text de relleno, plantilla hero-metric, tarjetas idénticas como andamio, hard-offset shadow fuera de contexto neobrutalista, monospace como disfraz, claro/oscuro por categoría en vez de por escena), además de guía de motion (Framer Motion, GSAP). Incluye el hook `PostToolUse` `ui-audit.mjs`: ~15 reglas deterministas que avisan por `system-reminder` al editar archivos de UI (`.css`/`.tsx`/`.jsx`/`.vue`/`.svelte`/`.html`), sin bloquear la edición; desactivable con `CLAUDEMAX_UI_AUDIT=0`. Incluida en este repo; no tiene repo upstream del que autoactualizarse. | propia (este repo) |
| **21st.dev magic MCP** | Generador de componentes en vivo de [21st.dev](https://21st.dev). | `@21st-dev/magic` (npx) |
| **Framer Motion + GSAP** | `npm install --save framer-motion gsap` en tu proyecto (se omite si no hay `package.json`). | [framer-motion](https://www.npmjs.com/package/framer-motion), [GSAP](https://gsap.com/docs/v3/) |
| **skill superpowers** | Clonada en `~/.claude/skills/superpowers/`. Paquete de meta-skills. | [obra/superpowers](https://github.com/obra/superpowers) |
| **Skills de disciplina de ingeniería** | Propias: `architecture-principles` (fusiona las antiguas skills `solid`, `design-patterns` y `architecture-patterns` en una sola skill SOLID → patrones GoF → arquitectura de sistemas), `conventional-commits`, `skill-mcp-builder` (meta-skill para crear Skills 2.0 y servidores MCP), `no-ai-slop` (anti-slop de *prosa* — documentación, README, artículos; fork propio traducido de `petergyang/no-ai-slop`, MIT. Actúa sobre texto que un humano leerá fuera de la sesión, nunca sobre las respuestas de la conversación) y `rituales` (documenta los cinco rituales de ciclo de vida de CLAUDEMAX — ver sección [Rituales](#rituales)). | este repo |
| **rag** | Vault V.A.U.L.T con taxonomía de 6 categorías con color + RAG con PGVector (Docker) + Ollama bge-m3 + backend de embeddings conmutable (`ollama`/`remote`/`kaggle`) + MCP `rag` (`rag_query`/`rag_status`, con filtros `categoria`/`proyecto`). `rag.mjs ingest` también indexa los grafos de conocimiento de Graphify (`graphify-out/graph.json`). También instala `ritual.mjs` junto a `rag.mjs` — los rituales manuales de ciclo de vida (`init-proyecto`/`fin-sesion`/`fin-dia`/`fin-ciclo`, ver sección [Rituales](#rituales)). Auto-instala Docker y Ollama vía winget si faltan. | propia (este repo) |
| **graphify** | CLI de Python (no un plugin del marketplace) que analiza el código con tree-sitter (+ un LLM opcional) y genera un grafo de conocimiento navegable del repo. `graphify extract .` produce `graphify-out/graph.json` (formato `node_link_data` de NetworkX: nodos con tipo/archivo/comunidad, aristas con relación/confianza), `graphify-out/graph.html` (dashboard interactivo) y `graphify-out/GRAPH_REPORT.md`. El instalador también corre `graphify claude install`, que registra un hook `PreToolUse` (matchers `Bash\|Grep` y `Read\|Glob`) que **sugiere** consultar el grafo antes de leer/grepear en crudo — nunca bloquea (se instala sin `--strict`). Sustituye al componente anterior, que por error instalaba el plugin de otro autor con nombre parecido. | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) (paquete PyPI `graphifyy`) |
| **ponytail** | Plugin de Claude Code que fuerza minimalismo al escribir código mediante una "escalera" de 7 peldaños (¿hace falta? → ¿ya existe en el repo? → ¿stdlib? → ¿feature nativa? → ¿dependencia ya instalada? → ¿cabe en una línea? → el mínimo que funcione). Trae 6 skills: `ponytail` (modo activo, niveles `lite`/`full`/`ultra`), `ponytail-review` (revisa el diff), `ponytail-audit` (repo completo), `ponytail-debt` (cosecha comentarios `ponytail:` en una libreta de deuda técnica), `ponytail-gain` y `ponytail-help`. No choca con Graphify: registra hooks `SessionStart`/`SubagentStart`/`UserPromptSubmit`, ninguno es `PreToolUse` (el único evento que usa Graphify). | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) |
| **cyber-neo** | Skill de auditoría de seguridad: OWASP 2025 Top 10 y CWE Top 25, escaneo de dependencias, secretos, SAST y configuración. Solo lectura; reporte en `~/Desktop/`. Clonada con commit fijado. | [Hainrixz/cyber-neo](https://github.com/Hainrixz/cyber-neo) |
| **parsers** | Ingesta de archivos para el RAG: **MarkItDown** (cualquier archivo → markdown, con MCP oficial `markitdown`), **opendataloader-pdf** (PDFs complejos) y **whisper-ctranslate2** (audio → texto, CPU). Auto-instala Python y el JDK vía winget si faltan. | [markitdown](https://github.com/microsoft/markitdown), [opendataloader-pdf](https://github.com/opendataloader-project/opendataloader-pdf), [whisper-ctranslate2](https://github.com/Softcatala/whisper-ctranslate2) |
| **rules** | Reglas operativas empaquetadas en el repo (`templates/rules/`) — no en la configuración personal de tu máquina — instaladas en `<RAG_ROOT>/.claude/`: `CLAUDEMAX.md` (las 7 reglas) y `proyecto.md` (plantilla por proyecto) se sobrescriben en cada instalación; `CLAUDE.md` nunca se pisa, solo se le añade `@CLAUDEMAX.md` si falta. Además instala y registra 4 hooks de cumplimiento y contexto: `git-footer-guard.mjs`, `loop-breaker.mjs`, `skill-suggest.mjs`, `session-start.mjs`. Ver sección [Reglas operativas](#reglas-operativas). Último componente en instalarse — sus reglas referencian rutas que crean los pasos anteriores. | propia (este repo) |

## Instalación

### Vía recomendada: wizard interactivo

**Doble clic en `CLAUDEMAX-INSTALLER.cmd` (Windows) es todo lo que hace falta** — no necesitas
tener nada instalado de antemano ni saber nada técnico. El propio `.cmd` comprueba si faltan
Node.js o Git for Windows (Git Bash) y, si es así, los instala él solo vía `winget` (pidiendo
confirmación primero); solo si `winget` no está disponible te pide instalar algo a mano, con la
URL exacta. Nunca se cierra de golpe: siempre espera una tecla al terminar, éxito o error. O,
si ya tienes Node instalado, invócalo directo:

```bash
node bin/wizard/wizard.mjs
```

Un asistente de 9 pasos que **orquesta** `bin/install.sh` en vez de reimplementarlo: recoge tus
decisiones, te enseña la línea de comando exacta que va a ejecutar y solo entonces la lanza.

1. Bienvenida.
2. Destino del workspace — crea la carpeta raíz que elijas (por defecto `WORKSPACE` en tu escritorio); se convierte en `RAG_ROOT`.
3. Tabla de dependencias con estado en vivo: `node`, `git`, `claude`, `docker`, `ollama`, `python`, `java`, `winget`.
4. Selección de componentes (los mismos diez de la tabla de arriba).
5. Vault: crear desde cero / importar uno existente / conectar a uno remoto.
6. RAG: los mismos tres modos, más Kaggle opcional (usuario y clave, la clave sin eco en pantalla).
7. Resumen auditable — la línea de comando completa con sus variables, antes de tocar nada.
8. Ejecución — stdout/stderr real de `bin/install.sh`, sin reformatear.
9. Resumen final y próximos pasos.

Flags propios del wizard (no confundir con los de `bin/install.sh` de más abajo): `--dry-run`
(simula sin cambiar nada), `--defaults` (acepta todos los valores por defecto, para reinstalar
rápido sin que pregunte nada — combinable con `--dry-run`), `--no-color` y `--uninstall` (ver
[Desinstalación](#desinstalación)). Detalle completo en [INSTALL.md](INSTALL.md#wizard-interactivo).

### Vía scripted: flags directos a `bin/install.sh`

Para automatización, CI, o si prefieres no pasar por el wizard — `bin/install.sh` sigue funcionando
exactamente igual que siempre; el wizard de arriba solo le pasa flags y variables de entorno, no
hay dos instaladores que mantener sincronizados. En Windows el punto de entrada normal es el
doble clic en `CLAUDEMAX-INSTALLER.cmd`; esta vía scripted es para macOS/Linux/WSL (o Windows con
Git Bash a mano):

```bash
# Desde un clon de este repo:
bash bin/install.sh

# O, una vez publicado, en una línea:
curl -fsSL https://raw.githubusercontent.com/Curcolor/CLAUDEMAX/main/bin/install.sh | bash
```

Re-ejecutable. Idempotente. Pasa `--dry-run` para ver exactamente qué haría.

## Flags

| Flag | Efecto |
|---|---|
| `--all` | Instala todos los componentes (por defecto). |
| `--only <id>` | Solo un componente. Repetible. ids: `rtk`, `figma`, `ui-ux`, `dev-skills`, `rag`, `graphify`, `ponytail`, `cyber-neo`, `parsers`, `rules`. |
| `--skip <id>` | Omite un componente. Repetible. |
| `--no-npm` | Omite `npm install framer-motion gsap`. |
| `--with-npm` | Fuerza el paso de npm aunque no haya `package.json` (ejecuta `npm init -y`). |
| `--dry-run` | Imprime cada comando. No toca nada. |
| `--force` | Reinstala componentes que se detectan a sí mismos como ya instalados. |
| `--config-dir <path>` | Sobrescribe `$CLAUDE_CONFIG_DIR` (por defecto `~/.claude`). |
| `--uninstall` | Delega en `bin/uninstall.sh`. |
| `--no-color` | Desactiva los colores ANSI. |

## Después de instalar

Solo quedan dos cosas, y una de ellas es simplemente reiniciar tu editor. La sesión ya se
autocontextualiza sola — no hace falta pedir nada: el hook `session-start` (presupuesto ~5s)
resume el grafo de Graphify del repo y consulta el RAG por el nombre del proyecto en cuanto
arranca la sesión; desactívalo con `CLAUDEMAX_SESSION_CONTEXT=0` si te resulta ruidoso.

1. **Reinicia Claude Code** — los hooks y skills se cargan al inicio de la sesión.
2. **Completa el OAuth de Figma**: abre Claude Code, ejecuta `/mcp`, selecciona `figma`, completa el flujo en el navegador. CLAUDEMAX no guarda tokens de Figma. (Este es el único paso que no podemos automatizar — el OAuth requiere navegador.)
3. Prueba los comandos:
   - `/superpowers` — paquete de meta-skills (obra/superpowers).
   - `architecture-principles`, `conventional-commits` — skills de disciplina de ingeniería. Invócalas por nombre o deja que sus triggers se disparen automáticamente durante una revisión/refactor/commit.
   - `ui-ux-pro-max` — inteligencia de diseño UI/UX. Se dispara automáticamente en prompts de diseño/construcción/revisión que toquen UI, o pídela por nombre.
   - `graphify extract .` — genera el grafo de conocimiento del proyecto actual (Graphify): `graphify-out/graph.json` + `graph.html`. Ábrelo con tu navegador para el dashboard interactivo.
   - `/ponytail-review` — revisa el diff actual con la escalera de minimalismo de Ponytail. `/ponytail-audit` hace lo mismo sobre el repo completo. `/ponytail-debt` cosecha los comentarios `ponytail:` que hayas dejado en el código.
   - `/cyber-neo <ruta>` — auditoría de seguridad OWASP/CWE del proyecto.
   - `skill-mcp-builder` — para crear nuevas Skills 2.0 o servidores MCP.
   - `no-ai-slop` — pide que audite o edite un borrador (README, artículo, mensaje) para quitarle "slop" de IA sin perder tu voz.
   - `rituales` — documenta los cinco rituales de ciclo de vida (ver sección [Rituales](#rituales)). Di "cerramos la sesión", "terminamos por hoy" o "cerramos el sprint" y deja que se dispare sola, o pídela por nombre.
   - Edita un `.tsx`/`.css`/`.vue`/`.html` — el hook `ui-audit.mjs` revisa el resultado y avisa por `system-reminder` si detecta anti-patrones de UI (gradient text de relleno, nombres placeholder, tarjetas idénticas, etc.). No bloquea nada; desactívalo con `CLAUDEMAX_UI_AUDIT=0` si te resulta ruidoso.
   - Intenta un `git commit` con un footer de atribución de IA — el hook `git-footer-guard.mjs` lo bloquea (ver sección [Reglas operativas](#reglas-operativas)).

## Ingesta de cualquier archivo

Los parsers convierten cualquier fuente a markdown en el Inbox del vault; después el RAG lo indexa:

```bash
# Documentos ofimáticos, HTML, imágenes, CSV, EPUB...
markitdown informe.docx -o <root>/V.A.U.L.T/00-Inbox/informe.md

# PDFs complejos (tablas, layout) — necesita JDK 11+
opendataloader-pdf contrato.pdf --format markdown

# Audio y video → transcripción (motor faster-whisper, funciona en CPU)
whisper-ctranslate2 reunion.mp3 --model base --language es \
  --output_dir <root>/V.A.U.L.T/00-Inbox

# Indexa todo el vault en PGVector
node <root>/R.A.G/rag.mjs ingest
```

MarkItDown también queda registrado como MCP (`markitdown`), así que puedes pedirle a Claude que convierta un archivo o URL sin salir de la sesión.

## Inicio rápido de RAG

```bash
RAG_ROOT=<workspace-root> VAULT_MODE=create RAG_MODE=create bash bin/install.sh --only rag
# luego:
cd <workspace-root>/R.A.G
node rag.mjs ingest          # indexa el vault
node rag.mjs query "..."     # búsqueda semántica (español o inglés)
node rag.mjs status
```

No hace falta memorizar estas variables: el wizard (`node bin/wizard/wizard.mjs`) pregunta el
destino del workspace, el modo de vault y el modo de RAG uno por uno y arma esta misma línea de
comando por ti — la enseña en su paso de resumen antes de ejecutarla.

`VAULT_MODE` / `RAG_MODE` toman cada una uno de tres valores (por defecto `create`):

- `create` — vault nuevo / stack local nuevo de Docker Postgres+pgvector.
- `import` — trae un vault existente (`VAULT_SRC=<folder>`) o restaura un dump de BD (`RAG_DUMP=<file>`) en un stack recién creado.
- `connect` — apunta a un repo de vault existente (`VAULT_REMOTE=<git url>`) o a una instancia de Postgres existente (`RAG_REMOTE_URL=<postgres://...>`) en vez de crear uno nuevo.

Necesita Docker (para la BD local) y Ollama con `bge-m3` descargado (para los embeddings) — el componente avisa y omite esos pasos si falta alguno, sin hacer fallar la instalación.

### Taxonomía de 6 categorías

Cada nota del vault lleva un frontmatter YAML con `categoria` (obligatoria) y `proyecto` (opcional: la clave transversal que relaciona notas de categorías distintas). Copia `_plantilla.md` para arrancar una nota nueva con el frontmatter ya listo:

```yaml
---
categoria: codigo          # una de las seis; obligatoria
proyecto: claudemax        # clave transversal: relaciona notas de distintas categorías
tags: [codigo/rag, codigo/pgvector]
fecha: 2026-08-01
fuente: informe.pdf        # opcional; lo rellenan los parsers
---
```

| Categoría | Color | Carpeta | Significado |
|---|---|---|---|
| `codigo` | `#4A90D9` azul | `Codigo/` | Repos, arquitectura, snippets, grafos de Graphify |
| `proyectos` | `#5CB85C` verde | `Proyectos/` | Planes, decisiones, sprints, specs |
| `organizacion` | `#9B59B6` morado | `Organizacion/` | Parte legal y conceptual de la organización: miembros y roles, estatutos, contratos, marca, procesos internos, clientes |
| `investigacion` | `#E8912D` naranja | `Investigacion/` | Lo que se pregunta e investiga para decidir algo: estilos de diseño, comparativas de herramientas, papers, PDFs parseados, transcripciones |
| `personal` (tag `personal/bitacora`) | `#E05C6E` rojo suave | `Journal/` | Bitácoras: registro cronológico del trabajo diario |
| `personal` (tag `personal/sesion`) | `#E05C6E` rojo suave | `00-Inbox/` | Lo último que se habló en cada sesión de Claude Code: continuidad de contexto entre sesiones (qué se hizo, en qué punto se quedó, qué sigue) |
| `aprendizaje` | `#17A2B8` turquesa | `Aprendizaje/` | Errores cometidos y su lección (postmortems), NO apuntes de tecnologías |

Si falta `categoria` en el frontmatter, `rag.mjs ingest` la infiere de la carpeta (`Codigo/` → `codigo`); si tampoco puede, la nota queda sin categoría y el ingestor avisa al terminar. `.obsidian/graph.json` trae un grupo de color por categoría para el grafo de Obsidian. Cada carpeta trae su propio `README.md` con ejemplos concretos de qué nota va ahí y qué no.

Filtra las consultas por categoría y/o proyecto (combinables):

```bash
node rag.mjs query "esquema de pgvector" --categoria codigo
node rag.mjs query "decisiones del sprint" --proyecto claudemax
node rag.mjs query "..." --categoria proyectos --proyecto claudemax --topk 10
```

`node rag.mjs status` agrupa el conteo de chunks por proyecto y por categoría. `rag.mjs ingest` también indexa los grafos de conocimiento de Graphify (`graphify-out/graph.json` que genera `graphify extract .`), aplanados a texto con `categoria: codigo` y `proyecto: <nombre del repo>`: el JSON alimenta al RAG para que el LLM entienda la arquitectura de un repo sin abrir archivos; `graphify-out/graph.html` sigue siendo el dashboard para el humano.

### Backends de embeddings

`EMBED_BACKEND` en `R.A.G/.env` elige quién calcula los vectores:

| Backend | Cuándo usarlo | Notas |
|---|---|---|
| `ollama` (por defecto) | Ollama corriendo en la misma máquina. | Es lo que deja funcionando `RAG_MODE=create`, sin configuración extra. |
| `remote` | **La alternativa recomendada** si tienes una GPU en otra máquina de tu red. | Idéntico a `ollama`: solo cambia `OLLAMA_URL` en `.env` a esa máquina (p. ej. `OLLAMA_URL=http://192.168.1.50:11434`). Cero fricción operativa, latencia de LAN. |
| `kaggle` | **Solo** para lotes grandes (`ingest`/`reindex --backend kaggle`). Nunca para consultas. | Batch asíncrono sobre una GPU T4 gratuita (minutos por lote), cuota ~30 h GPU/semana, y requiere una verificación telefónica manual **una sola vez** en kaggle.com → Settings → Phone Verification para habilitar GPU e Internet en los kernels. |

Regla dura: si `EMBED_BACKEND=kaggle` y ejecutas `query`, `rag.mjs` cae automáticamente a Ollama local y avisa una vez — Kaggle no puede responder en el bucle interactivo. Si el CLI `kaggle` no está instalado o faltan credenciales, `ingest --backend kaggle` avisa con el comando exacto a ejecutar y cae a Ollama en vez de fallar la ingesta.

Para habilitar Kaggle en la instalación:

```bash
KAGGLE_USERNAME=<usuario> KAGGLE_KEY=<key> RAG_ROOT=<root> bash bin/install.sh --only rag
```

El instalador escribe las credenciales en `.env` y en `~/.kaggle/kaggle.json`, y hace `pip install kaggle`; sin esas variables no toca nada de Kaggle — es estrictamente opcional. Antes de usarlo, completa a mano `KAGGLE_KERNEL_SLUG=<usuario>/claudemax-embed` en `.env` y el campo `id`/`dataset_sources` de `R.A.G/kaggle/kernel-metadata.json` con tu usuario real.

## Reglas operativas

Las reglas de trabajo no viven en la configuración personal de tu máquina — viven en el repo
(`templates/rules/`) y el componente `rules` las instala en `<RAG_ROOT>/.claude/CLAUDEMAX.md`
(y las propaga a cada proyecto vía el ritual `init-proyecto`, ver [Rituales](#rituales)). El
repo es la fuente de verdad: si necesitas cambiar una regla, edítala en `templates/rules/` y
reinstala — editar `<RAG_ROOT>/.claude/CLAUDEMAX.md` a mano se pierde en la siguiente instalación.

| # | Regla | Cómo se hace cumplir |
|---|---|---|
| 1 | **Idioma:** todo el contenido en español (docs, comentarios, mensajes, commits). Skills en modo bilingüe. Identificadores de código y tipos de Conventional Commits en inglés. | Convención — sin hook. |
| 2 | **Política de modelos:** los spawns de Agent para desarrollo dirigido por subagentes usan Sonnet 5 (`model: "sonnet"` explícito). Las revisiones de código nunca se delegan. | Convención — sin hook. |
| 3 | **Cortacircuitos de 3 intentos:** tras 3 intentos fallidos con el mismo error, PARAR, resumir al usuario y esperar su respuesta. | `hooks/loop-breaker.mjs` (avisa, no bloquea) |
| 4 | **Commits:** Conventional Commits, subject en español, y nunca un footer de atribución de IA (`Co-authored-by: Claude`, "Generated with Claude Code", 🤖...). | `hooks/git-footer-guard.mjs` (**bloquea** el commit) |
| 5 | **Ahorro de tokens / búsqueda de skills:** tecnología nueva sin Skill 2.0 instalada → preguntar al usuario si crear/buscar una, mencionando el compromiso. | `hooks/skill-suggest.mjs` (avisa, no bloquea) |
| 6 | **Memoria:** el cerebro RAG es la única fuente de retención de contexto entre sesiones. No reinstalar Context7 ni Claude-Mem. | Convención — sin hook. |
| 7 | **Taxonomía:** toda nota que se escriba en el vault lleva el frontmatter de categoría (ver `V.A.U.L.T/_plantilla.md`). | Convención — sin hook. |

Cuatro hooks Node sin dependencias hacen cumplir las reglas 3, 4 y 5 de forma determinista (y
`session-start.mjs` da contexto automático, ver [Rituales](#rituales)). Cada uno tiene su propia
variable de escape para desactivarlo sin desinstalar nada:

| Hook | Evento | ¿Bloquea? | Variable de escape |
|---|---|---|---|
| `git-footer-guard.mjs` | `PreToolUse` / `Bash` | **Sí** — el único de los cuatro que bloquea | `CLAUDEMAX_GIT_GUARD=0` |
| `loop-breaker.mjs` | `PostToolUse` | No, solo avisa (`system-reminder`) | `CLAUDEMAX_LOOP_BREAKER=0` |
| `skill-suggest.mjs` | `UserPromptSubmit` | No, solo avisa (una vez por sesión y tecnología) | `CLAUDEMAX_SKILL_SUGGEST=0` |
| `session-start.mjs` | `SessionStart` | No, solo aporta contexto | `CLAUDEMAX_SESSION_CONTEXT=0` |

## Rituales

Cinco rituales cubren el ciclo de vida completo de una sesión o proyecto: uno automático y
cuatro manuales que ejecuta `node R.A.G/ritual.mjs` (se instala junto a `rag.mjs`, mismo `.env`).
La skill `rituales` los documenta para que el modelo sepa cuándo invocarlos.

| Ritual | Cuándo | Comando |
|---|---|---|
| **Inicio de sesión** (automático) | Cada arranque de sesión, sin pedirlo. | — (hook `session-start.mjs`) |
| **Init de proyecto** | Repo/proyecto nuevo dentro del workspace. | `node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto]` |
| **Fin de sesión** (menor) | Al cerrar una sesión de trabajo, para que la siguiente retome el hilo. | `node R.A.G/ritual.mjs fin-sesion [--resumen "texto"] [--siguiente "texto"]` |
| **Fin de día** (menor) | "Terminamos por hoy", al cerrar la jornada completa. | `node R.A.G/ritual.mjs fin-dia [--resumen "texto"]` |
| **Fin de ciclo** (mayor) | "Cierre de ciclo" / "fin de sprint". | `node R.A.G/ritual.mjs fin-ciclo [--ciclo nombre] [--proyecto nombre] --si` |

`init-proyecto` crea `.claude/CLAUDEMAX.md` (la plantilla `templates/rules/proyecto.md` con sus
marcadores sustituidos) y `.claude/CLAUDE.md` en el repo destino, más la nota índice
`V.A.U.L.T/Proyectos/<nombre>/00-indice.md` con el frontmatter de taxonomía. Nunca sobrescribe
nada que ya exista.

La diferencia clave entre los tres rituales manuales de cierre:

- **`fin-sesion`** escribe en `V.A.U.L.T/00-Inbox/` (categoría `personal`, tag
  `personal/sesion`): continuidad entre sesiones de Claude Code — qué se hizo y qué sigue.
  Úsalo al cerrar *una sesión* de trabajo, no el día completo.
- **`fin-dia`** es barato: solo añade una entrada horaria a `V.A.U.L.T/Journal/YYYY-MM-DD.md`
  (categoría `personal`, tag `personal/bitacora`). Deliberadamente **no** reindexa el RAG ni
  regenera grafos de Graphify — puedes llamarlo varias veces al día sin coste. Igual que
  `fin-sesion`, el contenido se indexa en el siguiente `rag.mjs ingest`.
- **`fin-ciclo`** es caro y exige confirmación: sin `--si` solo imprime el plan y no toca nada
  ni se conecta a la base de datos. Con `--si` escribe la nota de cierre, ejecuta
  `rag.mjs reindex` (respetando `EMBED_BACKEND`, sugiriendo `--backend kaggle` si hay
  credenciales y muchas notas), recuerda regenerar los grafos con `graphify extract .`, e imprime un
  resumen final de documentos indexados por categoría.

## Formato Skills 2.0

Cada skill propia en `skills/<name>/` incluye tres archivos:

    skills/<name>/
    ├── SKILL.md      # frontmatter (name, description) para el descubrimiento de Claude Code + cuerpo en prosa
    ├── skill.yaml    # configuración estructurada: version, kind (knowledge|tool), triggers,
    │                 # commands, scripts, dependencies, puntero a schema
    └── schema.json   # JSON Schema (draft 2020-12) con definitions.inputs / definitions.outputs

Claude Code solo exige el frontmatter de SKILL.md; los archivos complementarios son una convención
del repo que el modelo lee al invocarse y que el tooling consume como artefactos legibles por máquina.
Valida todo el árbol con:

    node skills/validate-skills.mjs

## Desinstalación

Doble clic en `CLAUDEMAX-UNINSTALLER.cmd` (Windows) — igual de autosuficiente que el instalador
(instala Node/Git Bash solo si faltan) — lanza el wizard en modo desinstalación
(`wizard.mjs --uninstall`), que muestra en una tabla de dos columnas qué se borra y qué se
conserva, y exige escribir la palabra `desinstalar` completa para confirmar, por ser una
operación destructiva. O directo (macOS/Linux/WSL, o Windows con Git Bash a mano):

```bash
bash bin/uninstall.sh
```

Desmontaje simétrico. Deja los archivos por-repo (los que un `--with-init` de una instalación antigua de Caveman pudo haber escrito, `framer-motion`/`gsap` en el `node_modules` de tu proyecto) para que los borres a mano.

## Privacidad

Sin telemetría. El instalador no hace llamadas de analítica. Sí delega en:

- El script de instalación de `rtk-ai/rtk` (descarga el binario de rtk desde los releases de GitHub).
- `claude mcp add` (CLI de Anthropic) para los registros MCP de Figma, 21st.dev magic, `rag` y `markitdown`.
- `uv tool install` / `pipx install` / `pip install --user` (el primero disponible) para `graphifyy`, el paquete PyPI del CLI de Graphify — y `graphify claude install` para registrar su hook `PreToolUse` local (ver fila de `graphify` en la tabla de componentes).
- `claude plugin marketplace add` + `claude plugin install` (CLI de Anthropic) para instalar el plugin `ponytail` desde `DietrichGebert/ponytail`.
- `git clone` para la skill superpowers (`obra/superpowers`) y para `cyber-neo` (con commit fijado). Las demás skills propias (`architecture-principles`, `conventional-commits`, `skill-mcp-builder`, `ui-ux-pro-max`, `no-ai-slop`, `rituales`) y los cuatro hooks de `rules` se copian directo desde este repo — sin llamadas de red.
- `npm install framer-motion gsap` en tu cwd (solo si existe un `package.json` o se pasa `--with-npm`).
- `winget install` para dependencias de sistema que falten: Docker Desktop, Ollama, Python 3.12 y Temurin JDK 21.
- `pip install` para los parsers (`markitdown[all]`, `markitdown-mcp`, `opendataloader-pdf`, `whisper-ctranslate2`) y `ollama pull bge-m3` para el modelo de embeddings (todo local; los embeddings nunca salen de tu máquina con los backends `ollama`/`remote`).
- `pip install kaggle` y llamadas al CLI `kaggle` (API de Kaggle) — solo si defines `KAGGLE_USERNAME`/`KAGGLE_KEY` y usas `EMBED_BACKEND=kaggle` o `--backend kaggle`; con ese backend los chunks de texto sí salen de tu máquina hacia un kernel de Kaggle.

Consulta `bin/components/*.sh` para ver cada línea de comando.

## Alcance (qué es y qué no es esto)

- ✅ Instalador bash único, macOS / Linux / WSL / **Git Bash en Windows**.
- ✅ Nativo en Windows: RTK incluye un binario `rtk.exe` que el instalador descarga automáticamente cuando detecta MINGW/MSYS/Cygwin. Los MCPs (`figma`, `magic`) se registran a nivel de usuario para que funcionen en todos los proyectos.
- ✅ Idempotente, con dry-run, desinstalación quirúrgica.
- ❌ Sin instalador nativo de PowerShell para Windows (usa Git Bash — ya viene con Git for Windows).
- ❌ Sin almacenamiento de tokens de Figma. El OAuth se mantiene basado en navegador — este es el único paso manual.

---

Issues / PRs bienvenidos.
