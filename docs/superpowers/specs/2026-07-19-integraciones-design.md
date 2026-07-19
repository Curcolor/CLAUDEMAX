# Integraciones de Herramientas (Subproyecto C) — Especificación de Diseño

**Fecha:** 2026-07-19
**Padre:** [Diseño maestro CLAUDEMAX](2026-07-19-claudemax-master-design.md)
**Estado:** Diseño aprobado

## Objetivo

Integrar en el instalador las herramientas externas del ecosistema CLAUDEMAX: Understand-Anything ("Graphify", grafos de conocimiento del codebase), Cyber Neo (auditoría de seguridad OWASP 2025 / CWE Top 25), y los tres parsers de ingesta (MarkItDown, opendataloader-pdf, whisper-ctranslate2). Añadir la meta-skill first-party `skill-mcp-builder`. Todo con auto-instalación de prerrequisitos (Python, JDK) vía winget — el usuario solo ejecuta el instalador.

## Registro de decisiones (de la investigación upstream 2026-07-19)

| Decisión | Elección | Motivo |
|---|---|---|
| Understand-Anything | Plugin de Claude Code vía marketplace (`Egonex-AI/Understand-Anything`, MIT, muy activo) | Es su mecanismo nativo; salida `.ua/knowledge-graph.json` parseable — la leerá el ritual SessionStart (subproyecto D) |
| Cyber Neo | `git clone` a `~/.claude/skills/cyber-neo` con commit fijado | Es una skill pura (SKILL.md + referencias + 2 scripts Python stdlib); proyecto joven → pin por reproducibilidad |
| MarkItDown | `pip install "markitdown[all]"` + MCP oficial `markitdown-mcp` registrado a scope user | Única herramienta con MCP oficial; la más madura de las cinco |
| opendataloader-pdf | `pip install -U opendataloader-pdf`; JDK 11+ auto-instalado vía winget (`EclipseAdoptium.Temurin.21.JDK`) si falta | Core Java — sin JVM no funciona. Sin MCP oficial confirmado → se invoca por CLI/Bash |
| Whisper | `whisper-ctranslate2` (pip) | CLI lista para usar, motor faster-whisper, CPU-friendly, sin ffmpeg de sistema |
| Python | Auto-instalación vía winget (`Python.Python.3.12`) si falta `python`/`pip` | Regla "todo automático" del instalador |
| Meta-skill | `skills/skill-mcp-builder/` first-party, kind knowledge, bilingüe | Unifica "Skill Creator + MCP Builder" como pidió el diseño maestro |
| Context7 / Claude-Mem | Barrido en el componente `parsers`: si aparecen en `~/.claude/skills/` o en `claude mcp list`, se eliminan | Conflicto con el cerebro RAG (decisión del diseño maestro) |

## Componentes nuevos del instalador

Orden final: `rtk caveman figma ui-ux dev-skills rag graphify cyber-neo parsers`.

### `bin/components/graphify.sh` (id `graphify`)

- Requiere `claude` CLI; si falta, avisa y sale.
- Registra el marketplace y instala el plugin de forma no interactiva si el CLI lo soporta (`claude plugin marketplace add Egonex-AI/Understand-Anything` + `claude plugin install understand-anything`); si el CLI no soporta esos subcomandos, imprime las instrucciones exactas de los comandos `/plugin` para hacerlo en sesión — nunca falla el instalador por esto.
- Idempotente: si el plugin ya está instalado, lo reporta y sale.
- Documenta en su salida: uso `/understand` en un proyecto → genera `.ua/knowledge-graph.json`.

### `bin/components/cyber-neo.sh` (id `cyber-neo`)

- `git clone https://github.com/Hainrixz/cyber-neo` a `$CLAUDE_CONFIG_DIR/skills/cyber-neo` + `git checkout <COMMIT_FIJADO>` (el commit se fija en la implementación al último verificado).
- Re-ejecución: `git fetch` + checkout del commit fijado (no `pull` de main — reproducibilidad).
- Aviso: los escaneos son de solo lectura; reporte en `~/Desktop/cyber-neo-report-*.md`.

