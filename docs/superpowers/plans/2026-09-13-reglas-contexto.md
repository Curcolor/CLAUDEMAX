# Reglas + contexto por proyecto — Plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: superpowers:subagent-driven-development (recomendada) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`).

**Objetivo:** que el contexto de cada proyecto viva en `<RAG_ROOT>/.claude/proyectos/<nombre>.md` (nunca en el repo), se cargue solo por la cadena `CLAUDE.md → CLAUDEMAX.md → proyectos/_indice.md → <nombre>.md`, nazca de un `init-proyecto` que además indexa el código, y que `CLAUDEMAX.md` lleve las tres reglas nuevas (dónde vive el contexto, tres memorias, orden de herramientas).

**Arquitectura:** funciones puras nuevas en `templates/rag/proyectos-lib.mjs` (slug, índice, `.gitignore`, marcadores) e `indices-lib.mjs` (resolver y lanzar codebase-memory y graphify); `ritual.mjs init-proyecto` las orquesta. El motor de recordatorios gana el campo `excluir` para el recordatorio `contexto-fuera-del-repo`. `session-start.mjs` avisa si el repo no tiene contexto. El instalador crea `proyectos/_indice.md`.

**Stack:** Node 22 ESM sin dependencias nuevas, `node:test`, bash (instalador), Markdown.

**Spec:** [2026-09-13-reglas-contexto-design.md](../specs/2026-09-13-reglas-contexto-design.md)

**Lecciones que aplican (memoria del proyecto):** (a) el hook de rtk rompe heredocs bash con `'` o `\\` — escribir código con Write/Edit, nunca con `cat <<EOF`; (b) `spawnSync` + servidor en el mismo proceso = deadlock — usar `execFile`; (c) `node --test` con glob `"test/*.test.mjs"`; (d) `core.autocrlf=true`: las plantillas del repo pueden leerse con CRLF — las regex sobre ellas usan `\r?\n` o se normaliza con `.replace(/\r\n/g, "\n")`; (h) filtrar salidas con `sed -n '/…/p'` en vez de grep para no disparar `orden-herramientas`.

**Rama:** `feat/reglas-contexto` desde `feat/skills-conocimiento`.

---

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `hooks/recordar-lib.mjs` | Modificar | campo `excluir` en `parseRecordatorio` y `coincide` |
| `hooks/test/recordar.test.mjs` | Modificar | pruebas de `excluir` y del recordatorio nuevo |
| `templates/recordatorios/_plantilla.md` | Modificar | documentar `excluir` |
| `templates/recordatorios/contexto-fuera-del-repo.md` | Crear | recordatorio de fábrica |
| `templates/recordatorios/editar-vault.md` | Modificar | "regla 7" → "regla 9" |
| `templates/rag/proyectos-lib.mjs` | Crear | funciones puras del contexto por proyecto |
| `templates/rag/test/proyectos-lib.test.mjs` | Crear | pruebas de la lib y de la plantilla `proyecto.md` |
| `templates/rag/indices-lib.mjs` | Crear | resolver/lanzar codebase-memory y graphify |
| `templates/rag/test/indices-lib.test.mjs` | Crear | pruebas con PATH y `spawn` falsos |
| `templates/rules/proyecto.md` | Reescribir | esqueleto de `proyectos/<nombre>.md` |
| `templates/rag/ritual.mjs` | Modificar | `init-proyecto` v2 |
| `templates/rag/test/ritual.test.mjs` | Crear | extremo a extremo de `init-proyecto` |
| `templates/rules/CLAUDEMAX.md` | Reescribir | reglas v3, termina con `@proyectos/_indice.md` |
| `templates/rag/test/instalacion.test.mjs` | Modificar | prueba de `CLAUDEMAX.md` v3 y de `rules.sh` |
| `hooks/session-start.mjs` | Modificar | aviso "sin contexto de proyecto" |
| `hooks/test/session-start.test.mjs` | Crear | aviso con repo git temporal |
| `bin/components/rules.sh` | Modificar | crea `proyectos/_indice.md` |
| `bin/components/rag.sh` | Modificar | copia las dos libs nuevas |
| `bin/uninstall.sh`, `bin/wizard/wizard.mjs` | Modificar | mensaje de lo que se conserva |
| `skills/rituales/{SKILL.md,skill.yaml,schema.json}` | Modificar | §2 nuevo + guion de relleno |
| `README.md`, `INSTALL.md` | Modificar | reglas v3, contexto por proyecto, init-proyecto |

---

### Task 0: Rama

- [ ] **Step 1: Crear la rama**

```bash
cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX && git checkout -b feat/reglas-contexto
```

Esperado: `Switched to a new branch 'feat/reglas-contexto'`.

---

### Task 1: Motor de recordatorios — campo `excluir`

**Files:**
- Modify: `hooks/recordar-lib.mjs` (`CLAVES_LISTA`, `parseRecordatorio`, `coincide`)
- Modify: `hooks/test/recordar.test.mjs`
- Modify: `templates/recordatorios/_plantilla.md`

- [ ] **Step 1: Pruebas que fallan**

En `hooks/test/recordar.test.mjs`, dentro de `test("parseRecordatorio: valores por defecto", ...)`, añadir tras `assert.deepEqual(r.siempre, []);`:

```js
    assert.deepEqual(r.excluir, []);
    const r2 = parseRecordatorio("---\ntools: [Edit]\nrutas: [\"**/.claude/**\"]\nexcluir:\n  - \"**/.claude/proyectos/**\"\n  - '**/.claude/settings*.json'\n---\nX\n", "e.md");
    assert.deepEqual(r2.excluir, ["**/.claude/proyectos/**", "**/.claude/settings*.json"]);
```

Y un test nuevo justo después de `test("coincide: tabla", ...)`:

```js
test("coincide: excluir gana sobre rutas y sobre siempre; sin file_path no aplica", () => {
    const c = rec({ tools: ["Edit", "Write"], rutas: ["**/.claude/**", "**/CLAUDE.md"], excluir: ["**/.claude/proyectos/**"] });
    assert.equal(coincide(c, "Edit", { file_path: "C:\\ws\\repo\\.claude\\CLAUDE.md" }), true);
    assert.equal(coincide(c, "Edit", { file_path: "C:/ws/repo/CLAUDE.md" }), true);
    assert.equal(coincide(c, "Edit", { file_path: "C:/ws/.claude/proyectos/repo.md" }), false);
    const s = rec({ tools: ["Write"], siempre: ["Write"], excluir: ["**/*.md"] });
    assert.equal(coincide(s, "Write", { file_path: "/x/a.md" }), false);
    assert.equal(coincide(s, "Write", { file_path: "/x/a.cs" }), true);
    assert.equal(coincide(rec({ excluir: ["**"] }), "Bash", { command: "ls" }), true);
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX && node --test "hooks/test/*.test.mjs" 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `not ok` en "valores por defecto" (`r.excluir` es `undefined`) y en "excluir gana…".

- [ ] **Step 3: Implementación**

En `hooks/recordar-lib.mjs`:

```js
const CLAVES_LISTA = new Set(["tools", "patrones", "rutas", "siempre", "excluir"]);
```

En el `return` de `parseRecordatorio`, tras `rutas: …,`:

```js
        excluir: Array.isArray(meta.excluir) ? meta.excluir.filter(Boolean) : [],
```

Actualizar el comentario de cabecera de `parseRecordatorio` para listar `excluir`. Reemplazar `coincide` entera por:

```js
export function coincide(rec, tool, input = {}) {
    if (!rec.ok || !rec.activo) return false;
    if (!rec.tools.includes(tool)) return false;
    const ruta = String(input.file_path ?? "").replace(/\\/g, "/");
    // excluir gana sobre todo lo demás, incluido `siempre` (spec reglas-contexto §6.1)
    if (ruta && (rec.excluir || []).some(g => globARegex(g).test(ruta))) return false;
    if (rec.siempre.includes(tool)) return true;
    if (!rec.patrones.length && !rec.rutas.length) return true;
    const texto = textoDelTool(tool, input);
    if (rec.patrones.some(re => re.test(texto))) return true;
    if (ruta && rec.rutas.some(g => globARegex(g).test(ruta))) return true;
    return false;
}
```

En `templates/recordatorios/_plantilla.md`, tras las dos líneas de `# rutas`:

```
# excluir    opcional. Globs contra file_path que ANULAN el disparo (ganan incluso a `siempre`).
#            Ej.: rutas "**/.claude/**" con excluir "**/.claude/recordatorios/**".
```

Cambiar la línea de coincidencia a:

```
# Coincidencia: tool ∈ tools Y la ruta no casa con `excluir` Y (tool ∈ siempre, O sin patrones
# ni rutas, O algún patrón casa, O alguna ruta casa).
```

Y añadir `excluir: []` tras `rutas: []`.

- [ ] **Step 4: Verificar que pasan**

Run: `node --test "hooks/test/*.test.mjs" 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# pass 14`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/recordar-lib.mjs hooks/test/recordar.test.mjs templates/recordatorios/_plantilla.md
git commit -m "feat(hooks): los recordatorios aceptan excluir para anular rutas"
```

---

### Task 2: Recordatorio `contexto-fuera-del-repo`

**Files:**
- Create: `templates/recordatorios/contexto-fuera-del-repo.md`
- Modify: `templates/recordatorios/editar-vault.md`
- Modify: `hooks/test/recordar.test.mjs` (tests "templates/recordatorios" y "de fábrica")

- [ ] **Step 1: Pruebas que fallan**

En `test("templates/recordatorios: …")`: la lista esperada pasa a
`["_plantilla.md", "contexto-fuera-del-repo.md", "editar-vault.md", "ejemplos", "estandares-dotnet.md", "orden-herramientas.md", "pruebas-dotnet.md", "tocar-produccion.md"]`
y el bucle de fábrica a
`["contexto-fuera-del-repo.md", "editar-vault.md", "estandares-dotnet.md", "orden-herramientas.md", "pruebas-dotnet.md", "tocar-produccion.md"]`.

En `test("de fábrica: disparan con los eventos que deben", …)`, añadir a `casos`:

```js
        [{ tool_name: "Write", tool_input: { file_path: "C:\\w\\MiRepo\\CLAUDE.md" } }, /CONTEXTO FUERA DEL REPO/],
        [{ tool_name: "Edit", tool_input: { file_path: "C:/w/MiRepo/.claude/CLAUDE.md" } }, /CONTEXTO FUERA DEL REPO/],
        [{ tool_name: "Edit", tool_input: { file_path: "C:\\w\\V.A.U.L.T\\Decisiones\\x.md" } }, /NOTA DEL VAULT \(regla 9\)/],
```

Y a la lista de eventos que no disparan nada:

```js
        { tool_name: "Edit", tool_input: { file_path: "C:/w/.claude/proyectos/MiRepo.md" } },
        { tool_name: "Write", tool_input: { file_path: "C:/Users/u/.claude/projects/p/memory/x.md" } },
        { tool_name: "Edit", tool_input: { file_path: "C:/w/MiRepo/.claude/settings.local.json" } },
```

- [ ] **Step 2: Verificar que fallan**

Run: `node --test "hooks/test/*.test.mjs" 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `not ok` en "templates/recordatorios" y "de fábrica".

- [ ] **Step 3: Crear el recordatorio y renumerar editar-vault**

`templates/recordatorios/contexto-fuera-del-repo.md`:

