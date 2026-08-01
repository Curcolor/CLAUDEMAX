# CLAUDEMAX

Un solo comando bash. Todos los ahorradores de tokens, skills de UX/UI, el cerebro RAG y las herramientas de análisis para Claude Code, cableados y listos. El OAuth de Figma es el único paso manual.

```bash
bash install.sh
```

## Qué incluye

| Componente | Qué hace | Fuente |
|---|---|---|
| **RTK** | CLI proxy en Rust que filtra y comprime la salida de comandos de shell antes de que llegue al LLM. Cablea un hook de Claude Code. | [rtk-ai/rtk](https://github.com/rtk-ai/rtk) |
| **Caveman** | Plugin de modo terso, badge de statusline, middleware MCP `caveman-shrink`, fan-out multi-agente. | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) |
| **Figma MCP** | Servidor MCP remoto en `https://mcp.figma.com/mcp`, registrado con Claude Code. El OAuth es manual y basado en navegador. | [Figma docs](https://developers.figma.com/docs/figma-mcp-server/) |
| **skill ui-ux-pro-max** | Skill propia de inteligencia de diseño UI/UX — 50+ estilos, 161 paletas de color, 57 combinaciones tipográficas, 161 tipos de producto y 99 guías de UX en 10 stacks. Consolida lo que antes eran skills separadas (`frontend-design`, `brand-guidelines` y `taste`), incluidos 6 anti-patrones nuevos adaptados de `pbakaus/impeccable` (Apache-2.0: gradient text de relleno, plantilla hero-metric, tarjetas idénticas como andamio, hard-offset shadow fuera de contexto neobrutalista, monospace como disfraz, claro/oscuro por categoría en vez de por escena), además de guía de motion (Framer Motion, GSAP). Incluye el hook `PostToolUse` `ui-audit.mjs`: ~15 reglas deterministas que avisan por `system-reminder` al editar archivos de UI (`.css`/`.tsx`/`.jsx`/`.vue`/`.svelte`/`.html`), sin bloquear la edición; desactivable con `CLAUDEMAX_UI_AUDIT=0`. Incluida en este repo; no tiene repo upstream del que autoactualizarse. | propia (este repo) |
| **21st.dev magic MCP** | Generador de componentes en vivo de [21st.dev](https://21st.dev). | `@21st-dev/magic` (npx) |
| **Framer Motion + GSAP** | `npm install --save framer-motion gsap` en tu proyecto (se omite si no hay `package.json`). | [framer-motion](https://www.npmjs.com/package/framer-motion), [GSAP](https://gsap.com/docs/v3/) |
| **skill superpowers** | Clonada en `~/.claude/skills/superpowers/`. Paquete de meta-skills. | [obra/superpowers](https://github.com/obra/superpowers) |
| **Skills de disciplina de ingeniería** | Propias: `architecture-principles` (fusiona las antiguas skills `solid`, `design-patterns` y `architecture-patterns` en una sola skill SOLID → patrones GoF → arquitectura de sistemas), `conventional-commits`, `skill-mcp-builder` (meta-skill para crear Skills 2.0 y servidores MCP) y `no-ai-slop` (anti-slop de *prosa* — documentación, README, artículos; fork propio traducido de `petergyang/no-ai-slop`, MIT. Complementa a `caveman`, que comprime respuestas de sesión: objetivos opuestos). | este repo |
| **rag** | Vault V.A.U.L.T con taxonomía de 6 categorías con color + RAG con PGVector (Docker) + Ollama bge-m3 + backend de embeddings conmutable (`ollama`/`remote`/`kaggle`) + MCP `rag` (`rag_query`/`rag_status`, con filtros `categoria`/`proyecto`). `rag.mjs ingest` también indexa los grafos de conocimiento de Graphify (`.ua/knowledge-graph.json`). Auto-instala Docker y Ollama vía winget si faltan. | propia (este repo) |
| **graphify** | Plugin Understand-Anything: grafos de conocimiento interactivos del codebase. Comandos `/understand`, `/understand-dashboard`, `/understand-diff`, `/understand-domain`. Genera `.ua/knowledge-graph.json` por proyecto. | [Egonex-AI/Understand-Anything](https://github.com/Egonex-AI/Understand-Anything) |
| **cyber-neo** | Skill de auditoría de seguridad: OWASP 2025 Top 10 y CWE Top 25, escaneo de dependencias, secretos, SAST y configuración. Solo lectura; reporte en `~/Desktop/`. Clonada con commit fijado. | [Hainrixz/cyber-neo](https://github.com/Hainrixz/cyber-neo) |
| **parsers** | Ingesta de archivos para el RAG: **MarkItDown** (cualquier archivo → markdown, con MCP oficial `markitdown`), **opendataloader-pdf** (PDFs complejos) y **whisper-ctranslate2** (audio → texto, CPU). Auto-instala Python y el JDK vía winget si faltan. | [markitdown](https://github.com/microsoft/markitdown), [opendataloader-pdf](https://github.com/opendataloader-project/opendataloader-pdf), [whisper-ctranslate2](https://github.com/Softcatala/whisper-ctranslate2) |

## Instalación

```bash
# Desde un clon de este repo:
bash install.sh

# O, una vez publicado, en una línea:
curl -fsSL https://raw.githubusercontent.com/Curcolor/CLAUDEMAX/main/install.sh | bash
```

Re-ejecutable. Idempotente. Pasa `--dry-run` para ver exactamente qué haría.

## Flags

| Flag | Efecto |
|---|---|
| `--all` | Instala todos los componentes (por defecto). |
| `--only <id>` | Solo un componente. Repetible. ids: `rtk`, `caveman`, `figma`, `ui-ux`, `dev-skills`, `rag`, `graphify`, `cyber-neo`, `parsers`. |
| `--skip <id>` | Omite un componente. Repetible. |
| `--no-npm` | Omite `npm install framer-motion gsap`. |
| `--with-npm` | Fuerza el paso de npm aunque no haya `package.json` (ejecuta `npm init -y`). |
| `--dry-run` | Imprime cada comando. No toca nada. |
| `--force` | Reinstala componentes que se detectan a sí mismos como ya instalados. |
| `--config-dir <path>` | Sobrescribe `$CLAUDE_CONFIG_DIR` (por defecto `~/.claude`). |
| `--uninstall` | Delega en `uninstall.sh`. |
| `--no-color` | Desactiva los colores ANSI. |

## Después de instalar

Solo quedan dos cosas, y una de ellas es simplemente reiniciar tu editor:

1. **Reinicia Claude Code** — los hooks y skills se cargan al inicio de la sesión.
2. **Completa el OAuth de Figma**: abre Claude Code, ejecuta `/mcp`, selecciona `figma`, completa el flujo en el navegador. CLAUDEMAX no guarda tokens de Figma. (Este es el único paso que no podemos automatizar — el OAuth requiere navegador.)
3. Prueba los comandos:
   - `/caveman` — activa el modo terso.
   - `/superpowers` — paquete de meta-skills (obra/superpowers).
   - `architecture-principles`, `conventional-commits` — skills de disciplina de ingeniería. Invócalas por nombre o deja que sus triggers se disparen automáticamente durante una revisión/refactor/commit.
   - `ui-ux-pro-max` — inteligencia de diseño UI/UX. Se dispara automáticamente en prompts de diseño/construcción/revisión que toquen UI, o pídela por nombre.
   - `/understand` — genera el grafo de conocimiento del proyecto actual (Graphify). `/understand-dashboard` lo abre en el navegador.
   - `/cyber-neo <ruta>` — auditoría de seguridad OWASP/CWE del proyecto.
   - `skill-mcp-builder` — para crear nuevas Skills 2.0 o servidores MCP.
   - `no-ai-slop` — pide que audite o edite un borrador (README, artículo, mensaje) para quitarle "slop" de IA sin perder tu voz.
   - Edita un `.tsx`/`.css`/`.vue`/`.html` — el hook `ui-audit.mjs` revisa el resultado y avisa por `system-reminder` si detecta anti-patrones de UI (gradient text de relleno, nombres placeholder, tarjetas idénticas, etc.). No bloquea nada; desactívalo con `CLAUDEMAX_UI_AUDIT=0` si te resulta ruidoso.

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
RAG_ROOT=<workspace-root> VAULT_MODE=create RAG_MODE=create bash install.sh --only rag
# luego:
cd <workspace-root>/R.A.G
node rag.mjs ingest          # indexa el vault
node rag.mjs query "..."     # búsqueda semántica (español o inglés)
node rag.mjs status
```

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

| Categoría | Color | Carpeta | Contenido |
|---|---|---|---|
| `codigo` | `#4A90D9` azul | `Codigo/` | Repos, arquitectura, snippets, grafos de Graphify |
| `proyectos` | `#5CB85C` verde | `Proyectos/` | Planes, decisiones, sprints, specs |
| `organizacion` | `#9B59B6` morado | `Organizacion/` | Empresa, marca, clientes, procesos |
| `investigacion` | `#E8912D` naranja | `Investigacion/` | PDFs parseados, papers, transcripciones |
| `personal` | `#E05C6E` rojo suave | `Journal/` | Journal diario, ideas del Inbox |
| `aprendizaje` | `#17A2B8` turquesa | `Aprendizaje/` | Apuntes de tecnologías, tutoriales, skills |

Si falta `categoria` en el frontmatter, `rag.mjs ingest` la infiere de la carpeta (`Codigo/` → `codigo`); si tampoco puede, la nota queda sin categoría y el ingestor avisa al terminar. `.obsidian/graph.json` trae un grupo de color por categoría para el grafo de Obsidian.

Filtra las consultas por categoría y/o proyecto (combinables):

```bash
node rag.mjs query "esquema de pgvector" --categoria codigo
node rag.mjs query "decisiones del sprint" --proyecto claudemax
node rag.mjs query "..." --categoria proyectos --proyecto claudemax --topk 10
```

`node rag.mjs status` agrupa el conteo de chunks por proyecto y por categoría. `rag.mjs ingest` también indexa los grafos de conocimiento de Graphify (`.ua/knowledge-graph.json` que genera `/understand`), aplanados a texto con `categoria: codigo` y `proyecto: <nombre del repo>`: el JSON alimenta al RAG para que el LLM entienda la arquitectura de un repo sin abrir archivos; `/understand-dashboard` sigue siendo la vista para el humano.

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
KAGGLE_USERNAME=<usuario> KAGGLE_KEY=<key> RAG_ROOT=<root> bash install.sh --only rag
```

El instalador escribe las credenciales en `.env` y en `~/.kaggle/kaggle.json`, y hace `pip install kaggle`; sin esas variables no toca nada de Kaggle — es estrictamente opcional. Antes de usarlo, completa a mano `KAGGLE_KERNEL_SLUG=<usuario>/claudemax-embed` en `.env` y el campo `id`/`dataset_sources` de `R.A.G/kaggle/kernel-metadata.json` con tu usuario real.

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

```bash
bash uninstall.sh
```

Desmontaje simétrico. Deja los archivos por-repo (los archivos de reglas de Caveman escritos con `--with-init`, `framer-motion`/`gsap` en el `node_modules` de tu proyecto) para que los borres a mano.

## Privacidad

Sin telemetría. El instalador no hace llamadas de analítica. Sí delega en:

- El script de instalación de `rtk-ai/rtk` (descarga el binario de rtk desde los releases de GitHub).
- `npx -y github:JuliusBrussee/caveman` (el instalador de Caveman descarga desde GitHub y npm).
- `claude mcp add` (CLI de Anthropic) para los registros MCP de Figma, 21st.dev magic, `rag` y `markitdown`.
- `claude plugin marketplace add` / `claude plugin install` para el plugin Understand-Anything.
- `git clone` para la skill superpowers (`obra/superpowers`) y para `cyber-neo` (con commit fijado). Las demás skills propias (`architecture-principles`, `conventional-commits`, `skill-mcp-builder`, `ui-ux-pro-max`, `no-ai-slop`) se copian directo desde este repo — sin llamadas de red.
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
