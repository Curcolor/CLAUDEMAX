# Grafo de código en vivo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dos MCP registrados una sola vez a nivel usuario — `graphify` (envoltorio que localiza el `graph.json` del proyecto actual y lanza el servidor real, o un mini-servidor de aviso) y `codebase-memory` (binario multi-proyecto vía `npm -g`) — y retirar `graphify claude install`.

**Architecture:** `templates/mcp/graphify-auto-lib.mjs` (puro: resolver grafo, resolver servidor, textos de estado) + `templates/mcp/graphify-auto.mjs` (proxy con `stdio: inherit` o mini-servidor JSON-RPC por stdin), ambos copiados a `$CLAUDE_CONFIG_DIR/mcp/`. Componentes bash: `graphify.sh` rediseñado y `codebase-memory.sh` nuevo, registrados con `claude mcp add -s user`. Sin dependencias.

**Tech Stack:** Node 22 (ESM, `node:test`), bash, `claude` CLI, `npm`, PyPI `graphifyy`, npm `codebase-memory-mcp`.

**Spec:** `docs/superpowers/specs/2026-09-13-grafo-en-vivo-design.md`

---

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `templates/mcp/graphify-auto-lib.mjs` | crear | `resolverGrafo(env, cwd)`, `resolverServidor(env)`, `buscarEnPath(nombre, env)`, `textoEstado(grafo, servidor, proyecto)` |
| `templates/mcp/graphify-auto.mjs` | crear | Envoltorio MCP: proxy o mini-servidor de aviso |
| `templates/mcp/test/graphify-auto.test.mjs` | crear | Unitarias + extremo a extremo |
| `templates/mcp/test/fixtures/proy/graphify-out/graph.json`, `.../proy/src/.gitkeep` | crear | Proyecto con grafo |
| `bin/components/graphify.sh` | modificar | Sin `claude install`; limpieza; copia + registro del MCP |
| `bin/components/codebase-memory.sh` | crear | `npm -g` + registro |
| `bin/install.sh` | modificar | `ALL_COMPONENTS`, `case`, mensaje final |
| `bin/wizard/wizard.mjs` | modificar | `DESCRIPCIONES` |
| `bin/uninstall.sh` | modificar | Bloques graphify y codebase-memory |
| `templates/recordatorios/orden-herramientas.md` | modificar | Frase sobre reindexar |
| `README.md`, `INSTALL.md` | modificar | Componentes, sección "Grafo de código en vivo", troubleshooting, privacidad |

Convenciones: español; Conventional Commits con subject en español y sin footer de IA; código con `\\` o `'` vía Write/Edit (el hook de rtk rompe heredocs); en Windows, un `.cmd` no se puede `spawn` sin `shell: true` (Node 22 devuelve `EINVAL`). Pruebas: `node --test "templates/mcp/test/*.test.mjs"` desde la raíz del repo.

---

### Task 1: Resolución de grafo y servidor (`graphify-auto-lib.mjs`)

**Files:**
- Create: `templates/mcp/graphify-auto-lib.mjs`
- Create: `templates/mcp/test/graphify-auto.test.mjs`
- Create: `templates/mcp/test/fixtures/proy/graphify-out/graph.json` (contenido: `{"nodes":[],"links":[]}`), `templates/mcp/test/fixtures/proy/src/.gitkeep` (vacío)

- [ ] **Step 1: Escribir las pruebas**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolverGrafo, buscarEnPath, resolverServidor, textoEstado } from "../graphify-auto-lib.mjs";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const PROY = path.join(FIX, "proy");
const GRAFO = path.join(PROY, "graphify-out", "graph.json");

test("resolverGrafo: GRAPHIFY_GRAPH > CLAUDE_PROJECT_DIR > cwd subiendo; null si nada", () => {
    assert.equal(resolverGrafo({ GRAPHIFY_GRAPH: GRAFO }, "/otro"), GRAFO);
    assert.equal(resolverGrafo({ GRAPHIFY_GRAPH: "/no/existe.json", CLAUDE_PROJECT_DIR: PROY }, "/otro"), GRAFO);
    assert.equal(resolverGrafo({ CLAUDE_PROJECT_DIR: PROY }, "/otro"), GRAFO);
    assert.equal(resolverGrafo({}, path.join(PROY, "src")), GRAFO);
    assert.equal(resolverGrafo({}, PROY), GRAFO);
    assert.equal(resolverGrafo({}, os.tmpdir()), null);
    assert.equal(resolverGrafo({ CLAUDE_PROJECT_DIR: "/no/existe" }, os.tmpdir()), null);
});

// PATH temporal con un graphify-mcp falso: .cmd en Windows, script con shebang en POSIX.
function pathConFalso(salida = "", codigo = 0) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gmcp-"));
    const script = path.join(dir, "graphify-mcp.mjs");
    fs.writeFileSync(script, `process.stdout.write(${JSON.stringify(salida)} + JSON.stringify(process.argv.slice(2)) + "\\n"); process.exit(${codigo});`);
    let bin;
    if (process.platform === "win32") {
        bin = path.join(dir, "graphify-mcp.cmd");
        fs.writeFileSync(bin, `@echo off\r\nnode "%~dp0graphify-mcp.mjs" %*\r\n`);
    } else {
        bin = path.join(dir, "graphify-mcp");
        fs.writeFileSync(bin, `#!/bin/sh\nexec node "$(dirname "$0")/graphify-mcp.mjs" "$@"\n`);
        fs.chmodSync(bin, 0o755);
    }
    return { dir, bin };
}

