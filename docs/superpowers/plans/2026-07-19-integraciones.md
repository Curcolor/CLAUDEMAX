# Plan de Implementación: Integraciones (Subproyecto C)

> **Para workers agénticos:** SUB-SKILL REQUERIDO: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`).

**Objetivo:** Añadir los componentes `graphify`, `cyber-neo` y `parsers` al instalador, más la meta-skill first-party `skill-mcp-builder`.

**Arquitectura:** Mismo patrón `ac_component_<id>` existente; mensajes en español; auto-instalación de prerrequisitos (Python, JDK) vía winget siguiendo el patrón de `rag.sh` (ac_rag_ensure_deps). La meta-skill sigue el formato Skills 2.0 con sidecars.

**Stack:** Bash (instalador), winget, pip, git, formato Skills 2.0.

**Spec:** [2026-07-19-integraciones-design.md](../specs/2026-07-19-integraciones-design.md)

**Raíz del repo:** `c:\Users\JHONNY\Desktop\WORKSPACE\Herramientas\CLAUDEMAX`

**Rama:** `feat/integraciones` desde `main`. Commits: Conventional Commits, subject en español, sin footers de atribución IA.

---

### Tarea 1: Componente graphify

**Archivos:**
- Crear: `bin/components/graphify.sh`
- Modificar: `install.sh` (ALL_COMPONENTS, case en component_run, heredoc final)

- [ ] **Paso 1: Crear `bin/components/graphify.sh`:**

```bash
#!/usr/bin/env bash
# Understand-Anything ("Graphify"): grafos de conocimiento interactivos del
# codebase, como plugin de Claude Code. Genera .ua/knowledge-graph.json por
# proyecto (lo consume el ritual SessionStart del subproyecto D).
# Upstream: https://github.com/Egonex-AI/Understand-Anything (MIT)

GRAPHIFY_MARKETPLACE="Egonex-AI/Understand-Anything"
GRAPHIFY_PLUGIN="understand-anything"

ac_component_graphify() {
    ac_step "Graphify (Understand-Anything) — grafos de conocimiento del codebase"

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI no está en el PATH — instala el plugin manualmente en una sesión:"
        ac_warn "  /plugin marketplace add $GRAPHIFY_MARKETPLACE"
        ac_warn "  /plugin install $GRAPHIFY_PLUGIN"
        return 0
    fi

    # Idempotencia: ¿ya está instalado?
    if claude plugin list 2>/dev/null | grep -qi "$GRAPHIFY_PLUGIN"; then
        ac_info "Plugin $GRAPHIFY_PLUGIN ya instalado; no se hace nada. Usa --force para reinstalar."
        [ "${FORCE:-0}" != "1" ] && return 0
    fi

    # Intento no interactivo; si el CLI no soporta estos subcomandos, damos instrucciones.
    if claude plugin --help >/dev/null 2>&1; then
        ac_run claude plugin marketplace add "$GRAPHIFY_MARKETPLACE" \
            || ac_warn "No se pudo añadir el marketplace automáticamente."
        if ac_run claude plugin install "$GRAPHIFY_PLUGIN"; then
            ac_info "Plugin instalado. En cualquier proyecto: /understand genera .ua/knowledge-graph.json"
        else
            ac_warn "Instalación automática fallida — hazlo en una sesión de Claude Code:"
            ac_warn "  /plugin marketplace add $GRAPHIFY_MARKETPLACE"
            ac_warn "  /plugin install $GRAPHIFY_PLUGIN"
        fi
    else
        ac_warn "Este claude CLI no soporta 'claude plugin' no interactivo — hazlo en sesión:"
        ac_warn "  /plugin marketplace add $GRAPHIFY_MARKETPLACE"
        ac_warn "  /plugin install $GRAPHIFY_PLUGIN"
    fi
}
```

- [ ] **Paso 2: Cablear install.sh** — `ALL_COMPONENTS=(rtk caveman figma ui-ux dev-skills rag graphify)`; case:

```bash
        graphify)
            . "$AC_REPO_DIR/bin/components/graphify.sh"
            ac_component_graphify
            ;;