```markdown
---
tools: [Edit, Write, MultiEdit]
rutas: ["**/CLAUDE.md", "**/CLAUDE.local.md", "**/.claude/**"]
excluir:
  - "**/.claude/proyectos/**"
  - "**/.claude/recordatorios/**"
  - "**/.claude/hooks/**"
  - "**/.claude/skills/**"
  - "**/.claude/mcp/**"
  - "**/.claude/projects/**"
  - "**/.claude/plans/**"
  - "**/.claude/state/**"
  - "**/.claude/agents/**"
  - "**/.claude/commands/**"
  - "**/.claude/settings*.json"
  - "**/.claude/CLAUDEMAX.md"
  - "**/.claude/proyecto.md"
nota: >
  Generalizado del setup de trabajo del autor (2026-07-24: un CLAUDE.md con contexto interno
  dentro del repo acabó commiteado y publicado en GitHub). Regla 6 de CLAUDEMAX.md.
  `excluir` deja fuera lo que Claude Code y CLAUDEMAX escriben legítimamente bajo .claude/.
---
CONTEXTO FUERA DEL REPO (regla 6): ¿esta ruta está dentro de un repo git? Entonces PARA — el contexto de Claude no se escribe en el repo (2026-07-24: un CLAUDE.md interno acabó publicado en GitHub).
- Contexto de un proyecto → `<RAG_ROOT>/.claude/proyectos/<proyecto>.md`, en su sección (Estructura, Comandos, Estado, Trampas, Convenciones). Si no existe: `node R.A.G/ritual.mjs init-proyecto <ruta>`.
- Una regla → `templates/rules/CLAUDEMAX.md` del repo de CLAUDEMAX, y reinstalar. Lo largo → el vault (`Codigo/` con `fuentes:`).
- Si es el `.claude/CLAUDE.md` del propio workspace o algo de `~/.claude/`, sigue.
```

En `templates/recordatorios/editar-vault.md`: `la regla 7 vive` → `la regla 9 vive` (nota) y `NOTA DEL VAULT (regla 7)` → `NOTA DEL VAULT (regla 9)` (cuerpo).

- [ ] **Step 4: Verificar que pasan**

Run: `node --test "hooks/test/*.test.mjs" 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# pass 14`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add templates/recordatorios/contexto-fuera-del-repo.md templates/recordatorios/editar-vault.md hooks/test/recordar.test.mjs
git commit -m "feat(recordatorios): contexto-fuera-del-repo avisa al escribir CLAUDE.md o .claude/ en un repo"
```

---

### Task 3: `proyectos-lib.mjs`

**Files:**
- Create: `templates/rag/proyectos-lib.mjs`
- Test: `templates/rag/test/proyectos-lib.test.mjs`

- [ ] **Step 1: Pruebas que fallan**

`templates/rag/test/proyectos-lib.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
    slugProyecto, rutaParaIndice, sustituirMarcadores, marcadoresSinSustituir,
    leerProyecto, generarIndice, CABECERA_INDICE,
    completarGitignore, COMENTARIO_GITIGNORE, esClaudemaxViejo,
} from "../proyectos-lib.mjs";

test("slugProyecto: espacios, tildes, símbolos, extremos y vacío", () => {
    assert.equal(slugProyecto("MiRepo"), "MiRepo");
    assert.equal(slugProyecto("Otro Repo"), "Otro-Repo");
    assert.equal(slugProyecto("Nómina  Maestra (v2)"), "Nomina-Maestra-v2");
    assert.equal(slugProyecto("  --raro--  "), "raro");
    assert.equal(slugProyecto("api.v1_x"), "api.v1_x");
    assert.equal(slugProyecto(""), "proyecto");
});

test("rutaParaIndice: relativa con / dentro del workspace, '.' en la raíz, absoluta fuera", () => {
    const ws = path.resolve("/tmp/ws");
    assert.equal(rutaParaIndice(ws, path.join(ws, "Herramientas", "otro")), "Herramientas/otro");
    assert.equal(rutaParaIndice(ws, ws), ".");
    const fuera = path.resolve("/tmp/fuera/repo");
    assert.equal(rutaParaIndice(ws, fuera), fuera.replace(/\\/g, "/"));
});

test("sustituirMarcadores y marcadoresSinSustituir", () => {
    const t = sustituirMarcadores("{{PROYECTO}} en {{RUTA}} ({{PROYECTO}}) {{OTRO}}", { PROYECTO: "X", RUTA: "a/b" });
    assert.equal(t, "X en a/b (X) {{OTRO}}");
    assert.deepEqual(marcadoresSinSustituir(t), ["{{OTRO}}"]);
    assert.deepEqual(marcadoresSinSustituir("nada"), []);
});

test("leerProyecto: frontmatter con CRLF; sin frontmatter → legible=false con valores por defecto", () => {
    const p = leerProyecto("---\r\nproyecto: Otro Repo\r\nruta: Herramientas/otro\r\ndescripcion: API de catálogos\r\ninicializado: 2026-09-13\r\n---\r\n# x\r\n", "Otro-Repo.md");
    assert.deepEqual(p, { archivo: "Otro-Repo.md", nombre: "Otro Repo", ruta: "Herramientas/otro", descripcion: "API de catálogos", legible: true });
    assert.deepEqual(leerProyecto("# a mano\n", "suelto.md"), { archivo: "suelto.md", nombre: "suelto", ruta: "?", descripcion: "(sin descripción)", legible: false });
});

test("generarIndice: cabecera + una línea por proyecto ordenada por nombre, import relativo al índice", () => {
    const t = generarIndice([
        { archivo: "zeta.md", nombre: "zeta", ruta: "zeta", descripcion: "(sin descripción)" },
        { archivo: "Otro-Repo.md", nombre: "Otro Repo", ruta: "Herramientas/otro", descripcion: "API." },
    ]);
    assert.ok(t.startsWith(CABECERA_INDICE));
    assert.deepEqual(t.slice(CABECERA_INDICE.length).trim().split("\n"), [
        "- **Otro Repo** — `Herramientas/otro` — API. @Otro-Repo.md",
        "- **zeta** — `zeta` — (sin descripción) @zeta.md",
    ]);
    assert.equal(generarIndice([]), CABECERA_INDICE);
});

test("completarGitignore: vacío, sin salto final, idempotente, equivalentes sin ancla cuentan", () => {
    const bloque = `${COMENTARIO_GITIGNORE}\n/CLAUDE.md\n/CLAUDE.local.md\n/.claude/\n`;
    assert.deepEqual(completarGitignore(""), { texto: bloque, nuevas: ["/CLAUDE.md", "/CLAUDE.local.md", "/.claude/"] });
    const b = completarGitignore("node_modules/");
    assert.equal(b.texto, `node_modules/\n\n${bloque}`);
    assert.deepEqual(completarGitignore(b.texto), { texto: b.texto, nuevas: [] });
    const c = completarGitignore("bin/\r\n.claude\r\nCLAUDE.md\r\n");
    assert.deepEqual(c.nuevas, ["/CLAUDE.local.md"]);
    assert.ok(c.texto.endsWith(`\n${COMENTARIO_GITIGNORE}\n/CLAUDE.local.md\n`));
});

test("esClaudemaxViejo: cabecera de init-proyecto v1 con o sin comentario HTML", () => {
    assert.equal(esClaudemaxViejo("# Reglas de CLAUDEMAX — MiRepo\n\nEste proyecto hereda…"), true);
    assert.equal(esClaudemaxViejo("<!--\n nota\n-->\n\n# Reglas de CLAUDEMAX — X\n"), true);
    assert.equal(esClaudemaxViejo("# Mis reglas\n"), false);
    assert.equal(esClaudemaxViejo(""), false);
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX/templates/rag && node --test test/proyectos-lib.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/ERR_MODULE_NOT_FOUND/p'`
Esperado: `ERR_MODULE_NOT_FOUND` (no existe `proyectos-lib.mjs`).

- [ ] **Step 3: Implementación**

`templates/rag/proyectos-lib.mjs`:

```js
// Funciones puras del contexto por proyecto (spec reglas-contexto): nombre de archivo, índice de
// proyectos, bloque del .gitignore del repo y detección del diseño anterior. Sin red ni procesos;
// las importan ritual.mjs y test/proyectos-lib.test.mjs. Se instala junto a rag.mjs en R.A.G/.
import path from "node:path";
import { parseFrontmatter } from "./rag-lib.mjs";

// Nombre de archivo de .claude/proyectos/<slug>.md. Sin espacios porque `@ruta` termina en el
// primer espacio; sin tildes para que el import no dependa de la normalización del disco.
export function slugProyecto(nombre) {
    return String(nombre ?? "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9._-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "") || "proyecto";
}

// Ruta del repo tal como se escribe en el índice y en el frontmatter: relativa a RAG_ROOT con "/",
// "." si es la raíz, o absoluta (con "/") si el repo está fuera del workspace.
export function rutaParaIndice(ragRoot, rutaAbs) {
    const abs = path.resolve(rutaAbs);
    const rel = path.relative(path.resolve(ragRoot), abs);
    if (!rel) return ".";
    if (rel.startsWith("..") || path.isAbsolute(rel)) return abs.replace(/\\/g, "/");
    return rel.replace(/\\/g, "/");
}

export function sustituirMarcadores(texto, valores) {
    let out = String(texto);
    for (const [clave, valor] of Object.entries(valores)) out = out.split(`{{${clave}}}`).join(String(valor));
    return out;
}

export function marcadoresSinSustituir(texto) {
    return [...new Set(String(texto).match(/\{\{[A-Z_]+\}\}/g) || [])];
}

// Entrada del índice a partir del texto de proyectos/<archivo>. legible = tiene `proyecto:`.
export function leerProyecto(texto, archivo) {
    const { meta } = parseFrontmatter(String(texto ?? ""));
    return {
        archivo,
        nombre: meta.proyecto || archivo.replace(/\.md$/i, ""),
        ruta: meta.ruta || "?",
        descripcion: meta.descripcion || "(sin descripción)",
        legible: Boolean(meta.proyecto),
    };
}

export const CABECERA_INDICE = [
    "# Proyectos del workspace",
    "",
    "Un archivo por proyecto en `.claude/proyectos/`. Para añadir uno: `node R.A.G/ritual.mjs init-proyecto <ruta>`.",
    "",
].join("\n");

// Contenido de proyectos/_indice.md. El import va SIN "proyectos/": Claude Code resuelve `@ruta`
// relativa al archivo que la contiene, y el índice ya vive en proyectos/.
export function generarIndice(proyectos) {
    const lineas = [...proyectos]
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map(p => `- **${p.nombre}** — \`${p.ruta}\` — ${p.descripcion} @${p.archivo}`);
    return lineas.length ? `${CABECERA_INDICE}\n${lineas.join("\n")}\n` : CABECERA_INDICE;
}

export const COMENTARIO_GITIGNORE = "# CLAUDEMAX: el contexto de Claude vive en el workspace, no en el repo";
export const LINEAS_GITIGNORE = ["/CLAUDE.md", "/CLAUDE.local.md", "/.claude/"];
const EQUIVALENTES = {
    "/CLAUDE.md": ["CLAUDE.md"],
    "/CLAUDE.local.md": ["CLAUDE.local.md"],
    "/.claude/": [".claude/", ".claude", "/.claude"],
};

// Añade al final del .gitignore las líneas que falten, ancladas a la raíz del repo (sin ancla,
// "CLAUDE.md" ignoraría también archivos legítimos en subcarpetas). Devuelve { texto, nuevas }.
export function completarGitignore(actual) {
    const texto = String(actual ?? "");
    const existentes = new Set(texto.split(/\r?\n/).map(l => l.trim()));
    const nuevas = LINEAS_GITIGNORE.filter(l => !existentes.has(l) && !EQUIVALENTES[l].some(e => existentes.has(e)));
    if (!nuevas.length) return { texto, nuevas };
    const bloque = [...(existentes.has(COMENTARIO_GITIGNORE) ? [] : [COMENTARIO_GITIGNORE]), ...nuevas];
    const sep = texto === "" ? "" : texto.endsWith("\n") ? "\n" : "\n\n";
    return { texto: `${texto}${sep}${bloque.join("\n")}\n`, nuevas };
}