// El .cmd/.sh falso invoca `node`, así que el PATH de prueba lleva también el directorio de Node
// (y nada más: sin python, para que resolverServidor no lo encuentre).
const NODE_DIR = path.dirname(process.execPath);
const pathDe = dir => `${dir}${path.delimiter}${NODE_DIR}`;

test("buscarEnPath y resolverServidor: graphify-mcp falso en PATH; sin nada → null", () => {
    const { dir, bin } = pathConFalso();
    const env = { PATH: pathDe(dir), Path: pathDe(dir) };
    assert.equal(buscarEnPath("graphify-mcp", env), bin);
    assert.deepEqual(resolverServidor(env), { cmd: bin, args: [], shell: bin.endsWith(".cmd") });
    // PATH vacío y sin python: null (resolverServidor no debe lanzar)
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), "vacio-"));
    assert.equal(resolverServidor({ PATH: vacio, Path: vacio }), null);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(vacio, { recursive: true, force: true });
});

test("textoEstado: sin grafo, sin servidor, ambos", () => {
    assert.match(textoEstado(null, { cmd: "x", args: [] }, "/w/proy"), /no existe graphify-out\/graph\.json en \/w\/proy[\s\S]*graphify extract \. --code-only/);
    assert.match(textoEstado(GRAFO, null, "/w/proy"), /graphify no está instalado[\s\S]*uv tool install graphifyy/);
    assert.match(textoEstado(GRAFO, { cmd: "x", args: [] }, "/w/proy"), /listo/);
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `node --test "templates/mcp/test/*.test.mjs"`
Expected: FAIL — `Cannot find module '.../graphify-auto-lib.mjs'`.

- [ ] **Step 3: Implementar la lib**

```js
// Funciones puras del envoltorio MCP de graphify (graphify-auto.mjs). Sin dependencias: se
// instala junto al envoltorio en $CLAUDE_CONFIG_DIR/mcp/, fuera del repo.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MAX_NIVELES = 6;

function existeArchivo(p) {
    try { return fs.statSync(p).isFile(); } catch { return false; }
}

// Ruta absoluta al graph.json del proyecto actual, o null. Orden: GRAPHIFY_GRAPH (pruebas y
// casos raros) → CLAUDE_PROJECT_DIR (lo pasa Claude Code al proceso del MCP) → cwd, subiendo.
export function resolverGrafo(env = process.env, cwd = process.cwd()) {
    if (env.GRAPHIFY_GRAPH && existeArchivo(env.GRAPHIFY_GRAPH)) return path.resolve(env.GRAPHIFY_GRAPH);
    if (env.CLAUDE_PROJECT_DIR) {
        const p = path.join(env.CLAUDE_PROJECT_DIR, "graphify-out", "graph.json");
        if (existeArchivo(p)) return path.resolve(p);
    }
    let dir = path.resolve(cwd);
    for (let i = 0; i <= MAX_NIVELES; i++) {
        const p = path.join(dir, "graphify-out", "graph.json");
        if (existeArchivo(p)) return p;
        const padre = path.dirname(dir);
        if (padre === dir) break;
        dir = padre;
    }
    return null;
}

// Primer ejecutable `nombre` (con las extensiones de Windows si aplica) en el PATH de `env`.
export function buscarEnPath(nombre, env = process.env) {
    const rutaPath = env.PATH || env.Path || "";
    const exts = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
    for (const dir of rutaPath.split(path.delimiter).filter(Boolean)) {
        for (const ext of exts) {
            const p = path.join(dir, nombre + ext);
            if (existeArchivo(p)) return p;
        }
    }
    return null;
}

function pythonConGraphify(env, cmd, prefijo) {
    try {
        const r = spawnSync(cmd, [...prefijo, "-c", "import graphify.serve"], { env, timeout: 5000, stdio: "ignore", windowsHide: true });
        return r.status === 0;
    } catch { return false; }
}

// { cmd, args, shell } del servidor real de graphify, o null si no hay ninguno.
// Orden: graphify-mcp en el PATH → python -m graphify.serve → py -3 -m graphify.serve.
export function resolverServidor(env = process.env) {
    const bin = buscarEnPath("graphify-mcp", env);
    if (bin) return { cmd: bin, args: [], shell: /\.(cmd|bat)$/i.test(bin) };
    if (buscarEnPath("python", env) && pythonConGraphify(env, "python", [])) return { cmd: "python", args: ["-m", "graphify.serve"], shell: false };
    if (buscarEnPath("py", env) && pythonConGraphify(env, "py", ["-3"])) return { cmd: "py", args: ["-3", "-m", "graphify.serve"], shell: false };
    return null;
}

// Texto de la tool graphify_estado: dice exactamente qué falta y cómo arreglarlo.
export function textoEstado(grafo, servidor, proyecto) {
    if (!grafo) {
        return `Sin grafo: no existe graphify-out/graph.json en ${proyecto}.\n` +
            "Genera el grafo con: graphify extract . --code-only  (dentro del repo; --code-only evita que falle con los .md cuando no hay API key de LLM).\n" +
            "Luego vuelve a abrir la sesión para que el MCP graphify lo sirva.";
    }
    if (!servidor) {
        return `graphify no está instalado (falta graphify-mcp en el PATH y python -m graphify.serve).\n` +
            "Instálalo con: uv tool install graphifyy  (o pipx install graphifyy / pip install --user graphifyy) y vuelve a abrir la sesión.\n" +
            `Grafo encontrado: ${grafo}`;
    }
    return `listo: ${grafo} servido por ${servidor.cmd}`;
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `node --test "templates/mcp/test/*.test.mjs"`
Expected: `# pass 3`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add templates/mcp
git commit -m "feat(mcp): graphify-auto-lib resuelve grafo y servidor del proyecto actual"
```

---

### Task 2: El envoltorio `graphify-auto.mjs` — proxy y mini-servidor de aviso

**Files:**
- Create: `templates/mcp/graphify-auto.mjs`
- Modify: `templates/mcp/test/graphify-auto.test.mjs`

- [ ] **Step 1: Escribir las pruebas extremo a extremo**

Añade `import { spawn } from "node:child_process";` y al final:

```js
const WRAPPER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "graphify-auto.mjs");

// Lanza el envoltorio, le manda mensajes JSON-RPC por stdin y devuelve las respuestas parseadas.
function hablar(mensajes, env) {
    return new Promise(resolve => {
        const child = spawn(process.execPath, [WRAPPER], { env: { ...process.env, ...env }, stdio: ["pipe", "pipe", "pipe"] });
        let out = "", err = "";
        child.stdout.on("data", d => { out += d; });
        child.stderr.on("data", d => { err += d; });
        child.on("close", code => {
            const respuestas = out.split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return { crudo: l }; } });
            resolve({ code, respuestas, err, out });
        });
        for (const m of mensajes) child.stdin.write(JSON.stringify(m) + "\n");
        child.stdin.end();
    });
}

