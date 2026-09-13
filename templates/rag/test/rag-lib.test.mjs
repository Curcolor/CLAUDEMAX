import { test } from "node:test";
import assert from "node:assert/strict";
import {
    clasificar, EXCLUIDAS_POR_DEFECTO, CON_BOOST,
    parseFrontmatter, extraerFecha, limpiarWikilinks, tituloDe, normalizarReferencia,
    chunkMarkdown,
} from "../rag-lib.mjs";

test("clasificar: tabla completa de carpetas → colección y autoridad", () => {
    const casos = [
        ["Hubs/Bienvenida.md",                      "hubs",          "vigente"],
        ["Decisiones/Bitrix-vs-GCP.md",             "decisiones",    "vigente"],
        ["Formales/App/PRD.md",                     "docs_formales", "oficial"],
        ["Superpowers/Specs/2026-01-01-x.md",       "specs",         "diseño-vigente"],
        ["Entrevistas/e1.md",                       "entrevistas",   "fuente-primaria"],
        ["Conocimiento/norma.md",                   "conocimiento",  "referencia"],
        ["Aprendizaje/postmortem.md",               "aprendizaje",   "leccion"],
        ["Codigo/App/Modulo.md",                    "codigo",        "referencia"],
        ["Procesos/alta/proceso.md",                "procesos",      "referencia"],
        ["Revisiones/afinacion.md",                 "revisiones",    "referencia"],
        ["Superpowers/Sesiones/2026-01-01-s.md",    "sesiones",      "personal"],
        ["Bitacoras/bitacora-01-07-2026.md",        "bitacoras",     "historica"],
        ["Superpowers/Planes/plan.md",              "planes",        "historico-tecnico"],
        ["Superpowers/Tareas/t1.md",                "proceso",       "historico-tecnico"],
        ["00-Inbox/captura.md",                     "inbox",         "sin-clasificar"],
    ];
    for (const [rel, coleccion, autoridad] of casos) {
        const r = clasificar(rel);
        assert.equal(r.coleccion, coleccion, rel);
        assert.equal(r.autoridad, autoridad, rel);
        assert.equal(r.conocida, true, rel);
    }
});

test("clasificar: prefijo más específico gana y acepta separador de Windows", () => {
    assert.equal(clasificar("Superpowers\\Sesiones\\nota.md").coleccion, "sesiones");
    // un archivo suelto en Superpowers/ no pertenece a ninguna subcolección
    assert.equal(clasificar("Superpowers/suelto.md").coleccion, "otros");
    // "Codigo-viejo/" no es "Codigo/"
    assert.equal(clasificar("Codigo-viejo/x.md").coleccion, "otros");
});

test("clasificar: carpeta desconocida → otros/referencia y conocida=false", () => {
    const r = clasificar("Cualquiera/nota.md");
    assert.deepEqual(r, { coleccion: "otros", autoridad: "referencia", conocida: false });
});

test("constantes de ranking", () => {
    assert.deepEqual(EXCLUIDAS_POR_DEFECTO, ["planes", "proceso", "inbox"]);
    assert.deepEqual(CON_BOOST, ["decisiones", "hubs"]);
});

test("parseFrontmatter: escalares, listas en línea y en bloque, wikilinks en reemplaza", () => {
    const texto = [
        "---",
        "proyecto: claudemax   # comentario",
        "tags: [rag, pgvector]",
        "fecha: 2026-09-13",
        "fuentes:",
        "  - MiRepo/src/*.cs",
        "  - MiRepo/README.md",
        "reemplaza: [[Bitrix-vs-GCP]]",
        "revisar: 2026-10-08",
        "---",
        "",
        "# Título",
        "cuerpo",
    ].join("\n");
    const { meta, body, aviso } = parseFrontmatter(texto);
    assert.equal(aviso, null);
    assert.equal(meta.proyecto, "claudemax");
    assert.deepEqual(meta.tags, ["rag", "pgvector"]);
    assert.equal(meta.fecha, "2026-09-13");
    assert.deepEqual(meta.fuentes, ["MiRepo/src/*.cs", "MiRepo/README.md"]);
    assert.deepEqual(meta.reemplaza.map(normalizarReferencia), ["Bitrix-vs-GCP"]);
    assert.equal(meta.revisar, "2026-10-08");
    assert.equal(body, "\n# Título\ncuerpo");
});

