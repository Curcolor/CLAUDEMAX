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
| **Skills de disciplina de ingeniería** | Propias: `swebok` (destilación del SWEBOK v4 de IEEE Computer Society — 18 áreas de conocimiento de la ingeniería de software en `chapters/`, más `referencias/` curadas a mano con más profundidad que el SWEBOK en esos puntos concretos: SOLID con prueba de olfato, los 23 patrones GoF con disparador de una línea, y elección de arquitectura de sistema por fuerzas y trade-offs. Absorbe a la skill que cumplía este rol antes —la que fusionaba `solid` + `design-patterns` + `architecture-patterns`— y que ya no existe en este repo), `pmbok` (destilación de la *Guía del PMBOK® 7ª edición* del Project Management Institute — 370 páginas en español. PMBOK 7 cambió de paradigma frente a la 6ª: abandonó los 49 procesos y las 10 áreas de conocimiento por **12 principios** de dirección de proyectos y **8 dominios de desempeño** que operan simultáneamente, no como fases secuenciales — es lo que más se malinterpreta. Incluye `cheatsheet.md` (reglas de decisión: predictivo vs. adaptativo, estimación, riesgo, métricas), `glossary.md` (68 términos deduplicados), un archivo por principio (`principios/`, 12) y por dominio (`dominios/`, 8), `adaptacion.md` (tailoring) y un catálogo de 160 modelos/métodos/artefactos (`modelos-metodos-artefactos.md`: 23 modelos, 60 métodos, 77 artefactos). Complementa a `swebok` —SWEBOK cubre ingeniería de software, PMBOK cubre dirección de proyectos— y declara `dependencies: [swebok]`. Son notas sintetizadas, no una reproducción del PMBOK; PMBOK® y PMI® son marcas registradas del Project Management Institute), `book-to-skill` (convierte libros/manuales/normas en skills consultables por capítulo en vez de recargar el PDF en contexto cada vez; fork propio traducido de `virgiliojr94/book-to-skill`, MIT. Documenta un bug real de su extracción de PDF: elige `pdftotext` y solo comprueba que la salida no esté vacía, no que sea válida — con un documento en español devolvió mojibake en las 413 páginas reportando "OK" y la detección de capítulos cayó a 3 de 18; trae el fix, extraer con `pypdf`, y cómo verificarlo. Con ella se generaron `swebok` y `pmbok`), `conventional-commits`, `skill-mcp-builder` (meta-skill para crear Skills 2.0 y servidores MCP), `no-ai-slop` (anti-slop de *prosa* — documentación, README, artículos; fork propio traducido de `petergyang/no-ai-slop`, MIT. Actúa sobre texto que un humano leerá fuera de la sesión, nunca sobre las respuestas de la conversación) y `rituales` (documenta los cinco rituales de ciclo de vida de CLAUDEMAX — ver sección [Rituales](#rituales)). | este repo |
| **rag** | Vault V.A.U.L.T con carpetas-género (Decisiones, Conocimiento, Codigo, Superpowers/{Specs,Planes,Tareas,Sesiones}…), un hub por carpeta en `Hubs/` y `Bienvenida` como puerta de entrada + RAG con PGVector (Docker) + Ollama bge-m3 + backend de embeddings conmutable (`ollama`/`remote`/`kaggle`) + MCP `rag` (`rag_query`/`rag_leer`/`rag_status`, filtros `coleccion`/`proyecto`). La colección y la autoridad las da la carpeta; el ranking excluye ruido (`planes`, `proceso`, `inbox`) y sube decisiones y hubs. **Vigencia automática**: una nota con `fuentes:` queda CADUCA cuando sus fuentes cambian, `reemplaza:` retira decisiones viejas de la búsqueda, `revisar:` avisa al vencer; `rag.mjs salud` lista caducas, huérfanas y enlaces rotos y el hook `session-start` reindexa incremental y resume la salud al arrancar. También instala `ritual.mjs` (rituales manuales, ver [Rituales](#rituales)). Auto-instala Docker y Ollama vía winget si faltan. | propia (este repo) |
| **graphify** | CLI de Python (paquete PyPI `graphifyy`) que analiza el código con tree-sitter (+ LLM opcional) y genera un grafo de conocimiento navegable del repo: `graphify extract . --code-only` produce `graphify-out/graph.json` (formato `node_link_data` de NetworkX), `graph.html` (dashboard) y `GRAPH_REPORT.md`. CLAUDEMAX registra **un solo MCP `graphify`** a nivel usuario: un envoltorio (`~/.claude/mcp/graphify-auto.mjs`) que en cada sesión localiza el `graph.json` del proyecto actual (`CLAUDE_PROJECT_DIR`, que Claude Code pasa al MCP) y lanza el servidor real de graphify (`query_graph`, `get_node`, `get_neighbors`, `shortest_path`…); si falta el grafo o graphify, sirve una única tool `graphify_estado` que dice cómo generarlo o instalarlo. Ya no ejecuta `graphify claude install` (su hook duplicaba al recordatorio `orden-herramientas` y escribía dentro del repo). | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) (paquete PyPI `graphifyy`) |
| **codebase-memory** | MCP de inteligencia de código ([DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp), MIT): indexa un repo en un grafo persistente (158 lenguajes) y expone `search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`, `search_code`, `index_repository`. Instalado con `npm install -g codebase-memory-mcp` y registrado una vez a nivel usuario como `codebase-memory`. El índice vive en `~/.cache/codebase-memory-mcp/` (`CBM_CACHE_DIR`), nunca en el repo (**nunca `--persistence`**). Indexa cada proyecto con `codebase-memory-mcp cli index_repository --repo-path <abs> --mode moderate`; `ready` no significa al día — reindexa al cerrar ciclo. Excluye `bin/`/`docs/` por defecto: ajústalo con `.cbmignore` si ahí hay código. | npm `codebase-memory-mcp` |
| **ponytail** | Plugin de Claude Code que fuerza minimalismo al escribir código mediante una "escalera" de 7 peldaños (¿hace falta? → ¿ya existe en el repo? → ¿stdlib? → ¿feature nativa? → ¿dependencia ya instalada? → ¿cabe en una línea? → el mínimo que funcione). Trae 6 skills: `ponytail` (modo activo, niveles `lite`/`full`/`ultra`), `ponytail-review` (revisa el diff), `ponytail-audit` (repo completo), `ponytail-debt` (cosecha comentarios `ponytail:` en una libreta de deuda técnica), `ponytail-gain` y `ponytail-help`. No choca con Graphify: registra hooks `SessionStart`/`SubagentStart`/`UserPromptSubmit`, ninguno es `PreToolUse` (el único evento que usa Graphify). | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) |
| **cyber-neo** | Skill de auditoría de seguridad: OWASP 2025 Top 10 y CWE Top 25, escaneo de dependencias, secretos, SAST y configuración. Solo lectura; reporte en `~/Desktop/`. Clonada con commit fijado. | [Hainrixz/cyber-neo](https://github.com/Hainrixz/cyber-neo) |
| **parsers** | Ingesta de archivos para el RAG: **MarkItDown** (cualquier archivo → markdown, con MCP oficial `markitdown`), **opendataloader-pdf** (PDFs complejos) y **whisper-ctranslate2** (audio → texto, CPU). Auto-instala Python y el JDK vía winget si faltan. | [markitdown](https://github.com/microsoft/markitdown), [opendataloader-pdf](https://github.com/opendataloader-project/opendataloader-pdf), [whisper-ctranslate2](https://github.com/Softcatala/whisper-ctranslate2) |
| **rules** | Reglas operativas empaquetadas en el repo (`templates/rules/`) — no en la configuración personal de tu máquina — instaladas en `<RAG_ROOT>/.claude/`: `CLAUDEMAX.md` (las 10 reglas; termina importando `proyectos/_indice.md`) y `proyecto.md` (esqueleto de `.claude/proyectos/<nombre>.md`) se sobrescriben en cada instalación; `CLAUDE.md` nunca se pisa, solo se le añade `@CLAUDEMAX.md` si falta; crea `.claude/proyectos/_indice.md` si falta. Además instala y registra 5 hooks de cumplimiento y contexto: `git-footer-guard.mjs`, `loop-breaker.mjs`, `skill-suggest.mjs`, `session-start.mjs`, `recordar.mjs` (recordatorios justo a tiempo, ver [Reglas operativas](#reglas-operativas)), más los recordatorios de fábrica en `<RAG_ROOT>/.claude/recordatorios/`. Ver sección [Reglas operativas](#reglas-operativas). Último componente en instalarse — sus reglas referencian rutas que crean los pasos anteriores. | propia (este repo) |

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
   - `swebok`, `pmbok`, `conventional-commits` — skills de disciplina de ingeniería. Invócalas por nombre o deja que sus triggers se disparen automáticamente durante una revisión/refactor/commit/planificación — p. ej. pregúntale a `swebok` "qué técnica de prueba uso" o "cómo elijo entre arquitectura hexagonal y clean architecture", o a `pmbok` "¿ágil o predictivo para este proyecto?" o "qué artefacto uso para registrar y priorizar riesgos" y te lleva al capítulo, dominio, principio o artefacto exacto.
   - `book-to-skill` — pídela cuando quieras convertir un libro, manual o norma largo (PDF, EPUB, DOCX...) en una skill consultable por capítulo, en vez de recargarlo en contexto cada sesión. Así se generó `swebok`.
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

### Taxonomía del vault: la carpeta da la colección

Cada carpeta del vault es un *género* de nota y tiene su hub en `Hubs/` (qué contiene, cuándo nace
una nota ahí, qué no va ahí, y la lista de sus notas). `Hubs/Bienvenida.md` es la puerta de
entrada; `Hubs/Pendientes.md`, el índice único de lo abierto. La colección y la autoridad **se
derivan de la carpeta** — el frontmatter solo lleva `proyecto` (eje transversal), `tags` y, si
aplica, los campos de vigencia. Empieza una nota desde `Plantillas/nota.md`:

```yaml
---
proyecto: claudemax        # eje transversal, opcional pero recomendado
tags: [rag, pgvector]      # libres
fecha: 2026-09-13
fuentes:                   # si la nota describe código o un documento (rutas/globs desde la raíz del workspace)
  - CLAUDEMAX/templates/rag/rag.mjs
reemplaza: [nota-vieja]    # si deja obsoleta a otra nota
revisar: 2026-10-08        # si vence
---
```

| Carpeta | Color | `coleccion` | `autoridad` | En búsqueda por defecto |
|---|---|---|---|---|
| `Hubs/` | dorado | `hubs` | `vigente` | sí, con boost |
| `Decisiones/` | dorado | `decisiones` | `vigente` | sí, con boost |
| `Formales/` | morado | `docs_formales` | `oficial` | sí |
| `Superpowers/Specs/` | verde | `specs` | `diseño-vigente` | sí |
| `Entrevistas/` | naranja | `entrevistas` | `fuente-primaria` | sí |
| `Conocimiento/` | morado | `conocimiento` | `referencia` | sí |
| `Aprendizaje/` | turquesa | `aprendizaje` | `leccion` | sí |
| `Codigo/` | azul | `codigo` | `referencia` | sí |
| `Procesos/` | morado | `procesos` | `referencia` | sí |
| `Revisiones/` | naranja | `revisiones` | `referencia` | sí |
| `Superpowers/Sesiones/` | rojo | `sesiones` | `personal` | sí |
| `Bitacoras/` | rojo | `bitacoras` | `historica` | sí |
| `Superpowers/Planes/` | verde | `planes` | `historico-tecnico` | **no** |
| `Superpowers/Tareas/` | verde | `proceso` | `historico-tecnico` | **no** |
| `00-Inbox/` | gris | `inbox` | `sin-clasificar` | **no** |
| `Plantillas/` | — | — | — | fuera del índice |

Regla de conflicto entre fuentes que se contradicen: `decisiones > docs_formales/specs >
entrevistas > conocimiento/aprendizaje/codigo > planes > bitacoras` — gana la autoridad, no la
fecha. `planes` y `proceso` quedan fuera de la búsqueda sin filtro porque llevan código literal y
copan los resultados; se piden con `--coleccion`.

**Vigencia.** El ingest detecta notas que ya no reflejan la realidad: con `fuentes:`, guarda una
firma del contenido de esas fuentes y marca la nota **CADUCA** si cambian y la nota no; con
`reemplaza:`, la nota vieja queda **REEMPLAZADA** y sale de la búsqueda por defecto; con
`revisar:`, pasada la fecha queda **A REVISAR**. Cada resultado de `rag_query` abre con su aviso.
`node rag.mjs salud` lista caducas, a revisar, huérfanas (sin enlace desde ningún hub), enlaces
rotos en hubs y notas de `Codigo/` sin `fuentes:`; `--resumen` lo deja en una línea, que es lo que
el hook `session-start` añade al contexto al arrancar (además de reindexar incremental).

```bash
node rag.mjs query "esquema de pgvector" --coleccion codigo
node rag.mjs query "por qué pgvector y no sqlite" --proyecto claudemax
node rag.mjs query "..." --coleccion planes --topk 10      # incluye una colección excluida por defecto
node rag.mjs salud                                          # informe de vigencia y hubs
```

Migración desde el layout anterior de seis categorías: `Journal/`→`Bitacoras/`; `Proyectos/`→
`Superpowers/Specs|Planes/` o `Decisiones/`; `Organizacion/`→`Procesos/` o `Conocimiento/`;
`Investigacion/`→`Conocimiento/`; las notas de sesión de `00-Inbox/`→`Superpowers/Sesiones/`.
Tras mover, `node rag.mjs init && node rag.mjs reindex`. Lo que quede en una carpeta desconocida se
indexa como `otros` y el ingest lo lista al final.


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
(el contexto de cada proyecto va aparte, en `.claude/proyectos/`, ver [Contexto por proyecto](#contexto-por-proyecto)). El
repo es la fuente de verdad: si necesitas cambiar una regla, edítala en `templates/rules/` y
reinstala — editar `<RAG_ROOT>/.claude/CLAUDEMAX.md` a mano se pierde en la siguiente instalación.

| # | Regla | Cómo se hace cumplir |
|---|---|---|
| 1 | **Idioma:** todo el contenido en español (docs, comentarios, mensajes, commits). Skills en modo bilingüe. Identificadores de código y tipos de Conventional Commits en inglés. | Convención — sin hook. |
| 2 | **Política de modelos:** los spawns de Agent para desarrollo dirigido por subagentes usan Sonnet 5 (`model: "sonnet"` explícito). Las revisiones de código nunca se delegan. | Convención — sin hook. |
| 3 | **Cortacircuitos de 3 intentos:** tras 3 intentos fallidos con el mismo error, PARAR, resumir al usuario y esperar su respuesta. | `hooks/loop-breaker.mjs` (avisa, no bloquea) |
| 4 | **Commits:** Conventional Commits, subject en español, y nunca un footer de atribución de IA (`Co-authored-by: Claude`, "Generated with Claude Code", 🤖...). | `hooks/git-footer-guard.mjs` (**bloquea** el commit) |
| 5 | **Ahorro de tokens / búsqueda de skills:** tecnología nueva sin Skill 2.0 instalada → preguntar al usuario si crear/buscar una, mencionando el compromiso. | `hooks/skill-suggest.mjs` (avisa, no bloquea) |
| 6 | **Dónde vive el contexto:** todo en `<RAG_ROOT>/.claude/` (reglas, `proyectos/<nombre>.md`, recordatorios) o en el vault; ningún repo lleva `CLAUDE.md`, `CLAUDE.local.md` ni `.claude/`. Ver [Contexto por proyecto](#contexto-por-proyecto). | Recordatorio `contexto-fuera-del-repo` + `.gitignore` que escribe `init-proyecto` + aviso de `session-start.mjs`. |
| 7 | **Tres memorias con rol:** memoria nativa = gotchas cortos; vault + RAG = narrativa y decisiones; grafo = estructura. Lo generado se queda en su herramienta; lo narrado va al vault. Context7 permitido para documentación de librerías. | Convención — sin hook. |
| 8 | **Orden de herramientas de contexto:** `rag` → `graphify` → `codebase-memory` → grep (último recurso, solo literales). La prosa se verifica contra el grafo; codebase-memory se reindexa antes de concluir "no existe". | Recordatorio `orden-herramientas`. |
| 9 | **Taxonomía y vigencia:** la carpeta da la colección; toda nota se enlaza desde su hub; `fuentes:` si describe código, `reemplaza:` si sustituye a otra (ver `Plantillas/nota.md`). Specs y planes van al vault (`Superpowers/{Specs,Planes}/`) salvo que el proyecto declare `docs_en_repo: true`. | Convención + `rag.mjs salud` (informa, no bloquea) + recordatorios `editar-vault` y `specs-en-vault`. |
| 10 | **Recordatorios justo a tiempo:** una regla que se olvidó dos veces se convierte en un recordatorio en `.claude/recordatorios/`. | `hooks/recordar.mjs` (inyecta, no bloquea). |

Cinco hooks Node sin dependencias hacen cumplir las reglas 3, 4, 5 y 10 de forma determinista (y
`session-start.mjs` da contexto automático, ver [Rituales](#rituales)). Cada uno tiene su propia
variable de escape para desactivarlo sin desinstalar nada:

| Hook | Evento | ¿Bloquea? | Variable de escape |
|---|---|---|---|
| `git-footer-guard.mjs` | `PreToolUse` / `Bash` | **Sí** — el único de los cinco que bloquea | `CLAUDEMAX_GIT_GUARD=0` |
| `loop-breaker.mjs` | `PostToolUse` | No, solo avisa (`system-reminder`) | `CLAUDEMAX_LOOP_BREAKER=0` |
| `skill-suggest.mjs` | `UserPromptSubmit` | No, solo avisa (una vez por sesión y tecnología) | `CLAUDEMAX_SKILL_SUGGEST=0` |
| `session-start.mjs` | `SessionStart` / `startup` | No, solo aporta contexto (y reindexa el RAG) | `CLAUDEMAX_SESSION_CONTEXT=0` |
| `recordar.mjs` | `PreToolUse` / `Grep\|Bash\|PowerShell\|Edit\|Write\|MultiEdit\|Read` | No, inyecta el recordatorio como contexto | `CLAUDEMAX_RECORDAR=0` |

### Contexto por proyecto

El contexto que Claude necesita de cada repo (estructura, comandos, estado, trampas) no vive en
el repo: en el setup de trabajo del autor, un `CLAUDE.md` con contexto interno acabó publicado en
GitHub el 2026-07-24. Vive en el workspace, y Claude Code lo carga solo porque lee los `CLAUDE.md`
de los directorios padre y resuelve sus imports:

    <RAG_ROOT>/.claude/CLAUDE.md          tuyo; el instalador solo le añade la línea que importa CLAUDEMAX.md
      └─ CLAUDEMAX.md                     reglas; termina importando proyectos/_indice.md
           └─ proyectos/_indice.md        generado por init-proyecto: una línea e import por proyecto
                └─ proyectos/<nombre>.md  tuyo desde el día 1; ~150 líneas como máximo

Una sesión abierta en `<RAG_ROOT>/MiRepo/` (o en cualquier subcarpeta) ve las reglas y el contexto
de todos los proyectos; `/context` los lista en *Memory files*. Si el repo no tiene archivo, el
hook de arranque lo avisa y `node R.A.G/ritual.mjs init-proyecto <ruta>` lo crea.

**Migrar desde el diseño anterior** (`<repo>/.claude/CLAUDEMAX.md`): corre `init-proyecto` sobre el
repo —detecta el archivo viejo y lo avisa—, copia a `proyectos/<nombre>.md` lo que valga y borra
`<repo>/.claude/CLAUDEMAX.md` (y `<repo>/.claude/CLAUDE.md` si solo importaba ese archivo).

### Recordatorios justo a tiempo

Una regla escrita en `CLAUDEMAX.md` se olvida a mitad de una tarea larga; el problema es de
*tiempos*, no de conocimiento. `recordar.mjs` lee `<RAG_ROOT>/.claude/recordatorios/*.md` (y
los `.claude/recordatorios/` de cada proyecto, subiendo desde el cwd — el del proyecto pisa al
del workspace si comparten nombre) y, cuando la tool y el comando o la ruta casan, inyecta el
texto en el instante de la decisión. Dispara cada vez a propósito, salvo que el recordatorio
diga `una_vez_por_sesion: true`. Nunca bloquea.

```yaml
---
tools: [Bash, PowerShell]           # Grep, Bash, PowerShell, Edit, Write, MultiEdit, Read, Glob
patrones: ['\bgcloud\b']            # regex contra el comando (o la ruta, en Edit/Write)
rutas: ["**/V.A.U.L.T/**/*.md"]     # globs contra file_path
excluir: ["**/Plantillas/**"]       # globs que anulan el disparo (ganan incluso a siempre)
siempre: [Grep]                     # tools que disparan sin mirar patrones/rutas
una_vez_por_sesion: false
activo: true
nota: >                             # para ti: qué fallo lo parió y cuándo
  2026-09-02: desplegué sin leer el procedimiento.
---
TEXTO QUE SE INYECTA TAL CUAL.
```

De fábrica (se instalan si no existen; edítalos, son tuyos): `orden-herramientas` (rag →
graphify → codebase-memory → grep, al usar Grep o un buscador en Bash/PowerShell),
`tocar-produccion` (gcloud, aws, kubectl apply, terraform apply, docker push, `--prod`…),
`contexto-fuera-del-repo` (regla 6 al escribir un `CLAUDE.md` o `.claude/` dentro de un repo),
`editar-vault` (regla 9 al escribir bajo `V.A.U.L.T/`), `specs-en-vault` (al escribir en
`docs/superpowers/` de un repo: ¿el proyecto declara `docs_en_repo`?), `estandares-dotnet` (al
editar `.cs`/`.xaml`) y `pruebas-dotnet` (al correr `dotnet test`). En `ejemplos/maestrasuite/` van los
cuatro originales del setup de trabajo del autor, íntegros e inactivos, como referencia de cómo
se escribe uno nacido de un fallo real. Los recordatorios rotos se anotan en
`~/.claude/state/recordar.log`, nunca se le muestran al modelo.

### Grafo de código en vivo

La estructura del código no se vuelca al vault (el setup de trabajo del autor midió 257 notas de
ruido y las retiró): se consulta en vivo. Los tres peldaños del orden de herramientas, con sus
tools y su índice:

| Peldaño | Pregunta que responde | Tools | Cómo se regenera el índice |
|---|---|---|---|
| `rag` | qué se decidió, por qué, qué pasó | `rag_query`, `rag_leer`, `rag_status` | `node R.A.G/rag.mjs ingest` (automático al arrancar la sesión) |
| `graphify` | qué llama a qué, qué hereda de qué, comunidades | `query_graph`, `get_node`, `get_neighbors`, `shortest_path` (o `graphify_estado` si no hay grafo) | `graphify extract . --code-only` dentro del repo |
| `codebase-memory` | llamantes reales, snippets, arquitectura, literales | `search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`, `search_code` | `codebase-memory-mcp cli index_repository --repo-path <abs> --mode moderate` |

`grep` va después de los tres y solo para literales. Regla de oro: **lo generado se queda en su
herramienta; lo narrado va al vault.** Los índices se desincronizan a la vez y se regeneran juntos
en el cierre de ciclo.

## Rituales

Cinco rituales cubren el ciclo de vida completo de una sesión o proyecto: uno automático y
cuatro manuales que ejecuta `node R.A.G/ritual.mjs` (se instala junto a `rag.mjs`, mismo `.env`).
La skill `rituales` los documenta para que el modelo sepa cuándo invocarlos.

| Ritual | Cuándo | Comando |
|---|---|---|
| **Inicio de sesión** (automático) | Cada arranque de sesión, sin pedirlo. | — (hook `session-start.mjs`) |
| **Init de proyecto** | Repo del workspace sin `.claude/proyectos/<nombre>.md` (el arranque lo avisa). | `node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar]` |
| **Fin de sesión** (menor) | Al cerrar una sesión de trabajo, para que la siguiente retome el hilo. | `node R.A.G/ritual.mjs fin-sesion [--resumen "texto"] [--siguiente "texto"]` |
| **Fin de día** (menor) | "Terminamos por hoy", al cerrar la jornada completa. | `node R.A.G/ritual.mjs fin-dia [--resumen "texto"]` |
| **Fin de ciclo** (mayor, dos fases) | "Cierre de ciclo" / "fin de sprint". | `node R.A.G/ritual.mjs fin-ciclo [--ciclo nombre]` y, escrita la prosa, `node R.A.G/ritual.mjs fin-ciclo --cerrar --si` |

`init-proyecto` escribe el contexto del proyecto **fuera del repo**, en
`<RAG_ROOT>/.claude/proyectos/<nombre>.md` (esqueleto de `templates/rules/proyecto.md`); regenera
`proyectos/_indice.md`; crea el hub `V.A.U.L.T/Hubs/<nombre>.md`; añade `/CLAUDE.md`,
`/CLAUDE.local.md` y `/.claude/` al `.gitignore` del repo; e indexa el código con codebase-memory y
graphify (`--sin-indexar` lo salta). Nunca sobrescribe nada que ya exista. La prosa la rellena el
modelo después consultando el grafo (skill `rituales`). Ver [Contexto por proyecto](#contexto-por-proyecto).

En los tres rituales de cierre **el script hace la mecánica y Claude escribe la prosa**: la nota
sale de `V.A.U.L.T/Plantillas/` con su frontmatter, enlazada en su hub y con el rango git del ciclo
(desde el `commit:` del último cierre hasta HEAD); el modelo escribe lo único que no se puede
automatizar —qué pasó de verdad, con sus desvíos y errores—. La diferencia entre ellos:

- **`fin-sesion`** crea una nota en `V.A.U.L.T/Superpowers/Sesiones/` (colección `sesiones`) con
  `commit:` = HEAD y los specs y planes del rango: continuidad entre sesiones de Claude Code. Úsalo
  al cerrar *una sesión* de trabajo, no el día completo.
- **`fin-dia`** crea o completa `V.A.U.L.T/Bitacoras/YYYY-MM-DD.md` (colección `bitacoras`) y lista
  en ella las sesiones del día. No mira git ni reindexa: puedes llamarlo varias veces al día.
- **`fin-ciclo`** va en dos fases, porque la prosa tiene que existir antes de indexar. La primera
  crea la nota de cierre e imprime qué revisar: las notas de `Codigo/` cuyas `fuentes:` cambiaron
  en el ciclo, las huérfanas nuevas y los avisos de `Hubs/Pendientes.md`. Claude relee esas notas
  contra el grafo, pone al día `Pendientes.md` y escribe el cierre. La segunda, `--cerrar --si`,
  enlaza las huérfanas, **rota `Pendientes.md`** (lo cerrado en el ciclo pasa a la nota; lo de
  ciclos anteriores sale del índice sin perderse), copia los specs del repo al vault si el
  proyecto declara `docs_en_repo: true`, regenera **los tres índices juntos** (codebase-memory,
  graphify y `rag.mjs ingest`), corre `salud` y `status`, y graba el `commit:` que cierra el ciclo.

`Hubs/Pendientes.md` es el índice único de lo abierto, con un formato que `rag.mjs salud`
comprueba: un pendiente es **una línea** `- (YYYY-MM-DD) qué falta — qué desbloquea — [[nota]]`, y
lo cerrado lleva `(origen → cierre)`. El porqué vive en la nota enlazada; un párrafo narrativo es un
aviso y bloquea la rotación.

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
- `uv tool install` / `pipx install` / `pip install --user` (el primero disponible) para `graphifyy`, el paquete PyPI del CLI de Graphify. Ya no se ejecuta `graphify claude install`.
- `npm install -g codebase-memory-mcp` (binario del MCP de inteligencia de código; el índice queda en `~/.cache/codebase-memory-mcp/`, local).
- `claude plugin marketplace add` + `claude plugin install` (CLI de Anthropic) para instalar el plugin `ponytail` desde `DietrichGebert/ponytail`.
- `git clone` para la skill superpowers (`obra/superpowers`) y para `cyber-neo` (con commit fijado). Las demás skills propias (`swebok`, `pmbok`, `book-to-skill`, `conventional-commits`, `skill-mcp-builder`, `ui-ux-pro-max`, `no-ai-slop`, `rituales`) y los cinco hooks de `rules` y los recordatorios se copian directo desde este repo — sin llamadas de red.
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
