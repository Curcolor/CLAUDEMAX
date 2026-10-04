import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import {
    clasificar, EXCLUIDAS_POR_DEFECTO, CON_BOOST,
    parseFrontmatter, extraerFecha, limpiarWikilinks, tituloDe, normalizarReferencia,
    chunkMarkdown, walkVault, indiceDeNotas, resolverNombreNota,
    resolverFuentes, firmaDe,
    analizarHubs, leerDocumento, formatearResultado, AVISOS_AUTORIDAD, toVec,
    analizarPendientes,
} from "../rag-lib.mjs";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const VAULT = path.join(FIXTURES, "vault");

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

test("walkVault: solo .md, excluye Plantillas/, .obsidian y nombres con _ o .", () => {
    const rels = [...walkVault(VAULT)].map(a => a.rel).sort();
    assert.deepEqual(rels, [
        "Bitacoras/bitacora-01-07-2026.md",
        "Codigo/nota-codigo.md",
        "Codigo/sin-fuentes.md",
        "Decisiones/decision-a.md",
        "Decisiones/decision-vieja.md",
        "Hubs/Bienvenida.md",
        "Hubs/Bitacoras.md",
        "Hubs/Codigo.md",
        "Hubs/Decisiones.md",
        "Hubs/Superpowers-Planes.md",
        "Superpowers/Planes/plan-1.md",
    ]);
    assert.ok([...walkVault(VAULT)].every(a => path.isAbsolute(a.abs)));
});

test("resolverNombreNota: por nombre, por ruta, inexistente y ambiguo", () => {
    const indice = indiceDeNotas([...walkVault(VAULT)]);
    assert.deepEqual(resolverNombreNota("decision-a", indice), { source: "Decisiones/decision-a.md" });
    assert.deepEqual(resolverNombreNota("[[decision-a|alias]]", indice), { source: "Decisiones/decision-a.md" });
    assert.deepEqual(resolverNombreNota("Decisiones/decision-a.md", indice), { source: "Decisiones/decision-a.md" });
    assert.deepEqual(resolverNombreNota("no-existe", indice), { error: "no existe" });
    // dos notas con el mismo nombre en carpetas distintas → ambiguo
    const dup = indiceDeNotas([{ rel: "A/x.md" }, { rel: "B/x.md" }]);
    assert.deepEqual(resolverNombreNota("x", dup), { error: "ambiguo: usa la ruta" });
    assert.deepEqual(resolverNombreNota("B/x", dup), { source: "B/x.md" });
});

test("resolverFuentes: rutas exactas, comodines * y **, sin coincidencias, orden estable", () => {
    assert.deepEqual(resolverFuentes(["fuentes/app.txt"], FIXTURES), ["fuentes/app.txt"]);
    assert.deepEqual(resolverFuentes(["fuentes/*.txt"], FIXTURES), ["fuentes/app.txt"]);
    assert.deepEqual(resolverFuentes(["**/app.txt"], FIXTURES), ["fuentes/app.txt"]);
    assert.deepEqual(resolverFuentes(["fuentes/nada-*.txt"], FIXTURES), []);
    assert.deepEqual(resolverFuentes(["vault/Codigo/*.md", "fuentes/app.txt"], FIXTURES),
        ["fuentes/app.txt", "vault/Codigo/nota-codigo.md", "vault/Codigo/sin-fuentes.md"]);
    // separador de Windows en el patrón
    assert.deepEqual(resolverFuentes(["fuentes\\app.txt"], FIXTURES), ["fuentes/app.txt"]);
});

test("firmaDe: cambia si cambia el contenido, igual si no, null sin fuentes", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "firma-"));
    fs.mkdirSync(path.join(tmp, "src"));
    fs.writeFileSync(path.join(tmp, "src", "a.txt"), "uno");
    fs.writeFileSync(path.join(tmp, "src", "b.txt"), "dos");
    const rutas = resolverFuentes(["src/*.txt"], tmp);
    const f1 = firmaDe(rutas, tmp);
    assert.match(f1, /^[0-9a-f]{64}$/);
    assert.equal(firmaDe(rutas, tmp), f1);
    fs.writeFileSync(path.join(tmp, "src", "b.txt"), "dos-cambiado");
    assert.notEqual(firmaDe(rutas, tmp), f1);
    assert.equal(firmaDe([], tmp), null);
    fs.rmSync(tmp, { recursive: true, force: true });
});

test("analizarHubs: huérfanas (sin enlace desde Hubs/) y enlaces rotos", () => {
    const archivos = [...walkVault(VAULT)];
    const { huerfanas, enlacesRotos } = analizarHubs(VAULT, archivos);
    assert.deepEqual(huerfanas, ["Decisiones/decision-vieja.md"]);
    assert.deepEqual(enlacesRotos, [{ hub: "Hubs/Codigo.md", destino: "no-existe" }]);
});

test("leerDocumento: contenido, ruta inválida fuera del vault, inexistente, tope", () => {
    // \r? porque con core.autocrlf=true el checkout deja el fixture en CRLF
    assert.match(leerDocumento(VAULT, "Decisiones/decision-a.md"), /^---\r?\nproyecto: demo/);
    assert.equal(leerDocumento(VAULT, "../fuentes/app.txt"), "ruta inválida");
    assert.equal(leerDocumento(VAULT, "/etc/passwd"), "ruta inválida");
    assert.equal(leerDocumento(VAULT, "Decisiones/nada.md"), "no existe: Decisiones/nada.md");
    assert.equal(leerDocumento(VAULT, "Decisiones/decision-a.md", 10).length, 10);
});