const INIT = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } } };

test("mini-servidor sin grafo: initialize, tools/list, tools/call, ping, notificación, método desconocido", async () => {
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), "sin-grafo-"));
    const r = await hablar([
        INIT,
        { jsonrpc: "2.0", method: "notifications/initialized" },
        { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
        { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "graphify_estado", arguments: {} } },
        { jsonrpc: "2.0", id: 4, method: "ping" },
        { jsonrpc: "2.0", id: 5, method: "resources/list" },
    ], { CLAUDE_PROJECT_DIR: vacio, GRAPHIFY_GRAPH: "", PATH: vacio, Path: vacio });
    assert.equal(r.code, 0, r.err);
    const por = id => r.respuestas.find(x => x.id === id);
    assert.equal(por(1).result.serverInfo.name, "graphify-auto");
    assert.equal(por(1).result.protocolVersion, "2024-11-05");
    assert.deepEqual(por(2).result.tools.map(t => t.name), ["graphify_estado"]);
    assert.match(por(3).result.content[0].text, /Sin grafo[\s\S]*graphify extract \. --code-only/);
    assert.deepEqual(por(4).result, {});
    assert.equal(por(5).error.code, -32601);
    assert.equal(r.respuestas.length, 5, "la notificación no recibe respuesta");
    fs.rmSync(vacio, { recursive: true, force: true });
});

test("mini-servidor con grafo pero sin servidor: el estado dice cómo instalar graphify", async () => {
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), "sin-srv-"));
    const r = await hablar([INIT, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "graphify_estado", arguments: {} } }],
        { CLAUDE_PROJECT_DIR: PROY, PATH: vacio, Path: vacio });
    assert.match(r.respuestas.find(x => x.id === 2).result.content[0].text, /graphify no está instalado[\s\S]*uv tool install graphifyy/);
    fs.rmSync(vacio, { recursive: true, force: true });
});

test("proxy: con graphify-mcp falso en el PATH lo lanza con la ruta del grafo y devuelve su código", async () => {
    const { dir } = pathConFalso("ARGS=", 0);
    const r = await hablar([], { CLAUDE_PROJECT_DIR: PROY, PATH: pathDe(dir), Path: pathDe(dir) });
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, new RegExp("ARGS=\\[" + JSON.stringify(GRAFO).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\]"));
    fs.rmSync(dir, { recursive: true, force: true });
    const { dir: dir3 } = pathConFalso("", 3);
    const r3 = await hablar([], { CLAUDE_PROJECT_DIR: PROY, PATH: pathDe(dir3), Path: pathDe(dir3) });
    assert.equal(r3.code, 3);
    fs.rmSync(dir3, { recursive: true, force: true });
});
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `node --test "templates/mcp/test/*.test.mjs"`
Expected: FAIL — `Cannot find module '.../graphify-auto.mjs'`.

- [ ] **Step 3: Escribir el envoltorio**

