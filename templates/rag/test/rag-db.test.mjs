import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { arrancarOllamaFalso, bdDisponible, consultar, limpiarBd, copiarFixtures, rag } from "./helpers.mjs";

const hayBd = await bdDisponible();
const skip = hayBd ? false : "sin Postgres de prueba (RAG_TEST_PG_URL) — se saltan las pruebas de integración";

let ollama, fx;
before(async () => { if (!hayBd) return; ollama = await arrancarOllamaFalso(); fx = copiarFixtures(); await limpiarBd(); });
after(async () => { if (!hayBd) return; await ollama.cerrar(); fx.limpiar(); });

const ctx = () => ({ root: fx.root, ollamaUrl: ollama.url });

test("init: crea el schema nuevo sobre una BD vacía", { skip }, async () => {
    const r = await rag(["init"], ctx());
    assert.equal(r.status, 0, r.out);
    const cols = await consultar("SELECT column_name FROM information_schema.columns WHERE table_name='documentos' ORDER BY 1");
    assert.ok(cols.map(c => c.column_name).includes("firma_origen"));
    const st = await rag(["status"], ctx());
    assert.equal(st.status, 0, st.out);
    assert.match(st.out, /db: activa — 0 chunks, 0 documentos/);
});

test("init: migra una BD con el schema anterior y status pide reindex", { skip }, async () => {
    await limpiarBd();
    await consultar(`CREATE TABLE chunks (id BIGSERIAL PRIMARY KEY, source TEXT NOT NULL, proyecto TEXT, heading TEXT,
        content TEXT NOT NULL, content_hash TEXT NOT NULL, mtime TIMESTAMPTZ, embedding vector(1024), categoria TEXT, tags TEXT[])`);
    await consultar("CREATE UNIQUE INDEX chunks_source_hash ON chunks(source, content_hash)");
    await consultar("INSERT INTO chunks (source, content, content_hash, embedding, categoria) VALUES ('x.md','c','h', array_fill(0.0, ARRAY[1024])::vector, 'codigo')");
    const r = await rag(["init"], ctx());
    assert.equal(r.status, 0, r.out);
    const cols = (await consultar("SELECT column_name FROM information_schema.columns WHERE table_name='chunks'")).map(c => c.column_name);
    assert.ok(!cols.includes("categoria") && cols.includes("coleccion") && cols.includes("autoridad") && cols.includes("orden"));
    const st = await rag(["status"], ctx());
    assert.match(st.out, /schema migrado: ejecuta `reindex`/);
    await limpiarBd();
    await rag(["init"], ctx());
});

test("ingest: indexa el fixture, clasifica, y un segundo ingest no embebe nada", { skip }, async () => {
    const antes = ollama.llamadas();
    const r = await rag(["ingest", fx.vault], ctx());
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /indexados: 11 \| sin cambios: 0 \| fallidos: 0/);
    assert.match(r.out, /Codigo\/sin-fuentes\.md/);              // listado "sin fuentes:"
    assert.ok(ollama.llamadas() > antes);
    const docs = await consultar("SELECT source, coleccion, autoridad, proyecto, fecha::text, estado FROM documentos ORDER BY source");
    assert.equal(docs.length, 11);
    const dec = docs.find(d => d.source === "Decisiones/decision-a.md");
    assert.deepEqual([dec.coleccion, dec.autoridad, dec.proyecto, dec.fecha, dec.estado], ["decisiones", "vigente", "demo", "2026-07-12", "vigente"]);
    const bit = docs.find(d => d.source === "Bitacoras/bitacora-01-07-2026.md");
    assert.equal(bit.fecha, "2026-07-01");
    assert.equal((await consultar("SELECT count(*)::int n FROM chunks WHERE source='Superpowers/Planes/plan-1.md'"))[0].n, 1);
    // segundo ingest: todo sin cambios y cero llamadas a embed
    const mitad = ollama.llamadas();
    const r2 = await rag(["ingest", fx.vault], ctx());
    assert.match(r2.out, /indexados: 0 \| sin cambios: 11 \| fallidos: 0/);
    assert.equal(ollama.llamadas(), mitad);
});

test("ingest: carpeta desconocida → otros y aviso; frontmatter roto → aviso y se indexa", { skip }, async () => {
    fs.mkdirSync(path.join(fx.vault, "Rara"), { recursive: true });
    fs.writeFileSync(path.join(fx.vault, "Rara", "x.md"), "# Rara\ntexto");
    fs.writeFileSync(path.join(fx.vault, "Conocimiento-roto.md"), "---\nproyecto: x\n# Sin cierre\ntexto");
    const r = await rag(["ingest", fx.vault], ctx());
    assert.match(r.out, /carpetas desconocidas[\s\S]*Rara\/x\.md/);
    assert.match(r.out, /Conocimiento-roto\.md: frontmatter sin cierre/);
    const d = await consultar("SELECT coleccion FROM documentos WHERE source='Rara/x.md'");
    assert.equal(d[0].coleccion, "otros");
    fs.rmSync(path.join(fx.vault, "Rara"), { recursive: true });
    fs.rmSync(path.join(fx.vault, "Conocimiento-roto.md"));
});

