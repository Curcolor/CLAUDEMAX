# INSTALL.md — instalación extendida / layout / troubleshooting

Para la versión corta, ve [README.md](README.md). Este documento cubre la estructura de archivos, qué mutación hace realmente cada componente en disco, y qué hacer cuando algo se rompe.

## Estructura

```
CLAUDEMAX/
├── install.sh                  # punto de entrada
├── uninstall.sh                # desmontaje simétrico
├── CLAUDEMAX-INSTALLER.cmd     # lanzador Windows (doble clic) del wizard interactivo
├── CLAUDEMAX-UNINSTALLER.cmd   # lanzador Windows del wizard en modo desinstalación
├── README.md                   # versión corta
├── INSTALL.md                  # este archivo
├── bin/
│   ├── wizard/
│   │   ├── wizard.mjs          # flujo principal del wizard (9 pasos, ver más abajo)
│   │   ├── ui.mjs               # primitivas: banner, menú, prompt, tabla, colores
│   │   ├── detect.mjs           # envoltura sobre bin/lib/detect.sh + comprobaciones extra
│   │   └── test-componentes.mjs # prueba: la lista de componentes del wizard no se desincroniza de install.sh
│   ├── lib/
│   │   ├── log.sh              # helpers info/warn/error/dim/run-or-dry
│   │   ├── detect.sh           # comprobaciones de presencia para curl/git/node/npm/claude/opencode
│   │   ├── claude-config.sh    # resuelve $CLAUDE_CONFIG_DIR (por defecto ~/.claude)
│   │   └── jsonc.sh            # merge/remove tolerante a JSONC para los hooks de settings.json
│   └── components/
│       ├── rtk.sh              # encadena la instalación de rtk + `rtk init --global`
│       ├── figma-mcp.sh        # `claude mcp add --transport http figma ...`
│       ├── ui-ux.sh            # copia skills/ui-ux-pro-max + registra el MCP magic + npm i + hook ui-audit.mjs
│       ├── dev-skills.sh       # clon de superpowers + 5 skills propias (incluidas no-ai-slop y rituales)
│       ├── rag.sh              # vault V.A.U.L.T + stack R.A.G (compose/schema/CLI/MCP) + backend Kaggle opcional + registro MCP
│       ├── graphify.sh         # instala el CLI de Graphify (pip) y lo registra en Claude Code
│       ├── ponytail.sh         # `claude plugin marketplace add` + `install` del plugin ponytail
│       ├── cyber-neo.sh        # clon de la skill de seguridad (commit fijado)
│       ├── parsers.sh          # markitdown (+MCP) / opendataloader-pdf / whisper-ctranslate2
│       └── rules.sh            # plantillas de reglas → <RAG_ROOT>/.claude/ + 4 hooks de cumplimiento/contexto
├── hooks/
│   ├── ui-audit.mjs             # hook PostToolUse/Edit|Write: ~15 reglas deterministas anti-patrones de UI
│   ├── git-footer-guard.mjs     # hook PreToolUse/Bash: bloquea commits con atribución de IA
│   ├── loop-breaker.mjs         # hook PostToolUse: corta bucles de 3 fallos idénticos seguidos
│   ├── skill-suggest.mjs        # hook UserPromptSubmit: sugiere Skills 2.0 para tecnologías nuevas
│   └── session-start.mjs        # hook SessionStart: contexto automático (grafo de Graphify + RAG)
├── skills/
│   ├── architecture-principles/
│   │   ├── SKILL.md
│   │   ├── skill.yaml
│   │   └── schema.json
│   ├── conventional-commits/
│   │   ├── SKILL.md
│   │   ├── skill.yaml
│   │   └── schema.json
│   ├── skill-mcp-builder/
│   │   ├── SKILL.md
│   │   ├── skill.yaml
│   │   └── schema.json
│   ├── no-ai-slop/
│   │   ├── SKILL.md         # fork propio traducido de petergyang/no-ai-slop (MIT)
│   │   ├── skill.yaml
│   │   └── schema.json
│   ├── rituales/
│   │   ├── SKILL.md         # documenta los cuatro rituales de ciclo de vida (E/D)
│   │   ├── skill.yaml
│   │   └── schema.json
│   ├── ui-ux-pro-max/
│   │   ├── SKILL.md
│   │   ├── skill.yaml
│   │   ├── schema.json
│   │   ├── data/            # CSVs: estilos, colores, tipografía, guías de UX, por stack, ...
│   │   └── scripts/         # core.py, design_system.py, search.py
│   └── validate-skills.mjs  # verificador del contrato Skills 2.0 — ejecutar tras cualquier edición de skill
└── templates/
    ├── vault/                   # semilla del vault de Obsidian V.A.U.L.T (se copia a <RAG_ROOT>/V.A.U.L.T)
    │   ├── .obsidian/graph.json # un grupo de color por categoría + ejemplos de subcolor
    │   ├── 00-Inbox/            # capturas sin clasificar (los parsers escriben aquí)
    │   ├── Codigo/, Proyectos/, Organizacion/, Investigacion/, Aprendizaje/, Journal/
    │   ├── _plantilla.md        # nota vacía con el frontmatter de taxonomía listo para copiar
    │   └── README.md            # taxonomía de las 6 categorías
    ├── rag/                     # semilla del stack R.A.G (se copia a <RAG_ROOT>/R.A.G)
    │   ├── docker-compose.yml   # pgvector/pgvector:pg17, puerto 5433
    │   ├── schema.sql           # tabla chunks (+ categoria/proyecto/tags) + índices + hnsw
    │   ├── .env.example, package.json, .gitignore
    │   ├── rag.mjs              # CLI: init/ingest/query/reindex/status; taxonomía + backends conmutables
    │   ├── ritual.mjs           # rituales manuales: init-proyecto / fin-dia / fin-ciclo (se instala junto a rag.mjs)
    │   ├── kaggle-embed.mjs     # backend de embeddings por lotes vía Kaggle (importado dinámicamente)
    │   ├── kaggle/              # plantillas del kernel que corre en Kaggle
    │   │   ├── kernel-metadata.json   # enable_gpu/enable_internet, dataset_sources
    │   │   └── embed_kernel.py        # BAAI/bge-m3 vía FlagEmbedding, corre en el T4 gratuito
    │   └── mcp-server.mjs       # wrapper MCP stdio (rag_query/rag_status, con categoria/proyecto)
    └── rules/                   # semilla de las reglas operativas (se copia a <RAG_ROOT>/.claude/)
        ├── CLAUDEMAX.md         # las 7 reglas operativas — se sobrescribe en cada instalación
        ├── CLAUDE.md            # archivo raíz mínimo (`@CLAUDEMAX.md`) — nunca pisa uno existente
        └── proyecto.md          # plantilla por proyecto que instancia `ritual.mjs init-proyecto`
```