```js
#!/usr/bin/env node
// Envoltorio MCP de graphify para CLAUDEMAX. Registrado una sola vez a nivel usuario
// (`claude mcp add -s user graphify -- node <este archivo>`); en cada sesión localiza el
// graphify-out/graph.json del proyecto actual (CLAUDE_PROJECT_DIR, que Claude Code pasa al
// proceso del MCP; o el cwd subiendo) y lanza el servidor real de graphify sobre él como proxy
// transparente. Si falta el grafo o graphify, sirve un mini-servidor MCP con una única tool,
// graphify_estado, que dice exactamente qué falta y cómo arreglarlo — así el MCP nunca aparece
// caído en /mcp y el modelo recibe la instrucción en vez de un error opaco.
//
// Por qué un envoltorio: graphify sirve UN graph.json por servidor; registrarlo por proyecto
// obliga a tocar configuración por cada repo. Ver docs/superpowers/specs/2026-09-13-grafo-en-vivo-design.md.
// Sin dependencias; recordar que en Windows un .cmd solo se puede lanzar con shell: true.

import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { resolverGrafo, resolverServidor, textoEstado } from "./graphify-auto-lib.mjs";

const DEBUG = String(process.env.GRAPHIFY_AUTO_DEBUG || "") === "1";
const log = (...a) => { if (DEBUG) process.stderr.write(a.join(" ") + "\n"); };

const proyecto = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const grafo = resolverGrafo(process.env, process.cwd());
const servidor = grafo ? resolverServidor(process.env) : null;
log("grafo:", grafo, "servidor:", servidor && servidor.cmd);

if (grafo && servidor) {
    // Proxy transparente: stdin/stdout del hijo son los del envoltorio.
    const args = [...servidor.args, grafo];
    const child = servidor.shell
        ? spawn(`"${servidor.cmd}" ${args.map(a => `"${a}"`).join(" ")}`, { stdio: "inherit", shell: true, windowsHide: true })
        : spawn(servidor.cmd, args, { stdio: "inherit", windowsHide: true });
    child.on("error", e => { log("error al lanzar:", e.message); process.exit(1); });
    child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
    for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { try { child.kill(s); } catch {} });
} else {
    servirAviso();
}

// --- Mini-servidor MCP de aviso (JSON-RPC 2.0 por stdio, una línea por mensaje) --------------

function servirAviso() {
    const TOOL = {
        name: "graphify_estado",
        description: "Diagnóstico del grafo de código de graphify para este proyecto: si falta el grafo o graphify, dice cómo generarlo o instalarlo.",
        inputSchema: { type: "object", properties: {} },
    };
    const responder = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
    const fallar = (id, code, message) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");

    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => {
        buffer += chunk;
        let i;
        while ((i = buffer.indexOf("\n")) >= 0) {
            const linea = buffer.slice(0, i).trim();
            buffer = buffer.slice(i + 1);
            if (linea) atender(linea);
        }
    });
    process.stdin.on("end", () => process.exit(0));

    function atender(linea) {
        let msg;
        try { msg = JSON.parse(linea); } catch { return; }
        const { id, method, params = {} } = msg;
        if (id === undefined || id === null) return;   // notificación: sin respuesta
        switch (method) {
            case "initialize":
                responder(id, {
                    protocolVersion: params.protocolVersion || "2024-11-05",
                    capabilities: { tools: {} },
                    serverInfo: { name: "graphify-auto", version: "1.0.0" },
                });
                break;
            case "ping":
                responder(id, {});
                break;
            case "tools/list":
                responder(id, { tools: [TOOL] });
                break;
            case "tools/call":
                if (params.name !== TOOL.name) { fallar(id, -32602, `tool desconocida: ${params.name}`); break; }
                responder(id, { content: [{ type: "text", text: textoEstado(grafo, servidor, proyecto) }], isError: false });
                break;
            default:
                fallar(id, -32601, `método no soportado por graphify-auto: ${method}`);
        }
    }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `node --test "templates/mcp/test/*.test.mjs"`
Expected: `# pass 6`, `# fail 0`. Si el proxy falla en Windows con `EINVAL`, comprueba que `servidor.shell` es `true` para el `.cmd` y que se usa la rama `shell: true`.

- [ ] **Step 5: Commit**

```bash
git add templates/mcp
git commit -m "feat(mcp): graphify-auto — proxy al servidor de graphify o mini-servidor de aviso"
```

---

### Task 3: Componente `graphify` rediseñado

**Files:**
- Modify: `bin/components/graphify.sh`

- [ ] **Step 1: Reescribir la cabecera y `ac_component_graphify`**

Reemplaza el bloque de comentario de cabecera desde `# `graphify claude install` registra Graphify POR PROYECTO…` hasta `# en crudo, nunca bloquea una herramienta.` por:

```bash
# Registro en Claude Code: UN solo MCP `graphify` a nivel usuario, que apunta al envoltorio
# templates/mcp/graphify-auto.mjs (copiado a $CLAUDE_CONFIG_DIR/mcp/). El envoltorio localiza
# en cada sesión el graphify-out/graph.json del proyecto actual (CLAUDE_PROJECT_DIR, que Claude
# Code pasa al MCP) y lanza el servidor real de graphify; sin grafo o sin graphify, sirve una
# única tool `graphify_estado` que dice cómo arreglarlo. Ya NO se ejecuta `graphify claude
# install`: su hook PreToolUse duplicaba al recordatorio `orden-herramientas` y escribía
# CLAUDE.md + .claude/settings.json DENTRO del repo, contra la regla "contexto fuera de los
# repos". Ver docs/superpowers/specs/2026-09-13-grafo-en-vivo-design.md.
```

Y la función principal:

```bash
ac_component_graphify() {
    ac_step "Graphify — grafo de conocimiento del codebase + MCP graphify (envoltorio por proyecto)"

    ac_graphify_migrar_plugin_viejo
    ac_graphify_limpiar_claude_install

    ac_graphify_ensure_python
    if ! ac_graphify_has_pip; then
        ac_warn "pip no disponible — se omite la instalación del CLI de Graphify. El MCP se registra igual: dirá cómo instalarlo."
    else
        ac_graphify_install_cli
    fi

    ac_graphify_install_mcp
    ac_dim "  Genera el grafo de cada proyecto con 'graphify extract . --code-only' dentro del repo (sin API key de LLM, 'graphify .' falla con los .md)."
}
```

- [ ] **Step 2: Añadir la limpieza y el registro del MCP**

Añade después de `ac_graphify_migrar_plugin_viejo`:

```bash
# Instalaciones anteriores de CLAUDEMAX corrían `graphify claude install` en el propio repo:
# dejaba una sección "## graphify" en CLAUDE.md y un hook PreToolUse en .claude/settings.json.
# Se retiran si están; si no, no se dice nada.
ac_graphify_limpiar_claude_install() {
    local md="$AC_REPO_DIR/CLAUDE.md" settings="$AC_REPO_DIR/.claude/settings.json"
    if [ -f "$md" ] && grep -q '^## graphify' "$md"; then
        ac_info "Retirando la sección '## graphify' que dejó 'graphify claude install' en $md"
        if [ "${DRY_RUN:-0}" != "1" ]; then
            MD_FILE="$md" node -e '
                const fs = require("fs"); const f = process.env.MD_FILE;
                const t = fs.readFileSync(f, "utf8");
                const sin = t.replace(/^## graphify[\s\S]*?(?=^## |(?![\s\S]))/m, "").replace(/\n{3,}/g, "\n\n");
                if (sin.trim()) fs.writeFileSync(f, sin); else fs.unlinkSync(f);
            '
        fi
    fi
    if [ -f "$settings" ] && grep -q 'graphify hook-guard' "$settings"; then
        ac_info "Retirando el hook 'graphify hook-guard' de $settings"
        [ "${DRY_RUN:-0}" = "1" ] || ac_remove_hook "$settings" "graphify hook-guard"
    fi
}

# Ruta nativa para argumentos que Claude Code ejecutará sin shell (en Git Bash, /c/... no
# sirve para node.exe). cygpath existe en Git Bash/MSYS; en otros SO la ruta ya es nativa.
ac_ruta_nativa() {
    if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi
}

ac_graphify_install_mcp() {
    local dst="$CLAUDE_CONFIG_DIR/mcp"
    ac_run mkdir -p "$dst"
    ac_run cp -f "$AC_REPO_DIR/templates/mcp/graphify-auto.mjs" "$dst/graphify-auto.mjs"
    ac_run cp -f "$AC_REPO_DIR/templates/mcp/graphify-auto-lib.mjs" "$dst/graphify-auto-lib.mjs"

    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "El CLI claude no está en el PATH — registra el MCP a mano: claude mcp add -s user graphify -- node $(ac_ruta_nativa "$dst/graphify-auto.mjs")"
        return 0
    fi
    if claude mcp list 2>/dev/null | grep -qi '^graphify\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove graphify || true
        else
            ac_info "El MCP graphify ya está registrado; se omite. Usa --force para re-agregarlo con el envoltorio."
            return 0
        fi
    fi
    ac_run claude mcp add -s user graphify -- node "$(ac_ruta_nativa "$dst/graphify-auto.mjs")" \
        || ac_warn "claude mcp add falló para graphify — agrégalo manualmente."
}
```

Y borra de `ac_component_graphify` todo lo relativo a `graphify claude install` (el `ac_warn` largo, el `ac_run bash -c "cd … && graphify claude install"` y los dos mensajes de "Registro por-proyecto"). En `ac_graphify_install_cli`, si `graphify` no aparece en el PATH tras instalar, el aviso se mantiene.

- [ ] **Step 3: Verificar sintaxis y dry-run**

Run: `bash -n bin/components/graphify.sh && DRY_RUN=1 bash bin/install.sh --only graphify --dry-run 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | sed -n '/Graphify/,$p' | head -20`
Expected: aparecen `cp … graphify-auto.mjs`, `cp … graphify-auto-lib.mjs` y `claude mcp add -s user graphify -- node …graphify-auto.mjs`; **no** aparece `graphify claude install`.

- [ ] **Step 4: Commit**

```bash
git add bin/components/graphify.sh
git commit -m "feat(installer): graphify registra el MCP envoltorio y retira graphify claude install"
```

---

### Task 4: Componente `codebase-memory` + `install.sh` + wizard + `uninstall.sh`

**Files:**
- Create: `bin/components/codebase-memory.sh`
- Modify: `bin/install.sh`, `bin/wizard/wizard.mjs`, `bin/uninstall.sh`

- [ ] **Step 1: Crear el componente**

`bin/components/codebase-memory.sh`:

```bash
#!/usr/bin/env bash
# codebase-memory-mcp (DeusData/codebase-memory-mcp, MIT): servidor MCP de inteligencia de
# código — indexa un repo en un grafo persistente (158 lenguajes) y expone search_graph,
# trace_path, get_code_snippet, get_architecture, search_code, index_repository...
# Es el tercer peldaño del orden de herramientas de contexto (rag → graphify →
# codebase-memory → grep): el detalle fino que graphify no da (llamantes reales, snippets).
#
# Se instala con `npm install -g codebase-memory-mcp` (Node ya es requisito de CLAUDEMAX) y
# se registra UNA vez a nivel usuario con el nombre `codebase-memory` (el que usan los
# recordatorios). Es multi-proyecto por diseño: el índice vive en ~/.cache/codebase-memory-mcp/
# (CBM_CACHE_DIR para moverlo), NUNCA dentro del repo — por eso no se usa `--persistence`, que
# escribe .codebase-memory/graph.db.zst (todo el código comprimido) en el repo.
#
# No indexa nada al instalar: el indexado es por proyecto y lo disparan los rituales
# init-proyecto y fin-ciclo con:
#   codebase-memory-mcp cli index_repository --repo-path <abs> --mode moderate
# Lección del setup de trabajo (2026-08-20): `index_status: ready` significa que HAY un índice,
# no que esté al día — reindexa al cerrar ciclo o cuando search_graph no encuentre algo recién
# escrito.

CBM_PKG="codebase-memory-mcp"

ac_component_codebase_memory() {
    ac_step "codebase-memory — grafo de código persistente (search_graph / trace_path / get_code_snippet)"

    if ! command -v npm >/dev/null 2>&1; then
        ac_warn "npm no está en el PATH — se omite codebase-memory. Instala Node.js y re-ejecuta --only codebase-memory."
        return 0
    fi
    ac_cbm_install
    ac_cbm_register_mcp
    ac_dim "  Indexa cada proyecto con: codebase-memory-mcp cli index_repository --repo-path <ruta absoluta> --mode moderate (nunca --persistence)."
    ac_dim "  'index_status: ready' no significa al día: reindexa al cerrar ciclo."
}

ac_cbm_install() {
    if [ "${FORCE:-0}" != "1" ] && command -v codebase-memory-mcp >/dev/null 2>&1; then
        ac_info "codebase-memory-mcp ya está instalado ($(codebase-memory-mcp --version 2>/dev/null | head -1)); se omite. Usa --force para reinstalar."
        return 0
    fi
    ac_info "Instalando $CBM_PKG con npm -g..."
    if ! ac_run npm install -g "$CBM_PKG" --no-fund --no-audit; then
        ac_warn "npm install -g $CBM_PKG falló — instálalo a mano (npm install -g $CBM_PKG) y re-ejecuta --only codebase-memory."
        return 1
    fi
    hash -r 2>/dev/null || true
}

ac_cbm_register_mcp() {
    if [ "${DRY_RUN:-0}" != "1" ] && ! command -v codebase-memory-mcp >/dev/null 2>&1; then
        ac_warn "codebase-memory-mcp no está en el PATH — se omite el registro del MCP."
        return 0
    fi
    if [ "$AC_HAS_CLAUDE" != "1" ]; then
        ac_warn "El CLI claude no está en el PATH — registra el MCP a mano: claude mcp add -s user codebase-memory -- codebase-memory-mcp"
        return 0
    fi
    if claude mcp list 2>/dev/null | grep -qi '^codebase-memory\b'; then
        if [ "${FORCE:-0}" = "1" ]; then
            ac_run claude mcp remove codebase-memory || true
        else
            ac_info "El MCP codebase-memory ya está registrado; se omite. Usa --force para re-agregarlo."
            return 0
        fi
    fi
    ac_run claude mcp add -s user codebase-memory -- codebase-memory-mcp \
        || ac_warn "claude mcp add falló para codebase-memory — agrégalo manualmente."
}
```

- [ ] **Step 2: `install.sh`**

`ALL_COMPONENTS=(rtk figma ui-ux dev-skills rag graphify codebase-memory ponytail cyber-neo parsers rules)`.

En el `case`, tras el bloque `graphify)`:

```bash
        codebase-memory)
            . "$AC_REPO_DIR/bin/components/codebase-memory.sh"
            ac_component_codebase_memory
            ;;
