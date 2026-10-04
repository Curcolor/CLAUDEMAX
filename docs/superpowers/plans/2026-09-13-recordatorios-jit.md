# Recordatorios justo a tiempo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un hook `PreToolUse` (`hooks/recordar.mjs`) que lee recordatorios en markdown desde `.claude/recordatorios/` (workspace y proyecto) y, cuando la tool y el comando/ruta casan, inyecta el texto como `additionalContext` sin bloquear; con cinco recordatorios genéricos de fábrica y los cuatro originales de Maestra como ejemplos inactivos.

**Architecture:** Dos archivos en `hooks/`: `recordar-lib.mjs` (funciones puras: parseo del frontmatter, coincidencia, búsqueda de directorios con precedencia, estado por sesión, glob→regex) y `recordar.mjs` (stdin → decisión → stdout, log de recordatorios rotos, nunca falla). Ambos se copian a `$CLAUDE_CONFIG_DIR/hooks/` porque el hook no puede depender de `templates/rag/`. Plantillas en `templates/recordatorios/` que `rules.sh` copia a `<RAG_ROOT>/.claude/recordatorios/` sin pisar.

**Tech Stack:** Node 22 (ESM, `node:test`, sin dependencias), bash (instalador), markdown.

**Spec:** `docs/superpowers/specs/2026-09-13-recordatorios-jit-design.md`

---

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `hooks/recordar-lib.mjs` | crear | `parseRecordatorio`, `globARegex`, `textoDelTool`, `coincide`, `buscarDirectorios`, `cargarRecordatorios`, `rutaEstado`, `leerEstado`, `filtrarPorSesion`, `guardarEstado` |
| `hooks/recordar.mjs` | crear | Hook: lee el evento, decide, escribe el JSON, anota rotos en `state/recordar.log`; exit 0 siempre |
| `hooks/test/recordar.test.mjs` | crear | Unitarias + extremo a extremo (proceso hijo) |
| `hooks/test/fixtures/recordatorios/**` | crear | Workspace y proyecto con recordatorios de prueba |
| `templates/recordatorios/_plantilla.md` | crear | Plantilla comentada |
| `templates/recordatorios/{orden-herramientas,tocar-produccion,editar-vault,estandares-dotnet,pruebas-dotnet}.md` | crear | Los cinco de fábrica |
| `templates/recordatorios/ejemplos/maestrasuite/{orden-busqueda,despliegue,estandares-maestrasuite,rojos-suite-api}.md` | crear | Originales fieles, `activo: false` |
| `bin/components/rules.sh` | modificar | Registrar el hook, copiar la lib, `ac_rules_recordatorios` |
| `bin/uninstall.sh` | modificar | Retirar hook, lib y estado |
| `templates/rules/CLAUDEMAX.md` | modificar | Regla 8 |
| `README.md`, `INSTALL.md` | modificar | Fila en la tabla de hooks, párrafo, árbol |

Convenciones: contenido en español; commits Conventional Commits con subject en español y sin footer de IA; código con barras invertidas o comillas simples se escribe con Write/Edit (el hook de rtk rompe heredocs con `'` o `\\`). Pruebas: `node --test "hooks/test/*.test.mjs"` desde la raíz del repo — sin `npm install` (no hay dependencias).

---

### Task 1: Parseo del frontmatter de un recordatorio

**Files:**
- Create: `hooks/recordar-lib.mjs`
- Create: `hooks/test/recordar.test.mjs`

- [ ] **Step 1: Escribir las pruebas**

Crea `hooks/test/recordar.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRecordatorio } from "../recordar-lib.mjs";

test("parseRecordatorio: listas en línea y en bloque, booleanos, nota plegada, cuerpo", () => {
    const texto = [
        "---",
        "tools: [Bash, PowerShell]",
        "patrones:",
        "  - '\\bgcloud\\b'",
        "  - \"\\bkubectl\\s+apply\\b\"",
        "rutas: [\"**/*.cs\"]",
        "siempre: [Bash]",
        "una_vez_por_sesion: true",
        "activo: false",
        "nota: >",
        "  2026-09-02: desplegué sin leer.",
        "  Segunda línea.",
        "---",
        "TEXTO",
        "con dos líneas",
    ].join("\n");
    const r = parseRecordatorio(texto, "x.md");
    assert.equal(r.ok, true, r.motivo);
    assert.deepEqual(r.tools, ["Bash", "PowerShell"]);
    assert.deepEqual(r.patrones.map(p => p.source), ["\\bgcloud\\b", "\\bkubectl\\s+apply\\b"]);
    assert.ok(r.patrones.every(p => p.flags.includes("i")));
    assert.deepEqual(r.rutas, ["**/*.cs"]);
    assert.deepEqual(r.siempre, ["Bash"]);
    assert.equal(r.unaVezPorSesion, true);
    assert.equal(r.activo, false);
    assert.equal(r.nota, "2026-09-02: desplegué sin leer. Segunda línea.");
    assert.equal(r.cuerpo, "TEXTO\ncon dos líneas");
    assert.equal(r.nombre, "x.md");
});

test("parseRecordatorio: valores por defecto", () => {
    const r = parseRecordatorio("---\ntools: [Grep]\n---\nhola\n", "g.md");
    assert.equal(r.ok, true);
    assert.deepEqual(r.patrones, []);
    assert.deepEqual(r.rutas, []);
    assert.deepEqual(r.siempre, []);
    assert.equal(r.unaVezPorSesion, false);
    assert.equal(r.activo, true);
    assert.equal(r.cuerpo, "hola");
});

test("parseRecordatorio: inválidos con motivo — sin tools, sin cierre, regex rota, cuerpo vacío", () => {
    assert.match(parseRecordatorio("---\npatrones: [x]\n---\ncuerpo", "a.md").motivo, /tools/);
    assert.match(parseRecordatorio("---\ntools: [Bash]\ncuerpo", "b.md").motivo, /sin cierre/);
    assert.match(parseRecordatorio("---\ntools: [Bash]\npatrones: ['(']\n---\ncuerpo", "c.md").motivo, /regex/);
    assert.match(parseRecordatorio("---\ntools: [Bash]\n---\n\n", "d.md").motivo, /cuerpo vacío/);
    assert.match(parseRecordatorio("sin frontmatter", "e.md").motivo, /frontmatter/);
    assert.equal(parseRecordatorio("---\npatrones: [x]\n---\ncuerpo", "a.md").ok, false);
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: FAIL — `Cannot find module '.../hooks/recordar-lib.mjs'`.

- [ ] **Step 3: Implementar `parseRecordatorio`**

Crea `hooks/recordar-lib.mjs`:

```js
// Funciones puras del motor de recordatorios justo a tiempo (hooks/recordar.mjs). Sin
// dependencias y sin acceso a red; solo lee disco donde se indica. Se copia junto al hook a
// $CLAUDE_CONFIG_DIR/hooks/, así que no puede importar nada de templates/rag/.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// --- Frontmatter ---------------------------------------------------------------------------

function stripYamlComment(value) {
    const i = value.search(/\s#/);
    let v = (i >= 0 ? value.slice(0, i) : value).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v;
}

const CLAVES_LISTA = new Set(["tools", "patrones", "rutas", "siempre"]);

// Parsea el frontmatter mínimo que usan los recordatorios: listas (en línea "[a, b]" o en
// bloque "- a"), escalares, booleanos y un bloque plegado (`nota: >` seguido de líneas con
// sangría). Sin dependencias: no es YAML completo, es lo que la plantilla documenta.
function parseFrontmatter(text) {
    if (!/^---\r?\n/.test(text)) return { error: "sin frontmatter" };
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
    if (!m) return { error: "frontmatter sin cierre (---)" };
    const meta = {};
    const lines = m[1].split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const kv = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!kv) continue;
        const [, key, rawValue] = kv;
        const value = stripYamlComment(rawValue);
        if (CLAVES_LISTA.has(key)) {
            if (value.startsWith("[")) {
                meta[key] = value.replace(/^\[/, "").replace(/\]$/, "").split(",").map(s => stripYamlComment(s)).filter(Boolean);
            } else if (!value) {
                const items = [];
                let j = i + 1;
                while (j < lines.length && /^\s+-\s+/.test(lines[j])) { items.push(stripYamlComment(lines[j].replace(/^\s+-\s+/, ""))); j++; }
                meta[key] = items;
                i = j - 1;
            } else {
                meta[key] = [value];
            }
        } else if (value === ">" || value === "|" || value === "") {
            // bloque plegado: las líneas siguientes con sangría se unen con espacios
            const partes = [];
            let j = i + 1;
            while (j < lines.length && /^\s+\S/.test(lines[j]) && !/^\s+-\s+/.test(lines[j])) { partes.push(lines[j].trim()); j++; }
            meta[key] = partes.join(" ");
            i = j - 1;
        } else {
            meta[key] = value;
        }
    }
    return { meta, body: text.slice(m[0].length) };
}

function bool(v, porDefecto) {
    if (v === undefined || v === "") return porDefecto;
    return String(v).trim().toLowerCase() === "true";
}