```

Heredoc final: añadir línea `       /understand           — grafo de conocimiento del proyecto (Graphify)`.

- [ ] **Paso 3: Verificar:** `bash -n install.sh && bash -n bin/components/graphify.sh` exit 0; `bash install.sh --dry-run --only graphify` exit 0.

- [ ] **Paso 4: Commit:** `git add -A && git commit -m "feat(installer): componente graphify (Understand-Anything)"`

---

### Tarea 2: Componente cyber-neo

**Archivos:**
- Crear: `bin/components/cyber-neo.sh`
- Modificar: `install.sh`, `uninstall.sh`

- [ ] **Paso 1: Fijar el commit.** Obtener el SHA actual de main upstream:

```bash
git ls-remote https://github.com/Hainrixz/cyber-neo HEAD
```

Anotar el SHA (llámalo `<SHA>`) y usarlo en el paso 2.

- [ ] **Paso 2: Crear `bin/components/cyber-neo.sh`** (sustituye `<SHA>` por el real):

```bash
#!/usr/bin/env bash
# Cyber Neo: auditoría de seguridad OWASP 2025 / CWE Top 25 como skill de
# Claude Code. Solo lectura; el reporte queda en ~/Desktop/cyber-neo-report-*.md
# Upstream: https://github.com/Hainrixz/cyber-neo (MIT). Commit fijado por
# reproducibilidad (proyecto joven).

CYBER_NEO_REPO="https://github.com/Hainrixz/cyber-neo"
CYBER_NEO_COMMIT="<SHA>"

ac_component_cyber_neo() {
    ac_step "Cyber Neo — auditoría de seguridad (skill)"

    local dst="$CLAUDE_CONFIG_DIR/skills/cyber-neo"

    if [ "${DRY_RUN:-0}" = "1" ]; then
        if [ -d "$dst/.git" ]; then
            ac_dim "\$ git -C $dst fetch && git -C $dst checkout $CYBER_NEO_COMMIT"
        else
            ac_dim "\$ git clone $CYBER_NEO_REPO $dst && git -C $dst checkout $CYBER_NEO_COMMIT"
        fi
        return 0
    fi

    if [ -d "$dst/.git" ]; then
        ac_info "Clon existente; sincronizando al commit fijado..."
        git -C "$dst" fetch --quiet 2>/dev/null || true
        git -C "$dst" checkout --quiet "$CYBER_NEO_COMMIT" \
            || ac_warn "No se pudo hacer checkout de $CYBER_NEO_COMMIT — se deja el clon como está."
    else
        mkdir -p "$CLAUDE_CONFIG_DIR/skills"
        if git clone "$CYBER_NEO_REPO" "$dst"; then
            git -C "$dst" checkout --quiet "$CYBER_NEO_COMMIT" \
                || ac_warn "Checkout del commit fijado falló; queda en main."
            ac_info "Skill instalada. Uso: /cyber-neo <ruta-del-proyecto> (solo lectura)."
        else
            ac_warn "git clone falló — instala manualmente en $dst"
        fi
    fi
}
```

- [ ] **Paso 3: Cablear** — `install.sh`: ALL_COMPONENTS gana `cyber-neo` tras `graphify`; case análogo al de graphify (`cyber-neo) . .../cyber-neo.sh; ac_component_cyber_neo ;;`); heredoc: `       /cyber-neo <ruta>     — auditoría de seguridad OWASP/CWE`. `uninstall.sh`: en el loop de skills de ingeniería NO (es clon git aparte) — añadir tras el bloque de UI/UX: `ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/cyber-neo"` con su `ac_step "Cyber Neo"`.

- [ ] **Paso 4: Verificar:** `bash -n` de los 3 archivos; `bash install.sh --dry-run --only cyber-neo` exit 0; `bash uninstall.sh --dry-run` incluye cyber-neo.

- [ ] **Paso 5: Commit:** `git add -A && git commit -m "feat(installer): componente cyber-neo (skill de seguridad)"`

---

### Tarea 3: Componente parsers