```

En el mensaje final ("Próximos pasos"), tras la línea de `graphify extract .`:

```
       codebase-memory-mcp cli index_repository --repo-path <ruta> --mode moderate   — índice de código para search_graph/trace_path
```

y cambia la de graphify a `graphify extract . --code-only   — grafo de conocimiento del proyecto (lo sirve el MCP graphify)`. Revisa también la línea del `usage()` si enumera componentes.

- [ ] **Step 3: Wizard**

En `bin/wizard/wizard.mjs`, `DESCRIPCIONES`:

```js
    graphify: "CLI de Graphify + MCP graphify (envoltorio que sirve el grafo del proyecto actual).",
    "codebase-memory": "MCP codebase-memory — grafo de código persistente: search_graph, trace_path, get_code_snippet.",
```

Y en la línea ~547 del mensaje final del wizard, la misma sustitución que en `install.sh`.

- [ ] **Step 4: `uninstall.sh`**

Reemplaza el bloque `# --- Graphify (registro en Claude Code…` hasta su `ac_dim` final por:

```bash
# --- Graphify (MCP envoltorio a nivel usuario) y codebase-memory (npm -g + MCP)
ac_step "Graphify y codebase-memory (MCPs)"
if [ "$AC_HAS_CLAUDE" = "1" ]; then
    ac_run claude mcp remove graphify || true
    ac_run claude mcp remove codebase-memory || true
else
    ac_warn "El CLI claude no está en el PATH — quita a mano los MCP 'graphify' y 'codebase-memory' (claude mcp remove ...)."
fi
ac_run rm -f "$CLAUDE_CONFIG_DIR/mcp/graphify-auto.mjs" "$CLAUDE_CONFIG_DIR/mcp/graphify-auto-lib.mjs"
if command -v npm >/dev/null 2>&1; then
    ac_run npm uninstall -g codebase-memory-mcp || ac_warn "npm uninstall -g codebase-memory-mcp falló — hazlo a mano."
fi
ac_dim "  (se conservan: el paquete pip graphifyy —dependencia de sistema, 'pip uninstall graphifyy' si quieres— y los índices de ~/.cache/codebase-memory-mcp/)"
```