// Devuelve { ok, nombre, tools, patrones (RegExp[]), rutas, siempre, unaVezPorSesion, activo,
// nota, cuerpo } o { ok: false, nombre, motivo }.
export function parseRecordatorio(texto, nombre) {
    const fm = parseFrontmatter(texto);
    if (fm.error) return { ok: false, nombre, motivo: fm.error };
    const { meta, body } = fm;
    const tools = Array.isArray(meta.tools) ? meta.tools.filter(Boolean) : [];
    if (!tools.length) return { ok: false, nombre, motivo: "falta `tools` (obligatorio)" };
    const patrones = [];
    for (const p of Array.isArray(meta.patrones) ? meta.patrones : []) {
        try { patrones.push(new RegExp(p, "i")); }
        catch (e) { return { ok: false, nombre, motivo: `regex inválida en patrones: ${p} (${e.message})` }; }
    }
    const cuerpo = body.trim();
    if (!cuerpo) return { ok: false, nombre, motivo: "cuerpo vacío: no hay nada que inyectar" };
    return {
        ok: true,
        nombre,
        tools,
        patrones,
        rutas: Array.isArray(meta.rutas) ? meta.rutas.filter(Boolean) : [],
        siempre: Array.isArray(meta.siempre) ? meta.siempre.filter(Boolean) : [],
        unaVezPorSesion: bool(meta.una_vez_por_sesion, false),
        activo: bool(meta.activo, true),
        nota: meta.nota || "",
        cuerpo,
    };
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: `# pass 3`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/recordar-lib.mjs hooks/test/recordar.test.mjs
git commit -m "feat(hooks): recordar-lib parsea el frontmatter de un recordatorio"
```

---

### Task 2: Coincidencia — texto del tool, glob y decisión

**Files:**
- Modify: `hooks/recordar-lib.mjs`
- Modify: `hooks/test/recordar.test.mjs`

- [ ] **Step 1: Escribir las pruebas**

Amplía el import a `{ parseRecordatorio, globARegex, textoDelTool, coincide }` y añade:

```js
test("globARegex: *, ?, ** y rutas con barra invertida", () => {
    const re = globARegex("**/V.A.U.L.T/**/*.md");
    assert.ok(re.test("C:/Users/x/WORKSPACE/V.A.U.L.T/Decisiones/a.md"));
    assert.ok(re.test("V.A.U.L.T/a.md"));
    assert.ok(!re.test("C:/Users/x/VAULT/a.md"));
    assert.ok(!re.test("C:/Users/x/V.A.U.L.T/a.txt"));
    assert.ok(globARegex("**/*.cs").test("C:/repo/src/Foo.cs"));
    assert.ok(!globARegex("**/*.cs").test("C:/repo/src/Foo.csproj"));
    assert.ok(globARegex("**/MaestraSuite/**/*.xaml").test("D:\\w\\MaestraSuite\\src\\UI\\Main.xaml".replace(/\\/g, "/")));
    assert.ok(globARegex("src/?.cs").test("src/a.cs"));
    assert.ok(!globARegex("src/?.cs").test("src/ab.cs"));
});

test("textoDelTool: qué texto se prueba por tool", () => {
    assert.equal(textoDelTool("Bash", { command: "ls -la" }), "ls -la");
    assert.equal(textoDelTool("PowerShell", { command: "Get-ChildItem" }), "Get-ChildItem");
    assert.equal(textoDelTool("Grep", { pattern: "foo", path: "src" }), "foo src");
    assert.equal(textoDelTool("Edit", { file_path: "C:\\a\\b.cs" }), "C:/a/b.cs");
    assert.equal(textoDelTool("Write", { file_path: "x.md" }), "x.md");
    assert.equal(textoDelTool("Glob", { pattern: "**/*.ts" }), "**/*.ts");
    assert.equal(textoDelTool("Desconocida", { command: "x" }), "");
});

const rec = (over = {}) => ({
    ok: true, nombre: "r.md", tools: ["Bash"], patrones: [], rutas: [], siempre: [],
    unaVezPorSesion: false, activo: true, nota: "", cuerpo: "T", ...over,
});

test("coincide: tabla", () => {
    // tool fuera de tools → no
    assert.equal(coincide(rec(), "Grep", { pattern: "x" }), false);
    // sin patrones ni rutas → siempre
    assert.equal(coincide(rec(), "Bash", { command: "ls" }), true);
    // patrones casa / no casa, case-insensitive
    assert.equal(coincide(rec({ patrones: [/\bgcloud\b/i] }), "Bash", { command: "GCLOUD run deploy" }), true);
    assert.equal(coincide(rec({ patrones: [/\bgcloud\b/i] }), "Bash", { command: "ls" }), false);
    // rutas casa / no casa, con barras invertidas
    const e = rec({ tools: ["Edit"], rutas: ["**/*.cs"] });
    assert.equal(coincide(e, "Edit", { file_path: "C:\\repo\\A.cs" }), true);
    assert.equal(coincide(e, "Edit", { file_path: "C:\\repo\\A.md" }), false);
    // ambos → basta uno
    const ambos = rec({ tools: ["Edit"], patrones: [/Foo/], rutas: ["**/*.xaml"] });
    assert.equal(coincide(ambos, "Edit", { file_path: "C:/repo/Foo.cs" }), true);
    assert.equal(coincide(ambos, "Edit", { file_path: "C:/repo/Bar.xaml" }), true);
    assert.equal(coincide(ambos, "Edit", { file_path: "C:/repo/Bar.cs" }), false);
    // siempre → sí aunque no case ningún patrón
    const s = rec({ tools: ["Grep", "Bash"], siempre: ["Grep"], patrones: [/\bgrep\b/i] });
    assert.equal(coincide(s, "Grep", { pattern: "zzz" }), true);
    assert.equal(coincide(s, "Bash", { command: "ls" }), false);
    assert.equal(coincide(s, "Bash", { command: "git log | grep x" }), true);
    // inactivo → no
    assert.equal(coincide(rec({ activo: false }), "Bash", { command: "ls" }), false);
    // Edit prueba patrones contra file_path
    assert.equal(coincide(rec({ tools: ["Edit"], patrones: [/MaestraSuite/] }), "Edit", { file_path: "C:/w/MaestraSuite/a.cs" }), true);
});
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: FAIL — `globARegex` no exportada.

- [ ] **Step 3: Implementar**

Añade al final de `hooks/recordar-lib.mjs`:

```js
// --- Coincidencia (spec §1) -----------------------------------------------------------------

// Glob → RegExp sobre rutas normalizadas a "/": "**/" = cualquier prefijo de directorios
// (incluido ninguno), "**" = cualquier cosa, "*" = un segmento, "?" = un carácter.
export function globARegex(glob) {
    const g = String(glob).replace(/\\/g, "/");
    const esc = s => s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    let out = "";
    for (let i = 0; i < g.length; i++) {
        if (g.startsWith("**/", i)) { out += "(?:.*/)?"; i += 2; continue; }
        if (g.startsWith("**", i)) { out += ".*"; i += 1; continue; }
        if (g[i] === "*") { out += "[^/]*"; continue; }
        if (g[i] === "?") { out += "[^/]"; continue; }
        out += esc(g[i]);
    }
    return new RegExp(`^${out}$`, "i");
}

// Texto contra el que se prueban los `patrones` de un recordatorio, según la tool.
export function textoDelTool(tool, input = {}) {
    const norm = v => String(v ?? "").replace(/\\/g, "/");
    switch (tool) {
        case "Bash":
        case "PowerShell":
            return String(input.command ?? "");
        case "Grep":
            return [input.pattern, input.path].filter(Boolean).map(String).join(" ");
        case "Glob":
            return String(input.pattern ?? "");
        case "Edit":
        case "Write":
        case "MultiEdit":
        case "Read":
            return norm(input.file_path);
        default:
            return "";
    }
}

export function coincide(rec, tool, input = {}) {
    if (!rec.ok || !rec.activo) return false;
    if (!rec.tools.includes(tool)) return false;
    if (rec.siempre.includes(tool)) return true;
    if (!rec.patrones.length && !rec.rutas.length) return true;
    const texto = textoDelTool(tool, input);
    if (rec.patrones.some(re => re.test(texto))) return true;
    const ruta = String(input.file_path ?? "").replace(/\\/g, "/");
    if (ruta && rec.rutas.some(g => globARegex(g).test(ruta))) return true;
    return false;
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: `# pass 6`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/recordar-lib.mjs hooks/test/recordar.test.mjs
git commit -m "feat(hooks): coincidencia de recordatorios por tool, patrón y ruta"
```

---

### Task 3: Búsqueda de directorios con precedencia y carga

**Files:**
- Modify: `hooks/recordar-lib.mjs`
- Modify: `hooks/test/recordar.test.mjs`
- Create: `hooks/test/fixtures/recordatorios/ws/.claude/recordatorios/a.md`, `.../ws/.claude/recordatorios/b.md`, `.../ws/.claude/recordatorios/_plantilla.md`, `.../ws/.claude/recordatorios/roto.md`, `.../ws/proy/.claude/recordatorios/b.md`, `.../ws/proy/src/.gitkeep`

- [ ] **Step 1: Crear el fixture**

`ws/.claude/recordatorios/a.md`:
```markdown
---
tools: [Bash]
patrones: ['\bls\b']
---
A DEL WORKSPACE
```

`ws/.claude/recordatorios/b.md`:
```markdown
---
tools: [Bash]
---
B DEL WORKSPACE
```

`ws/.claude/recordatorios/_plantilla.md`:
```markdown
---
tools: [Bash]
---
NO DEBE CARGARSE
```

`ws/.claude/recordatorios/roto.md`:
```markdown
---
patrones: [x]
---
sin tools
```

`ws/proy/.claude/recordatorios/b.md`:
```markdown
---
tools: [Bash]
una_vez_por_sesion: true
---
B DEL PROYECTO
```

`ws/proy/src/.gitkeep` vacío.

- [ ] **Step 2: Escribir las pruebas**

Amplía el import con `buscarDirectorios, cargarRecordatorios` y añade arriba del archivo:

```js
import path from "node:path";
import { fileURLToPath } from "node:url";
const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "recordatorios");
```

y al final:

```js
test("buscarDirectorios: sube desde el cwd, del más cercano al más lejano; env anula", () => {
    const dirs = buscarDirectorios(path.join(FIX, "ws", "proy", "src"), {});
    assert.deepEqual(dirs, [
        path.join(FIX, "ws", "proy", ".claude", "recordatorios"),
        path.join(FIX, "ws", ".claude", "recordatorios"),
    ]);
    assert.deepEqual(buscarDirectorios(path.join(FIX, "ws"), {}), [path.join(FIX, "ws", ".claude", "recordatorios")]);
    assert.deepEqual(buscarDirectorios(path.join(FIX, "ws", "proy", "src"), { CLAUDEMAX_RECORDATORIOS_DIR: "/x/y" }), ["/x/y"]);
    // más de 4 niveles por encima no se mira
    assert.deepEqual(buscarDirectorios(path.join(FIX, "ws", "proy", "src", "a", "b", "c", "d", "e"), {}), []);
});