// ¿Es el <repo>/.claude/CLAUDEMAX.md que escribía init-proyecto v1? Su primer título era
// "# Reglas de CLAUDEMAX — <proyecto>".
export function esClaudemaxViejo(texto) {
    const sinComentarios = String(texto ?? "").replace(/<!--[\s\S]*?-->/g, "");
    const primera = sinComentarios.split(/\r?\n/).find(l => l.trim());
    return Boolean(primera && /^# Reglas de CLAUDEMAX —/.test(primera.trim()));
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `node --test test/proyectos-lib.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# pass 7`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX
git add templates/rag/proyectos-lib.mjs templates/rag/test/proyectos-lib.test.mjs
git commit -m "feat(rag): proyectos-lib con slug, índice de proyectos y bloque del gitignore"
```

---

### Task 4: `indices-lib.mjs`

**Files:**
- Create: `templates/rag/indices-lib.mjs`
- Test: `templates/rag/test/indices-lib.test.mjs`

- [ ] **Step 1: Pruebas que fallan**

`templates/rag/test/indices-lib.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
    buscarEnPath, resolverCodebaseMemory, resolverGraphify, indexarCodebaseMemory, extraerGraphify,
} from "../indices-lib.mjs";

const WIN = process.platform === "win32";
const envDe = dir => ({ PATH: dir, Path: dir });
const tmp = prefijo => fs.mkdtempSync(path.join(os.tmpdir(), prefijo));

// Binario falso: .cmd en Windows, script sin extensión en POSIX. Nunca se ejecuta.
function binarioFalso(nombre) {
    const dir = tmp("idx-");
    const bin = path.join(dir, WIN ? `${nombre}.cmd` : nombre);
    fs.writeFileSync(bin, WIN ? "@echo off\r\n" : "#!/bin/sh\n");
    if (!WIN) fs.chmodSync(bin, 0o755);
    return { dir, bin };
}

test("buscarEnPath: en Windows ignora archivos sin extensión", { skip: !WIN }, () => {
    const dir = tmp("idx-");
    fs.writeFileSync(path.join(dir, "graphify"), "");
    assert.equal(buscarEnPath("graphify", envDe(dir)), null);
    fs.writeFileSync(path.join(dir, "graphify.exe"), "");
    assert.equal(buscarEnPath("graphify", envDe(dir)), path.join(dir, "graphify.exe"));
    fs.rmSync(dir, { recursive: true, force: true });
});

test("resolverCodebaseMemory: binario en PATH → node bin.js de npm root -g → null", () => {
    const { dir, bin } = binarioFalso("codebase-memory-mcp");
    assert.deepEqual(resolverCodebaseMemory(envDe(dir), { npmRoot: () => null }), { cmd: bin, args: [], shell: WIN });
    const npm = tmp("npm-");
    fs.mkdirSync(path.join(npm, "codebase-memory-mcp"));
    const js = path.join(npm, "codebase-memory-mcp", "bin.js");
    fs.writeFileSync(js, "");
    // en Windows el .cmd pierde frente a node bin.js (sin shell); en POSIX el binario directo gana
    assert.deepEqual(resolverCodebaseMemory(envDe(dir), { npmRoot: () => npm }),
        WIN ? { cmd: process.execPath, args: [js], shell: false } : { cmd: bin, args: [], shell: false });
    const vacio = tmp("vacio-");
    assert.deepEqual(resolverCodebaseMemory(envDe(vacio), { npmRoot: () => npm }), { cmd: process.execPath, args: [js], shell: false });
    assert.equal(resolverCodebaseMemory(envDe(vacio), { npmRoot: () => null }), null);
    for (const d of [dir, npm, vacio]) fs.rmSync(d, { recursive: true, force: true });
});

test("resolverGraphify: graphify en PATH → python -m graphify → py -3 -m graphify → null", () => {
    const { dir, bin } = binarioFalso("graphify");
    assert.deepEqual(resolverGraphify(envDe(dir), { probarPython: () => { throw new Error("no debe probar python"); } }),
        { cmd: bin, args: [], shell: WIN });
    const pyDir = tmp("py-");
    const ext = WIN ? ".exe" : "";
    const python = path.join(pyDir, `python${ext}`), py = path.join(pyDir, `py${ext}`);
    fs.writeFileSync(python, "");
    fs.writeFileSync(py, "");
    assert.deepEqual(resolverGraphify(envDe(pyDir), { probarPython: (env, cmd) => cmd === python }), { cmd: python, args: ["-m", "graphify"], shell: false });
    assert.deepEqual(resolverGraphify(envDe(pyDir), { probarPython: (env, cmd) => cmd === py }), { cmd: py, args: ["-3", "-m", "graphify"], shell: false });
    assert.equal(resolverGraphify(envDe(pyDir), { probarPython: () => false }), null);
    for (const d of [dir, pyDir]) fs.rmSync(d, { recursive: true, force: true });
});

test("indexarCodebaseMemory y extraerGraphify: argumentos, cwd, shell y códigos; sin binario → aviso", () => {
    const llamadas = [];
    const spawnFalso = codigo => (cmd, args, opts) => { llamadas.push({ cmd, args, opts }); return { status: codigo }; };
    const repo = path.resolve("repo-x");
    assert.deepEqual(indexarCodebaseMemory("repo-x", { resolver: () => ({ cmd: "cbm", args: ["bin.js"], shell: false }), spawn: spawnFalso(0) }),
        { ok: true, codigo: 0, aviso: null });
    assert.equal(llamadas[0].cmd, "cbm");
    assert.deepEqual(llamadas[0].args, ["bin.js", "cli", "index_repository", "--repo-path", repo, "--mode", "moderate"]);
    assert.equal(llamadas[0].opts.cwd, repo);
    assert.equal(llamadas[0].opts.stdio, "inherit");
    const g = extraerGraphify("repo-x", { resolver: () => ({ cmd: "py", args: ["-3", "-m", "graphify"], shell: false }), spawn: spawnFalso(2) });
    assert.equal(g.ok, false);
    assert.equal(g.codigo, 2);
    assert.match(g.aviso, /código 2/);
    assert.deepEqual(llamadas[1].args, ["-3", "-m", "graphify", "extract", repo, "--code-only"]);
    assert.equal(llamadas[1].opts.cwd, repo);
    indexarCodebaseMemory("repo-x", { resolver: () => ({ cmd: "C:/n/cbm.cmd", args: [], shell: true }), spawn: spawnFalso(0) });
    assert.equal(llamadas[2].cmd, `"C:/n/cbm.cmd" "cli" "index_repository" "--repo-path" "${repo}" "--mode" "moderate"`);
    assert.deepEqual(llamadas[2].args, []);
    assert.equal(llamadas[2].opts.shell, true);
    const err = extraerGraphify("repo-x", { resolver: () => ({ cmd: "x", args: [], shell: false }), spawn: () => ({ error: new Error("ENOENT") }) });
    assert.deepEqual([err.ok, err.codigo], [false, null]);
    assert.match(err.aviso, /ENOENT/);
    assert.match(indexarCodebaseMemory("repo-x", { resolver: () => null }).aviso, /install\.sh --only codebase-memory/);
    assert.match(extraerGraphify("repo-x", { resolver: () => null }).aviso, /install\.sh --only graphify/);
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX/templates/rag && node --test test/indices-lib.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/ERR_MODULE_NOT_FOUND/p'`
Esperado: `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementación**

`templates/rag/indices-lib.mjs`:

```js
// Los dos índices de código que viven fuera del RAG: codebase-memory (index_repository) y
// graphify (extract --code-only). Los usa `ritual.mjs init-proyecto` y, en el sub-proyecto 5,
// `fin-ciclo`. Sin dependencias; se instala junto a rag.mjs en R.A.G/.
// buscarEnPath está duplicada de templates/mcp/graphify-auto-lib.mjs a propósito: esa lib vive en
// $CLAUDE_CONFIG_DIR/mcp/ y esta en R.A.G/ — no comparten directorio.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function existeArchivo(p) {
    try { return fs.statSync(p).isFile(); } catch { return false; }
}

// Primer ejecutable `nombre` en el PATH de `env`. En Windows solo .exe/.cmd/.bat: un archivo sin
// extensión (shim de pip o de bash) no se puede lanzar desde Node.
export function buscarEnPath(nombre, env = process.env) {
    const rutaPath = env.PATH || env.Path || "";
    const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat"] : [""];
    for (const dir of rutaPath.split(path.delimiter).filter(Boolean)) {
        for (const ext of exts) {
            const p = path.join(dir, nombre + ext);
            if (existeArchivo(p)) return p;
        }
    }
    return null;
}

const esShim = bin => /\.(cmd|bat)$/i.test(bin);

// `npm root -g`; npm es un .cmd en Windows, así que va por shell. null si npm falta o falla.
export function npmRootGlobal(env = process.env) {
    try {
        const r = spawnSync("npm", ["root", "-g"], { env, shell: true, encoding: "utf8", timeout: 10_000, windowsHide: true });
        const out = String(r.stdout || "").trim();
        return r.status === 0 && out ? out : null;
    } catch { return null; }
}

// { cmd, args, shell } para lanzar codebase-memory-mcp, o null. Un .exe/binario del PATH gana; un
// .cmd pierde frente a `node <npm root -g>/codebase-memory-mcp/bin.js`, que no necesita shell.
export function resolverCodebaseMemory(env = process.env, { npmRoot = npmRootGlobal } = {}) {
    const bin = buscarEnPath("codebase-memory-mcp", env);
    if (bin && !esShim(bin)) return { cmd: bin, args: [], shell: false };
    const root = npmRoot(env);
    const js = root ? path.join(root, "codebase-memory-mcp", "bin.js") : null;
    if (js && existeArchivo(js)) return { cmd: process.execPath, args: [js], shell: false };
    if (bin) return { cmd: bin, args: [], shell: true };
    return null;
}

function pythonConGraphify(env, cmd, prefijo) {
    try {
        const r = spawnSync(cmd, [...prefijo, "-c", "import graphify"], { env, timeout: 10_000, stdio: "ignore", windowsHide: true });
        return r.status === 0;
    } catch { return false; }
}

// { cmd, args, shell } para lanzar el CLI de graphify, o null.
// Orden: graphify en el PATH → python -m graphify → py -3 -m graphify.
export function resolverGraphify(env = process.env, { probarPython = pythonConGraphify } = {}) {
    const bin = buscarEnPath("graphify", env);
    if (bin) return { cmd: bin, args: [], shell: esShim(bin) };
    const python = buscarEnPath("python", env);
    if (python && probarPython(env, python, [])) return { cmd: python, args: ["-m", "graphify"], shell: false };
    const py = buscarEnPath("py", env);
    if (py && probarPython(env, py, ["-3"])) return { cmd: py, args: ["-3", "-m", "graphify"], shell: false };
    return null;
}

// Un .cmd solo se lanza con shell: una línea con cada argumento entre comillas.
function lanzar(spawn, srv, args, opciones) {
    if (srv.shell) {
        const linea = [srv.cmd, ...srv.args, ...args].map(a => `"${a}"`).join(" ");
        return spawn(linea, [], { ...opciones, shell: true });
    }
    return spawn(srv.cmd, [...srv.args, ...args], opciones);
}

function resultado(r, nombre) {
    if (r.error) return { ok: false, codigo: null, aviso: `${nombre}: no se pudo lanzar (${r.error.message})` };
    if (r.status !== 0) return { ok: false, codigo: r.status, aviso: `${nombre}: terminó con código ${r.status} — revisa su salida arriba` };
    return { ok: true, codigo: 0, aviso: null };
}

// Indexa el repo en ~/.cache/codebase-memory-mcp/ (fuera del repo; nunca --persistence).
export function indexarCodebaseMemory(rutaRepo, { env = process.env, resolver = resolverCodebaseMemory, spawn = spawnSync } = {}) {
    const abs = path.resolve(rutaRepo);
    const srv = resolver(env);
    if (!srv) return { ok: false, codigo: null, aviso: "codebase-memory-mcp no está instalado — instálalo con: bash install.sh --only codebase-memory (desde el repo de CLAUDEMAX)" };
    const r = lanzar(spawn, srv, ["cli", "index_repository", "--repo-path", abs, "--mode", "moderate"], { cwd: abs, env, stdio: "inherit", windowsHide: true });
    return resultado(r, "codebase-memory index_repository");
}

// Extrae el grafo en <repo>/graphify-out/ (--code-only: AST local, sin API key de LLM).
export function extraerGraphify(rutaRepo, { env = process.env, resolver = resolverGraphify, spawn = spawnSync } = {}) {
    const abs = path.resolve(rutaRepo);
    const srv = resolver(env);
    if (!srv) return { ok: false, codigo: null, aviso: "graphify no está instalado — instálalo con: bash install.sh --only graphify (desde el repo de CLAUDEMAX)" };
    const r = lanzar(spawn, srv, ["extract", abs, "--code-only"], { cwd: abs, env, stdio: "inherit", windowsHide: true });
    return resultado(r, "graphify extract");
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `node --test test/indices-lib.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\|skipped\)/p;/not ok/p'`
Esperado: `# pass 4`, `# fail 0` (en POSIX: 3 pass, 1 skipped).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX
git add templates/rag/indices-lib.mjs templates/rag/test/indices-lib.test.mjs
git commit -m "feat(rag): indices-lib resuelve y lanza codebase-memory y graphify"
```

---

### Task 5: Plantilla `proyecto.md` v2

**Files:**
- Rewrite: `templates/rules/proyecto.md`
- Modify: `templates/rag/test/proyectos-lib.test.mjs`

- [ ] **Step 1: Prueba que falla**

Añadir a los imports de `test/proyectos-lib.test.mjs`: `import fs from "node:fs";`, `import { fileURLToPath } from "node:url";`, `import { parseFrontmatter } from "../rag-lib.mjs";` y la constante
`const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");`. Test nuevo al final:

```js
test("templates/rules/proyecto.md v2: frontmatter, cinco secciones, marcadores conocidos; ya no resume las reglas", () => {
    const tpl = fs.readFileSync(path.join(REPO, "templates", "rules", "proyecto.md"), "utf8").replace(/\r\n/g, "\n");
    const { meta } = parseFrontmatter(tpl);
    assert.deepEqual(Object.keys(meta).sort(), ["descripcion", "inicializado", "proyecto", "ruta"]);
    for (const s of ["## Estructura", "## Comandos", "## Estado", "## Trampas que ya costaron tiempo", "## Convenciones"]) {
        assert.ok(tpl.includes(`\n${s}\n`), s);
    }
    assert.deepEqual(marcadoresSinSustituir(tpl).sort(), ["{{DESCRIPCION}}", "{{FECHA}}", "{{PROYECTO}}", "{{RUTA_ABS}}", "{{RUTA}}"].sort());
    assert.ok(!/Reglas de CLAUDEMAX|Conventional Commits/.test(tpl), "ya no resume las reglas");
    assert.ok(tpl.split("\n").length < 60, "esqueleto corto");
});
```

- [ ] **Step 2: Verificar que falla**

Run: `cd templates/rag && node --test test/proyectos-lib.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `not ok` en "templates/rules/proyecto.md v2".

- [ ] **Step 3: Reescribir la plantilla**

`templates/rules/proyecto.md` (contenido completo):

```markdown
---
proyecto: {{PROYECTO}}
ruta: {{RUTA}}
descripcion: {{DESCRIPCION}}
inicializado: {{FECHA}}
---
<!--
    Contexto de {{PROYECTO}} para Claude Code. Lo creó `ritual.mjs init-proyecto` desde
    templates/rules/proyecto.md y desde ese momento es TUYO: la reinstalación no lo toca.
    Lo carga toda sesión del workspace vía .claude/CLAUDEMAX.md → proyectos/_indice.md.
    Rellena las secciones consultando el grafo (codebase-memory get_architecture, graphify
    query_graph), nunca de memoria; deja vacía la que no tenga nada real todavía. Tope ~150
    líneas: lo largo va al vault (Codigo/ con fuentes:) y se enlaza desde aquí.
    Claude Code elimina estos comentarios al cargar el archivo: no cuestan contexto.
-->
# {{PROYECTO}}

{{DESCRIPCION}}. Ruta: `{{RUTA}}` (`{{RUTA_ABS}}`). Notas del vault con `proyecto: {{PROYECTO}}`;
hub `Hubs/{{PROYECTO}}.md`. Grafo: `graphify-out/graph.json` del repo (regenerar con
`graphify extract . --code-only`); índice de codebase-memory: `index_repository` sobre `{{RUTA_ABS}}`.

## Estructura
<!-- carpetas de primer nivel y qué vive en cada una; capas/proyectos y quién depende de quién -->

## Comandos
<!-- build, test, run: los exactos, con las banderas que importan -->

## Estado
<!-- qué está desplegado y dónde, con fecha; decisiones vigentes que condicionan el trabajo -->

## Trampas que ya costaron tiempo
<!-- una viñeta por trampa: síntoma, causa, qué hacer; con la fecha en que costó -->

## Convenciones
<!-- idioma del dominio, patrones obligatorios (MVVM, DI…), qué no se commitea -->
```

- [ ] **Step 4: Verificar que pasa**

Run: `node --test test/proyectos-lib.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# pass 8`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX
git add templates/rules/proyecto.md templates/rag/test/proyectos-lib.test.mjs
git commit -m "feat(rules): proyecto.md pasa a ser el esqueleto de .claude/proyectos/<nombre>.md"
```

---

### Task 6: `ritual.mjs init-proyecto` v2

**Files:**
- Modify: `templates/rag/ritual.mjs` (cabecera, imports, `sustituirMarcadores`, `quitarComentarioCabecera`, `localizarPlantillaProyecto`, `cmdInitProyecto`, `imprimirAyuda`, `parseArgs`)
- Test: `templates/rag/test/ritual.test.mjs`

- [ ] **Step 1: Pruebas que fallan**

`templates/rag/test/ritual.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const RAG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(RAG_DIR, "..", "..");

// Workspace temporal con el layout instalado: R.A.G/ (el ritual y sus libs), .claude/proyecto.md,
// V.A.U.L.T/Hubs/_proyecto.md y un repo MiRepo/ con .git/ (basta el directorio).
function workspace() {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "ritual-"));
    fs.mkdirSync(path.join(ws, "R.A.G"));
    for (const f of ["ritual.mjs", "rag-lib.mjs", "proyectos-lib.mjs", "indices-lib.mjs"]) {
        fs.copyFileSync(path.join(RAG_DIR, f), path.join(ws, "R.A.G", f));
    }
    fs.mkdirSync(path.join(ws, ".claude"));
    fs.copyFileSync(path.join(REPO, "templates", "rules", "proyecto.md"), path.join(ws, ".claude", "proyecto.md"));
    fs.mkdirSync(path.join(ws, "V.A.U.L.T", "Hubs"), { recursive: true });
    fs.copyFileSync(path.join(REPO, "templates", "vault", "Hubs", "_proyecto.md"), path.join(ws, "V.A.U.L.T", "Hubs", "_proyecto.md"));
    fs.mkdirSync(path.join(ws, "MiRepo", ".git"), { recursive: true });
    return { ws, limpiar: () => fs.rmSync(ws, { recursive: true, force: true }) };
}

// Ejecuta el ritual copiado. RAG_ROOT se quita del entorno: nunca debe apuntar al workspace real.
function ritual(ws, args, env = {}) {
    return new Promise(resolve => {
        const base = { ...process.env };
        delete base.RAG_ROOT;
        execFile(process.execPath, [path.join(ws, "R.A.G", "ritual.mjs"), ...args],
            { cwd: ws, env: { ...base, ...env }, encoding: "utf8", timeout: 60_000 },
            (err, stdout, stderr) => resolve({ status: err ? (typeof err.code === "number" ? err.code : 1) : 0, out: `${stdout}${stderr}` }));
    });
}

const leer = (...p) => fs.readFileSync(path.join(...p), "utf8");

test("init-proyecto: contexto en .claude/proyectos, índice, hub y .gitignore; nada dentro del repo", async () => {
    const { ws, limpiar } = workspace();
    try {
        const r = await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo"), "--descripcion", "API de catálogos", "--sin-indexar"]);
        assert.equal(r.status, 0, r.out);
        const ctx = leer(ws, ".claude", "proyectos", "MiRepo.md");
        assert.ok(!ctx.includes("{{"), "sin marcadores");
        assert.match(ctx, /^---\r?\nproyecto: MiRepo\r?\nruta: MiRepo\r?\ndescripcion: API de catálogos\r?\ninicializado: \d{4}-\d{2}-\d{2}\r?\n---/);
        assert.match(ctx, /## Estructura/);
        assert.ok(ctx.includes(`(\`${path.join(ws, "MiRepo").replace(/\\/g, "/")}\`)`), "ruta absoluta con /");
        assert.match(leer(ws, ".claude", "proyectos", "_indice.md"), /^- \*\*MiRepo\*\* — `MiRepo` — API de catálogos @MiRepo\.md$/m);
        assert.ok(fs.existsSync(path.join(ws, "V.A.U.L.T", "Hubs", "MiRepo.md")));
        assert.equal(leer(ws, "MiRepo", ".gitignore"),
            "# CLAUDEMAX: el contexto de Claude vive en el workspace, no en el repo\n/CLAUDE.md\n/CLAUDE.local.md\n/.claude/\n");
        assert.ok(!fs.existsSync(path.join(ws, "MiRepo", ".claude")), "nada de .claude/ dentro del repo");
        assert.match(r.out, /--sin-indexar/);
    } finally { limpiar(); }
});

test("init-proyecto: segundo proyecto con espacios, índice con dos, idempotente y respeta lo editado", async () => {
    const { ws, limpiar } = workspace();
    try {
        await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo"), "--sin-indexar"]);
        const ctxPath = path.join(ws, ".claude", "proyectos", "MiRepo.md");
        fs.appendFileSync(ctxPath, "\nEDITADO A MANO\n");
        const giAntes = leer(ws, "MiRepo", ".gitignore");
        fs.mkdirSync(path.join(ws, "Herramientas", "Otro Repo"), { recursive: true });
        const r = await ritual(ws, ["init-proyecto", path.join(ws, "Herramientas", "Otro Repo"), "--descripcion", "x", "--sin-indexar"]);
        assert.equal(r.status, 0, r.out);
        const r2 = await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo"), "--sin-indexar"]);
        assert.match(r2.out, /ya existe — se respeta/);
        assert.match(leer(ctxPath), /EDITADO A MANO/);
        assert.equal(leer(ws, "MiRepo", ".gitignore"), giAntes, "gitignore idempotente");
        const indice = leer(ws, ".claude", "proyectos", "_indice.md");
        assert.match(indice, /^- \*\*MiRepo\*\* — `MiRepo` — \(sin descripción\) @MiRepo\.md$/m);
        assert.match(indice, /^- \*\*Otro Repo\*\* — `Herramientas\/Otro Repo` — x @Otro-Repo\.md$/m);
        assert.ok(!fs.existsSync(path.join(ws, "Herramientas", "Otro Repo", ".gitignore")), "sin .git no se crea .gitignore");
        assert.ok(fs.existsSync(path.join(ws, "V.A.U.L.T", "Hubs", "Otro Repo.md")));
    } finally { limpiar(); }
});

test("init-proyecto: --sin-gitignore, aviso del diseño anterior, slug en uso por otro proyecto y ruta ausente", async () => {
    const { ws, limpiar } = workspace();
    try {
        const viejo = path.join(ws, "MiRepo", ".claude", "CLAUDEMAX.md");
        fs.mkdirSync(path.dirname(viejo), { recursive: true });
        fs.writeFileSync(viejo, "# Reglas de CLAUDEMAX — MiRepo\n\nEste proyecto hereda…\n");
        const r = await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo"), "--sin-gitignore", "--sin-indexar"]);
        assert.equal(r.status, 0, r.out);
        assert.ok(!fs.existsSync(path.join(ws, "MiRepo", ".gitignore")));
        assert.match(r.out, /diseño anterior/);
        assert.ok(fs.existsSync(viejo), "no borra nada");
        fs.mkdirSync(path.join(ws, "Mi Repo"));
        await ritual(ws, ["init-proyecto", path.join(ws, "Mi Repo"), "--sin-indexar"]);
        fs.mkdirSync(path.join(ws, "otro"));
        const r2 = await ritual(ws, ["init-proyecto", path.join(ws, "otro"), "--proyecto", "Mi-Repo", "--sin-indexar"]);
        assert.match(r2.out, /es de "Mi Repo"/);
        assert.match(leer(ws, ".claude", "proyectos", "Mi-Repo.md"), /^---\r?\nproyecto: Mi Repo\r?\n/);
        assert.equal((await ritual(ws, ["init-proyecto"])).status, 1);
    } finally { limpiar(); }
});

test("init-proyecto sin --sin-indexar y sin binarios: avisa cómo instalar ambos y sale 0", async () => {
    const { ws, limpiar } = workspace();
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), "sin-path-"));
    try {
        const r = await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo")], { PATH: vacio, Path: vacio });
        assert.equal(r.status, 0, r.out);
        assert.match(r.out, /install\.sh --only codebase-memory/);
        assert.match(r.out, /install\.sh --only graphify/);
    } finally {
        limpiar();
        fs.rmSync(vacio, { recursive: true, force: true });
    }
});
```

- [ ] **Step 2: Verificar que fallan**

Run: `cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX/templates/rag && node --test test/ritual.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# fail 4` (el v1 escribe `<repo>/.claude/CLAUDEMAX.md`, no `proyectos/`).