### `bin/components/parsers.sh` (id `parsers`)

1. **Python**: si no hay `python`/`py` en PATH → `winget install -e --id Python.Python.3.12` (con esperas y `hash -r`; si winget falla, aviso y se omiten los pasos pip).
2. **MarkItDown**: `pip install --upgrade "markitdown[all]" markitdown-mcp`; registra MCP: `claude mcp add -s user markitdown -- markitdown-mcp` (idempotente, patrón figma/magic/rag).
3. **JDK**: si `java -version` falla → `winget install -e --id EclipseAdoptium.Temurin.21.JDK`.
4. **opendataloader-pdf**: `pip install -U opendataloader-pdf` (solo si hay Java funcional; si no, aviso).
5. **whisper-ctranslate2**: `pip install -U whisper-ctranslate2`.
6. **Barrido legacy**: elimina `$CLAUDE_CONFIG_DIR/skills/context7` y `claude-mem` si existen; `claude mcp remove context7` / `claude-mem` best-effort.

### `uninstall.sh`

- `claude mcp remove markitdown`; borra `skills/cyber-neo`; desinstala el plugin understand-anything si el CLI lo permite (best-effort). Los paquetes pip y el JDK se quedan (dependencias de sistema — se listan para remoción manual, mismo criterio que Docker/Ollama).

## Meta-skill `skills/skill-mcp-builder/`

Formato Skills 2.0 completo (SKILL.md bilingüe + skill.yaml + schema.json). Contenido:

- **Parte 1 — Crear Skills 2.0:** estructura de sidecars de este repo (SKILL.md/skill.yaml/schema.json), reglas del validador, convención bilingüe, checklist de calidad (triggers duales, kind correcto, scripts declarados), y cómo añadirla al componente `dev-skills`.
- **Parte 2 — Crear servidores MCP:** patrón stdio con `@modelcontextprotocol/sdk` (ejemplo real: `templates/rag/mcp-server.mjs`), definición de tools con inputSchema, registro con `claude mcp add -s user`, prueba con `claude mcp list`, y cuándo elegir MCP vs CLI vs skill.
- Triggers: "crear skill", "nueva skill", "create skill", "mcp server", "crear mcp", "skill 2.0", "builder".
- Se añade a `FIRST_PARTY_SKILLS` en `dev-skills.sh` y al validador (pasa a `OK (4 skills)`).

## Flujo parsers → RAG (documentación, sin código nuevo)

En README, sección "Ingesta de cualquier archivo":

```bash
markitdown informe.docx -o <root>/V.A.U.L.T/00-Inbox/informe.md
opendataloader-pdf contrato.pdf --format markdown   # PDFs complejos
whisper-ctranslate2 reunion.mp3 --model base --language es --output_dir <root>/V.A.U.L.T/00-Inbox
node <root>/R.A.G/rag.mjs ingest                    # indexa todo el vault
```

## Verificación

1. `bash -n` de los 3 componentes nuevos + dry-runs (`--only graphify`, `--only cyber-neo`, `--only parsers`) exit 0 sin daemons/deps presentes.
2. Install real: `claude mcp list` muestra `markitdown ✓`; `markitdown --version`, `whisper-ctranslate2 --help`, `java -version`, `python --version` funcionan; `skills/cyber-neo/SKILL.md` existe en el commit fijado.
3. `node skills/validate-skills.mjs` → `OK (4 skills)`.
4. `bash uninstall.sh --dry-run` incluye la limpieza nueva.
5. Smoke: convertir un .docx con markitdown al Inbox y `rag.mjs ingest` lo indexa.

## Fuera de alcance

- Hook SessionStart que lee `.ua/knowledge-graph.json` y consulta el RAG → subproyecto D.
- Wizard interactivo → sub-spec del instalador.
- Reglas operativas empaquetadas → subproyecto E.