test("cargarRecordatorios: precedencia por nombre, ignora _plantilla, reporta rotos, orden alfabético", () => {
    const dirs = buscarDirectorios(path.join(FIX, "ws", "proy", "src"), {});
    const { recordatorios, rotos } = cargarRecordatorios(dirs);
    assert.deepEqual(recordatorios.map(r => r.nombre), ["a.md", "b.md"]);
    assert.equal(recordatorios.find(r => r.nombre === "b.md").cuerpo, "B DEL PROYECTO");
    assert.equal(rotos.length, 1);
    assert.match(rotos[0].archivo, /roto\.md$/);
    assert.match(rotos[0].motivo, /tools/);
    assert.deepEqual(cargarRecordatorios(["/no/existe"]), { recordatorios: [], rotos: [] });
});
```

- [ ] **Step 3: Ejecutar y verificar que fallan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: FAIL — `buscarDirectorios` no exportada.

- [ ] **Step 4: Implementar**

Añade al final de `hooks/recordar-lib.mjs`:

```js
// --- Búsqueda y carga (spec §2) -------------------------------------------------------------

const MAX_NIVELES = 4;

// Directorios `.claude/recordatorios/` desde `cwd` hacia arriba (hasta 4 niveles), del más
// cercano al más lejano. CLAUDEMAX_RECORDATORIOS_DIR anula la búsqueda (pruebas, casos raros).
export function buscarDirectorios(cwd, env = process.env) {
    if (env.CLAUDEMAX_RECORDATORIOS_DIR) return [env.CLAUDEMAX_RECORDATORIOS_DIR];
    const out = [];
    let dir = path.resolve(cwd || process.cwd());
    for (let nivel = 0; nivel <= MAX_NIVELES; nivel++) {
        const candidato = path.join(dir, ".claude", "recordatorios");
        try { if (fs.statSync(candidato).isDirectory()) out.push(candidato); } catch {}
        const padre = path.dirname(dir);
        if (padre === dir) break;
        dir = padre;
    }
    return out;
}

// Carga los *.md (sin los "_") de los directorios dados; ante el mismo nombre gana el primer
// directorio (el más cercano al cwd). Devuelve { recordatorios (ordenados por nombre), rotos }.
export function cargarRecordatorios(dirs) {
    const porNombre = new Map();
    const rotos = [];
    for (const dir of dirs) {
        let entradas;
        try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
        for (const e of entradas) {
            if (!e.isFile() || !e.name.endsWith(".md") || e.name.startsWith("_")) continue;
            if (porNombre.has(e.name)) continue;   // ya lo aportó un directorio más cercano
            const archivo = path.join(dir, e.name);
            let r;
            try { r = parseRecordatorio(fs.readFileSync(archivo, "utf8"), e.name); }
            catch (err) { r = { ok: false, nombre: e.name, motivo: err.message }; }
            if (r.ok) porNombre.set(e.name, r);
            else { porNombre.set(e.name, null); rotos.push({ archivo, motivo: r.motivo }); }
        }
    }
    const recordatorios = [...porNombre.values()].filter(Boolean).sort((a, b) => a.nombre.localeCompare(b.nombre));
    return { recordatorios, rotos };
}
```

- [ ] **Step 5: Ejecutar y verificar que pasan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: `# pass 8`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add hooks/recordar-lib.mjs hooks/test/
git commit -m "feat(hooks): búsqueda de recordatorios con precedencia proyecto > workspace"
```

---

### Task 4: Estado por sesión (`una_vez_por_sesion`)

**Files:**
- Modify: `hooks/recordar-lib.mjs`
- Modify: `hooks/test/recordar.test.mjs`

- [ ] **Step 1: Escribir las pruebas**

Amplía el import con `rutaEstado, leerEstado, filtrarPorSesion, guardarEstado` y añade `import fs from "node:fs"; import os from "node:os";` arriba. Al final:

```js
test("estado por sesión: dispara una vez, no repite, se resetea al cambiar de sesión, tolera JSON roto", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "recordar-estado-"));
    const env = { CLAUDE_CONFIG_DIR: tmp };
    assert.equal(rutaEstado(env), path.join(tmp, "state", "recordar.json"));
    const unaVez = { ok: true, nombre: "u.md", unaVezPorSesion: true, activo: true, tools: ["Bash"], patrones: [], rutas: [], siempre: [], cuerpo: "U" };
    const cadaVez = { ...unaVez, nombre: "c.md", unaVezPorSesion: false };

    let estado = leerEstado(env);
    let { visibles, estado: e1 } = filtrarPorSesion([unaVez, cadaVez], "s1", estado);
    assert.deepEqual(visibles.map(r => r.nombre), ["u.md", "c.md"]);
    guardarEstado(env, e1);
    assert.deepEqual(JSON.parse(fs.readFileSync(rutaEstado(env), "utf8")), { sessionId: "s1", disparados: ["u.md"] });

    ({ visibles, estado: e1 } = filtrarPorSesion([unaVez, cadaVez], "s1", leerEstado(env)));
    assert.deepEqual(visibles.map(r => r.nombre), ["c.md"]);

    ({ visibles, estado: e1 } = filtrarPorSesion([unaVez, cadaVez], "s2", leerEstado(env)));
    assert.deepEqual(visibles.map(r => r.nombre), ["u.md", "c.md"]);
    assert.equal(e1.sessionId, "s2");

    // sin session_id → se comporta como cada vez y no toca el estado
    ({ visibles } = filtrarPorSesion([unaVez], null, leerEstado(env)));
    assert.deepEqual(visibles.map(r => r.nombre), ["u.md"]);

    fs.writeFileSync(rutaEstado(env), "{corrupto");
    assert.deepEqual(leerEstado(env), { sessionId: null, disparados: [] });
    fs.rmSync(tmp, { recursive: true, force: true });
});
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: FAIL — `rutaEstado` no exportada.

- [ ] **Step 3: Implementar**

Añade al final de `hooks/recordar-lib.mjs`:

```js
// --- Estado por sesión (spec §2, una_vez_por_sesion) ----------------------------------------

export function dirEstado(env = process.env) {
    const base = env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
    return path.join(base, "state");
}

export function rutaEstado(env = process.env) {
    return path.join(dirEstado(env), "recordar.json");
}

export function leerEstado(env = process.env) {
    try {
        const parsed = JSON.parse(fs.readFileSync(rutaEstado(env), "utf8"));
        return {
            sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
            disparados: Array.isArray(parsed.disparados) ? parsed.disparados.filter(x => typeof x === "string") : [],
        };
    } catch {
        return { sessionId: null, disparados: [] };
    }
}

export function guardarEstado(env, estado) {
    try {
        fs.mkdirSync(dirEstado(env), { recursive: true });
        fs.writeFileSync(rutaEstado(env), JSON.stringify(estado, null, 2), "utf8");
    } catch {}
}

// Quita los `una_vez_por_sesion` ya disparados en esta sesión y anota los que van a disparar.
// Sin sessionId no se filtra ni se anota nada (se comporta como "cada vez").
export function filtrarPorSesion(recordatorios, sessionId, estado) {
    if (!sessionId) return { visibles: recordatorios, estado };
    const e = estado.sessionId === sessionId ? { ...estado, disparados: [...estado.disparados] } : { sessionId, disparados: [] };
    const visibles = [];
    for (const r of recordatorios) {
        if (r.unaVezPorSesion) {
            if (e.disparados.includes(r.nombre)) continue;
            e.disparados.push(r.nombre);
        }
        visibles.push(r);
    }
    return { visibles, estado: e };
}
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: `# pass 9`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/recordar-lib.mjs hooks/test/recordar.test.mjs
git commit -m "feat(hooks): estado por sesión para recordatorios de una sola vez"
```

---

### Task 5: El hook `recordar.mjs` — extremo a extremo

**Files:**
- Create: `hooks/recordar.mjs`
- Modify: `hooks/test/recordar.test.mjs`

- [ ] **Step 1: Escribir las pruebas extremo a extremo**

Añade `import { execFile } from "node:child_process";` arriba y al final:

```js
const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "recordar.mjs");