- [ ] **Step 3: Implementación**

En `templates/rag/ritual.mjs`:

1. Cabecera de uso: la línea de `init-proyecto` pasa a
   `//   node ritual.mjs init-proyecto <ruta> [--proyecto n] [--descripcion t] [--sin-indexar] [--sin-gitignore] [--vault r]`.
2. Imports, tras `import { spawnSync } from "node:child_process";`:

```js
import { resolverRagRoot } from "./rag-lib.mjs";
import * as proy from "./proyectos-lib.mjs";
import { indexarCodebaseMemory, extraerGraphify } from "./indices-lib.mjs";
```

3. Borrar las funciones locales `sustituirMarcadores` y `quitarComentarioCabecera` (con sus comentarios). En el bloque del hub dentro de `cmdInitProyecto`, `sustituirMarcadores(` pasa a `proy.sustituirMarcadores(`.
4. Reemplazar `localizarPlantillaProyecto` por:

```js
// Plantilla de .claude/proyectos/<nombre>.md en los dos layouts posibles:
//   - instalado:  <RAG_ROOT>/.claude/proyecto.md   (rules.sh copia templates/rules/ ahí)
//   - repo (dev): templates/rules/proyecto.md      (hermano de templates/rag/, este archivo)
function localizarPlantillaProyecto(ragRoot) {
    const candidatos = [
        path.join(ragRoot, ".claude", "proyecto.md"),
        path.join(HERE, "..", "rules", "proyecto.md"),
    ];
    return candidatos.find(c => fs.existsSync(c)) || null;
}

// proyectos/_indice.md se regenera entero desde el frontmatter de cada proyectos/*.md.
function regenerarIndice(proyectosDir) {
    const entradas = [];
    for (const f of fs.readdirSync(proyectosDir).filter(f => f.endsWith(".md") && !f.startsWith("_")).sort()) {
        const p = proy.leerProyecto(fs.readFileSync(path.join(proyectosDir, f), "utf8"), f);
        if (!p.legible) console.warn(`ritual: aviso — ${f} no tiene frontmatter con \`proyecto:\`; entra en el índice con valores por defecto.`);
        entradas.push(p);
    }
    const indice = path.join(proyectosDir, "_indice.md");
    fs.writeFileSync(indice, proy.generarIndice(entradas), "utf8");
    console.log(`ritual: regenerado ${indice} (${entradas.length} proyecto${entradas.length === 1 ? "" : "s"}).`);
}
```

5. Reemplazar `cmdInitProyecto` entera por:

```js
function cmdInitProyecto(rutaArg, opts) {
    if (!rutaArg) {
        console.error("ritual: falta <ruta> — uso: ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar] [--sin-gitignore] [--vault ruta]");
        process.exitCode = 1;
        return;
    }
    const ruta = path.resolve(rutaArg);
    fs.mkdirSync(ruta, { recursive: true });
    const proyecto = String(opts.proyecto || path.basename(ruta)).trim();
    const descripcion = String(opts.descripcion || "(sin descripción)").replace(/\s+/g, " ").trim();
    const ragRoot = resolverRagRoot(HERE);
    const vaultDir = resolveVault(opts.vault);
    const fecha = hoyISO();
    const slug = proy.slugProyecto(proyecto);
    const proyectosDir = path.join(ragRoot, ".claude", "proyectos");
    fs.mkdirSync(proyectosDir, { recursive: true });

    // 1. .claude/proyectos/<slug>.md — el contexto del proyecto, fuera del repo (regla 6).
    const contextoPath = path.join(proyectosDir, `${slug}.md`);
    if (fs.existsSync(contextoPath)) {
        const previo = proy.leerProyecto(fs.readFileSync(contextoPath, "utf8"), `${slug}.md`);
        if (previo.legible && previo.nombre !== proyecto) {
            console.warn(`ritual: aviso — ${contextoPath} ya existe y es de "${previo.nombre}": el nombre "${proyecto}" da el mismo archivo. Se respeta; usa --proyecto con otro nombre.`);
        } else {
            console.log(`ritual: ${contextoPath} ya existe — se respeta, no se sobrescribe.`);
        }
    } else {
        const plantillaPath = localizarPlantillaProyecto(ragRoot);
        if (!plantillaPath) {
            console.warn("ritual: aviso — no se encontró la plantilla proyecto.md (ni en <RAG_ROOT>/.claude/ ni en templates/rules/); se omite el contexto del proyecto y se continúa.");
        } else {
            const contenido = proy.sustituirMarcadores(fs.readFileSync(plantillaPath, "utf8"), {
                PROYECTO: proyecto,
                RUTA: proy.rutaParaIndice(ragRoot, ruta),
                RUTA_ABS: ruta.replace(/\\/g, "/"),
                DESCRIPCION: descripcion,
                FECHA: fecha,
            });
            const sueltos = proy.marcadoresSinSustituir(contenido);
            if (sueltos.length) console.warn(`ritual: aviso — la plantilla tiene marcadores desconocidos sin sustituir: ${sueltos.join(", ")}`);
            fs.writeFileSync(contextoPath, contenido, "utf8");
            console.log(`ritual: creado ${contextoPath}`);
        }
    }

    // 2. proyectos/_indice.md, que CLAUDEMAX.md importa.
    regenerarIndice(proyectosDir);

    // 3. Hub del proyecto en Hubs/<Proyecto>.md desde Hubs/_proyecto.md (plantilla del vault).
    const hubsDir = path.join(vaultDir, "Hubs");
    fs.mkdirSync(hubsDir, { recursive: true });
    const hubPath = path.join(hubsDir, `${proyecto}.md`);
    if (fs.existsSync(hubPath)) {
        console.log(`ritual: ${hubPath} ya existe — se respeta, no se sobrescribe.`);
    } else {
        const plantillaHub = path.join(hubsDir, "_proyecto.md");
        let contenido;
        if (fs.existsSync(plantillaHub)) {
            contenido = proy.sustituirMarcadores(fs.readFileSync(plantillaHub, "utf8"), {
                PROYECTO: proyecto, FECHA: fecha, DESCRIPCION: descripcion, RUTA: ruta,
            });
        } else {
            contenido = [
                "---", "tags: [hub]", `titulo: ${proyecto}`, `actualizado: ${fecha}`, "---", "",
                `# ${proyecto}`, "", descripcion, "", `Ruta: \`${ruta}\`. Inicializado el ${fecha}.`, "",
                "## Notas del proyecto", "-", "", "Relacionado: [[Bienvenida]]", "",
            ].join("\n");
        }
        fs.writeFileSync(hubPath, contenido, "utf8");
        console.log(`ritual: creado el hub ${hubPath} — enlázalo desde Hubs/Bienvenida.md (sección Negocio).`);
    }

    // 4. .gitignore del repo: CLAUDE.md, CLAUDE.local.md y .claude/ anclados a la raíz.
    if (opts["sin-gitignore"]) {
        console.log("ritual: --sin-gitignore — no se toca el .gitignore del repo.");
    } else if (!fs.existsSync(path.join(ruta, ".git"))) {
        console.log(`ritual: ${ruta} no es un repo git — no se toca ningún .gitignore.`);
    } else {
        const gi = path.join(ruta, ".gitignore");
        const { texto, nuevas } = proy.completarGitignore(fs.existsSync(gi) ? fs.readFileSync(gi, "utf8") : "");
        if (nuevas.length) {
            fs.writeFileSync(gi, texto, "utf8");
            console.log(`ritual: .gitignore del repo — añadidas ${nuevas.join(", ")} (el contexto de Claude vive en el workspace).`);
        } else {
            console.log("ritual: el .gitignore del repo ya ignora CLAUDE.md, CLAUDE.local.md y .claude/.");
        }
    }

    // 5. Diseño anterior: <repo>/.claude/CLAUDEMAX.md de init-proyecto v1. Se avisa, no se borra.
    const viejo = path.join(ruta, ".claude", "CLAUDEMAX.md");
    if (fs.existsSync(viejo) && proy.esClaudemaxViejo(fs.readFileSync(viejo, "utf8"))) {
        console.warn(`ritual: aviso — diseño anterior: ${viejo} es del init-proyecto v1. El contexto va ahora en ${contextoPath}; copia lo que valga y borra ${viejo} (y ${path.join(ruta, ".claude", "CLAUDE.md")} si solo contiene @CLAUDEMAX.md).`);
    }

    // 6. Índices de código: codebase-memory y graphify, con su salida en vivo.
    if (opts["sin-indexar"]) {
        console.log("ritual: --sin-indexar — no se indexa con codebase-memory ni se extrae el grafo de graphify.");
    } else {
        console.log(`ritual: indexando ${ruta} con codebase-memory (index_repository, modo moderate)...`);
        const cbm = indexarCodebaseMemory(ruta);
        console.log(cbm.ok ? "ritual: índice de codebase-memory listo." : `ritual: aviso — ${cbm.aviso}`);
        console.log(`ritual: extrayendo el grafo de graphify en ${path.join(ruta, "graphify-out")} (--code-only)...`);
        const gfy = extraerGraphify(ruta);
        console.log(gfy.ok ? "ritual: grafo de graphify listo." : `ritual: aviso — ${gfy.aviso}`);
    }

    console.log(`ritual: init-proyecto completo para "${proyecto}". Abre una sesión en ${ruta} y rellena las secciones de .claude/proyectos/${slug}.md consultando el grafo (skill rituales, §2).`);
}
```

6. En `imprimirAyuda`, la línea de `init-proyecto` pasa a
   `  ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar] [--sin-gitignore] [--vault ruta]`.
7. En `parseArgs`, tras la línea de `--si`:

```js
        if (a === "--sin-indexar" || a === "--sin-gitignore") { opts[a.slice(2)] = true; continue; }