**Archivos:**
- Crear: `bin/components/parsers.sh`
- Modificar: `install.sh`, `uninstall.sh`

- [ ] **Paso 1: Crear `bin/components/parsers.sh`:**

```bash
#!/usr/bin/env bash
# Parsers de ingesta para el RAG:
#   - MarkItDown (Microsoft): cualquier archivo → markdown. + MCP oficial.
#   - opendataloader-pdf: PDFs complejos → markdown/JSON (requiere JDK 11+).
#   - whisper-ctranslate2: audio → texto (motor faster-whisper, CPU).
# Auto-instala Python 3.12 y JDK 21 vía winget si faltan (Windows).
# También barre restos legacy de Context7 / Claude-Mem (conflicto con el RAG).

ac_component_parsers() {
    ac_step "Parsers — MarkItDown + opendataloader-pdf + whisper-ctranslate2"

    ac_parsers_ensure_python
    if ! ac_parsers_has_pip; then
        ac_warn "pip no disponible — se omiten los parsers. Instala Python y re-ejecuta --only parsers."
        return 0
    fi

    ac_parsers_markitdown
    ac_parsers_opendataloader
    ac_parsers_whisper
    ac_parsers_barrido_legacy
}

ac_parsers_has_pip() {
    python -m pip --version >/dev/null 2>&1 || py -m pip --version >/dev/null 2>&1
}

# pip con el intérprete que exista (python o py -3)
ac_pip() {
    if python -m pip --version >/dev/null 2>&1; then
        ac_run python -m pip "$@"
    else
        ac_run py -3 -m pip "$@"
    fi
}

ac_parsers_ensure_python() {
    if command -v python >/dev/null 2>&1 || command -v py >/dev/null 2>&1; then
        return 0
    fi
    if [ "$AC_OS" = "windows" ] && command -v winget >/dev/null 2>&1; then
        ac_info "Python no encontrado — instalando Python 3.12 vía winget..."
        ac_run winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements \
            || ac_warn "winget no pudo instalar Python — instálalo manualmente."
        hash -r 2>/dev/null || true
    else
        ac_warn "Python no encontrado y no hay winget — instálalo manualmente."
    fi
}

ac_parsers_markitdown() {
    ac_info "MarkItDown: instalando (pip)..."
    ac_pip install --upgrade "markitdown[all]" markitdown-mcp \
        || { ac_warn "pip install markitdown falló."; return 0; }

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "claude CLI no disponible — registra el MCP luego: claude mcp add -s user markitdown -- markitdown-mcp"
        return 0
    fi
    if claude mcp list 2>/dev/null | grep -qi '^markitdown\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove markitdown || true
        else
            ac_info "MCP markitdown ya registrado; se omite. Usa --force para re-añadir."
            return 0
        fi
    fi
    ac_run claude mcp add -s user markitdown -- markitdown-mcp \
        || ac_warn "claude mcp add falló para markitdown — añádelo manualmente."
}

ac_parsers_opendataloader() {
    if ! java -version >/dev/null 2>&1; then
        if [ "$AC_OS" = "windows" ] && command -v winget >/dev/null 2>&1; then
            ac_info "Java no encontrado — instalando Temurin JDK 21 vía winget..."
            ac_run winget install -e --id EclipseAdoptium.Temurin.21.JDK --accept-package-agreements --accept-source-agreements \
                || ac_warn "winget no pudo instalar el JDK."
            hash -r 2>/dev/null || true
        else
            ac_warn "Java 11+ no encontrado — opendataloader-pdf lo necesita; instálalo manualmente."
        fi
    fi
    if java -version >/dev/null 2>&1 || [ "${DRY_RUN:-0}" = "1" ]; then
        ac_info "opendataloader-pdf: instalando (pip)..."
        ac_pip install -U opendataloader-pdf || ac_warn "pip install opendataloader-pdf falló."
    else
        ac_warn "Sin Java funcional — se omite opendataloader-pdf (re-ejecuta --only parsers tras instalar JDK)."
    fi
}

ac_parsers_whisper() {
    ac_info "whisper-ctranslate2: instalando (pip)..."
    ac_pip install -U whisper-ctranslate2 || ac_warn "pip install whisper-ctranslate2 falló."
}

ac_parsers_barrido_legacy() {
    # Context7 y Claude-Mem entran en conflicto con el cerebro RAG (spec maestra).
    local encontrados=0
    for s in context7 claude-mem; do
        if [ -d "$CLAUDE_CONFIG_DIR/skills/$s" ]; then
            ac_info "Legacy: eliminando skill $s"
            ac_run rm -rf "$CLAUDE_CONFIG_DIR/skills/$s"
            encontrados=1
        fi
        if [ "$AC_HAS_CLAUDE" = "1" ] && claude mcp list 2>/dev/null | grep -qi "^$s\b"; then
            ac_info "Legacy: quitando MCP $s"
            ac_run claude mcp remove "$s" || true
            encontrados=1
        fi
    done
    [ "$encontrados" = "0" ] && ac_dim "  sin restos de Context7/Claude-Mem — nada que barrer."
}
```

