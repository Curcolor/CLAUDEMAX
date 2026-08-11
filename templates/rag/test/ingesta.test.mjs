// Pruebas de regresión de `rag.mjs ingest`. Cubren los dos fallos que rompían el índice:
// el crash por chunks duplicados dentro de un mismo archivo y la pérdida silenciosa de
// los chunks sin cambios en la segunda pasada.
//
// Ejecutar:  node templates/rag/test/ingesta.test.mjs
//
// No hace falta Postgres, ni Ollama, ni `npm install`: entorno.mjs sustituye el driver
// `pg` por uno en memoria que hace cumplir el UNIQUE(source, content_hash) real y stubea
// las llamadas de embeddings. Lo que se ejecuta es el rag.mjs de verdad, como subproceso.

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAG = path.join(AQUI, "..", "rag.mjs");
const ENTORNO = pathToFileURL(path.join(AQUI, "entorno.mjs")).href;

// Monta un vault temporal y devuelve helpers para ingerirlo y leer la tabla resultante.
function bancoDePruebas() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rag-prueba-"));
    const bd = path.join(dir, "tabla.json");
    const registroLotes = path.join(dir, "lotes.txt");
    return {
        dir,
        escribir(nombre, contenido) {
            const destino = path.join(dir, nombre);
            fs.mkdirSync(path.dirname(destino), { recursive: true });
            fs.writeFileSync(destino, contenido);
            return destino;
        },
        ingerir(extraEnv = {}) {
            return execFileSync(process.execPath, ["--import", ENTORNO, RAG, "ingest", dir], {
                encoding: "utf8",
                env: {
                    ...process.env,
                    RAG_FAKE_PG_FILE: bd,
                    RAG_FAKE_EMBED_LOG: registroLotes,
                    EMBED_BACKEND: "ollama",
                    ...extraEnv
                }
            });
        },
        filas() {
            try { return JSON.parse(fs.readFileSync(bd, "utf8")); }
            catch { return []; }
        },
        // Tamaño de cada POST a /api/embed, en orden.
        lotes() {
            try { return fs.readFileSync(registroLotes, "utf8").trim().split("\n").filter(Boolean).map(Number); }
            catch { return []; }
        }
    };
}

const sha1 = t => crypto.createHash("sha1").update(t).digest("hex");

const FRONTMATTER = "---\ncategoria: codigo\nproyecto: pruebas\n---\n";

// Fallo 1: dos secciones de contenido idéntico en el MISMO archivo producen el mismo sha1.
// Ninguna está todavía en la BD, así que el pre-check contra la BD deja pasar las dos y el
// segundo INSERT viola chunks_source_hash, abortando la ingesta completa.
test("chunks duplicados dentro de un archivo no revientan la ingesta", () => {
    const banco = bancoDePruebas();
    banco.escribir("duplicados.md", `${FRONTMATTER}## Repetido\nmismo texto\n\n## Repetido\nmismo texto\n`);

    const salida = banco.ingerir();

    assert.match(salida, /ingesta completa/, "la ingesta debió terminar sin abortar");
    const filas = banco.filas();
    assert.equal(filas.length, 1, "el chunk repetido debe indexarse una sola vez");
});

