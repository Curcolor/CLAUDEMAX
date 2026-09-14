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