Actualiza el comentario de cabecera de `uninstall.sh` donde describa graphify.

- [ ] **Step 5: Verificar**

Run: `bash -n bin/components/codebase-memory.sh && bash -n bin/install.sh && bash -n bin/uninstall.sh && node bin/wizard/test-componentes.mjs | tail -1 && DRY_RUN=1 bash bin/install.sh --only codebase-memory --dry-run 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | sed -n '/codebase-memory/,$p' | head -8 && DRY_RUN=1 bash bin/uninstall.sh --dry-run 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | sed -n '/Graphify y codebase-memory/,+8p'`
Expected: `OK: 11 componentes sincronizados…`; el dry-run muestra `npm install -g codebase-memory-mcp` y `claude mcp add -s user codebase-memory -- codebase-memory-mcp`; el uninstall muestra ambos `claude mcp remove`, el `rm` de los dos `.mjs` y `npm uninstall -g`.

- [ ] **Step 6: Commit**

```bash
git add bin/components/codebase-memory.sh bin/install.sh bin/wizard/wizard.mjs bin/uninstall.sh
git commit -m "feat(installer): componente codebase-memory (npm -g + MCP) y desinstalación de ambos MCP"
```

---

### Task 5: Recordatorio y documentación

**Files:**
- Modify: `templates/recordatorios/orden-herramientas.md`, `README.md`, `INSTALL.md`

- [ ] **Step 1: Recordatorio**

En `orden-herramientas.md`, el punto 2 termina así:

```
2. ¿Es ESTRUCTURA, o "quién usa esto", o vas a escribir un helper/mapeo/regla nuevo? → te equivocaste de herramienta: `rag_query` para qué se decidió y por qué; el grafo de código (graphify / codebase-memory) para qué llama a qué. Y pregunta al grafo si el helper YA EXISTE antes de escribirlo. `codebase-memory` NO se refresca solo: `ready` significa que hay un índice, no que esté al día — si `search_graph` no encuentra algo recién escrito, reindexa (`index_repository`) antes de concluir que no existe.
```

Comprueba que `node --test "hooks/test/*.test.mjs"` sigue en verde (la prueba de fábrica solo mira el encabezado).

- [ ] **Step 2: README**

(a) Fila `graphify` de la tabla de componentes — reemplaza la celda "Qué hace" por:

```
CLI de Python (paquete PyPI `graphifyy`) que analiza el código con tree-sitter (+ LLM opcional) y genera un grafo de conocimiento navegable del repo: `graphify extract . --code-only` produce `graphify-out/graph.json` (formato `node_link_data` de NetworkX), `graph.html` (dashboard) y `GRAPH_REPORT.md`. CLAUDEMAX registra **un solo MCP `graphify`** a nivel usuario: un envoltorio (`~/.claude/mcp/graphify-auto.mjs`) que en cada sesión localiza el `graph.json` del proyecto actual (`CLAUDE_PROJECT_DIR`, que Claude Code pasa al MCP) y lanza el servidor real de graphify (`query_graph`, `get_node`, `get_neighbors`, `shortest_path`…); si falta el grafo o graphify, sirve una única tool `graphify_estado` que dice cómo generarlo o instalarlo. Ya no ejecuta `graphify claude install` (su hook duplicaba al recordatorio `orden-herramientas` y escribía dentro del repo).
```

(b) Fila nueva tras `graphify`:

```
| **codebase-memory** | MCP de inteligencia de código ([DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp), MIT): indexa un repo en un grafo persistente (158 lenguajes) y expone `search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`, `search_code`, `index_repository`. Instalado con `npm install -g codebase-memory-mcp` y registrado una vez a nivel usuario como `codebase-memory`. El índice vive en `~/.cache/codebase-memory-mcp/` (`CBM_CACHE_DIR`), nunca en el repo (**nunca `--persistence`**). Indexa cada proyecto con `codebase-memory-mcp cli index_repository --repo-path <abs> --mode moderate`; `ready` no significa al día — reindexa al cerrar ciclo. | npm `codebase-memory-mcp` |
```