test("ingest: borrar una nota borra sus filas", { skip }, async () => {
    await rag(["ingest", fx.vault], ctx());
    assert.equal((await consultar("SELECT count(*)::int n FROM documentos WHERE source LIKE 'Rara/%'"))[0].n, 0);
    assert.equal((await consultar("SELECT count(*)::int n FROM chunks WHERE source LIKE 'Rara/%'"))[0].n, 0);
});

test("vigencia a: fuentes cambian → caduca; nota cambia → vigente; fuente desaparece → caduca", { skip }, async () => {
    const nota = path.join(fx.vault, "Codigo", "nota-codigo.md");
    const fuente = path.join(fx.root, "fuentes", "app.txt");
    const estado = async () => (await consultar("SELECT estado FROM documentos WHERE source='Codigo/nota-codigo.md'"))[0].estado;
    assert.equal(await estado(), "vigente");
    fs.writeFileSync(fuente, "version 2");
    await rag(["ingest", fx.vault], ctx());
    assert.equal(await estado(), "caduca");
    fs.appendFileSync(nota, "\nActualizada contra la versión 2.\n");
    await rag(["ingest", fx.vault], ctx());
    assert.equal(await estado(), "vigente");
    fs.rmSync(fuente);
    const r = await rag(["ingest", fx.vault], ctx());
    assert.match(r.out, /nota-codigo\.md: fuentes sin coincidencias/);
    assert.equal(await estado(), "caduca");
    fs.writeFileSync(fuente, "version 2");
    fs.appendFileSync(nota, "\nY otra vez.\n");
    await rag(["ingest", fx.vault], ctx());
    assert.equal(await estado(), "vigente");
});

test("vigencia b: reemplaza marca a la vieja; si la nueva desaparece, la vieja vuelve", { skip }, async () => {
    const nueva = path.join(fx.vault, "Decisiones", "decision-b.md");
    fs.writeFileSync(nueva, "---\nproyecto: demo\nreemplaza: [[decision-a]]\n---\n# Decisión B\nSustituye a la A.\n");
    await rag(["ingest", fx.vault], ctx());
    let a = (await consultar("SELECT estado, reemplazada_por FROM documentos WHERE source='Decisiones/decision-a.md'"))[0];
    assert.deepEqual(a, { estado: "reemplazada", reemplazada_por: "Decisiones/decision-b.md" });
    fs.rmSync(nueva);
    await rag(["ingest", fx.vault], ctx());
    a = (await consultar("SELECT estado, reemplazada_por FROM documentos WHERE source='Decisiones/decision-a.md'"))[0];
    assert.deepEqual(a, { estado: "vigente", reemplazada_por: null });
});

test("vigencia b: reemplaza a nota inexistente o ambigua → aviso, sin efecto", { skip }, async () => {
    const n = path.join(fx.vault, "Decisiones", "decision-c.md");
    fs.writeFileSync(n, "---\nreemplaza: [nada, decision-a]\n---\n# C\n");
    const r = await rag(["ingest", fx.vault], ctx());
    assert.match(r.out, /decision-c\.md: reemplaza "nada" — no existe/);
    fs.rmSync(n);
    await rag(["ingest", fx.vault], ctx());
});

test("vigencia c: revisar vencido → estado revisar; precedencia reemplazada > caduca > revisar", { skip }, async () => {
    const n = path.join(fx.vault, "Conocimiento", "creditos.md");
    fs.mkdirSync(path.dirname(n), { recursive: true });
    fs.writeFileSync(n, "---\nrevisar: 2020-01-01\n---\n# Créditos\nvencen.\n");
    await rag(["ingest", fx.vault], ctx());
    assert.equal((await consultar("SELECT estado FROM documentos WHERE source='Conocimiento/creditos.md'"))[0].estado, "revisar");
    fs.writeFileSync(n, "---\nrevisar: 2999-01-01\n---\n# Créditos\nvencen.\n");
    await rag(["ingest", fx.vault], ctx());
    assert.equal((await consultar("SELECT estado FROM documentos WHERE source='Conocimiento/creditos.md'"))[0].estado, "vigente");
    fs.rmSync(n);
    await rag(["ingest", fx.vault], ctx());
});

test("ingest --silencioso con la BD caída sale 0 y avisa; sin flag sale 1", { skip }, async () => {
    const caida = { ...ctx(), env: { PG_URL: "postgres://rag:rag@127.0.0.1:1/nada" } };
    const a = await rag(["ingest", fx.vault, "--silencioso"], caida);
    assert.equal(a.status, 0, a.out);
    assert.match(a.out, /rag no disponible/);
    const b = await rag(["ingest", fx.vault], caida);
    assert.equal(b.status, 1, b.out);
});