// Fallo 2: el DELETE total por `source` borraba TODOS los chunks del archivo y solo se
// reinsertaban los `fresh`, así que los contados como `skipped` (sin cambios) desaparecían
// del índice sin aviso.
test("un chunk sin cambios sobrevive a una segunda pasada", () => {
    const banco = bancoDePruebas();
    const alfa = "## Alfa\ncontenido alfa";
    const beta = "## Beta\ncontenido beta";
    const gamma = "## Gamma\ncontenido gamma";

    banco.escribir("nota.md", `${FRONTMATTER}${alfa}\n\n${beta}\n`);
    banco.ingerir();
    assert.equal(banco.filas().length, 2, "la primera pasada debe indexar los dos chunks");

    // Segunda pasada: Alfa y Beta intactos, Gamma nuevo.
    banco.escribir("nota.md", `${FRONTMATTER}${alfa}\n\n${beta}\n\n${gamma}\n`);
    const salida = banco.ingerir();

    assert.match(salida, /2 sin cambios/, "Alfa y Beta debieron contarse como sin cambios");
    const hashes = banco.filas().map(f => f.content_hash);
    assert.equal(hashes.length, 3, "los dos chunks intactos deben seguir en el índice junto al nuevo");
    for (const [nombre, texto] of [["Alfa", alfa], ["Beta", beta], ["Gamma", gamma]]) {
        assert.ok(hashes.includes(sha1(texto)), `el chunk ${nombre} desapareció del índice`);
    }
});

// Contrapartida del fallo 2: acotar el DELETE no debe convertirlo en un no-op. Lo que ya
// no está en el archivo tiene que seguir saliendo del índice.
test("un chunk eliminado del archivo sí se borra del índice", () => {
    const banco = bancoDePruebas();
    const alfa = "## Alfa\ncontenido alfa";
    const beta = "## Beta\ncontenido beta";
    const gamma = "## Gamma\ncontenido gamma";

    banco.escribir("nota.md", `${FRONTMATTER}${alfa}\n\n${beta}\n`);
    banco.ingerir();

    // Beta desaparece, Gamma entra: el DELETE acotado debe llevarse solo a Beta.
    banco.escribir("nota.md", `${FRONTMATTER}${alfa}\n\n${gamma}\n`);
    banco.ingerir();

    const hashes = banco.filas().map(f => f.content_hash);
    assert.deepEqual(hashes.sort(), [sha1(alfa), sha1(gamma)].sort());
});

// Fallo 4: embedOllama mandaba el array COMPLETO de textos en un único POST. Un grafo de
// Graphify emite un chunk por nodo (11738 en qaforge), así que el cuerpo tumbaba la
// conexión y la ingesta moría con un escueto "fetch failed". Aquí se baja EMBED_BATCH a 4
// para observar el troceo con un grafo pequeño: lo que se verifica es que NINGUNA petición
// lleve el corpus entero, no el valor concreto del lote.
test("el corpus se trocea en lotes de EMBED_BATCH", () => {
    const banco = bancoDePruebas();
    const nodes = Array.from({ length: 10 }, (_, i) => ({
        id: `n${i}`, label: `nodo ${i}`, type: "function", summary: `resumen del nodo ${i}`
    }));
    banco.escribir(path.join("graphify-out", "graph.json"), JSON.stringify({ nodes, links: [] }));

    banco.ingerir({ EMBED_BATCH: "4" });

    assert.equal(banco.filas().length, 10, "debe indexarse un chunk por nodo del grafo");
    const lotes = banco.lotes();
    assert.deepEqual(lotes, [4, 4, 2], "10 nodos con EMBED_BATCH=4 son tres peticiones");
    assert.ok(Math.max(...lotes) <= 4, "ninguna petición debe superar el tamaño de lote");
});

// Fallo 3: `_plantilla.md` es el molde que se copia para crear una nota. Su frontmatter
// está vacío a propósito y lleva comentarios explicativos que, al ingerirse, entraban
// como VALORES de proyecto y categoria y ensuciaban la taxonomía.
test("los archivos con prefijo _ no se indexan", () => {
    const banco = bancoDePruebas();
    banco.escribir("_plantilla.md", "---\ncategoria: # obligatoria — una de: codigo | proyectos\nproyecto: # opcional — clave transversal\n---\n## Molde\ncuerpo de la plantilla\n");
    banco.escribir("nota.md", `${FRONTMATTER}## Alfa\ncontenido alfa\n`);

    banco.ingerir();

    const fuentes = banco.filas().map(f => path.basename(f.source));
    assert.deepEqual(fuentes, ["nota.md"], "la plantilla no debe entrar al índice");
});