```

- [ ] **Step 4: Verificar que pasan**

Run: `node --test test/ritual.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Suite completa del RAG**

Run: `npm test 2>&1 | sed -n '/^# \(tests\|pass\|fail\|skipped\)/p'`
Esperado: `# fail 0` (40 previas + 7 + 4 + 1 + 4 nuevas; las de BD se saltan si `claudemax-ragdb` está apagado).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX
git add templates/rag/ritual.mjs templates/rag/test/ritual.test.mjs
git commit -m "feat(rituales): init-proyecto escribe el contexto en .claude/proyectos e indexa el código"
```

---

### Task 7: `CLAUDEMAX.md` v3

**Files:**
- Rewrite: `templates/rules/CLAUDEMAX.md`
- Modify: `templates/rag/test/instalacion.test.mjs`

- [ ] **Step 1: Prueba que falla**

Añadir a `templates/rag/test/instalacion.test.mjs`:

```js
test("templates/rules/CLAUDEMAX.md v3: diez reglas, termina importando el índice, ≤ 200 líneas, sin prohibir Context7", () => {
    const t = fs.readFileSync(path.join(REPO, "templates", "rules", "CLAUDEMAX.md"), "utf8").replace(/\r\n/g, "\n");
    assert.deepEqual([...t.matchAll(/^## (\d+)\. /gm)].map(m => Number(m[1])), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const s of ["## 6. Dónde vive el contexto", "## 7. Tres memorias con rol", "## 8. Orden de herramientas de contexto",
        "## 9. Taxonomía y vigencia del vault", "## 10. Recordatorios justo a tiempo"]) {
        assert.ok(t.includes(s), s);
    }
    assert.equal(t.trimEnd().split("\n").at(-1), "@proyectos/_indice.md");
    assert.ok(t.split("\n").length <= 200, `${t.split("\n").length} líneas`);
    assert.ok(!/No reinstales ni sugieras Context7/.test(t), "la prohibición de Context7 se retiró");
    assert.match(t, /2026-09-13-reglas-contexto-design\.md/);
    // ningún @ fuera de backticks salvo el import final (Claude Code lo tomaría como import)
    const sinCodigo = t.replace(/`[^`\n]*`/g, "").replace(/<!--[\s\S]*?-->/g, "");
    assert.deepEqual(sinCodigo.match(/(^|\s)@\S+/gm).map(s => s.trim()), ["@proyectos/_indice.md"]);
});
```

- [ ] **Step 2: Verificar que falla**

Run: `cd templates/rag && node --test test/instalacion.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `not ok` en "CLAUDEMAX.md v3".

- [ ] **Step 3: Reescribir `templates/rules/CLAUDEMAX.md`**

Contenido completo (reglas 1–5 idénticas a las actuales; 9 = antigua 7; 10 = antigua 8):

````markdown
<!--
    Este archivo lo instala CLAUDEMAX (componente `rules`, ver bin/components/rules.sh).
    Fuente de verdad: templates/rules/CLAUDEMAX.md del repo y el spec
    docs/superpowers/specs/2026-09-13-reglas-contexto-design.md. No lo edites a mano en
    `<RAG_ROOT>/.claude/CLAUDEMAX.md` — se pisa en cada reinstalación. El contexto de cada
    proyecto NO va aquí: va en `.claude/proyectos/<nombre>.md` (regla 6), que es tuyo.
-->

# Reglas operativas de CLAUDEMAX

Estas reglas aplican a cualquier sesión de Claude Code lanzada dentro de este workspace, en la
raíz o en cualquiera de sus repos. Son imperativas: cúmplelas salvo que el usuario te pida
explícitamente lo contrario en la conversación.

## 1. Idioma

(texto actual de la regla 1, sin cambios)

## 2. Política de modelos

(texto actual de la regla 2, sin cambios)

## 3. Cortacircuitos de 3 intentos

(texto actual de la regla 3, sin cambios)

## 4. Commits

(texto actual de la regla 4, sin cambios)

## 5. Ahorro de tokens / búsqueda de skills

(texto actual de la regla 5, sin cambios)

## 6. Dónde vive el contexto (regla dura)

Todo el contexto de Claude vive **en el workspace**, nunca en un repo: las reglas en este archivo,
el contexto de cada proyecto en `.claude/proyectos/<nombre>.md` (se carga solo, al final de este
archivo), los recordatorios en `.claude/recordatorios/` y la narrativa en el vault. **Ningún repo
lleva `CLAUDE.md`, `CLAUDE.local.md` ni `.claude/`**: el 2026-07-24 un `CLAUDE.md` con contexto
interno acabó commiteado y publicado en GitHub. `init-proyecto` los deja ignorados en el
`.gitignore` de cada repo.

- Aprendes algo del proyecto que la próxima sesión necesita → edita su `proyectos/<nombre>.md`
  en la sección que toque (Estructura, Comandos, Estado, Trampas que ya costaron tiempo,
  Convenciones).
- Si ese archivo pasa de ~150 líneas, lo largo va al vault (`Codigo/` con `fuentes:`) y se enlaza
  desde el archivo: todos los `proyectos/*.md` se cargan en cada sesión y cuestan contexto.
- Repo sin archivo (el hook de arranque lo avisa) → `node R.A.G/ritual.mjs init-proyecto <ruta>`,
  y luego rellena Estructura y Comandos consultando el grafo; deja vacío lo que no sepas.
- Refuerzo: el recordatorio `contexto-fuera-del-repo` salta si vas a escribir un `CLAUDE.md` o
  un `.claude/` dentro de un repo.

## 7. Tres memorias con rol

Hay tres memorias y cada una guarda una cosa distinta; usar la equivocada es la forma más común
de perder contexto.

| Memoria | Qué guarda | Ejemplo |
|---|---|---|
| Nativa de Claude Code (`~/.claude/projects/<p>/memory/`) | gotchas cortos, correcciones y preferencias: "no hagas X porque Y", ≤ 3 líneas | "el hook de rtk rompe heredocs con comillas: usa Write" |
| Vault + RAG (`V.A.U.L.T/`, MCP `rag`) | narrativa: decisiones con alternativas descartadas, specs, sesiones, aprendizajes largos | por qué se eligió pgvector y no otra base vectorial |
| Grafo de código (MCP `graphify` y `codebase-memory`) | estructura: qué llama a qué, qué hereda de qué | quién llama al servicio que vas a cambiar |

**Lo generado se queda en su herramienta; lo narrado va al vault.** Nunca vuelques el grafo, un
listado de archivos ni un esquema de base de datos al vault: el setup de trabajo del autor metió
257 notas de nodos y aristas —más de la mitad del vault— y ahogaron las búsquedas. Context7 está
permitido para documentación de librerías externas: no es memoria del proyecto y no compite con
ninguna de las tres.

## 8. Orden de herramientas de contexto

Antes de asumir nada sobre el código o su historia: `rag_query` (qué se decidió y por qué) →
`graphify` (el mapa: qué existe y quién llama a quién) → `codebase-memory` (el detalle:
`search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`) → grep, **el último
recurso**.

- **Literal** (string exacto, valor mágico, mensaje de error, SQL) → grep es correcto.
- **Estructura**, "quién usa esto", "¿ya existe un helper así?" → el grafo. grep no ve despacho
  por interfaz, inyección de dependencias, `override` ni bindings declarativos. Si enumeras
  candidatos y cuentas cuál aparece, es una pregunta de estructura disfrazada de literal.
- **Deriva doc↔código**: el RAG trae el requerimiento exacto; el grafo confirma con
  `get_neighbors` que algo real lo usa. Que una clase exista no significa que esté en uso.
- **La prosa se pudre, el grafo no**: toda descripción de arquitectura escrita a mano —incluida
  la de `proyectos/<nombre>.md`— se verifica contra el grafo antes de confiar en ella.
- **`codebase-memory` no se refresca solo**: `ready` significa que hay índice, no que esté al
  día. Si `search_graph` no encuentra algo recién escrito, reindexa (`index_repository`) antes de
  concluir que no existe. Nunca con `--persistence`: escribe el grafo dentro del repo.
- Refuerzo: el recordatorio `orden-herramientas` salta en cada Grep y en cada buscador por Bash.

## 9. Taxonomía y vigencia del vault

(texto actual de la regla 7, sin cambios)

## 10. Recordatorios justo a tiempo

(texto actual de la regla 8, sin cambios)

---

Contexto de los proyectos del workspace (regla 6), un archivo por proyecto:

@proyectos/_indice.md
````

Al ejecutar: los párrafos "(texto actual de la regla N, sin cambios)" se sustituyen copiando literalmente el cuerpo de esa regla del archivo actual (se lee antes de sobrescribir).

- [ ] **Step 4: Verificar que pasa**

Run: `node --test test/instalacion.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX
git add templates/rules/CLAUDEMAX.md templates/rag/test/instalacion.test.mjs
git commit -m "feat(rules): CLAUDEMAX.md v3 — contexto fuera del repo, tres memorias y orden de herramientas"
```

---

### Task 8: `session-start.mjs` avisa si el repo no tiene contexto

**Files:**
- Modify: `hooks/session-start.mjs` (`detectProjectRoot`, funciones nuevas, `main`)
- Test: `hooks/test/session-start.test.mjs`

- [ ] **Step 1: Prueba que falla**

`hooks/test/session-start.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, spawnSync } from "node:child_process";

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "session-start.mjs");
const hayGit = spawnSync("git", ["--version"]).status === 0;

function correr(cwd) {
    return new Promise(resolve => {
        const env = { ...process.env };
        delete env.CLAUDEMAX_RAG_DIR;
        delete env.CLAUDEMAX_SESSION_CONTEXT;
        const child = execFile(process.execPath, [HOOK], { env, timeout: 20_000 },
            (err, stdout) => resolve({ status: err ? (err.code ?? 1) : 0, stdout }));
        child.stdin.end(JSON.stringify({ hook_event_name: "SessionStart", source: "startup", cwd }));
    });
}

test("session-start: avisa si el repo no tiene contexto en .claude/proyectos/; calla si lo tiene por nombre o por ruta, o si no hay workspace",
    { skip: !hayGit && "sin git" }, async () => {
        const ws = fs.mkdtempSync(path.join(os.tmpdir(), "ss-"));
        try {
            const repo = path.join(ws, "MiRepo");
            fs.mkdirSync(repo);
            assert.equal(spawnSync("git", ["init", "-q"], { cwd: repo }).status, 0);
            assert.equal((await correr(repo)).stdout, "", "sin .claude/proyectos/ arriba no dice nada");
            const proyectos = path.join(ws, ".claude", "proyectos");
            fs.mkdirSync(proyectos, { recursive: true });
            const r = await correr(repo);
            assert.equal(r.status, 0);
            assert.match(r.stdout, /Sin contexto de proyecto para "MiRepo"/);
            assert.match(r.stdout, /ritual\.mjs init-proyecto/);
            fs.writeFileSync(path.join(proyectos, "api.md"), "---\nproyecto: api\nruta: MiRepo\n---\n");
            assert.equal((await correr(repo)).stdout, "", "por ruta");
            fs.rmSync(path.join(proyectos, "api.md"));
            fs.writeFileSync(path.join(proyectos, "MiRepo.md"), "---\nproyecto: MiRepo\nruta: otra/cosa\n---\n");
            assert.equal((await correr(repo)).stdout, "", "por nombre");
        } finally {
            fs.rmSync(ws, { recursive: true, force: true });
        }
    });
```

- [ ] **Step 2: Verificar que falla**

Run: `cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX && node --test hooks/test/session-start.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `not ok` (no hay aviso).

- [ ] **Step 3: Implementación**

En `hooks/session-start.mjs`, reemplazar `detectProjectRoot`:

```js
async function detectProjectRoot(cwd) {
    const top = await run("git", ["rev-parse", "--show-toplevel"], { cwd, timeout: 1500 });
    if (top) return { root: path.resolve(top), esRepo: true };
    return { root: cwd, esRepo: false };
}
```

Añadir, tras `detectProjectRoot`:

```js
// --- Aviso de contexto de proyecto (spec reglas-contexto §6.2) -----------------------------
// El contexto de cada repo vive en <RAG_ROOT>/.claude/proyectos/<slug>.md. Si el workspace existe
// y ningún archivo describe este repo, se sugiere init-proyecto. Mismo slug que
// templates/rag/proyectos-lib.mjs (duplicado: el hook no importa de R.A.G/).

function slugProyecto(nombre) {
    return String(nombre ?? "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9._-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "") || "proyecto";
}

// Primer ancestro del repo (sin contar el repo) con .claude/proyectos/, hasta 4 niveles.
function findWorkspaceProyectos(projectRoot) {
    let dir = path.dirname(path.resolve(projectRoot));
    for (let level = 1; level <= 4; level++) {
        const candidato = path.join(dir, ".claude", "proyectos");
        try { if (fs.statSync(candidato).isDirectory()) return { root: dir, proyectosDir: candidato }; } catch {}
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

// ¿Algún proyectos/*.md describe este repo? Por nombre de archivo o por su `ruta:` (relativa al
// workspace o absoluta), que cubre `init-proyecto --proyecto otro-nombre`.
function tieneContextoDeProyecto(ws, projectRoot, projectName) {
    if (fs.existsSync(path.join(ws.proyectosDir, `${slugProyecto(projectName)}.md`))) return true;
    const rel = path.relative(ws.root, projectRoot).replace(/\\/g, "/") || ".";
    const abs = path.resolve(projectRoot).replace(/\\/g, "/").toLowerCase();
    let archivos = [];
    try { archivos = fs.readdirSync(ws.proyectosDir).filter(f => f.endsWith(".md") && !f.startsWith("_")); } catch { return false; }
    for (const f of archivos) {
        try {
            const m = fs.readFileSync(path.join(ws.proyectosDir, f), "utf8").match(/^ruta:\s*(.+?)\s*$/m);
            const ruta = m ? m[1].replace(/^["']|["']$/g, "") : "";
            if (ruta && (ruta === rel || ruta.toLowerCase() === abs)) return true;
        } catch {}
    }
    return false;
}

function avisoContextoProyecto(projectRoot, projectName) {
    const ws = findWorkspaceProyectos(projectRoot);
    if (!ws || tieneContextoDeProyecto(ws, projectRoot, projectName)) return null;
    const ritual = path.join(ws.root, "R.A.G", "ritual.mjs");
    return `Sin contexto de proyecto para "${projectName}": corre \`node "${ritual}" init-proyecto "${projectRoot}"\` — lo escribe en ${path.join(ws.root, ".claude", "proyectos")}, fuera del repo (regla 6).`;
}
```

En `main`, reemplazar la detección y añadir el aviso como primer bloque:

```js
    const { root: projectRoot, esRepo } = timeLeft() > 300 ? await detectProjectRoot(cwd) : { root: cwd, esRepo: false };
    const projectName = path.basename(projectRoot) || "proyecto";

    const blocks = [];

    if (esRepo) {
        const aviso = avisoContextoProyecto(projectRoot, projectName);
        if (aviso) blocks.push(aviso);
    }
```

(las dos líneas antiguas `const projectRoot = …` y `const projectName = …` y la declaración `const blocks = [];` se sustituyen por lo anterior). Añadir un paso 0 al comentario de cabecera: `//   0. avisa si el repo no tiene .claude/proyectos/<nombre>.md en el workspace;`.

- [ ] **Step 4: Verificar que pasa, y la suite de hooks entera**

Run: `node --test "hooks/test/*.test.mjs" 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# pass 15`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/session-start.mjs hooks/test/session-start.test.mjs
git commit -m "feat(hooks): session-start avisa si el repo no tiene contexto en .claude/proyectos"
```

---

### Task 9: Instalador y desinstalador

**Files:**
- Modify: `bin/components/rules.sh` (`ac_rules_install_templates`, cabecera)
- Modify: `bin/components/rag.sh` (bucle de copia)
- Modify: `bin/uninstall.sh` (mensaje de lo que se conserva), `bin/wizard/wizard.mjs` (tabla)
- Modify: `templates/rag/test/instalacion.test.mjs`

- [ ] **Step 1: Prueba que falla**

En `templates/rag/test/instalacion.test.mjs`, añadir el import `import { CABECERA_INDICE } from "../proyectos-lib.mjs";` y:

```js
test("rules.sh: ac_rules_install_templates crea proyectos/_indice.md con la cabecera del índice y no lo pisa", () => {
    const bash = localizarBash();
    if (!bash) { console.log("sin bash — se salta"); return; }
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "rules-tpl-"));
    const u = p => p.replace(/\\/g, "/");
    const script = `export AC_REPO_DIR="${u(REPO)}" RAG_ROOT="${u(ws)}" && source "${u(REPO)}/bin/lib/log.sh" && source "${u(REPO)}/bin/components/rules.sh" && ac_rules_install_templates`;
    const r = spawnSync(bash, ["-c", script], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    const indice = path.join(ws, ".claude", "proyectos", "_indice.md");
    assert.equal(fs.readFileSync(indice, "utf8"), CABECERA_INDICE);
    assert.ok(fs.existsSync(path.join(ws, ".claude", "CLAUDEMAX.md")));
    fs.writeFileSync(indice, "EDITADO");
    assert.equal(spawnSync(bash, ["-c", script], { encoding: "utf8" }).status, 0);
    assert.equal(fs.readFileSync(indice, "utf8"), "EDITADO");
    fs.rmSync(ws, { recursive: true, force: true });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `cd templates/rag && node --test test/instalacion.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `not ok` en "rules.sh" (`ENOENT … _indice.md`).

- [ ] **Step 3: Implementación**

`bin/components/rules.sh`, en `ac_rules_install_templates`, dentro del bloque `DRY_RUN` añadir antes del `return 0`:

```bash
        ac_dim "\$ mkdir -p $dst/proyectos  (+ _indice.md con la cabecera, solo si falta)"
```

y al final de la función (tras el bloque de `CLAUDE.md`):

```bash
    # Contexto por proyecto (spec reglas-contexto §1): proyectos/ es del usuario. El índice se crea
    # con la cabecera si falta —CLAUDEMAX.md lo importa— y lo regenera `ritual.mjs init-proyecto`.
    mkdir -p "$dst/proyectos"
    if [ ! -f "$dst/proyectos/_indice.md" ]; then
        printf '%s\n' "# Proyectos del workspace" "" 'Un archivo por proyecto en `.claude/proyectos/`. Para añadir uno: `node R.A.G/ritual.mjs init-proyecto <ruta>`.' > "$dst/proyectos/_indice.md"
        ac_info "  proyectos/_indice.md creado (se llena con cada init-proyecto)"
    else
        ac_dim "  proyectos/ ya existe — se respeta"
    fi
```

En la cabecera de `rules.sh`, el punto 1 pasa a: `#   1. Copia templates/rules/ a <RAG_ROOT>/.claude/ (reglas del workspace) y crea .claude/proyectos/_indice.md si falta.`

`bin/components/rag.sh`: el bucle `for f in docker-compose.yml … ritual.mjs; do` añade `proyectos-lib.mjs indices-lib.mjs` tras `ritual.mjs`.

`bin/uninstall.sh`: el mensaje
`(se conservan: las reglas y los recordatorios de <RAG_ROOT>/.claude/ — puedes haberlos editado)` pasa a
`(se conservan: las reglas, los recordatorios y el contexto por proyecto (proyectos/) de <RAG_ROOT>/.claude/ — son tuyos)`.

`bin/wizard/wizard.mjs`: la celda `"Reglas en <RAG_ROOT>/.claude/ (por si las editaste)"` pasa a `"Reglas, recordatorios y contexto por proyecto en <RAG_ROOT>/.claude/"`.

- [ ] **Step 4: Verificar**

Run: `node --test test/instalacion.test.mjs 2>&1 | sed -n '/^# \(pass\|fail\)/p;/not ok/p'`
Esperado: `# fail 0`.

Run: `cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX && node bin/wizard/test-componentes.mjs && RAG_ROOT=/tmp/x bash bin/install.sh --dry-run --only rules --only rag 2>&1 | sed -n '/proyectos\|proyectos-lib\|indices-lib/p'`
Esperado: `test-componentes` OK; el dry-run muestra `mkdir -p /tmp/x/.claude/proyectos` y los `cp` de `proyectos-lib.mjs` e `indices-lib.mjs`.

- [ ] **Step 5: Commit**

```bash
git add bin/components/rules.sh bin/components/rag.sh bin/uninstall.sh bin/wizard/wizard.mjs templates/rag/test/instalacion.test.mjs
git commit -m "feat(installer): rules crea .claude/proyectos y rag copia las libs de proyectos e índices"
```

---

### Task 10: Skill `rituales` y documentación

**Files:**
- Modify: `skills/rituales/SKILL.md`, `skills/rituales/skill.yaml`, `skills/rituales/schema.json`
- Modify: `README.md`, `INSTALL.md`

- [ ] **Step 1: Skill `rituales`**

`SKILL.md`: en la tabla "Dónde escribe cada ritual", la fila de `init-proyecto` pasa a
`| init-proyecto | .claude/proyectos/<slug>.md + Hubs/<Proyecto>.md | hubs (el hub) | regenera proyectos/_indice.md; .gitignore del repo; indexa codebase-memory y graphify |`
(con los backticks del formato actual), y "la regla 7 de `CLAUDEMAX.md`" pasa a "la regla 9 de `CLAUDEMAX.md`". La sección `## 2. Init de proyecto (manual)` se sustituye entera por:

````markdown
## 2. Init de proyecto (manual)

- **Cuándo:** al empezar a trabajar en un repo del workspace que todavía no tiene
  `.claude/proyectos/<nombre>.md` (el hook de arranque lo avisa: "Sin contexto de proyecto…"), o
  cuando el usuario dice "nuevo proyecto" / "init project".
- **Comando:**
  ```bash
  node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar] [--sin-gitignore] [--vault ruta]
  ```
- **Qué hace, en orden:**
  1. crea `<RAG_ROOT>/.claude/proyectos/<slug>.md` desde la plantilla `proyecto.md`: frontmatter
     `proyecto/ruta/descripcion/inicializado` y cinco secciones vacías con su guía en comentarios.
     `<slug>` es el nombre sin espacios ni tildes (`Otro Repo` → `Otro-Repo.md`);
  2. regenera `proyectos/_indice.md`, que `CLAUDEMAX.md` importa: el contexto de todos los
     proyectos se carga en cualquier sesión del workspace sin nada dentro de los repos;
  3. crea el hub `V.A.U.L.T/Hubs/<nombre>.md` desde `Hubs/_proyecto.md`;
  4. si `<ruta>` es un repo git, añade `/CLAUDE.md`, `/CLAUDE.local.md` y `/.claude/` a su
     `.gitignore` (salvo `--sin-gitignore`);
  5. si encuentra `<ruta>/.claude/CLAUDEMAX.md` del diseño anterior, avisa de que hay que migrarlo
     a mano — no borra nada;
  6. indexa el repo con codebase-memory (`index_repository`, modo `moderate`) y extrae su grafo
     con `graphify extract <ruta> --code-only` (salvo `--sin-indexar`; si falta un binario, dice
     cómo instalarlo y sigue).
- **Qué NO hace:** nunca sobrescribe `proyectos/<slug>.md` ni el hub si ya existen; nunca escribe
  dentro del repo salvo el `.gitignore`; no escribe la prosa — eso es el paso siguiente.
- **Después — guion para el modelo**, en una sesión abierta en el repo. Rellena
  `proyectos/<slug>.md` verificando contra el grafo, nunca de memoria:
  1. **Estructura:** `get_architecture` de codebase-memory y `query_graph` / `get_neighbors` de
     graphify → carpetas de primer nivel, capas y quién depende de quién.
  2. **Comandos:** léelos de los archivos reales (`*.sln`/`*.csproj`, `package.json`,
     `pyproject.toml`, `Makefile`) y pruébalos si es barato.
  3. **Estado**, **Trampas que ya costaron tiempo** y **Convenciones** se quedan vacías hasta que
     haya algo real que escribir, con su fecha. No inventes.
  4. Tope ~150 líneas: lo largo va al vault (`Codigo/` con `fuentes:`) y se enlaza.
````

`skill.yaml`: `version: 2.1.0`. `schema.json`: dentro de `inputs.properties` añadir

```json
        "ruta": {
          "type": "string",
          "description": "Ruta del repo — usado por init-proyecto"
        },
        "descripcion": {
          "type": "string",
          "description": "Una línea que describe el proyecto — usado por init-proyecto"
        },
```

- [ ] **Step 2: README.md**

1. Fila `rules` de la tabla de componentes: `(las 8 reglas)` → `(las 10 reglas; termina importando proyectos/_indice.md)` y `proyecto.md` (plantilla por proyecto) → `proyecto.md` (esqueleto de `.claude/proyectos/<nombre>.md`); añadir tras la mención de `CLAUDE.md`: `; crea .claude/proyectos/_indice.md si falta`.
2. Sección "Reglas operativas": el paréntesis `(y las propaga a cada proyecto vía el ritual init-proyecto, ver Rituales)` → `(el contexto de cada proyecto va aparte, en .claude/proyectos/, ver Contexto por proyecto)` (conservando backticks y enlace). Las filas 6 y 7 de la tabla se sustituyen por:

```markdown
| 6 | **Dónde vive el contexto:** todo en `<RAG_ROOT>/.claude/` (reglas, `proyectos/<nombre>.md`, recordatorios) o en el vault; ningún repo lleva `CLAUDE.md`, `CLAUDE.local.md` ni `.claude/`. Ver [Contexto por proyecto](#contexto-por-proyecto). | Recordatorio `contexto-fuera-del-repo` + `.gitignore` que escribe `init-proyecto` + aviso de `session-start.mjs`. |
| 7 | **Tres memorias con rol:** memoria nativa = gotchas cortos; vault + RAG = narrativa y decisiones; grafo = estructura. Lo generado se queda en su herramienta; lo narrado va al vault. Context7 permitido para documentación de librerías. | Convención — sin hook. |
| 8 | **Orden de herramientas de contexto:** `rag` → `graphify` → `codebase-memory` → grep (último recurso, solo literales). La prosa se verifica contra el grafo; codebase-memory se reindexa antes de concluir "no existe". | Recordatorio `orden-herramientas`. |
| 9 | **Taxonomía y vigencia:** la carpeta da la colección; toda nota se enlaza desde su hub; `fuentes:` si describe código, `reemplaza:` si sustituye a otra (ver `Plantillas/nota.md`). | Convención + `rag.mjs salud` (informa, no bloquea) + recordatorio `editar-vault`. |
| 10 | **Recordatorios justo a tiempo:** una regla que se olvidó dos veces se convierte en un recordatorio en `.claude/recordatorios/`. | `hooks/recordar.mjs` (inyecta, no bloquea). |
```

3. `hacen cumplir las reglas 3, 4, 5 y 8` → `hacen cumplir las reglas 3, 4, 5 y 10`.
4. Nueva subsección antes de `### Recordatorios justo a tiempo`:

```markdown
### Contexto por proyecto

El contexto que Claude necesita de cada repo (estructura, comandos, estado, trampas) no vive en
el repo: en el setup de trabajo del autor, un `CLAUDE.md` con contexto interno acabó publicado en
GitHub el 2026-07-24. Vive en el workspace, y Claude Code lo carga solo porque lee los `CLAUDE.md`
de los directorios padre y resuelve sus `@import`:

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
```

5. Recordatorios: en el bloque YAML de ejemplo añadir tras `rutas:` la línea
   `excluir: ["**/.claude/recordatorios/**"]   # globs que anulan el disparo (ganan a siempre)`;
   en "De fábrica", `editar-vault` (regla 7 …) → (regla 9 …) y añadir
   `contexto-fuera-del-repo` (regla 6 al escribir un `CLAUDE.md` o `.claude/` dentro de un repo) antes de `editar-vault`.
6. Rituales: fila de `init-proyecto` → comando `node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar]`; el párrafo que empieza por "`init-proyecto` crea `.claude/CLAUDEMAX.md`" se sustituye por:

```markdown
`init-proyecto` escribe el contexto del proyecto **fuera del repo**, en
`<RAG_ROOT>/.claude/proyectos/<nombre>.md` (esqueleto de `templates/rules/proyecto.md`); regenera
`proyectos/_indice.md`; crea el hub `V.A.U.L.T/Hubs/<nombre>.md`; añade `/CLAUDE.md`,
`/CLAUDE.local.md` y `/.claude/` al `.gitignore` del repo; e indexa el código con codebase-memory y
graphify (`--sin-indexar` lo salta). Nunca sobrescribe nada que ya exista. La prosa la rellena el
modelo después consultando el grafo (skill `rituales`). Ver [Contexto por proyecto](#contexto-por-proyecto).
```

- [ ] **Step 3: INSTALL.md**

1. Árbol de `templates/rag/`: tras la línea de `ritual.mjs` añadir
   `    │   ├── proyectos-lib.mjs    # funciones puras del contexto por proyecto (slug, índice, .gitignore)` y
   `    │   ├── indices-lib.mjs      # resolver y lanzar codebase-memory index_repository y graphify extract`.
2. Árbol de `recordatorios/`: añadir `contexto-fuera-del-repo.md` a la lista de fábrica.
3. Árbol de `rules/`: `# las 8 reglas operativas — se sobrescribe en cada instalación` → `# las 10 reglas; termina importando proyectos/_indice.md — se sobrescribe en cada instalación`; `# plantilla por proyecto que instancia ritual.mjs init-proyecto` → `# esqueleto de .claude/proyectos/<nombre>.md que instancia ritual.mjs init-proyecto`.
4. Fila de la tabla de desinstalación `<RAG_ROOT>/.claude/` (`CLAUDEMAX.md`, `CLAUDE.md`, `proyecto.md`) → añadir `proyectos/`, `recordatorios/` a la lista y cambiar la justificación a "**No** — reglas que pudiste editar y contexto por proyecto que es tuyo; sobrevive a la desinstalación igual que `V.A.U.L.T`/`R.A.G`".
5. La sección `### "Quiero las reglas en un proyecto ya existente"` se sustituye por:

````markdown
### "Quiero el contexto de un proyecto ya existente"

Ejecuta el ritual de inicialización sobre ese repo — nunca sobrescribe nada que ya exista:

```bash
node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar] [--sin-gitignore]
```

Crea `<RAG_ROOT>/.claude/proyectos/<nombre>.md` (esqueleto de `templates/rules/proyecto.md`),
regenera `proyectos/_indice.md`, crea el hub `V.A.U.L.T/Hubs/<nombre>.md`, añade `/CLAUDE.md`,
`/CLAUDE.local.md` y `/.claude/` al `.gitignore` del repo e indexa el código con codebase-memory y
graphify. **No escribe nada dentro del repo** salvo ese `.gitignore`. Si el repo tiene un
`.claude/CLAUDEMAX.md` del diseño anterior, lo avisa para que migres su contenido a mano.
````

- [ ] **Step 4: Verificar**

Run: `cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX && node skills/validate-skills.mjs 2>&1 | tail -3 && sed -n '/las 8 reglas\|regla 7 al escribir\|reglas 3, 4, 5 y 8\|<ruta>\/.claude\/CLAUDEMAX.md` (la plantilla/p' README.md INSTALL.md`
Esperado: `validate-skills` OK; el `sed` no imprime nada (no quedan referencias viejas).

- [ ] **Step 5: Commit**

```bash
git add skills/rituales README.md INSTALL.md
git commit -m "docs: contexto por proyecto fuera del repo, reglas v3 e init-proyecto v2"
```

---

### Task 11: Verificación en vivo en esta máquina

- [ ] **Step 1: Suites completas**

```bash
cd /c/Users/JHONNY/Desktop/WORKSPACE/Herramientas/CLAUDEMAX
node --test "hooks/test/*.test.mjs" 2>&1 | sed -n '/^# \(pass\|fail\)/p'
node --test "templates/mcp/test/*.test.mjs" 2>&1 | sed -n '/^# \(pass\|fail\)/p'
(cd templates/rag && npm test 2>&1 | sed -n '/^# \(pass\|fail\|skipped\)/p')
node bin/wizard/test-componentes.mjs && node skills/validate-skills.mjs 2>&1 | tail -1
```

Esperado: todo `# fail 0`; hooks 15, mcp 6.

- [ ] **Step 2: Reinstalar `rules` y `rag` sobre el workspace real**

```bash
RAG_ROOT="$HOME/Desktop/WORKSPACE" bash bin/install.sh --only rules --only rag 2>&1 | sed -n '/proyectos\|recordatorio\|WARN\|ERR/p'
ls "$HOME/Desktop/WORKSPACE/.claude/proyectos" "$HOME/Desktop/WORKSPACE/R.A.G" | sed -n '/_indice\|proyectos-lib\|indices-lib/p'
tail -3 "$HOME/Desktop/WORKSPACE/.claude/CLAUDEMAX.md"
```

Esperado: `_indice.md`, `proyectos-lib.mjs`, `indices-lib.mjs` presentes; última línea de `CLAUDEMAX.md` = `@proyectos/_indice.md`; `contexto-fuera-del-repo.md` copiado a `.claude/recordatorios/`.

- [ ] **Step 3: `init-proyecto` sobre CLAUDEMAX**

```bash
node "$HOME/Desktop/WORKSPACE/R.A.G/ritual.mjs" init-proyecto "$(pwd -W)" --descripcion "Instalador de Claude Code con vault, RAG, recordatorios y grafo de código"
cat "$HOME/Desktop/WORKSPACE/.claude/proyectos/_indice.md"
git diff .gitignore
```

Esperado: `proyectos/CLAUDEMAX.md` creado; índice con la línea de CLAUDEMAX; codebase-memory y graphify terminan con "listo"; `.gitignore` gana el bloque anclado (no afecta a `templates/rules/CLAUDE.md` ni a los fixtures: comprobar con `git status --short` que ningún archivo versionado pasa a ignorado — `git ls-files -ci --exclude-standard` vacío).

- [ ] **Step 4: Rellenar `proyectos/CLAUDEMAX.md` con el guion de la skill**

Consultar `get_architecture` (codebase-memory) y `query_graph` (graphify) — o, si esta sesión no tiene aún los MCP cargados, sus CLI — y escribir **Estructura** y **Comandos** (los de las suites de arriba e `install.sh`). Estado/Trampas/Convenciones: solo lo verificable hoy (las lecciones (a)–(h) de la memoria son trampas reales con fecha). ≤ 150 líneas.

- [ ] **Step 5: Aviso de session-start en vivo**

```bash
printf '{"cwd":"%s"}' "$(pwd -W | sed 's/\\/\\\\/g')" | CLAUDEMAX_RAG_DIR=/nonexistent node hooks/session-start.mjs | sed -n '/Sin contexto/p'
```

Esperado: nada (CLAUDEMAX ya tiene contexto). Repetir sobre otro repo del workspace sin archivo (p. ej. uno bajo `Herramientas/`) → imprime el aviso.

- [ ] **Step 6: Commit del .gitignore de CLAUDEMAX**

```bash
git add .gitignore
git commit -m "chore: el repo ignora el contexto de Claude en su raíz"
```

- [ ] **Step 7: Pedir al usuario la comprobación de carga**

Pedirle que abra una sesión nueva en `Herramientas/CLAUDEMAX` y ejecute `/context`: en *Memory files* deben aparecer `WORKSPACE/.claude/CLAUDE.md`, `CLAUDEMAX.md`, `proyectos/_indice.md` y `proyectos/CLAUDEMAX.md`. Es la única verificación que no se puede automatizar desde esta sesión.

---

## Autorrevisión

- **Cobertura del spec:** §1 cadena y `_indice.md` → T3, T6, T7, T9; §2 plantilla → T5; §3 pasos 1–7 → T6; §4 `indices-lib` → T4; §5 reglas v3 → T7; §6.1 recordatorio + `excluir` → T1, T2; §6.2 aviso → T8; §6.3 skill → T10; §7 instalador → T9; §8 pruebas → T1–T9; §9 casos límite: fuera del workspace (T3 `rutaParaIndice`), slug en uso (T6 test 3), sin frontmatter (T3 `leerProyecto` + aviso en T6), `.gitignore` sin salto final (T3), `npm root -g` falla (T4), `_indice.md` borrado (T6 lo regenera; T9 lo crea), sesión desde la raíz (T8 no avisa: el workspace no es repo).
- **Renumeración de reglas:** "regla 7" → 9 en `editar-vault.md` (T2), skill `rituales` (T10) y README (T10); "3, 4, 5 y 8" → "3, 4, 5 y 10" (T10).
- **Consistencia de nombres:** `slugProyecto`, `rutaParaIndice`, `sustituirMarcadores`, `marcadoresSinSustituir`, `leerProyecto`, `generarIndice`, `CABECERA_INDICE`, `completarGitignore` (`{ texto, nuevas }`), `COMENTARIO_GITIGNORE`, `esClaudemaxViejo`; `resolverCodebaseMemory(env, { npmRoot })`, `resolverGraphify(env, { probarPython })`, `indexarCodebaseMemory(ruta, { env, resolver, spawn })`, `extraerGraphify(ruta, { env, resolver, spawn })` → `{ ok, codigo, aviso }`. Usados igual en T3, T4, T6, T9.
