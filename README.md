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
| **skill ui-ux-pro-max** | Skill propia de inteligencia de diseño UI/UX — 50+ estilos, 161 paletas de color, 57 combinaciones tipográficas, 161 tipos de producto y 99 guías de UX en 10 stacks. Consolida lo que antes eran skills separadas (`frontend-design`, `brand-guidelines` y `taste`), además de guía de motion (Framer Motion, GSAP). Incluida en este repo; no tiene repo upstream del que autoactualizarse. | propia (este repo) |
| **21st.dev magic MCP** | Generador de componentes en vivo de [21st.dev](https://21st.dev). | `@21st-dev/magic` (npx) |
| **Framer Motion + GSAP** | `npm install --save framer-motion gsap` en tu proyecto (se omite si no hay `package.json`). | [framer-motion](https://www.npmjs.com/package/framer-motion), [GSAP](https://gsap.com/docs/v3/) |
| **skill superpowers** | Clonada en `~/.claude/skills/superpowers/`. Paquete de meta-skills. | [obra/superpowers](https://github.com/obra/superpowers) |
| **Skills de disciplina de ingeniería** | Propias: `architecture-principles` (fusiona las antiguas skills `solid`, `design-patterns` y `architecture-patterns` en una sola skill SOLID → patrones GoF → arquitectura de sistemas), `conventional-commits` y `skill-mcp-builder` (meta-skill para crear Skills 2.0 y servidores MCP). | este repo |
| **rag** | Vault V.A.U.L.T + RAG con PGVector (Docker) + Ollama bge-m3 + MCP `rag` (rag_query/rag_status). Auto-instala Docker y Ollama vía winget si faltan. | propia (este repo) |
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
- `git clone` para la skill superpowers (`obra/superpowers`) y para `cyber-neo` (con commit fijado). Las demás skills propias (`architecture-principles`, `conventional-commits`, `skill-mcp-builder`, `ui-ux-pro-max`) se copian directo desde este repo — sin llamadas de red.
- `npm install framer-motion gsap` en tu cwd (solo si existe un `package.json` o se pasa `--with-npm`).
- `winget install` para dependencias de sistema que falten: Docker Desktop, Ollama, Python 3.12 y Temurin JDK 21.
- `pip install` para los parsers (`markitdown[all]`, `markitdown-mcp`, `opendataloader-pdf`, `whisper-ctranslate2`) y `ollama pull bge-m3` para el modelo de embeddings (todo local; los embeddings nunca salen de tu máquina).

Consulta `bin/components/*.sh` para ver cada línea de comando.

## Alcance (qué es y qué no es esto)

- ✅ Instalador bash único, macOS / Linux / WSL / **Git Bash en Windows**.
- ✅ Nativo en Windows: RTK incluye un binario `rtk.exe` que el instalador descarga automáticamente cuando detecta MINGW/MSYS/Cygwin. Los MCPs (`figma`, `magic`) se registran a nivel de usuario para que funcionen en todos los proyectos.
- ✅ Idempotente, con dry-run, desinstalación quirúrgica.
- ❌ Sin instalador nativo de PowerShell para Windows (usa Git Bash — ya viene con Git for Windows).
- ❌ Sin almacenamiento de tokens de Figma. El OAuth se mantiene basado en navegador — este es el único paso manual.

---

Issues / PRs bienvenidos.