test("formatearResultado: cabecera, aviso de vigencia, aviso de autoridad, contenido", () => {
    const fila = {
        source: "Decisiones/decision-a.md", titulo: "Decisión A", coleccion: "decisiones",
        autoridad: "vigente", fecha: new Date("2026-07-12T00:00:00Z"), estado: "vigente",
        reemplazada_por: null, revisar: null, heading: "", content: "cuerpo", score: 0.91,
    };
    assert.equal(formatearResultado(fila),
        "[decisiones · vigente · 2026-07-12] Decisiones/decision-a.md — Decisión A\n(decisión o estado vigente)\ncuerpo");
    assert.match(formatearResultado({ ...fila, estado: "caduca" }), /\n⚠ CADUCA — sus fuentes cambiaron/);
    assert.match(formatearResultado({ ...fila, estado: "revisar", revisar: "2026-10-08" }), /⚠ REVISAR — venció el 2026-10-08/);
    assert.match(formatearResultado({ ...fila, estado: "reemplazada", reemplazada_por: "Decisiones/nueva.md" }),
        /⚠ REEMPLAZADA por \[\[Decisiones\/nueva\]\]/);
    assert.match(formatearResultado({ ...fila, autoridad: "historica", coleccion: "bitacoras" }),
        /\(bitácora histórica: la decisión pudo cambiar después\)/);
    assert.equal(Object.keys(AVISOS_AUTORIDAD).length, 10);
    assert.equal(toVec([1, 0.5]), "[1,0.5]");
});

test("mcp-server: arranca y responde a tools/list con las tres tools", async () => {
    const srv = spawn(process.execPath, [path.join(FIXTURES, "..", "..", "mcp-server.mjs")], { stdio: ["pipe", "pipe", "pipe"] });
    let salida = "";
    srv.stdout.on("data", d => { salida += d; });
    const enviar = obj => srv.stdin.write(JSON.stringify(obj) + "\n");
    enviar({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } } });
    enviar({ jsonrpc: "2.0", method: "notifications/initialized" });
    enviar({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    await new Promise(r => setTimeout(r, 1500));
    srv.kill();
    const nombres = salida.split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(m => m && m.id === 2).flatMap(m => m.result.tools.map(t => t.name));
    assert.deepEqual(nombres.sort(), ["rag_leer", "rag_query", "rag_status"]);
});

test("analizarPendientes: clasifica abiertos y cerrados y avisa de párrafo, fecha, largo, enlace y antigüedad", () => {
    const texto = [
        "---", "tags: [hub]", "---", "",
        "# Pendientes", "",
        "Texto de cabecera que no se analiza.", "",
        "## Abierto", "### CLAUDEMAX",
        "<!-- comentario -->",
        "- (2026-09-01) terminar el sub-proyecto 5 — desbloquea el 6 — [[2026-09-13-rituales-design]]",
        "- (2026-06-01) migrar Pendientes del setup viejo — [[Bienvenida]]",
        "- sin fecha de origen — [[Bienvenida]]",
        `- (2026-09-10) ${"x".repeat(320)}`,
        "  continuación con sangría",
        "",
        "## Cerrado recientemente",
        "- (2026-09-01 → 2026-09-13) contexto fuera del repo — [[2026-09-13-cierre-reglas]]",
        "- (2026-09-02 -> 2026-09-14) grafo en vivo — [[2026-09-14-cierre-grafo]]",
        "- (2026-09-05) sin fecha de cierre — [[x]]",
        "- (2026-09-06 → 2026-09-15) cerrado sin enlace al detalle",
        "", "Relacionado: [[Bienvenida]]", "",
    ].join("\n");
    const r = analizarPendientes(texto, "2026-09-20");
    assert.equal(r.abiertos.length, 3);
    assert.equal(r.cerrados.length, 3);
    assert.deepEqual(r.cerrados[0], { linea: 19, origen: "2026-09-01", cierre: "2026-09-13", proyecto: "", texto: r.cerrados[0].texto });
    const tipos = t => r.avisos.filter(a => a.tipo === t).map(a => a.linea);
    assert.deepEqual(tipos("parrafo"), [16]);          // la continuación con sangría; "Relacionado:" cierra la sección
    assert.deepEqual(tipos("sin-fecha"), [14, 21]);
    assert.deepEqual(tipos("larga"), [15]);
    assert.deepEqual(tipos("sin-enlace"), [22]);
    assert.deepEqual(tipos("antiguo"), [13]);          // origen de más de 60 días
    assert.equal(r.abiertos[0].proyecto, "CLAUDEMAX");
    // CRLF y ausencia de secciones
    assert.equal(analizarPendientes(texto.replace(/\n/g, "\r\n"), "2026-09-20").avisos.length, r.avisos.length);
    assert.deepEqual(analizarPendientes("# Pendientes\n\nsin secciones\n", "2026-09-20"),
        { abiertos: [], cerrados: [], avisos: [] });
    // un comentario de varias líneas no genera avisos de párrafo
    const conComentario = "## Abierto\n<!-- formato:\n     - (YYYY-MM-DD) qué falta\n     más texto -->\n-\n";
    assert.deepEqual(analizarPendientes(conComentario, "2026-09-20").avisos, []);
});
