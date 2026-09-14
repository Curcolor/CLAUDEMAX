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
