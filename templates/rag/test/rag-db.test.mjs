import { test, before, after } from "node:test";
import assert from "node:assert/strict";
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