## Wizard interactivo

Especificación completa: `docs/superpowers/specs/2026-08-02-wizard-design.md`. Lo que sigue es
el resumen operativo.

**Principio rector: el wizard no reimplementa la instalación, la orquesta.** Toda la lógica de
instalación sigue viviendo en `install.sh` y en `bin/components/*.sh`; `bin/wizard/wizard.mjs`
solo recoge decisiones del usuario y las traduce a flags y variables de entorno para un único
`bash install.sh` final, lanzado con stdio heredado — la salida que ves es literalmente la del
instalador, sin ninguna capa de reformateo. Consecuencia directa: la ruta no interactiva (flags
directos a `install.sh`) sigue funcionando exactamente igual y no hay dos instaladores que
mantener sincronizados.

Tecnología: Node ≥18, sin dependencias (igual que el resto del repo). `node:readline/promises`
para la entrada, secuencias ANSI para el color — sin librerías de TUI, para que el mismo menú
numerado funcione igual en Git Bash, cmd.exe y Windows Terminal. Colores desactivados si
`NO_COLOR`/`CLAUDEMAX_NO_COLOR` están definidas, si la salida no es TTY, o con `--no-color`.

### Puntos de entrada

| Archivo | Qué hace |
|---|---|
| `CLAUDEMAX-INSTALLER.cmd` | Comprueba que `node` esté en el PATH y lanza `bin/wizard/wizard.mjs`. Si falta Node, explica cómo instalarlo y hace `pause` antes de cerrar — para que la ventana no desaparezca de golpe al hacer doble clic. |
| `CLAUDEMAX-UNINSTALLER.cmd` | Igual, pero lanza `wizard.mjs --uninstall`. |

También se puede invocar directo, sin pasar por el `.cmd`: `node bin/wizard/wizard.mjs`.

### Los 9 pasos

1. **Bienvenida** — banner ASCII (el mismo de `install.sh`), y una frase de qué va a pasar. Enter para continuar, `q` para salir sin tocar nada.
2. **Destino del workspace** — pregunta dónde crear la carpeta raíz; por defecto `%USERPROFILE%\Desktop\WORKSPACE`. Valida que la ruta sea escribible; si ya existe y no está vacía, pide confirmación explícita antes de seguir. Esta respuesta se convierte en `RAG_ROOT`.
3. **Chequeo de dependencias** — tabla con estado en vivo (`node`, `git`, `claude`, `docker`, `ollama`, `python`, `java`, `winget`), detectada **ejecutando** `bin/lib/detect.sh` (la misma función `ac_detect_all` que usa `install.sh`), no reimplementando la detección en JS. Para lo que falte, el wizard no instala nada aquí: avisa qué componentes quedarán degradados y deja que cada componente resuelva sus propias dependencias en su momento (`ac_rag_ensure_deps` vía winget, `ac_parsers_ensure_python`).
4. **Selección de componentes** — lista con casilla marcada por defecto en los diez. La lista se extrae de `ALL_COMPONENTS` en `install.sh` con una expresión regular al arrancar — el wizard nunca mantiene su propia copia (ver más abajo).
5. **Vault** — tres modos, como ya soporta `rag.sh`: crear desde cero (plantilla con la taxonomía de seis categorías), importar uno existente (`VAULT_SRC`, valida que la ruta exista) o conectar a uno remoto (`VAULT_REMOTE`, URL de git). Se omite si `rag` quedó desmarcado en el paso 4.
6. **RAG** — los mismos tres modos (`RAG_MODE`, con `RAG_DUMP` / `RAG_REMOTE_URL` según el caso), y después Kaggle opcional: si se acepta, pide usuario y clave (**la clave se lee sin eco en pantalla**, con lectura raw-mode de stdin) y recuerda la verificación telefónica manual de Kaggle. Si se declina, las variables `KAGGLE_*` ni se mencionan en el resumen. Se omite si `rag` quedó desmarcado.
7. **Resumen y confirmación** — imprime la línea de comando completa con sus variables de entorno (auditable: se ve exactamente qué se va a ejecutar antes de ejecutarlo; la clave de Kaggle se enmascara en pantalla, no en el entorno real del proceso hijo) y ofrece ejecutar de verdad, simular (`--dry-run`) o cancelar.
8. **Ejecución** — localiza bash y lanza `bash install.sh` con los flags/variables acordados, con stdio heredado para que veas el progreso real (`ac_step` de `install.sh`).
9. **Resumen final** — código de salida del instalador, recordatorio de reiniciar Claude Code, y los comandos para empezar (`graphify extract .`, `ritual.mjs fin-sesion`, etc.). En Windows espera una tecla antes de cerrar (salvo con `--defaults` o si no hay TTY real, para no colgarse en una prueba automatizada).

