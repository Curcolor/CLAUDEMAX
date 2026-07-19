# INSTALL.md — instalación extendida / layout / troubleshooting

Para la versión corta, ve [README.md](README.md). Este documento cubre la estructura de archivos, qué mutación hace realmente cada componente en disco, y qué hacer cuando algo se rompe.

## Estructura

```
ABSOLUTE-CLAUDE/
├── install.sh                  # punto de entrada
├── uninstall.sh                # desmontaje simétrico
├── README.md                   # versión corta
├── INSTALL.md                  # este archivo
├── bin/
│   ├── lib/
│   │   ├── log.sh              # helpers info/warn/error/dim/run-or-dry
│   │   ├── detect.sh           # comprobaciones de presencia para curl/git/node/npm/claude/opencode
│   │   ├── claude-config.sh    # resuelve $CLAUDE_CONFIG_DIR (por defecto ~/.claude)
│   │   └── jsonc.sh            # merge/remove tolerante a JSONC para los hooks de settings.json
│   └── components/
│       ├── rtk.sh              # encadena la instalación de rtk + `rtk init --global`
│       ├── caveman.sh          # `npx -y github:JuliusBrussee/caveman -- --all`
│       ├── figma-mcp.sh        # `claude mcp add --transport http figma ...`
│       ├── ui-ux.sh            # copia skills/ui-ux-pro-max + registra el MCP magic + npm i
│       ├── dev-skills.sh       # clon de superpowers + 2 skills propias de ingeniería
│       └── rag.sh              # vault V.A.U.L.T + stack R.A.G (compose/schema/CLI/MCP) + registro MCP
├── skills/
│   ├── architecture-principles/
│   │   ├── SKILL.md
│   │   ├── skill.yaml
│   │   └── schema.json
│   ├── conventional-commits/
│   │   ├── SKILL.md
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
    │   ├── .obsidian/graph.json
    │   ├── 00-Inbox/, Projects/, Journal/
    │   └── README.md
    └── rag/                     # semilla del stack R.A.G (se copia a <RAG_ROOT>/R.A.G)
        ├── docker-compose.yml   # pgvector/pgvector:pg17, puerto 5433
        ├── schema.sql           # tabla chunks + índice hnsw
        ├── .env.example, package.json, .gitignore
        ├── rag.mjs              # CLI: init/ingest/query/reindex/status
        └── mcp-server.mjs       # wrapper MCP stdio (rag_query/rag_status)
```

## Dónde queda cada cosa en tu máquina

| Ruta | Escrita por | ¿La elimina `uninstall.sh`? |
|---|---|---|
| `$HOME/.local/bin/rtk` | Instalador de RTK (upstream) | Sí |
| `$CLAUDE_CONFIG_DIR/settings.json` (entradas de hooks) | Caveman, rtk init | Las entradas de Caveman las quita Caveman; las de rtk las quitamos nosotros |
| `$CLAUDE_CONFIG_DIR/skills/ui-ux-pro-max/` | ui-ux.sh (`cp -R` desde este repo) | Sí |
| `$CLAUDE_CONFIG_DIR/skills/superpowers/` | dev-skills.sh (`git clone`) | Sí |
| `$CLAUDE_CONFIG_DIR/skills/{architecture-principles,conventional-commits}/` | dev-skills.sh (`cp -R` desde este repo) | Sí |
| `$CLAUDE_CONFIG_DIR/.caveman-active` | Caveman | Lo gestiona Caveman |
| Registro MCP de Claude: `figma`, `magic`, `caveman-shrink` | figma-mcp.sh, ui-ux.sh, Caveman | Sí para figma + magic; Caveman gestiona el suyo |
| `<cwd>/package.json`, `<cwd>/node_modules/` | `npm install` de ui-ux.sh | **No** — no tocamos las dependencias de tu proyecto al desinstalar |
| `<RAG_ROOT>/V.A.U.L.T`, `<RAG_ROOT>/R.A.G`, registro MCP de Claude: `rag`, volumen Docker `ragdata` | rag.sh (`cp -R` de templates, `docker compose up`, `claude mcp add`) | Solo el registro MCP + el contenedor `claudemax-ragdb` — las carpetas y el volumen `ragdata` sobreviven a la desinstalación |