(c) Sección nueva antes de `## Rituales` (después de "Recordatorios justo a tiempo"):

```markdown
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
```

(d) Sección Privacidad: añade `- \`npm install -g codebase-memory-mcp\` (binario del MCP de inteligencia de código; el índice queda en \`~/.cache/codebase-memory-mcp/\`, local).` y corrige la viñeta de graphify quitando `— y graphify claude install para registrar su hook PreToolUse local (ver fila de graphify…)`.

- [ ] **Step 3: INSTALL**

Árbol: en `bin/components/`, línea `graphify.sh         # instala el CLI de Graphify (pip) y registra el MCP graphify (envoltorio)` y nueva `codebase-memory.sh  # npm -g codebase-memory-mcp + registro del MCP codebase-memory`. Bajo `templates/`, antes de `recordatorios/`:

```
    ├── mcp/                     # envoltorio MCP de graphify (se copia a ~/.claude/mcp/)
    │   ├── graphify-auto.mjs    # proxy al servidor real o mini-servidor de aviso (graphify_estado)
    │   ├── graphify-auto-lib.mjs
    │   └── test/                # node --test
```

Lista de componentes (el párrafo "10. **rules**…"): inserta antes `7. **codebase-memory** — \`npm install -g codebase-memory-mcp\` + \`claude mcp add -s user codebase-memory\`. No indexa nada; el índice vive en \`~/.cache/codebase-memory-mcp/\`.` y renumera; en el párrafo de **graphify** quita la mención a `graphify claude install` y describe el MCP envoltorio. Troubleshooting: añade

```markdown
### `/mcp` muestra `graphify` conectado pero solo con la tool `graphify_estado`

Es el envoltorio diciendo que le falta algo: llama a `graphify_estado` y te dirá si no hay
`graphify-out/graph.json` en este proyecto (genera el grafo con `graphify extract . --code-only`
dentro del repo) o si graphify no está instalado (`uv tool install graphifyy`). Después reinicia la
sesión: el envoltorio decide al arrancar.
```

- [ ] **Step 4: Verificar y commit**

Run: `sed -n '/graphify claude install/p' README.md INSTALL.md bin/*.sh bin/components/*.sh | head`
Expected: solo menciones históricas ("ya no ejecuta…"), ninguna instrucción vigente.

```bash
git add templates/recordatorios/orden-herramientas.md README.md INSTALL.md
git commit -m "docs: grafo de código en vivo — MCP graphify envoltorio y codebase-memory"
```

---

### Task 6: Verificación final e instalación real

- [ ] **Step 1: Suites**

Run: `node --test "templates/mcp/test/*.test.mjs" && node --test "hooks/test/*.test.mjs" && (cd templates/rag && npm test --silent) && node bin/wizard/test-componentes.mjs && node skills/validate-skills.mjs`
Expected: 6 + 13 + 40 en verde; wizard `OK: 11 componentes…`; skills OK.

- [ ] **Step 2: Confirmar con el usuario e instalar**

Instala Python/`graphifyy` (pip) y `codebase-memory-mcp` (npm -g) y registra dos MCP a nivel usuario: pide confirmación antes. Luego:

Run: `bash bin/install.sh --only graphify --only codebase-memory 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -25`
Expected: `graphify --version` responde; `claude mcp list` muestra `graphify: node …graphify-auto.mjs - ✓ Connected` y `codebase-memory: codebase-memory-mcp - ✓ Connected`.

- [ ] **Step 3: Prueba en vivo**

```bash
# Sin grafo (cwd = ~/Desktop/WORKSPACE): el envoltorio sirve graphify_estado
cd "$HOME/Desktop/WORKSPACE" && printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}' '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"graphify_estado","arguments":{}}}' | CLAUDE_PROJECT_DIR="$(pwd -W)" node "$HOME/.claude/mcp/graphify-auto.mjs" | head -c 600
# Con grafo: genera el de CLAUDEMAX y prueba el proxy
cd "$HOME/Desktop/WORKSPACE/Herramientas/CLAUDEMAX" && graphify extract . --code-only 2>&1 | tail -3 && ls graphify-out/graph.json && printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | CLAUDE_PROJECT_DIR="$(pwd -W)" timeout 30 node "$HOME/.claude/mcp/graphify-auto.mjs" | head -c 800
# codebase-memory: indexa CLAUDEMAX y busca
codebase-memory-mcp cli index_repository --repo-path "$(pwd -W)" --mode moderate 2>&1 | tail -3 && codebase-memory-mcp cli search_graph --project CLAUDEMAX --name-pattern '.*Recordatorio.*' 2>&1 | head -10
```

Expected: primer bloque → texto "Sin grafo … graphify extract . --code-only"; segundo → `tools/list` con `query_graph`, `get_node`, `get_neighbors`, `shortest_path`…; tercero → nodos de `parseRecordatorio` en el índice.

- [ ] **Step 4: Recorrido de la spec y `git status`**

§1 (Tasks 1–3), §2 (Task 4), §3–4 (Task 5), §5 errores (Tasks 2–4), §6 pruebas (todas), §7 nada tocado. `git status --short` limpio (salvo `graphify-out/`, que está en `.gitignore`).