// Ejecuta el hook con un evento por stdin; devuelve { status, stdout, stderr }.
function correrHook(evento, env = {}) {
    return new Promise(resolve => {
        const child = execFile(process.execPath, [HOOK], { env: { ...process.env, ...env }, timeout: 10_000 },
            (err, stdout, stderr) => resolve({ status: err ? (err.code ?? 1) : 0, stdout, stderr }));
        child.stdin.end(evento === null ? "" : JSON.stringify(evento));
    });
}

test("hook: Bash con ls dispara a.md y b.md del fixture (b del proyecto), en orden alfabético", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "recordar-e2e-"));
    const cwd = path.join(FIX, "ws", "proy", "src");
    const r = await correrHook({ tool_name: "Bash", tool_input: { command: "ls -la" }, cwd, session_id: "s1" }, { CLAUDE_CONFIG_DIR: tmp });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stderr, "");
    const out = JSON.parse(r.stdout);
    assert.equal(out.hookSpecificOutput.hookEventName, "PreToolUse");
    assert.equal(out.hookSpecificOutput.additionalContext, "A DEL WORKSPACE\n\nB DEL PROYECTO");
    assert.equal(out.suppressOutput, true);
    // b.md es una_vez_por_sesion: la segunda vez solo sale a.md
    const r2 = await correrHook({ tool_name: "Bash", tool_input: { command: "ls" }, cwd, session_id: "s1" }, { CLAUDE_CONFIG_DIR: tmp });
    assert.equal(JSON.parse(r2.stdout).hookSpecificOutput.additionalContext, "A DEL WORKSPACE");
    // el roto quedó anotado en el log, no en stderr
    assert.match(fs.readFileSync(path.join(tmp, "state", "recordar.log"), "utf8"), /roto\.md: falta `tools`/);
    fs.rmSync(tmp, { recursive: true, force: true });
});

test("hook: sin coincidencia, stdin vacío, JSON roto y CLAUDEMAX_RECORDAR=0 → exit 0 sin salida", async () => {
    const cwd = path.join(FIX, "ws", "proy", "src");
    // Ojo: en el fixture b.md no tiene patrones, así que casa con CUALQUIER Bash; por eso el
    // caso "sin coincidencia" usa Grep, que ningún recordatorio del fixture declara.
    for (const [evento, env] of [
        [{ tool_name: "Grep", tool_input: { pattern: "x" }, cwd }, {}],
        [null, {}],
        [{ tool_name: "Bash", tool_input: { command: "ls" }, cwd }, { CLAUDEMAX_RECORDAR: "0" }],
        [{ tool_name: "Bash", tool_input: { command: "ls" }, cwd: "/no/existe/en/ningun/sitio" }, {}],
    ]) {
        const r = await correrHook(evento, env);
        assert.equal(r.status, 0);
        assert.equal(r.stdout, "");
        assert.equal(r.stderr, "");
    }
    // JSON roto por stdin
    const roto = await new Promise(resolve => {
        const child = execFile(process.execPath, [HOOK], { timeout: 10_000 }, (err, stdout, stderr) => resolve({ status: err ? 1 : 0, stdout, stderr }));
        child.stdin.end("{no es json");
    });
    assert.deepEqual(roto, { status: 0, stdout: "", stderr: "" });
});
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: FAIL — `Cannot find module '.../hooks/recordar.mjs'`.

- [ ] **Step 3: Escribir el hook**

Crea `hooks/recordar.mjs`:

```js
#!/usr/bin/env node
// Hook PreToolUse de CLAUDEMAX: recordatorios justo a tiempo. Lee los recordatorios en
// markdown de `.claude/recordatorios/` (del proyecto y del workspace, subiendo desde el cwd) y,
// cuando la tool y el comando/ruta casan, inyecta el texto como additionalContext — en el
// instante de la decisión, no al arranque de la sesión. Nunca bloquea; exit 0 siempre.
//
// Por qué existe: en el setup de trabajo del autor, las reglas escritas en CLAUDE.md y en la
// memoria se olvidaban igual a mitad de una tarea larga. El problema era de TIEMPOS, no de
// conocimiento: el recordatorio tiene que llegar cuando se va a ejecutar el comando. Y dispara
// cada vez a propósito — la búsqueda que importa casi nunca es la primera.
//
// Formato de un recordatorio y semántica de coincidencia: templates/recordatorios/_plantilla.md
// y docs/superpowers/specs/2026-09-13-recordatorios-jit-design.md. Funciones puras en
// recordar-lib.mjs (se instala junto a este archivo).
//
// Recordatorios rotos (frontmatter inválido, regex mala) se ignoran y se anotan en
// $CLAUDE_CONFIG_DIR/state/recordar.log — nunca por stderr, que iría al modelo.
//
// Registrado por bin/components/rules.sh como PreToolUse con matcher
// Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read y timeout 5. Escape: CLAUDEMAX_RECORDAR=0.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
    buscarDirectorios, cargarRecordatorios, coincide, dirEstado,
    leerEstado, filtrarPorSesion, guardarEstado,
} from "./recordar-lib.mjs";

if (String(process.env.CLAUDEMAX_RECORDAR || "") === "0") process.exit(0);

function leerStdin() {
    return new Promise(resolve => {
        let buf = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", c => { buf += c; });
        process.stdin.on("end", () => resolve(buf));
        process.stdin.on("error", () => resolve(buf));
        if (process.stdin.isTTY) resolve("");
    });
}

function pick(obj, keys) {
    for (const k of keys) if (obj && obj[k] !== undefined) return obj[k];
    return undefined;
}

// Anota recordatorios rotos en state/recordar.log, truncado a las últimas 200 líneas.
function anotarRotos(rotos) {
    if (!rotos.length) return;
    try {
        const dir = dirEstado(process.env);
        fs.mkdirSync(dir, { recursive: true });
        const archivo = path.join(dir, "recordar.log");
        const fecha = new Date().toISOString();
        let previas = [];
        try { previas = fs.readFileSync(archivo, "utf8").split("\n").filter(Boolean); } catch {}
        const nuevas = rotos.map(r => `${fecha} ${r.archivo}: ${r.motivo}`);
        fs.writeFileSync(archivo, [...previas, ...nuevas].slice(-200).join("\n") + "\n", "utf8");
    } catch {}
}

async function main() {
    const raw = await leerStdin();
    if (!raw.trim()) return;
    let evt;
    try { evt = JSON.parse(raw); } catch { return; }
    const tool = pick(evt, ["tool_name", "toolName"]);
    if (typeof tool !== "string" || !tool) return;
    const input = pick(evt, ["tool_input", "toolInput"]) || {};
    const cwd = pick(evt, ["cwd", "cwd_path", "cwdPath"]) || process.cwd();
    const sessionId = pick(evt, ["session_id", "sessionId"]);

    const dirs = buscarDirectorios(cwd, process.env);
    if (!dirs.length) return;
    const { recordatorios, rotos } = cargarRecordatorios(dirs);
    anotarRotos(rotos);

    const coincidentes = recordatorios.filter(r => coincide(r, tool, input));
    if (!coincidentes.length) return;

    const sid = typeof sessionId === "string" && sessionId ? sessionId : null;
    const { visibles, estado } = filtrarPorSesion(coincidentes, sid, leerEstado(process.env));
    if (sid && coincidentes.some(r => r.unaVezPorSesion)) guardarEstado(process.env, estado);
    if (!visibles.length) return;

    const texto = visibles.map(r => r.cuerpo).join("\n\n");
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: texto },
        suppressOutput: true,
    }) + "\n");
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: `# pass 11`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/recordar.mjs hooks/test/recordar.test.mjs
git commit -m "feat(hooks): recordar.mjs — recordatorios justo a tiempo en PreToolUse"
```

---

### Task 6: Plantilla, cinco de fábrica y ejemplos de Maestra

**Files:**
- Create: `templates/recordatorios/_plantilla.md`
- Create: `templates/recordatorios/{orden-herramientas,tocar-produccion,editar-vault,estandares-dotnet,pruebas-dotnet}.md`
- Create: `templates/recordatorios/ejemplos/maestrasuite/{orden-busqueda,despliegue,estandares-maestrasuite,rojos-suite-api}.md`
- Modify: `hooks/test/recordar.test.mjs`

- [ ] **Step 1: Escribir la prueba de instalación**

Al final de `hooks/test/recordar.test.mjs`:

```js
const TPL = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "recordatorios");