test("parseFrontmatter: reemplaza escalar se vuelve lista; sin frontmatter → meta vacío", () => {
    assert.deepEqual(parseFrontmatter("---\nreemplaza: vieja\n---\nx").meta.reemplaza, ["vieja"]);
    const sin = parseFrontmatter("# Solo cuerpo\n");
    assert.deepEqual(sin.meta, {});
    assert.equal(sin.body, "# Solo cuerpo\n");
    assert.equal(sin.aviso, null);
});

test("parseFrontmatter: frontmatter sin cierre → aviso y se indexa el texto entero", () => {
    const roto = "---\nproyecto: x\n# Título\ncuerpo";
    const r = parseFrontmatter(roto);
    assert.deepEqual(r.meta, {});
    assert.equal(r.body, roto);
    assert.match(r.aviso, /sin cierre/);
});

test("normalizarReferencia: quita [[ ]], alias, ancla y .md", () => {
    assert.equal(normalizarReferencia("[[Nota|alias]]"), "Nota");
    assert.equal(normalizarReferencia("[[Nota#seccion]]"), "Nota");
    assert.equal(normalizarReferencia("Decisiones/Nota.md"), "Decisiones/Nota");
    assert.equal(normalizarReferencia("[Nota]"), "Nota");
});

test("extraerFecha: frontmatter > yyyy-mm-dd en el nombre > dd-mm-yyyy en el nombre > mtime", () => {
    const mtime = Date.UTC(2026, 0, 15);
    assert.equal(extraerFecha("x.md", { fecha: "2026-09-13" }, mtime), "2026-09-13");
    assert.equal(extraerFecha("2026-09-13-1530-proyecto.md", {}, mtime), "2026-09-13");
    assert.equal(extraerFecha("bitacora-01-07-2026.md", {}, mtime), "2026-07-01");
    assert.equal(extraerFecha("nota.md", {}, mtime), "2026-01-15");
    // una fecha inválida en el frontmatter se ignora
    assert.equal(extraerFecha("nota.md", { fecha: "ayer" }, mtime), "2026-01-15");
});

test("limpiarWikilinks y tituloDe", () => {
    assert.equal(limpiarWikilinks("ver [[Nota|el alias]] y [[Otra]]"), "ver el alias y Otra");
    assert.equal(tituloDe("intro\n# Mi título \nmás", "Carpeta/archivo.md"), "Mi título");
    assert.equal(tituloDe("sin encabezado", "Carpeta/archivo.md"), "archivo");
});

test("chunkMarkdown: corta en # ## ### y no en ####; empaqueta bloques cortos; heading y orden", () => {
    const body = "intro\n# A\ntexto a\n## B\ntexto b\n#### D\nsub d\n### C\ntexto c";
    const out = chunkMarkdown(body, { max: 30, solape: 10 });
    // intro (5) + "# A\ntexto a" (11) caben juntos (18 ≤ 30); "## B…#### D…" (25) ya no cabe con
    // ellos y forma otro; "### C\ntexto c" (13) tampoco cabe con B (25+2+13 > 30) → tercero
    assert.equal(out.length, 3);
    assert.equal(out[0].heading, "");
    assert.match(out[0].content, /^intro\n\n# A/);
    assert.equal(out[1].heading, "B");
    assert.match(out[1].content, /#### D/);
    assert.equal(out[2].heading, "C");
    assert.deepEqual(out.map(c => c.orden), [0, 1, 2]);
});

test("chunkMarkdown: un bloque largo se parte con solape y conserva su heading", () => {
    const largo = "# Largo\n" + "x".repeat(250);
    const out = chunkMarkdown(largo, { max: 100, solape: 20 });
    assert.ok(out.length >= 3);
    assert.ok(out.every(c => c.heading === "Largo"));
    assert.ok(out.every(c => c.content.length <= 100));
    // el solape hace que el final de un trozo aparezca al principio del siguiente
    assert.equal(out[1].content.slice(0, 20), out[0].content.slice(-20));
});

test("chunkMarkdown: por defecto max 2400 y no devuelve trozos vacíos", () => {
    assert.deepEqual(chunkMarkdown("\n\n   \n"), []);
    const uno = chunkMarkdown("# T\n" + "y".repeat(2000));
    assert.equal(uno.length, 1);
});
