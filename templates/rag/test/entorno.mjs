// Precarga (`node --import`) que aísla a rag.mjs de sus dos dependencias externas antes de
// que se evalúe: el driver `pg` y el servidor de Ollama. Con esto la ingesta real se
// ejecuta entera —walkSources, hashing, pre-check, DELETE, INSERT— sin contenedor,
// sin red y sin `npm install`.

import fs from "node:fs";
import { register } from "node:module";

// Hook de resolución inline: redirige el especificador "pg" al driver falso. Va como
// data: URL para no dejar un cuarto archivo cuyo único contenido sea este redirect.
const hook = `
    let destino;
    export function initialize(d) { destino = d.destino; }
    export async function resolve(especificador, contexto, next) {
        if (especificador === "pg") return { url: destino, shortCircuit: true };
        return next(especificador, contexto);
    }
`;
register(`data:text/javascript,${encodeURIComponent(hook)}`, import.meta.url, {
    data: { destino: new URL("./pg-falso.mjs", import.meta.url).href }
});

// Embeddings deterministas con la dimensión que valida rag.mjs (DIMS = 1024). El
// contenido del vector da igual: ninguna de estas pruebas mide relevancia.
//
// Si RAG_FAKE_EMBED_LOG apunta a un archivo, se anota el tamaño de cada petición: es la
// única forma de observar desde fuera que embedOllama trocea en lotes en vez de mandar
// el corpus entero de una vez.
globalThis.fetch = async (url, opciones = {}) => {
    if (!String(url).includes("/api/embed")) throw new Error(`fetch inesperado a ${url}`);
    const { input } = JSON.parse(opciones.body);
    if (process.env.RAG_FAKE_EMBED_LOG) {
        fs.appendFileSync(process.env.RAG_FAKE_EMBED_LOG, `${input.length}\n`);
    }
    const embeddings = input.map(() => Array(1024).fill(0.001));
    return {
        ok: true,
        status: 200,
        json: async () => ({ embeddings }),
        text: async () => ""
    };
};