- [ ] **Paso 2: Cablear** — `install.sh`: ALL_COMPONENTS final `(rtk caveman figma ui-ux dev-skills rag graphify cyber-neo parsers)`; case análogo; heredoc final añade:

```
       markitdown / whisper-ctranslate2 / opendataloader-pdf — parsers de ingesta (Bash)
```

`uninstall.sh`: tras el bloque de Cyber Neo añadir:

```bash
# --- Parsers (solo el registro MCP; los paquetes pip y el JDK se quedan)
ac_step "Parsers (MCP markitdown)"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove markitdown 2>/dev/null || true
fi
ac_dim "  (se conservan: paquetes pip markitdown/opendataloader-pdf/whisper-ctranslate2 y el JDK — desinstálalos a mano si quieres)"
```

- [ ] **Paso 3: Verificar:** `bash -n` de todo; `bash install.sh --dry-run --only parsers` exit 0 (sin Python real no falla: en dry-run `ac_pip` solo imprime); `bash install.sh --dry-run --all` exit 0 con los 9 componentes; `bash uninstall.sh --dry-run` exit 0.

- [ ] **Paso 4: Commit:** `git add -A && git commit -m "feat(installer): componente parsers (markitdown+pdf+whisper)"`

---

### Tarea 4: Meta-skill skill-mcp-builder

**Archivos:**
- Crear: `skills/skill-mcp-builder/SKILL.md`, `skill.yaml`, `schema.json`
- Modificar: `bin/components/dev-skills.sh` (lista), `uninstall.sh` (loop de skills)

- [ ] **Paso 1: SKILL.md.** Frontmatter:

```yaml
---
name: skill-mcp-builder
description: "Meta-skill para crear Skills 2.0 y servidores MCP en el ecosistema CLAUDEMAX. Trigger con \"crear skill\", \"nueva skill\", \"create skill\", \"skill 2.0\", \"crear mcp\", \"mcp server\", \"builder\", o al diseñar cualquier herramienta nueva para Claude Code."
---
```

Cuerpo (español, ~120 líneas, escribir contenido real — no placeholder):
- `# Constructor de Skills 2.0 y Servidores MCP`
- `## Parte 1 — Crear una Skill 2.0`: estructura de `skills/<name>/` con los 3 archivos; campos de skill.yaml (name==dir, version, kind knowledge|tool, triggers duales español/inglés, commands, scripts, dependencies, schema); schema.json con definitions.inputs/outputs; línea final `Config: skill.yaml · Schema: schema.json`; correr `node skills/validate-skills.mjs` hasta verde; añadir a `FIRST_PARTY_SKILLS` en dev-skills.sh; checklist de calidad (cuerpo español, triggers bilingües, scripts declarados existen, sin duplicar contenido de otras skills).
- `## Parte 2 — Crear un servidor MCP`: patrón stdio con `@modelcontextprotocol/sdk` tomando `templates/rag/mcp-server.mjs` como referencia canónica (Server + StdioServerTransport + ListTools/CallTool con inputSchema JSON Schema); regla "el MCP es wrapper delgado, la lógica vive en un CLI"; registro `claude mcp add -s user <id> -- node <ruta>`; verificación `claude mcp list` (✓ Connected); desregistro en uninstall.
- `## Cuándo elegir qué`: tabla skill (conocimiento/proceso) vs CLI (lógica invocable) vs MCP (tools en sesión).
- Línea final: `Config: skill.yaml · Schema: schema.json`