test("templates/recordatorios: archivos exactos, los de fábrica válidos y activos, los ejemplos válidos e inactivos, sin 'Maestra' en los genéricos", () => {
    assert.deepEqual(fs.readdirSync(TPL).sort(), ["_plantilla.md", "editar-vault.md", "ejemplos", "estandares-dotnet.md", "orden-herramientas.md", "pruebas-dotnet.md", "tocar-produccion.md"]);
    assert.deepEqual(fs.readdirSync(path.join(TPL, "ejemplos", "maestrasuite")).sort(), ["despliegue.md", "estandares-maestrasuite.md", "orden-busqueda.md", "rojos-suite-api.md"]);
    for (const f of ["editar-vault.md", "estandares-dotnet.md", "orden-herramientas.md", "pruebas-dotnet.md", "tocar-produccion.md"]) {
        const texto = fs.readFileSync(path.join(TPL, f), "utf8");
        const r = parseRecordatorio(texto, f);
        assert.equal(r.ok, true, `${f}: ${r.motivo}`);
        assert.equal(r.activo, true, f);
        assert.ok(r.nota.length > 10, `${f}: sin nota de origen`);
        assert.ok(!/maestra/i.test(texto), `${f}: menciona Maestra`);
    }
    for (const f of ["despliegue.md", "estandares-maestrasuite.md", "orden-busqueda.md", "rojos-suite-api.md"]) {
        const r = parseRecordatorio(fs.readFileSync(path.join(TPL, "ejemplos", "maestrasuite", f), "utf8"), f);
        assert.equal(r.ok, true, `${f}: ${r.motivo}`);
        assert.equal(r.activo, false, f);
    }
    // la plantilla NO parsea como recordatorio válido a propósito (tools vacío) — y empieza por _
    assert.equal(parseRecordatorio(fs.readFileSync(path.join(TPL, "_plantilla.md"), "utf8"), "_plantilla.md").ok, false);
});

test("de fábrica: disparan con los eventos que deben", async () => {
    const env = { CLAUDEMAX_RECORDATORIOS_DIR: TPL };
    const casos = [
        [{ tool_name: "Grep", tool_input: { pattern: "foo" } }, /ORDEN DE HERRAMIENTAS/],
        [{ tool_name: "Bash", tool_input: { command: "git log | grep fix" } }, /ORDEN DE HERRAMIENTAS/],
        [{ tool_name: "PowerShell", tool_input: { command: "Get-Content x | Select-String y" } }, /ORDEN DE HERRAMIENTAS/],
        [{ tool_name: "Bash", tool_input: { command: "gcloud run deploy api --image x" } }, /VAS A TOCAR PRODUCCIÓN/],
        [{ tool_name: "PowerShell", tool_input: { command: ".\\publicar.ps1" } }, /VAS A TOCAR PRODUCCIÓN/],
        [{ tool_name: "Edit", tool_input: { file_path: "C:\\w\\V.A.U.L.T\\Decisiones\\x.md" } }, /NOTA DEL VAULT/],
        [{ tool_name: "Write", tool_input: { file_path: "C:/repo/src/Foo.cs" } }, /ESTÁNDARES \.NET/],
        [{ tool_name: "Edit", tool_input: { file_path: "C:/repo/src/Main.xaml" } }, /ESTÁNDARES \.NET/],
        [{ tool_name: "Bash", tool_input: { command: "dotnet test tests/Api.Tests" } }, /VAS A CORRER UNA SUITE \.NET/],
        [{ tool_name: "PowerShell", tool_input: { command: "./db/probar-api.ps1" } }, /VAS A CORRER UNA SUITE \.NET/],
    ];
    for (const [evento, re] of casos) {
        const r = await correrHook({ ...evento, cwd: TPL }, env);
        assert.equal(r.status, 0);
        assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, re, JSON.stringify(evento));
    }
    for (const evento of [
        { tool_name: "Bash", tool_input: { command: "git status" } },
        { tool_name: "Edit", tool_input: { file_path: "C:/repo/README.md" } },
    ]) {
        const r = await correrHook({ ...evento, cwd: TPL }, env);
        assert.equal(r.stdout, "", JSON.stringify(evento));
    }
});
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: FAIL — `ENOENT … templates/recordatorios`.

- [ ] **Step 3: Escribir la plantilla**

`templates/recordatorios/_plantilla.md`:

```markdown
---
# Recordatorio justo a tiempo de CLAUDEMAX. Copia este archivo, quítale el "_" del nombre y
# rellena el frontmatter. El hook recordar.mjs lo inyecta como contexto en el instante en que
# la tool y el comando/ruta casan. Nunca bloquea. Los archivos que empiezan por "_" se ignoran.
#
# tools      obligatorio. Tools de Claude Code: Grep, Bash, PowerShell, Edit, Write, MultiEdit, Read, Glob.
# patrones   opcional. Regex JS (sin barras, case-insensitive) contra el texto del tool:
#            Bash/PowerShell → el comando; Grep → el patrón; Edit/Write/Read → la ruta.
#            Si un patrón lleva comas, usa la forma en bloque ("- ...") y no la lista en línea.
# rutas      opcional. Globs (*, ?, **) contra file_path. Ej.: "**/V.A.U.L.T/**/*.md", "**/*.cs".
# siempre    opcional. Tools (de las de arriba) que disparan sin mirar patrones ni rutas.
# una_vez_por_sesion  opcional (false). true = solo la primera vez por sesión de Claude Code.
# activo     opcional (true). false = se ignora sin borrarlo.
# nota       opcional. Para ti: qué fallo lo parió y cuándo. El motor no lo inyecta.
#
# Coincidencia: tool ∈ tools Y (tool ∈ siempre, O sin patrones ni rutas, O algún patrón casa,
# O alguna ruta casa).
#
# Longitud: si dispara en cada edición, ≤ 8 líneas — se paga muchas veces por sesión. Si dispara
# pocas veces (un despliegue), lo que haga falta. Escríbelo para el instante de la decisión:
# qué comprobar ANTES de ejecutar esto, y por qué (el fallo real, con fecha).
tools: []
patrones: []
rutas: []
siempre: []
una_vez_por_sesion: false
activo: true
nota: >
  AAAA-MM-DD: qué pasó y cuánto costó.
---
TEXTO QUE SE INYECTA TAL CUAL.
```

- [ ] **Step 4: Escribir los cinco de fábrica**

`templates/recordatorios/orden-herramientas.md`:

```markdown
---
tools: [Grep, Bash, PowerShell]
siempre: [Grep]
patrones:
  - '\bgrep\b'
  - '\brg\b'
  - '\bripgrep\b'
  - '\bfind\b'
  - '\bfindstr\b'
  - 'Select-String'
nota: >
  Generalizado del setup de trabajo del autor (2026-08-19: derivó a grep dos veces el mismo día
  con la regla escrita en CLAUDE.md; 2026-09-04: grep "confirmó" un helper que el grafo mostró
  que tenía 2 llamantes de 97). Dispara cada vez a propósito.
---
ORDEN DE HERRAMIENTAS DE CONTEXTO: rag → graphify → codebase-memory → grep, que es el ÚLTIMO recurso.

Antes de esta búsqueda, responde:
1. ¿Es un LITERAL? (string exacto, valor mágico, mensaje de error, SQL) → grep es la herramienta correcta. Sigue.
1b. TRAMPA: ¿sabes EXACTAMENTE qué cadena buscas, o estás PROBANDO CANDIDATOS? Si enumeras nombres posibles y cuentas cuál aparece, NO es una búsqueda literal: es la pregunta "¿qué mecanismo se usa aquí?", que es ESTRUCTURA disfrazada. Va al grafo de código.
2. ¿Es ESTRUCTURA, o "quién usa esto", o vas a escribir un helper/mapeo/regla nuevo? → te equivocaste de herramienta: `rag_query` para qué se decidió y por qué; el grafo de código (graphify / codebase-memory) para qué llama a qué. Y pregunta al grafo si el helper YA EXISTE antes de escribirlo.
3. Si usas grep igual: excluye antes lo generado (`bin/`, `obj/`, `node_modules/`, `*.Designer.cs`, `dist/`) — el corte de `head` se llena de código generado y tapa la respuesta.

grep NO ve despacho por interfaz, inyección de dependencias, `override` ni bindings declarativos — justo lo que usan los frameworks modernos.
```

`templates/recordatorios/tocar-produccion.md`:

```markdown
---
tools: [Bash, PowerShell]
patrones:
  - '\bgcloud\b'
  - '\bgsutil\b'
  - '\baws\s'
  - '\baz\s'
  - '\bkubectl\s+(apply|delete|rollout)\b'
  - '\bterraform\s+(apply|destroy)\b'
  - '\bpulumi\s+up\b'
  - '\bdocker\s+push\b'
  - '\bhelm\s+(install|upgrade|uninstall)\b'
  - '\bfly\s+deploy\b'
  - '\bvercel\s+--prod\b'
  - '\bnetlify\s+deploy\b'
  - '\brun\s+deploy\b'
  - '--prod\b'
  - '\bpublicar\.ps1\b'
nota: >
  Generalizado del setup de trabajo del autor (2026-09-02: desplegó una versión sin leer ninguna
  de las cuatro fuentes que documentaban el procedimiento; creó un bucket que nadie pidió y
  estuvo a punto de bajar producción de 3 instancias a 1 con un comando guardado que se había
  podrido). "Lo que hiciste fue improvisar sobre producción."
---
VAS A TOCAR PRODUCCIÓN. Antes del primer comando:

1. Lee el procedimiento escrito, no lo improvises: `rag_query "procedimiento de despliegue"` y `rag_query "pendientes de despliegue"` (y `Hubs/Pendientes.md`). Si no existe, dilo antes de seguir.
2. RESPALDO PRIMERO — y no cuenta hasta RESTAURARLO en una base scratch. Con esa base se mide producción; lo que hay allí no se lee de ninguna nota.
3. Si solo cambió el código, despliega SOLO la imagen/artefacto, sin banderas de configuración: el comando completo guardado se pudre (número de instancias, secretos que se REEMPLAZAN en bloque).
4. Lo LOCAL no toca producción. La INFRAESTRUCTURA NUEVA la decide el humano, no tú: si el procedimiento no cubre el caso, se dice y se pregunta — no se inventa.
5. Al terminar, inventaría lo que creaste (buckets, reglas de red, secretos, revisiones) y dilo.
```

