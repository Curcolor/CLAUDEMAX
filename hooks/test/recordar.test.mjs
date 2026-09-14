import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRecordatorio, globARegex, textoDelTool, coincide } from "../recordar-lib.mjs";

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