- [ ] **Paso 2: skill.yaml:**

```yaml
name: skill-mcp-builder
version: 2.0.0
kind: knowledge
triggers:
  - "crear skill / create skill"
  - "nueva skill / new skill"
  - "skill 2.0"
  - "crear mcp / build mcp server"
  - "mcp server"
  - "builder"
commands: []
scripts: []
dependencies: []
schema: ./schema.json
```

- [ ] **Paso 3: schema.json:**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "skill-mcp-builder",
  "definitions": {
    "inputs": {
      "type": "object",
      "properties": {
        "objetivo": {
          "type": "string",
          "description": "Qué skill o servidor MCP se quiere crear y para qué"
        },
        "tipo": {
          "type": "string",
          "enum": ["skill", "mcp", "ambos"],
          "description": "Qué artefacto construir"
        }
      },
      "additionalProperties": false
    },
    "outputs": {
      "type": "object",
      "properties": {
        "artefactos": {
          "type": "string",
          "description": "Skill 2.0 completa (3 archivos, validador verde) y/o servidor MCP registrado y conectado"
        }
      },
      "required": ["artefactos"]
    }
  }
}
```

- [ ] **Paso 4: Cablear** — `dev-skills.sh`: `FIRST_PARTY_SKILLS=(architecture-principles conventional-commits skill-mcp-builder)` (+ comentario de cabecera y ac_step). `uninstall.sh`: el loop de skills gana `skill-mcp-builder`.

- [ ] **Paso 5: Verificar:** `node skills/validate-skills.mjs` → `validate-skills: OK (4 skills)`.

- [ ] **Paso 6: Commit:** `git add -A && git commit -m "feat(skills): meta-skill skill-mcp-builder"`

---

### Tarea 5: Docs + verificación real

**Archivos:**
- Modificar: `README.md`, `INSTALL.md`

- [ ] **Paso 1: Docs.** README: filas nuevas en la tabla de componentes (graphify, cyber-neo, parsers), ids en `--only`, sección "Ingesta de cualquier archivo" con el bloque de comandos del spec (markitdown/opendataloader-pdf/whisper → Inbox → `rag.mjs ingest`), y skill-mcp-builder en la lista de skills. INSTALL: árbol (3 componentes nuevos + skill nueva), tabla "dónde queda cada cosa" (plugin understand-anything, clon cyber-neo, MCP markitdown, paquetes pip, JDK — qué elimina uninstall y qué no), troubleshooting (winget falla → instalar Python/JDK a mano; plugin no interactivo → comandos /plugin en sesión).

- [ ] **Paso 2: Verificación real** (esta máquina tiene winget; Python/Java pueden faltar — el componente los instala):

```bash
bash install.sh --only parsers --only cyber-neo --only graphify
# luego:
claude mcp list                    # markitdown ✓
markitdown --version || python -m markitdown --version
whisper-ctranslate2 --help >/dev/null && echo WHISPER-OK
java -version && echo JAVA-OK
ls "$HOME/.claude/skills/cyber-neo/SKILL.md"
node skills/validate-skills.mjs    # OK (4 skills)
bash uninstall.sh --dry-run        # incluye limpieza nueva
```

Si winget necesita reiniciar la shell para PATH (típico con Python/JDK recién instalados), documenta el estado y reintenta con `hash -r` o rutas absolutas; si aún así no aparece, repórtalo como pendiente-de-reinicio en vez de fallar.

- [ ] **Paso 3: Commit:** `git add README.md INSTALL.md && git commit -m "docs: componentes graphify, cyber-neo y parsers"`
