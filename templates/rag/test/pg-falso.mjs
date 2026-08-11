// Driver `pg` falso, en memoria, para las pruebas de ingesta. Sustituye a la dependencia
// real vía un hook de resolución (ver entorno.mjs), así que las pruebas corren sin
// contenedor de Postgres y sin `npm install`.
//
// Lo único que le importa a estas pruebas es que reproduzca fielmente la restricción que
// provoca el fallo: el índice chunks_source_hash es UNIQUE(source, content_hash)
// (schema.sql:12), y un INSERT que la viole revienta con SQLSTATE 23505. Si el falso no
// la hiciera cumplir, la prueba del bug de duplicados pasaría en vacío.
//
// El estado vive en el JSON que apunta RAG_FAKE_PG_FILE para que dos ejecuciones seguidas
// de `rag.mjs ingest` compartan tabla, que es como se observa la pérdida de chunks.

import fs from "node:fs";

const ARCHIVO = process.env.RAG_FAKE_PG_FILE;

// Cualquier SQL que este falso no entienda es un fallo de la prueba, no algo a ignorar:
// si rag.mjs cambia de consulta, queremos enterarnos en vez de seguir validando en vacío.
function noReconocido(sql) {
    throw new Error(`pg-falso: SQL no reconocido — ${sql}`);
}

export class Client {
    constructor() { this.filas = []; }

    async connect() {
        if (!ARCHIVO) throw new Error("pg-falso: falta la variable RAG_FAKE_PG_FILE");
        try { this.filas = JSON.parse(fs.readFileSync(ARCHIVO, "utf8")); }
        catch { this.filas = []; }
    }

    async end() {
        fs.writeFileSync(ARCHIVO, JSON.stringify(this.filas, null, 2));
    }

    async query(sql, params = []) {
        const q = String(sql).replace(/\s+/g, " ").trim();

        if (/^SELECT 1 FROM chunks WHERE source=\$1 AND content_hash=\$2$/.test(q)) {
            const hit = this.filas.filter(f => f.source === params[0] && f.content_hash === params[1]);
            return { rows: hit, rowCount: hit.length };
        }

        // El DELETE acotado que introduce el fix 2. Se comprueba ANTES que el DELETE total
        // porque el prefijo del primero es idéntico al segundo.
        if (/^DELETE FROM chunks WHERE source=\$1 AND content_hash <> ALL\(\$2::text\[\]\)$/.test(q)) {
            const conservar = new Set(params[1]);
            const antes = this.filas.length;
            this.filas = this.filas.filter(f => f.source !== params[0] || conservar.has(f.content_hash));
            return { rows: [], rowCount: antes - this.filas.length };
        }

        // DELETE total por source: el que hacía el código roto dentro del bucle, y el que
        // sigue usando la limpieza de archivos desaparecidos al final de cmdIngest.
        if (/^DELETE FROM chunks WHERE source=\$1$/.test(q)) {
            const antes = this.filas.length;
            this.filas = this.filas.filter(f => f.source !== params[0]);
            return { rows: [], rowCount: antes - this.filas.length };
        }

        if (/^INSERT INTO chunks /.test(q)) {
            const [source, categoria, proyecto, tags, heading, content, content_hash, mtime] = params;
            if (this.filas.some(f => f.source === source && f.content_hash === content_hash)) {
                // Mismo mensaje y SQLSTATE que devuelve Postgres al violar el índice único.
                const e = new Error('duplicate key value violates unique constraint "chunks_source_hash"');
                e.code = "23505";
                throw e;
            }
            this.filas.push({ source, categoria, proyecto, tags, heading, content, content_hash, mtime });
            return { rows: [], rowCount: 1 };
        }

        if (/^SELECT DISTINCT source FROM chunks$/.test(q)) {
            const fuentes = [...new Set(this.filas.map(f => f.source))].map(source => ({ source }));
            return { rows: fuentes, rowCount: fuentes.length };
        }

        return noReconocido(q);
    }
}

export default { Client };