`templates/recordatorios/editar-vault.md`:

```markdown
---
tools: [Edit, Write, MultiEdit]
rutas: ["**/V.A.U.L.T/**/*.md"]
nota: >
  Nace con el vault v2 (2026-09-13): la regla 7 vive en CLAUDEMAX.md pero se aplica al escribir
  la nota, no al leer las reglas. Corto porque dispara en cada edición del vault.
---
NOTA DEL VAULT (regla 7): la colección la da la carpeta — guárdala en la de su género y arranca de `Plantillas/nota.md`. Enlázala desde su hub en `Hubs/`. Si describe código o un documento, `fuentes:` (rutas/globs desde la raíz del workspace). Si sustituye a otra nota, `reemplaza: [nombre]`; si vence, `revisar:`. Nunca escribas "hay N notas": el conteo se mide. Antes de reescribir una nota de `Codigo/`, relee el código, no la prosa vieja.
```

`templates/recordatorios/estandares-dotnet.md`:

```markdown
---
tools: [Edit, Write, MultiEdit]
rutas: ["**/*.cs", "**/*.xaml"]
nota: >
  Generalizado del setup de trabajo del autor (2026-08-19: reescribió a mano un helper que ya
  existía; 2026-07-26: parcheó el síntoma de SelectionChanged en una pantalla y media hora
  después salió el mismo bug en otra). Ajusta el punto 3 a los estándares de tu casa.
---
ESTÁNDARES .NET / WinUI — antes de este cambio:
1. Si vas a escribir un helper, mapeo o regla nuevos: pregunta al grafo de código si YA EXISTE (graphify / codebase-memory). Reescribir a mano algo que ya existía es el fallo más repetido. Si el grafo no encuentra algo recién escrito, reindexa antes de concluir que no existe.
2. Si es un arreglo: causa raíz, no síntoma. grep no ve `x:Bind`, despacho por interfaz, DI ni `override`. Lee las ASERCIONES del test que falla, no solo su nombre.
3. Estándares de la casa: dominio sin UI ni BD; ViewModels con CommunityToolkit.Mvvm y bindeo por `x:Bind` (no `DataContext`); parámetros de negocio versionados — nunca hardcodear una regla que el diseño marca parametrizable; dominio y UI en español, inglés solo en tipos de framework.
4. Trampas de WinUI: un `SelectedIndex` en XAML dispara `SelectionChanged` durante `InitializeComponent` (bandera `_listo` al final del constructor, no un guard por control); un `--` dentro de un comentario XAML o csproj tumba el compilador sin decir dónde; `IsEnabled` no existe en `Panel`.
5. Nombres de clientes o personas: nunca en código, tests ni mensajes de commit.
```

`templates/recordatorios/pruebas-dotnet.md`:

```markdown
---
tools: [Bash, PowerShell]
patrones:
  - '\bdotnet\s+test\b'
  - '\.Tests\b'
  - '\bprobar-[\w-]+\.ps1\b'
nota: >
  Generalizado del setup de trabajo del autor (2026-09-09: media sesión y seis pasadas
  diagnosticando un test por su NOMBRE y por una nota del vault que lo mencionaba, porque
  Select-String se comió el mensaje de error real).
---
VAS A CORRER UNA SUITE .NET. Cómo se lee un rojo:
1. EL MENSAJE, NO LA LÍNEA [FAIL]. Si filtras la salida con Select-String / grep / head, el filtro se come el mensaje de error y te quedas con el nombre del test — que induce a diagnosticar de memoria. Vuelca a archivo o corre sin filtro. UNA PASADA DE LA QUE NO SE LEE EL ERROR NO CUENTA COMO PASADA.
2. Una nota o memoria que nombra un síntoma es una HIPÓTESIS, no un diagnóstico: compárala con el `Actual:` / `Expected:` reales.
3. UN ROJO QUE SE REPITE: comprueba si es PREEXISTENTE antes de tocar nada — `git stash && git checkout main && dotnet test --filter <test>; git checkout - && git stash pop`. Zanja la única pregunta que importa: "¿qué es mío?".
4. NO encadenes pasadas para confirmar: se contaminan entre sí (límites de peticiones, residuos en la BD de pruebas) y cada pasada abortada deja residuo que rompe la siguiente.
5. Si la suite toca una base de datos, averigua ANTES qué borra (limpiadores que llaman a la función real) y si hay algo que perder.
6. `Select-Object -First N` sobre la invocación de un `.ps1` mata el proceso hijo antes de que termine. Captura en variable y filtra después.
```

- [ ] **Step 5: Escribir los cuatro ejemplos de Maestra (texto íntegro de los `.py` de COPY, `activo: false`)**

`templates/recordatorios/ejemplos/maestrasuite/orden-busqueda.md`:

```markdown
---
tools: [Grep, Bash, PowerShell]
siempre: [Grep]
patrones:
  - '\bgrep\b'
  - '\brg '
  - 'ripgrep'
  - '\bfind '
  - 'Select-String'
  - 'findstr'
activo: false
nota: >
  Original: recordar-orden-busqueda.py del workspace de Grupo Maestra. Por que existe: la regla
  ya estaba escrita en .claude/CLAUDE.md y en la memoria, y aun asi derive a grep dos veces el
  mismo dia (2026-08-19). La causa es de tiempos, no de conocimiento: Grep/Bash estan en
  contexto desde el primer token y los MCP llegan como deferred tools que piden un ToolSearch
  antes. Un recordatorio en el arranque llega demasiado pronto para servir; este llega en el
  instante de la decision. NO bloquea. Dispara CADA vez a proposito. Para usarlo: copialo al
  nivel superior de .claude/recordatorios/ y pon activo: true.
---
ORDEN DE HERRAMIENTAS DE CONTEXTO (regla de .claude/CLAUDE.md):
cerebro -> graphify -> codebase-memory -> grep, que es el ULTIMO recurso.

Antes de correr esta busqueda, responde:
1. Es un LITERAL? (string exacto, valor magico como 'devuelto', mensaje de error, SQL)
   -> grep es la herramienta correcta. Sigue.
1b. TRAMPA: sabes EXACTAMENTE que cadena buscas, o estas PROBANDO CANDIDATOS?
   Si estas enumerando nombres posibles ('RequireAuthorization', 'ExigirRol', 'Permiso'...)
   y contando cual aparece, NO es una busqueda literal: es la pregunta '?que mecanismo se
   usa aqui?', que es ESTRUCTURA disfrazada. Va al grafo: trace_path sobre el simbolo
   sospechoso te dice sus llamantes reales y de paso si hay varios mecanismos conviviendo.
   Paso el 2026-09-04: grep 'confirmo' un helper Permiso() que en realidad tenia 2 llamantes
   de 97 rutas, y el grafo destapo que habia TRES mecanismos distintos (clave de API, JWT
   y rol). El campo derivado de esa suposicion habria salido vacio en las 97.
2. Es ESTRUCTURA, o 'quien usa esto', o vas a escribir un helper/mapeo/rotulo nuevo?
   -> te equivocaste de herramienta. Usa search_graph / trace_path / get_code_snippet
      de codebase-memory, o query_graph / get_neighbors de graphify.
      El peldano que mas se salta: preguntar al grafo si el helper YA EXISTE antes de
      escribirlo. Asi se reescribio a mano CuadroGuardadoApi.EstadoTexto (2026-08-19).
3. Si usas grep igual: NUNCA con `head` sin excluir antes Designer.cs, obj/ y bin/.
   El codigo generado llena el corte y tapa la respuesta -- ya paso.

Y recuerda que grep NO ve x:Bind, despacho por interfaz, DI ni override, que es
justo todo lo que usa este stack.
```

`templates/recordatorios/ejemplos/maestrasuite/despliegue.md`:

```markdown
---
tools: [Bash, PowerShell]
patrones:
  - '\bgcloud '
  - '\bgsutil '
  - 'publicar\.ps1'
  - 'sql export'
  - 'sql import'
  - 'authorized-networks'
  - 'run deploy'
activo: false
nota: >
  Original: recordar-despliegue.py del workspace de Grupo Maestra. Por que existe: el
  2026-09-02 desplegue la 1.4.0 sin leer ninguna de las cuatro fuentes que lo documentan.
  Consecuencias reales: (a) pg_dump fallo porque authorizedNetworks esta VACIO a proposito --y
  el procedimiento de la ventana temporal estaba escrito en admin-catalogos.md, que no abri--,
  asi que cree un bucket que nadie pidio; (b) estuve a punto de correr el comando de infra.md
  con --max-instances=1, que habria bajado produccion de 3 a 1. Jairo: "lo que hiciste fue
  improvisar sobre produccion". NO bloquea. Dispara CADA vez a proposito: un despliegue son
  muchos comandos seguidos y el que importa casi nunca es el primero. docker compose NO entra:
  ese es el contenedor local.
---
VAS A TOCAR PRODUCCION. Antes del primer comando, las cuatro fuentes, en orden:

1. cerebro -> Hubs/Despliegue-pendiente.md   <- LA nota: la secuencia, el bloque
   'Antes de ejecutar nada de esto' y 'Trampas del propio despliegue'.
2. CerebroVault/Hubs/Pendientes.md           <- 'Orden de despliegue - no negociable'.
3. MaestraSuite/db/gcp/infra.md              <- Cloud Run, Cloud SQL, secretos, Redeploy.
4. MaestraSuite/db/gcp/admin-catalogos.md    <- COMO se llega a la base y COMO se respalda.
   Es la que mas se salta y la que mas falta hace.

Las cuatro reglas que ya costaron caro:
- RESPALDO PRIMERO, y no cuenta hasta RESTAURARLO. Con esa base scratch se MIDE
  produccion: lo que hay alli no se lee de ninguna nota (leccion aprendida 3 veces).
- Si solo cambio el codigo, desplegar SOLO LA IMAGEN, sin banderas de configuracion.
  El comando completo de infra.md se pudre: llevaba --max-instances=1 con produccion
  en 3, y --set-secrets REEMPLAZA el conjunto entero.
- La base de produccion se alcanza por VENTANA DE RED TEMPORAL, que se abre y se CIERRA
  comprobando que quedo vacia (admin-catalogos.md). authorizedNetworks esta vacio a
  proposito: 'connection refused' NO es un fallo, es el diseno.
- El MSIX se verifica con gsutil, NO por el codigo de salida --el de una tuberia es el
  del ultimo comando-- y su numero tiene que ser MAYOR que todo lo que haya en el bucket.

Y lo que Jairo dejo dicho: NADA de local toca produccion (tiene mas datos), y la
INFRAESTRUCTURA NUEVA la decide el, no yo. Si el procedimiento no cubre el caso, se dice
y se pregunta -- no se inventa. Al terminar, inventariar lo creado y decirlo.
```

`templates/recordatorios/ejemplos/maestrasuite/estandares-maestrasuite.md`:

```markdown
---
tools: [Edit, Write, MultiEdit]
rutas: ["**/MaestraSuite/**/*.cs", "**/MaestraSuite/**/*.xaml"]
activo: false
nota: >
  Original: recordar-estandares-maestrasuite.py del workspace de Grupo Maestra. Recuerda los
  estandares de MaestraSuite justo cuando voy a tocar codigo, no al arranque de la sesion ni en
  CLAUDE.md donde se diluye con el contexto acumulado. Mismo problema de TIEMPOS que los otros:
  la regla se olvida a mitad de una tarea larga de rediseno o arreglo, justo cuando mas
  contexto se ha acumulado. Dispara CADA vez a proposito. Deliberadamente corto porque dispara
  en CADA edicion de codigo. NO cubre convenciones de commit (skill conventional-commits) ni
  trampas de XAML puntuales (validar-xaml.py).
---
ESTANDARES DE MAESTRASUITE (regla de .claude/CLAUDE.md) -- antes de este cambio:

1. Si vas a escribir un helper/mapeo/regla nuevo: pregunta al grafo si YA EXISTE antes
   de escribirlo (graphify query_graph/get_neighbors, o codebase-memory search_graph/
   get_code_snippet). Asi se reescribio a mano CuadroGuardadoApi.EstadoTexto (2026-08-19).
   Si search_graph no encuentra algo recien escrito, REINDEXAR antes de concluir que no
   existe -- codebase-memory no se refresca solo.
2. Si es un arreglo: causa raiz, no sintoma. grep no ve x:Bind, despacho por interfaz, DI
   ni override -- justo lo que usa este stack. Y leer las ASERCIONES de un test que falla,
   no solo su nombre.
3. Estandares de la casa: Nomina.Maestra.Dominio sin UI ni BD. ViewModels con
   CommunityToolkit.Mvvm, bindeo por x:Bind (nunca DataContext). Dominio y UI en espanol,
   ingles solo en tipos de framework. Parametros de negocio versionados -- nunca
   hardcodear una regla que el diseno marca parametrizable.
4. Nombres de clientes/empleados: nunca en codigo, tests ni mensajes de commit.
```

`templates/recordatorios/ejemplos/maestrasuite/rojos-suite-api.md`:

```markdown
---
tools: [Bash, PowerShell]
patrones:
  - 'probar-api\.ps1'
  - 'Maestra\.Api\.Catalogos\.Tests'
activo: false
nota: >
  Original: recordar-rojos-de-la-suite-api.py del workspace de Grupo Maestra. Por que existe:
  el 2026-09-09 perdi media sesion --seis pasadas-- diagnosticando PuertaDeHorariosTest por
  su NOMBRE y por una nota del vault que lo mencionaba, en vez de por su mensaje. La nota decia
  que ese test se pone rojo por el rate limit, y encajaba. Era otra cosa: un 23505 de residuo de
  usuarios, que tumba la clase entera en InitializeAsync. Lo que de verdad fallo no fue la
  hipotesis, fue el metodo: filtre la salida con Select-String y el filtro se comio el mensaje.
  Una nota que nombra un sintoma es una hipotesis, no un diagnostico. NO bloquea.
---
VAS A CORRER LA SUITE DE LA API. Como se lee un rojo aqui:

1. EL MENSAJE, NO LA LINEA [FAIL]. Si filtras la salida con Select-String/grep, el filtro
   se come el 'Mensaje de error' y te quedas con el nombre del test -- que es justo lo que
   induce a diagnosticar de memoria. Volcar a archivo o correr sin filtro.
   UNA PASADA DE LA QUE NO SE LEE EL ERROR NO CUENTA COMO PASADA.

2. PuertaDeHorariosTest tiene DOS causas y se confunden:
   - falla en una ASERCION con 'Actual: TooManyRequests'  -> es el rate limit (ventana 1 min)
   - toda la clase cae en ~1 ms SIN mensaje visible       -> es 23505 en InitializeAsync,
     residuo de usuarios de prueba. NO es el limitador.
   Si los cuatro caen en 1 ms, ni lo mires: es residuo.

3. UN ROJO QUE SE REPITE: comprobar si es PREEXISTENTE antes de tocar nada.
   git stash && git checkout main && correr ese test && volver.
   Es barato y zanja la unica pregunta que importa: 'que es mio?'.

4. NO encadenar pasadas para confirmar: se contaminan entre si, agotan la ventana del
   limitador, y cada pasada abortada deja residuo que rompe la siguiente.

5. La suite BORRA los ensayos de la base de desarrollo (BorrarPruebas llama a la funcion
   real). Medir si hay algo que perder antes de preguntar si se puede correr.

Memorias: suite-api-429-se-disfraza-de-permisos · fixture-que-fija-un-valor-unico ·
leer-las-aserciones-no-los-nombres
```

- [ ] **Step 6: Ejecutar y verificar que pasan**

Run: `node --test "hooks/test/*.test.mjs"`
Expected: `# pass 13`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add templates/recordatorios hooks/test/recordar.test.mjs
git commit -m "feat(recordatorios): plantilla, cinco de fábrica y los cuatro originales de Maestra como ejemplos"
```

---

### Task 7: Instalador y desinstalador

**Files:**
- Modify: `bin/components/rules.sh`
- Modify: `bin/uninstall.sh`

- [ ] **Step 1: Registrar el hook, copiar la lib y los recordatorios en `rules.sh`**

Actualiza el comentario de cabecera: en la lista de hooks añade
`#        PreToolUse/Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read → recordar.mjs (recordatorios justo a tiempo)` y en las variables de escape `CLAUDEMAX_RECORDAR=0`. Cambia "los cuatro hooks" por "los cinco hooks".

En `ac_component_rules`:

```bash
ac_component_rules() {
    ac_step "Reglas operativas + rituales — plantillas, hooks y recordatorios"

    ac_rules_install_templates
    ac_rules_install_hooks
    ac_rules_recordatorios
}
```

En `ac_rules_install_hooks`, tras la línea de `session-start.mjs`:

```bash
    # Recordatorios justo a tiempo: el hook importa recordar-lib.mjs desde su propio directorio,
    # así que la lib viaja con él.
    ac_rules_hook "recordar.mjs" "PreToolUse" "Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read" "CLAUDEMAX_RECORDAR" "5"
    ac_run cp -f "$AC_REPO_DIR/hooks/recordar-lib.mjs" "$CLAUDE_CONFIG_DIR/hooks/recordar-lib.mjs"
```

Añade la función nueva al final del archivo:

```bash
# Copia los recordatorios a <RAG_ROOT>/.claude/recordatorios/: la plantilla siempre (es del
# repo), los de fábrica y los ejemplos solo si faltan — son del usuario desde el primer día.
ac_rules_recordatorios() {
    if [ -z "${RAG_ROOT:-}" ]; then
        ac_warn "RAG_ROOT no está definido — se omiten los recordatorios de fábrica (el hook buscará .claude/recordatorios/ subiendo desde el cwd)."
        return 0
    fi
    local src="$AC_REPO_DIR/templates/recordatorios" dst="$RAG_ROOT/.claude/recordatorios" f rel
    ac_info "Instalando recordatorios en $dst"
    ac_run mkdir -p "$dst/ejemplos/maestrasuite"
    ac_run cp -f "$src/_plantilla.md" "$dst/_plantilla.md"
    for f in "$src"/*.md "$src"/ejemplos/maestrasuite/*.md; do
        rel="${f#"$src"/}"
        case "$rel" in _*) continue ;; esac
        if [ -f "$dst/$rel" ]; then
            ac_dim "  $rel ya existe — se respeta"
        else
            ac_run cp "$f" "$dst/$rel"
        fi
    done
    ac_dim "  (añade uno copiando _plantilla.md; los ejemplos/ no se cargan hasta copiarlos al nivel superior)"
}
```

- [ ] **Step 2: Retirar hook, lib y estado en `uninstall.sh`**

En el bloque `# --- Reglas y rituales`, cambia el `for` a
`for h in git-footer-guard loop-breaker skill-suggest session-start recordar; do` y añade tras el bucle:

```bash
ac_run rm -f "$CLAUDE_CONFIG_DIR/hooks/recordar-lib.mjs"
ac_run rm -f "$CLAUDE_CONFIG_DIR/state/recordar.json"
ac_run rm -f "$CLAUDE_CONFIG_DIR/state/recordar.log"
```

y en el `ac_dim` final: `"  (se conservan: las reglas y los recordatorios de <RAG_ROOT>/.claude/ — puedes haberlos editado)"`. Actualiza el comentario de cabecera del archivo donde diga "los cuatro hooks".

- [ ] **Step 3: Verificar sintaxis y dry-run**

Run: `bash -n bin/components/rules.sh && bash -n bin/uninstall.sh && RAG_ROOT=/tmp/cmx-jit DRY_RUN=1 bash bin/install.sh --only rules --dry-run 2>&1 | grep -E "recordar|recordatorios" | head -12`
Expected: líneas con `ac_merge_hook … PreToolUse … 'Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read' '5'`, `cp … recordar-lib.mjs`, `mkdir -p /tmp/cmx-jit/.claude/recordatorios/ejemplos/maestrasuite`, `cp … _plantilla.md`, y una `cp` por cada uno de los 5 + 4.

Run: `DRY_RUN=1 bash bin/uninstall.sh --dry-run 2>&1 | grep -E "recordar" | head -5`
Expected: `rm -f … hooks/recordar.mjs`, `eliminar entradas … 'recordar.mjs'`, `rm -f … recordar-lib.mjs`, `state/recordar.json`, `state/recordar.log`.

- [ ] **Step 4: Commit**

```bash
git add bin/components/rules.sh bin/uninstall.sh
git commit -m "feat(installer): registra recordar.mjs e instala los recordatorios de fábrica"
```

---

### Task 8: Regla 8, README e INSTALL

**Files:**
- Modify: `templates/rules/CLAUDEMAX.md`
- Modify: `README.md`
- Modify: `INSTALL.md`

- [ ] **Step 1: Regla 8 en `CLAUDEMAX.md`**

Añade al final del archivo:

```markdown

## 8. Recordatorios justo a tiempo

Las reglas que se olvidan a mitad de una tarea larga no se arreglan repitiéndolas aquí: se
convierten en un recordatorio en `<RAG_ROOT>/.claude/recordatorios/<nombre>.md` (frontmatter
`tools`/`patrones`/`rutas` + texto), que el hook `recordar.mjs` inyecta en el instante en que
vas a ejecutar el comando o editar el archivo que lo dispara. Criterio: una regla que se
olvidó dos veces se convierte en recordatorio, con la fecha y el fallo que lo parió en su
`nota:`. Copia `_plantilla.md` para crear uno; no toques `settings.json`. Cuando recibas
uno, aplícalo antes de seguir.
```

- [ ] **Step 2: README — tabla de hooks y párrafo**

Reemplaza la frase `Cuatro hooks Node sin dependencias hacen cumplir las reglas 3, 4 y 5 de forma determinista (y` por `Cinco hooks Node sin dependencias hacen cumplir las reglas 3, 4, 5 y 8 de forma determinista (y`; en la fila de `git-footer-guard.mjs` cambia `el único de los cuatro que bloquea` por `el único de los cinco que bloquea`; añade tras la fila de `session-start.mjs`:

```markdown
| `recordar.mjs` | `PreToolUse` / `Grep\|Bash\|PowerShell\|Edit\|Write\|MultiEdit\|Read` | No, inyecta el recordatorio como contexto | `CLAUDEMAX_RECORDAR=0` |
```

Y antes de `## Rituales`, la subsección:

```markdown
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
`editar-vault` (regla 7 al escribir bajo `V.A.U.L.T/`), `estandares-dotnet` (al editar `.cs`/
`.xaml`) y `pruebas-dotnet` (al correr `dotnet test`). En `ejemplos/maestrasuite/` van los
cuatro originales del setup de trabajo del autor, íntegros e inactivos, como referencia de cómo
se escribe uno nacido de un fallo real. Los recordatorios rotos se anotan en
`~/.claude/state/recordar.log`, nunca se le muestran al modelo.
```

- [ ] **Step 3: INSTALL — árbol**

En el árbol, tras `│   └── session-start.mjs …` (que pasa a `├──`):

```
│   ├── recordar.mjs             # hook PreToolUse: recordatorios justo a tiempo desde .claude/recordatorios/*.md
│   └── recordar-lib.mjs         # funciones puras del anterior (parseo, coincidencia, búsqueda, estado) — probadas en hooks/test/
```

Y bajo `templates/`, antes de `rules/`:

```
    ├── recordatorios/           # semilla de <RAG_ROOT>/.claude/recordatorios/ (se copian solo si faltan)
    │   ├── _plantilla.md        # frontmatter comentado campo a campo
    │   ├── orden-herramientas.md, tocar-produccion.md, editar-vault.md, estandares-dotnet.md, pruebas-dotnet.md
    │   └── ejemplos/maestrasuite/   # los cuatro originales del setup de trabajo, íntegros, activo: false
```

Cambia `rules.sh            # plantillas de reglas → <RAG_ROOT>/.claude/ + 4 hooks de cumplimiento/contexto` por `… + 5 hooks de cumplimiento/contexto + recordatorios`.

- [ ] **Step 4: Verificar y commit**

Run: `grep -n "cuatro hooks\|los cuatro" README.md INSTALL.md bin/components/rules.sh bin/uninstall.sh | head`
Expected: sin resultados (o solo en texto histórico que no describa el estado actual).

```bash
git add templates/rules/CLAUDEMAX.md README.md INSTALL.md
git commit -m "docs: regla 8 y recordatorios justo a tiempo en README e INSTALL"
```

---

### Task 9: Verificación final e instalación real

- [ ] **Step 1: Suite completa del repo**

Run: `node --test "hooks/test/*.test.mjs" && (cd templates/rag && npm test --silent) && node bin/wizard/test-componentes.mjs && node skills/validate-skills.mjs`
Expected: hooks 13 `pass`; rag 40 `pass` (o `skip` de integración sin Postgres); wizard `OK`; skills `OK`.

- [ ] **Step 2: Instalar en esta máquina**

Run: `RAG_ROOT="$HOME/Desktop/WORKSPACE" bash bin/install.sh --only rules 2>&1 | grep -E "recordar|Hook PreToolUse"`
Expected: `Hook PreToolUse/Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read (timeout 5s) registrado → recordar.mjs` y la copia de los recordatorios a `~/Desktop/WORKSPACE/.claude/recordatorios/`.

- [ ] **Step 3: Prueba en vivo del hook instalado (rutas Windows, como las manda Claude Code)**

```bash
W=$(cd "$HOME/Desktop/WORKSPACE" && pwd -W)
echo "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"gcloud run deploy x\"},\"cwd\":\"$W\",\"session_id\":\"prueba\"}" | node "$HOME/.claude/hooks/recordar.mjs" | head -c 300; echo
echo "{\"tool_name\":\"Grep\",\"tool_input\":{\"pattern\":\"foo\"},\"cwd\":\"$W\"}" | node "$HOME/.claude/hooks/recordar.mjs" | head -c 200; echo
echo "{\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"git status\"},\"cwd\":\"$W\"}" | node "$HOME/.claude/hooks/recordar.mjs"; echo "exit=$?"
```

Expected: el primero devuelve JSON con "VAS A TOCAR PRODUCCIÓN"; el segundo con "ORDEN DE HERRAMIENTAS"; el tercero nada y `exit=0`. Comprueba en `~/.claude/settings.json` que hay un solo grupo `PreToolUse` con `recordar.mjs`, matcher `Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read` y `timeout: 5`.

- [ ] **Step 4: Recorrido de la spec**

§1 formato (Task 1, 2); §2 motor (Tasks 3–5); §3 fábrica y ejemplos (Task 6); §4 instalación, regla 8, docs (Tasks 7–8); §5 errores (Tasks 1, 3, 5); §6 pruebas (todas); §7 fuera de alcance (nada tocado).

- [ ] **Step 5: `git status --short`**

Expected: limpio salvo los cambios previos ajenos (`dev-skills.sh`, `install.sh`, `uninstall.sh` — ojo: `uninstall.sh` ahora también lleva cambios de este plan; commítalos con Task 7 y deja los ajenos aparte si son separables con `git add -p`).