`uninstall.sh` también elimina, best-effort, un puñado de rutas heredadas de instalaciones antiguas de ABSOLUTE-CLAUDE (`skills/repo-map/`, `skills/dcp-lite/`, `hooks/dcp-lite-dedup.mjs`, `state/dcp-lite-*.json`, y los nombres de skill pre-2.0 `solid`, `design-patterns`, `architecture-patterns`) para que actualizar en el sitio no deje nada atrás. Ninguno de esos componentes lo instala el `install.sh` actual.

## Orden de instalación de componentes (y por qué)

1. **rtk** — binario independiente; se instala primero para que los pasos siguientes puedan verificar el PATH.
   - En macOS/Linux: ejecuta el instalador upstream `curl | sh`.
   - En Windows (MinGW/MSYS/Cygwin vía Git Bash): descarga `rtk-x86_64-pc-windows-msvc.zip` del último release de GitHub y extrae `rtk.exe` en `~/.local/bin/`. Prueba `unzip`, luego `powershell.exe Expand-Archive`, luego `python -m zipfile` hasta que uno funcione.
   - El hook PreToolUse/Bash (`rtk hook claude`) se escribe directamente en `~/.claude/settings.json` mediante nuestro merger JSONC — no dependemos del prompt interactivo y/N de `rtk init -g`, que por defecto responde `N` en shells no interactivos.
2. **caveman** — cablea hooks, statusline, MCP `caveman-shrink`. Idempotente. El MCP `caveman-shrink` se registra a nivel de proyecto (lo gestiona el propio instalador de Caveman).
3. **figma** — necesita el CLI `claude`; se registra a nivel de **usuario** (`claude mcp add -s user`) para que funcione en todos los proyectos.
4. **ui-ux** — también necesita `claude` para el MCP magic (también registrado a nivel de **usuario**); muta el cwd vía `npm install` (condicionado).
5. **dev-skills** — copia simple de archivos para `architecture-principles` / `conventional-commits`; `git clone`/`git pull` para `superpowers`. Sin dependencia de orden con los demás.
6. **rag** — opt-in (necesita `RAG_ROOT` definido, si no avisa y se omite): copia `templates/vault` → `<RAG_ROOT>/V.A.U.L.T` y `templates/rag` → `<RAG_ROOT>/R.A.G`, levanta el stack Docker Compose `ragdb` + `bge-m3` vía Ollama, hace `npm install` de las dependencias del CLI/MCP, y registra el MCP `rag` a nivel de **usuario**. Sin dependencia de orden con los demás.

## Interacciones entre flags

- `--dry-run` lo respeta cada componente **y** se propaga al propio `--dry-run` de Caveman. El instalador upstream de RTK no soporta dry-run; en su lugar imprimimos el comando curl y lo omitimos.
- `--force` no reinstala todo en bloque — cada componente decide qué significa "force" para sí mismo (rtk: re-encadena el instalador; Caveman: pasa `--force`; Figma/magic: `mcp remove` y luego `mcp add`; copia de la skill ui-ux: `rm -rf` + `cp -R`; clon de superpowers: `rm -rf` y re-clona en vez de `git pull`).
- `--no-npm` solo afecta al paso de framer-motion/gsap en `ui-ux`. **No** suprime los pasos basados en `npx` (`caveman`, MCP `magic`) — esos usan el registro de npm pero no mutan tu proyecto.
- `--config-dir` se propaga a Caveman (vía el propio `--config-dir` de Caveman) y a dónde `dev-skills`/`ui-ux` copian los directorios de skills. RTK y los registros MCP de Figma/magic no aceptan un override de config-dir — usan los valores por defecto del CLI `claude`.

## Troubleshooting

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

### "`node skills/validate-skills.mjs` falla después de editar una skill"

Cada skill bajo `skills/<name>/` necesita los tres archivos (`SKILL.md`, `skill.yaml`, `schema.json`), el campo `name` en el frontmatter de `SKILL.md` y en `skill.yaml` debe coincidir con el nombre del directorio, `skill.yaml` necesita una lista `triggers` no vacía y un `kind` de `knowledge` o `tool`, y `schema.json` necesita `definitions.inputs` / `definitions.outputs`. El validador imprime exactamente qué comprobación falló por cada skill.

## Instalación manual (sin instalador)

Cada paso que ejecuta `install.sh` es simplemente un comando público. Si prefieres auditarlos y ejecutarlos tú mismo, lee `bin/components/*.sh` — cada archivo tiene ~50 líneas y es autocontenido.