### Modo desinstalación

`wizard.mjs --uninstall` (o `CLAUDEMAX-UNINSTALLER.cmd`) muestra qué se va a eliminar y qué se
conserva (dependencias de sistema, el vault, el volumen de datos del RAG, las reglas que
pudiste editar) y pide escribir la palabra **`desinstalar`** completa para confirmar — no un
simple sí/no, precisamente porque es una operación destructiva y un Enter accidental no debe
bastar. Cualquier otra respuesta cancela sin tocar nada. Confirmado, delega en `bash
uninstall.sh` con stdio heredado, igual que el paso 8 de la instalación.

### Flags del propio wizard

No confundir con los flags de `install.sh` (sección [Flags](README.md#flags) del README):

| Flag | Efecto |
|---|---|
| `--uninstall` | Modo desinstalación. |
| `--dry-run` | Fuerza modo simulación sin preguntarlo en el paso 7. |
| `--defaults` | Acepta todos los valores por defecto sin preguntar nada — útil para reinstalar rápido. Combinable con `--dry-run` para simular sin que pregunte nada. |
| `--no-color` | Desactiva los colores ANSI. |

### Decisiones de diseño que merecen explicación

- **Git Bash explícito antes que el `bash` del PATH, en Windows.** `bin/wizard/detect.mjs` prueba primero las rutas conocidas de Git for Windows (`%ProgramFiles%\Git\bin\bash.exe`, `%LOCALAPPDATA%\Programs\Git\bin\bash.exe`) antes de caer al `bash` que resuelva el PATH. Motivo: si el usuario tiene WSL instalado, su `bash` puede aparecer antes en el PATH, y el bash de WSL monta el disco de Windows en `/mnt/c` en vez de `/c` — las rutas que el wizard construye (`RAG_ROOT`, `AC_REPO_DIR`, rutas de vault/dump convertidas con `aPosix()`) no resolverían ahí y la instalación fallaría de forma confusa. Cada candidato se valida ejecutando `echo $OSTYPE` antes de aceptarlo: Git Bash reporta `msys`/`cygwin`, WSL reporta `linux-gnu` — si no empieza por `msys`/`cygwin` en Windows, se descarta aunque el binario exista y responda.
- **La lista de componentes se deriva, no se duplica.** `leerComponentes()` en `bin/wizard/detect.mjs` extrae `ALL_COMPONENTS=(...)` de `install.sh` con una expresión regular al arrancar — el wizard nunca mantiene su propia lista escrita a mano. Así, añadir un componente nuevo a `install.sh` lo hace aparecer en el paso 4 del wizard sin tocar el wizard. `bin/wizard/test-componentes.mjs` es la prueba de sincronización: evalúa la línea `ALL_COMPONENTS=(...)` con el parser de arrays real de bash (no otra regex de JS, para no esconder el mismo bug dos veces) y falla si diverge de lo que devuelve `leerComponentes()`. Ejecutar: `node bin/wizard/test-componentes.mjs`.
- **Confirmación por palabra exacta en la desinstalación.** A diferencia del resto de prompts del wizard (que aceptan s/n con Enter por defecto), `--uninstall` exige teclear `desinstalar` literal. Es la única confirmación del wizard que funciona así, deliberadamente: un simple "sí" es demasiado fácil de teclear por reflejo cuando la acción es destructiva.
- **Los pasos de vault y RAG (5 y 6) se omiten si `rag` queda desmarcado en el paso 4** — no tiene sentido preguntar `VAULT_MODE`/`RAG_MODE` si ese componente no se va a instalar.

## Dónde queda cada cosa en tu máquina

| Ruta | Escrita por | ¿La elimina `uninstall.sh`? |
|---|---|---|
| `$HOME/.local/bin/rtk` | Instalador de RTK (upstream) | Sí |
| `$CLAUDE_CONFIG_DIR/settings.json` (entradas de hooks) | rtk init | Las quitamos nosotros |
| `$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max/` | ui-ux.sh (`cp -R` desde este repo) | Sí |
| `$CLAUDE_CONFIG_DIR/hooks/ui-audit.mjs` + entrada `PostToolUse`/`Edit\|Write` en `settings.json` | ui-ux.sh (`cp` + `ac_merge_hook`) | Sí — `rm -f` del archivo y `ac_remove_hook` de la entrada en `settings.json` |
| `$CLAUDE_CONFIG_DIR/skills/superpowers/` | dev-skills.sh (`git clone`) | Sí |
| `$CLAUDE_CONFIG_DIR/skills/{architecture-principles,conventional-commits,skill-mcp-builder,no-ai-slop,rituales}/` | dev-skills.sh (`cp -R` desde este repo) | Sí |
| `$CLAUDE_CONFIG_DIR/skills/cyber-neo/` | cyber-neo.sh (`git clone` + checkout del commit fijado) | Sí |
| Paquete pip `graphifyy` (binario `graphify`, vía `uv tool install` / `pipx install` / `pip install --user`, el primero disponible) | graphify.sh | **No** — es una dependencia de sistema, igual que los parsers; desinstálala a mano con `pip uninstall graphifyy` (o `uv tool uninstall` / `pipx uninstall`) si quieres |
| Sección `## graphify` en `CLAUDE.md` + hook `PreToolUse` (`Bash\|Grep`, `Read\|Glob`) en `.claude/settings.json`, en `$AC_REPO_DIR` (el propio repo de CLAUDEMAX) | graphify.sh (`graphify claude install`, sin `--strict`) | Sí — `graphify claude uninstall` en `$AC_REPO_DIR`. Es un registro **por-proyecto**: si ejecutaste `graphify claude install` en otros proyectos a mano, desregístralos ahí también con `graphify claude uninstall` |
| `<proyecto>/graphify-out/` (`graph.json`, `graph.html`, `GRAPH_REPORT.md`) en cualquier proyecto donde corras `graphify extract` | El propio CLI `graphify`, invocado manualmente por ti | **No** — no es CLAUDEMAX quien lo genera; bórralo a mano en cada proyecto si quieres |
| Legado: plugin `understand-anything` (en `$CLAUDE_CONFIG_DIR/plugins/cache/`) + marketplace `understand-anything`, de instalaciones de CLAUDEMAX anteriores a este cambio | Ya no lo instala `graphify.sh` — se detecta y se quita como migración (`claude plugin uninstall`/`marketplace remove`, best-effort) | Sí, best-effort — `claude plugin uninstall understand-anything -s user` + `marketplace remove`. Si el CLI falla, hazlo en sesión con `/plugin uninstall understand-anything` |
| Plugin `ponytail` (marketplace `DietrichGebert/ponytail`, típicamente en `$CLAUDE_CONFIG_DIR/plugins/cache/`) + flags `$CLAUDE_CONFIG_DIR/.ponytail-active` y `.ponytail-statusline-nudged` | ponytail.sh (`claude plugin marketplace add` + `claude plugin install`) | Sí, best-effort — ejecuta primero `node <plugin>/scripts/uninstall.js` (limpia flags/statusLine) si localiza el directorio del plugin, luego `claude plugin uninstall ponytail -s user` + `marketplace remove`, y borra los dos archivos de flag. **No** elimina `~/.config/ponytail/config.json` — puedes haberlo editado a mano |
| Registro MCP de Claude: `markitdown` | parsers.sh (`claude mcp add -s user`) | Sí |
| Paquetes pip `markitdown[all]`, `markitdown-mcp`, `opendataloader-pdf`, `whisper-ctranslate2` | parsers.sh (`pip install`) | **No** — quítalos con `pip uninstall` si quieres |
| Python 3.12, Temurin JDK 21, Docker Desktop, Ollama | parsers.sh / rag.sh (`winget install`, solo si faltaban) | **No** — son dependencias de sistema; desinstálalas a mano |
| Registro MCP de Claude: `figma`, `magic` | figma-mcp.sh, ui-ux.sh | Sí |
| `<cwd>/package.json`, `<cwd>/node_modules/` | `npm install` de ui-ux.sh | **No** — no tocamos las dependencias de tu proyecto al desinstalar |
| `<RAG_ROOT>/V.A.U.L.T`, `<RAG_ROOT>/R.A.G`, registro MCP de Claude: `rag`, volumen Docker `ragdata` | rag.sh (`cp -R` de templates, `docker compose up`, `claude mcp add`) | Solo el registro MCP + el contenedor `claudemax-ragdb` — las carpetas y el volumen `ragdata` sobreviven a la desinstalación |
| `$HOME/.kaggle/kaggle.json` | rag.sh (`ac_rag_kaggle_setup`, solo si `KAGGLE_USERNAME`/`KAGGLE_KEY` están en el entorno) | **No** — es una credencial de tu cuenta de Kaggle, no un artefacto de CLAUDEMAX; bórrala a mano si quieres |
| `$CLAUDE_CONFIG_DIR/hooks/{git-footer-guard,loop-breaker,skill-suggest,session-start}.mjs` + sus entradas `PreToolUse`/`PostToolUse`/`UserPromptSubmit`/`SessionStart` en `settings.json` | rules.sh (`cp` + `ac_merge_hook`) | Sí — `rm -f` de los 4 archivos y `ac_remove_hook` de sus 4 entradas en `settings.json` |
| `<RAG_ROOT>/.claude/` (`CLAUDEMAX.md`, `CLAUDE.md`, `proyecto.md`) | rules.sh (`cp -f` de `templates/rules/`) | **No** — contiene reglas que pudiste editar a mano; sobrevive a la desinstalación igual que `V.A.U.L.T`/`R.A.G` |
| `$CLAUDE_CONFIG_DIR/state/{loop-breaker,skill-suggest}.json` | loop-breaker.mjs / skill-suggest.mjs (estado por sesión, escritura propia) | Sí |

`uninstall.sh` también elimina, best-effort, un puñado de rutas heredadas de instalaciones antiguas de CLAUDEMAX (antes ABSOLUTE-CLAUDE) (`skills/repo-map/`, `skills/dcp-lite/`, `hooks/dcp-lite-dedup.mjs`, `state/dcp-lite-*.json`, y los nombres de skill pre-2.0 `solid`, `design-patterns`, `architecture-patterns`) para que actualizar en el sitio no deje nada atrás. Ninguno de esos componentes lo instala el `install.sh` actual. Lo mismo aplica a Caveman: ya no es un componente de `install.sh`, pero `uninstall.sh` sigue delegando en su propio `--uninstall` para dejar limpias las instalaciones antiguas que lo tenían activo (hooks, statusline, `$CLAUDE_CONFIG_DIR/.caveman-active`, y el MCP de proyecto `caveman-shrink`, que gestiona el propio desinstalador de Caveman).

## Orden de instalación de componentes (y por qué)

1. **rtk** — binario independiente; se instala primero para que los pasos siguientes puedan verificar el PATH.
   - En macOS/Linux: ejecuta el instalador upstream `curl | sh`.
   - En Windows (MinGW/MSYS/Cygwin vía Git Bash): descarga `rtk-x86_64-pc-windows-msvc.zip` del último release de GitHub y extrae `rtk.exe` en `~/.local/bin/`. Prueba `unzip`, luego `powershell.exe Expand-Archive`, luego `python -m zipfile` hasta que uno funcione.
   - El hook PreToolUse/Bash (`rtk hook claude`) se escribe directamente en `~/.claude/settings.json` mediante nuestro merger JSONC — no dependemos del prompt interactivo y/N de `rtk init -g`, que por defecto responde `N` en shells no interactivos.
2. **figma** — necesita el CLI `claude`; se registra a nivel de **usuario** (`claude mcp add -s user`) para que funcione en todos los proyectos.
3. **ui-ux** — también necesita `claude` para el MCP magic (también registrado a nivel de **usuario**); muta el cwd vía `npm install` (condicionado). Además de copiar la skill, ahora también copia `hooks/ui-audit.mjs` a `$CLAUDE_CONFIG_DIR/hooks/` y lo registra como `PostToolUse`/`Edit|Write` en `settings.json` (auditoría determinista de anti-patrones de UI; desactivable con `CLAUDEMAX_UI_AUDIT=0`).
4. **dev-skills** — copia simple de archivos para `architecture-principles` / `conventional-commits` / `skill-mcp-builder` / `no-ai-slop` / `rituales`; `git clone`/`git pull` para `superpowers`. Sin dependencia de orden con los demás.
5. **rag** — opt-in (necesita `RAG_ROOT` definido, si no avisa y se omite): copia `templates/vault` (con la taxonomía de 6 categorías) → `<RAG_ROOT>/V.A.U.L.T` y `templates/rag` (incluidas las plantillas de Kaggle en `kaggle/`) → `<RAG_ROOT>/R.A.G`, auto-instala Docker y Ollama vía winget si faltan, levanta el stack Docker Compose `ragdb` + `bge-m3`, hace `npm install` de las dependencias del CLI/MCP, configura el backend opcional de Kaggle si `KAGGLE_USERNAME`/`KAGGLE_KEY` están en el entorno, y registra el MCP `rag` a nivel de **usuario**.
6. **graphify** — instala el paquete pip `graphifyy` (`uv tool install` / `pipx install` / `pip install --user`, el primero disponible) y ejecuta `graphify claude install` (registro por-proyecto: sección de `CLAUDE.md` + hook `PreToolUse`, sin `--strict`). Antes de instalar nada, hace la migración: si detecta el plugin equivocado de una instalación anterior (`understand-anything`), lo quita. Sin dependencia de orden con los demás — ya no toca la configuración de plugins de `claude`.
7. **ponytail** — necesita `claude`; sin él avisa con los comandos `/plugin` para hacerlo en sesión y no falla la instalación. Idempotente vía `claude plugin list`. `claude plugin marketplace add DietrichGebert/ponytail` + `claude plugin install ponytail@ponytail`. Sin dependencia de orden con los demás — sus hooks (`SessionStart`/`SubagentStart`/`UserPromptSubmit`) no chocan con el `PreToolUse` de graphify.
8. **cyber-neo** — `git clone` + `checkout` del commit fijado en `$CLAUDE_CONFIG_DIR/skills/cyber-neo`. Sin dependencia de orden.
9. **parsers** — auto-instala Python y el JDK vía winget si faltan, luego `pip install` de los tres parsers, registra el MCP `markitdown` a nivel de **usuario**, y barre restos heredados de Context7 / Claude-Mem (entran en conflicto con el cerebro RAG).
10. **rules** — **último** a propósito: copia `templates/rules/` a `<RAG_ROOT>/.claude/` (requiere `RAG_ROOT`, igual que `rag`; sin él instala solo los hooks y avisa) y registra los cuatro hooks de cumplimiento y contexto en `$CLAUDE_CONFIG_DIR/hooks/`. Va al final porque sus reglas y su hook `session-start` referencian rutas que crean los pasos anteriores (`<RAG_ROOT>/V.A.U.L.T`, `<RAG_ROOT>/R.A.G/rag.mjs`, las skills ya instaladas) — instalarlo antes correría el riesgo de documentar/consultar rutas que todavía no existen.

## Interacciones entre flags

- `--dry-run` lo respeta cada componente. El instalador upstream de RTK no soporta dry-run; en su lugar imprimimos el comando curl y lo omitimos.
- `--force` no reinstala todo en bloque — cada componente decide qué significa "force" para sí mismo (rtk: re-encadena el instalador; Figma/magic: `mcp remove` y luego `mcp add`; copia de la skill ui-ux: `rm -rf` + `cp -R`; clon de superpowers: `rm -rf` y re-clona en vez de `git pull`).
- `--no-npm` solo afecta al paso de framer-motion/gsap en `ui-ux`. **No** suprime el paso basado en `npx` (MCP `magic`) — usa el registro de npm pero no muta tu proyecto.
- `--config-dir` se propaga a dónde `dev-skills`/`ui-ux` copian los directorios de skills (vía `CLAUDE_CONFIG_DIR`). RTK y los registros MCP de Figma/magic no aceptan un override de config-dir — usan los valores por defecto del CLI `claude`.

## Troubleshooting

### "Hago doble clic en `CLAUDEMAX-INSTALLER.cmd` y la ventana se cierra de golpe"

El `.cmd` termina con `pause`, así que en condiciones normales siempre espera una tecla antes de
cerrar — incluso si algo falló. Si la ventana se cierra de golpe sin llegar a mostrar ese
`pause`, es que falta Node.js ≥18 en el PATH: el propio `.cmd` comprueba `where node` al
arrancar y, si no lo encuentra, imprime el error, hace `pause` y sale con código 1 (ese `pause`
sí debería verse). Si ni siquiera eso aparece, revisa que el archivo no se esté ejecutando desde
un antivirus/SmartScreen que lo bloquee antes de arrancar `cmd.exe`. Instala Node desde
<https://nodejs.org/> (o `winget install -e --id OpenJS.NodeJS.LTS`) y vuelve a intentarlo.

### "El wizard dice que no encuentra bash"

`bin/wizard/detect.mjs` busca bash en este orden: rutas conocidas de Git for Windows
(`%ProgramFiles%\Git\bin\bash.exe`, `%LOCALAPPDATA%\Programs\Git\bin\bash.exe`) y, si ninguna
sirve, el `bash` del PATH. **El bash de WSL no cuenta aunque esté instalado y responda**: WSL
monta el disco de Windows en `/mnt/c` en vez de `/c`, así que las rutas que el wizard le pasa
(`RAG_ROOT`, rutas de vault/dump) no resolverían ahí — el wizard valida cada candidato con
`echo $OSTYPE` y descarta cualquiera que no reporte `msys`/`cygwin` en Windows, precisamente
para no caer en ese caso. La solución es instalar Git for Windows
(<https://git-scm.com/download/win>), que trae Git Bash — no hace falta configurar nada más, el
wizard lo encuentra solo en cuanto está en una de esas dos rutas estándar.

### "Quiero reinstalar sin que me pregunte nada"

```bash
node bin/wizard/wizard.mjs --defaults
```

Acepta todos los valores por defecto (destino `WORKSPACE` en el escritorio, todos los
componentes marcados, vault y RAG en modo `create`, Kaggle omitido) sin hacer ninguna pregunta.
Combínalo con `--dry-run` para ver primero qué línea de comando ejecutaría, sin tocar nada:

```bash
node bin/wizard/wizard.mjs --defaults --dry-run
```

Si prefieres no pasar por el wizard en absoluto, `bash install.sh` (sin argumentos) es el
equivalente directo — instala todos los componentes con los valores por defecto de cada uno.

### "El preflight dice que me falta node, pero `node --version` funciona en mi shell"

`install.sh` ejecuta `command -v node`. Si tu node lo carga un gestor de versiones que solo se activa en shells interactivos (nvm, asdf), no será visible para un script. Haz source del gestor de versiones primero, o enlaza (symlink) el binario de node en `/usr/local/bin/` o `~/.local/bin/`.

### "`claude mcp add figma ...` falló con 'unknown command'"

Las versiones de Claude Code anteriores al soporte de MCP no tienen `claude mcp`. Actualiza Claude Code. Verifica con `claude --version` (necesitas un build reciente).

### "El MCP de Figma aparece en `/mcp` pero nunca autentica"

El OAuth requiere un navegador por defecto. Si estás en un servidor headless, ejecuta el flujo de OAuth en una máquina de escritorio con sesión iniciada en la misma cuenta de Claude; el token se sincroniza.

### "Mi `settings.json` quedó dañado"

`bin/lib/jsonc.sh` escribe un `.bak` junto a `settings.json` antes de cada merge. Restaura con:

```bash
cp ~/.claude/settings.json.bak ~/.claude/settings.json
```

Abre un issue con el archivo dañado (redactado) — que el merger JSONC sobreviva pero rompa Claude Code es un bug que vale la pena arreglar.

### "Quiero omitir RTK porque estoy en un entorno gestionado que bloquea `$HOME/.local/bin`"

```bash
bash install.sh --skip rtk
```

Todo lo demás se instala igual.

### "Solo quiero las partes de UI/UX, no los ahorradores de tokens"

```bash
bash install.sh --only figma --only ui-ux
```

### "Re-ejecutar el instalador sigue re-clonando superpowers"

Si `--force` está activo, `dev-skills.sh` borra y re-clona. Sin `--force`, hace `git pull --ff-only` en el checkout existente. Si el pull sigue fallando, tu clon local ha divergido — ejecuta `rm -rf $CLAUDE_CONFIG_DIR/skills/superpowers` y vuelve a correr.

### "Docker no está corriendo / falta ollama"

El componente `rag` avisa y omite esos pasos en vez de hacer fallar la instalación (los pasos de compose/schema necesitan Docker; la descarga de `bge-m3` necesita `ollama` en el PATH). Arranca Docker Desktop / instala Ollama, y vuelve a correr `bash install.sh --only rag` — es idempotente y retoma donde se quedó.

### "winget falló al instalar Python / el JDK"

Los componentes `parsers` y `rag` avisan y siguen adelante en vez de romper la instalación. Instala a mano lo que falte:

```bash
winget install -e --id Python.Python.3.12
winget install -e --id EclipseAdoptium.Temurin.21.JDK
```

Después **abre una shell nueva** (winget actualiza el PATH, pero la sesión actual no lo ve) y vuelve a correr `bash install.sh --only parsers`. Si `python` sigue sin aparecer en Git Bash pero `py -3` sí funciona, el componente usa `py -3` automáticamente.

### "`graphify` no queda en el PATH después de instalarlo"

Cuando ni `uv` ni `pipx` están disponibles, `graphify.sh` cae a `pip install --user graphifyy`, y `pip`
deja el binario en el directorio de scripts de usuario de Python — que **no** siempre está en el
PATH. Verás un aviso así en la instalación:

```
WARNING: The script graphify.exe is installed in '...\Python\PythonXXX\Scripts' which is not on PATH.
```

Soluciones, de más a menos preferible:

1. **Instala con `pipx` o `uv` en su lugar** (ambos gestionan el PATH por ti): `pipx install graphifyy`
   o `uv tool install graphifyy`, y vuelve a correr `bash install.sh --only graphify --force`.
2. **Añade el directorio de scripts al PATH** — en Windows suele ser
   `%APPDATA%\Python\PythonXXX\Scripts` (Git Bash: `~/AppData/Roaming/Python/PythonXXX/Scripts`); en
   macOS/Linux, `~/.local/bin`. Abre una shell nueva después de tocar el PATH.
3. **Localízalo a mano si no sabes dónde quedó**: `python -m pip show -f graphifyy` lista los archivos
   instalados, incluido el binario.

Mientras `graphify` no esté en el PATH, el paso de registro en Claude Code (`graphify claude install`)
se omite con un aviso — el resto de componentes se instalan igual. Vuelve a correr
`bash install.sh --only graphify` una vez resuelto el PATH; es idempotente.

### "`graphify claude install` falló durante la instalación"

Revisa que `graphify --version` funcione en una shell nueva (ver el punto anterior sobre el PATH). Si
funciona pero el registro sigue fallando, ejecútalo a mano dentro del repo que quieras integrar:

```bash
cd <tu-repo>
graphify claude install
```

Escribe una sección `## graphify` en `./CLAUDE.md` y un hook `PreToolUse` en `./.claude/settings.json`
— es un registro **por-proyecto**, no global (a diferencia del resto de componentes de CLAUDEMAX). El
componente `graphify.sh` lo ejecuta en `$AC_REPO_DIR` (el propio repo de CLAUDEMAX); para activarlo en
cualquier otro proyecto, repite el comando ahí.

### "Ponytail me interrumpe demasiado / quiero bajarle la intensidad sin desinstalarlo"

Ponytail arranca en modo `full`. Sin desinstalar el plugin, tienes dos formas de bajarle
el volumen o apagarlo del todo, de niveles `lite` (menos estricto) a `ultra` (más estricto)
y `off` (desactivado):

```bash
export PONYTAIL_DEFAULT_MODE=lite   # o: full | ultra | off
```

O edita directamente `~/.config/ponytail/config.json` (el mismo archivo que lee la variable
de entorno de arriba si no está definida). Ninguna de las dos formas requiere reinstalar ni
tocar `install.sh` — son configuración propia del plugin, no de CLAUDEMAX.

### "`claude plugin install ponytail@ponytail` falló durante la instalación"

`bin/components/ponytail.sh` avisa en vez de romper la instalación y te da los dos comandos
exactos para hacerlo a mano en una sesión de Claude Code:

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Si `claude plugin list` no muestra `ponytail` después de eso, actualiza el CLI `claude`
(las versiones antiguas pueden no soportar `plugin marketplace`/`plugin install` de forma
no interactiva) y vuelve a intentarlo.

### "`opendataloader-pdf` no procesa nada"

Su núcleo es Java: sin un JDK 11+ funcional el wrapper de Python no hace nada. Comprueba con `java -version`; si falla, mira el apartado de winget de arriba.

### "El hook de UI me avisa demasiado"

`hooks/ui-audit.mjs` corre tras cada `Edit`/`Write`/`MultiEdit` sobre un archivo `.css`/`.scss`/`.tsx`/`.jsx`/`.vue`/`.svelte`/`.html` y emite un `<system-reminder>` por hallazgo (máximo 6 por edición) — nunca bloquea la edición, solo avisa. Para silenciarlo sin desinstalar nada:

```bash
export CLAUDEMAX_UI_AUDIT=0
```

Para quitarlo del todo, desregistra la entrada `PostToolUse` que contiene `ui-audit.mjs` en `$CLAUDE_CONFIG_DIR/settings.json` (o corre `bash uninstall.sh`, que lo hace por ti con `ac_remove_hook`).

### "Un commit me lo bloquea el hook"

Es intencional: `hooks/git-footer-guard.mjs` detecta `git commit` con `Co-authored-by: Claude`, "Generated with Claude Code", el emoji 🤖 o `noreply@anthropic.com` en el mensaje, y deniega la ejecución (regla 4 de `CLAUDEMAX.md` — sin footers de atribución de IA). Reintenta el commit sin ese footer. Si de verdad lo necesitas (por ejemplo, para depurar el propio hook):

```bash
export CLAUDEMAX_GIT_GUARD=0
```

Es el único de los cuatro hooks de `rules` que bloquea algo; los otros tres solo avisan.

### "El aviso de bucle salta cuando no toca"

`hooks/loop-breaker.mjs` cuenta fallos con la misma firma: `(herramienta, primeros 200 caracteres del error normalizado)`. Normaliza rutas absolutas, números de línea/columna y timestamps antes de comparar, para que dos intentos del "mismo" error colisionen aunque cambien detalles incidentales (una ruta temporal distinta, otra línea de la misma traza). Si el aviso salta con errores que tú consideras distintos, probablemente comparten ese primer tramo normalizado de 200 caracteres — no hay forma de ajustar la sensibilidad sin tocar el hook. Un éxito de la misma herramienta reinicia el contador. Para silenciarlo:

```bash
export CLAUDEMAX_LOOP_BREAKER=0
```

### "La sesión tarda en arrancar"

`hooks/session-start.mjs` tiene un presupuesto total de ~5s (resumen del grafo de Graphify + consulta acotada al RAG); si algo tarda más, ese paso se omite en silencio en vez de retrasar el arranque — nunca deberías notar una espera larga achacable a este hook. Si aun así te resulta molesto o simplemente no quieres el contexto automático:

```bash
export CLAUDEMAX_SESSION_CONTEXT=0
```

### "Quiero las reglas en un proyecto ya existente"

Ejecuta el ritual de inicialización sobre esa carpeta — nunca sobrescribe nada que ya exista:

```bash
node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto]
```

Crea `<ruta>/.claude/CLAUDEMAX.md` (la plantilla `templates/rules/proyecto.md` con sus marcadores sustituidos), `<ruta>/.claude/CLAUDE.md` (o le añade `@CLAUDEMAX.md` si el archivo ya existía) y la nota índice `V.A.U.L.T/Proyectos/<nombre>/00-indice.md`.

### "Kaggle no arranca los kernels"

Antes de nada, confirma la verificación telefónica: sin ella, Kaggle no habilita GPU ni Internet en los kernels aunque `kernel-metadata.json` pida `enable_gpu: true`. Se hace una sola vez en <https://www.kaggle.com/settings> → Phone Verification.

Con eso resuelto:

- Revisa la cuota semanal de GPU (~30 h/semana); si la agotaste, el kernel queda en cola hasta que se renueve.
- `EMBED_BACKEND=kaggle`/`--backend kaggle` es **batch asíncrono** — el kernel tarda minutos, no es instantáneo. `kaggle-embed.mjs` hace poll con `kaggle kernels status` hasta `complete` (timeout configurable con `KAGGLE_POLL_TIMEOUT_MS`, por defecto 20 min).
- Verifica el estado a mano en cualquier momento:

```bash
kaggle kernels status <tu_usuario>/claudemax-embed
```

- Si el CLI no está instalado o faltan credenciales, `rag.mjs` avisa con el comando exacto a ejecutar y cae a Ollama local en vez de fallar — la ingesta nunca se interrumpe por esto.
- Confirma que `id`/`dataset_sources` en `R.A.G/kaggle/kernel-metadata.json` y `KAGGLE_KERNEL_SLUG` en `.env` usan tu usuario real de Kaggle (el instalador deja el placeholder `<TU_USUARIO_DE_KAGGLE>` si no lo reemplazaste).

### "Quiero indexar sin saturar la CPU"

Tres rutas, de menos a más esfuerzo de configuración:

1. **`ollama` local** — usa la GPU/CPU de la propia máquina. Si no tiene GPU, cada `ingest` compite por CPU con lo demás que corras.
2. **`remote`** — apunta `OLLAMA_URL` en `.env` a otra máquina de tu red con GPU (`OLLAMA_URL=http://192.168.1.50:11434`). Es la opción recomendada: mismo código que `ollama`, cero cómputo local, solo latencia de LAN.
3. **`kaggle`** — para un re-indexado masivo puntual (`node rag.mjs reindex --backend kaggle`) usa una GPU T4 gratuita en la nube en vez de tu máquina. Es la opción con más fricción (credenciales, verificación telefónica, cuota semanal) y solo sirve para lotes, nunca para `query`.

### "`node skills/validate-skills.mjs` falla después de editar una skill"

Cada skill bajo `skills/<name>/` necesita los tres archivos (`SKILL.md`, `skill.yaml`, `schema.json`), el campo `name` en el frontmatter de `SKILL.md` y en `skill.yaml` debe coincidir con el nombre del directorio, `skill.yaml` necesita una lista `triggers` no vacía y un `kind` de `knowledge` o `tool`, y `schema.json` necesita `definitions.inputs` / `definitions.outputs`. El validador imprime exactamente qué comprobación falló por cada skill.

## Instalación manual (sin instalador)

Cada paso que ejecuta `install.sh` es simplemente un comando público. Si prefieres auditarlos y ejecutarlos tú mismo, lee `bin/components/*.sh` — cada archivo tiene ~50 líneas y es autocontenido.
