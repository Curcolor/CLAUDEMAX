#!/usr/bin/env node
// Wrapper MCP stdio ligero sobre rag.mjs — sin acceso directo a la BD aquí. rag_leer no
// necesita BD: lee el archivo del vault confinado a su raíz (rag-lib.leerDocumento).
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as lib from "./rag-lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
lib.loadDotEnv(path.join(HERE, ".env"));
const RAG = path.join(HERE, "rag.mjs");
const VAULT = path.join(lib.resolverRagRoot(HERE), "V.A.U.L.T");

function run(args) {
    return new Promise(resolve => {
        execFile(process.execPath, [RAG, ...args], { timeout: 60000, windowsHide: true },
            (err, stdout, stderr) => resolve({ ok: !err, out: stdout || stderr || String(err) }));
    });
}

const COLECCIONES_DOC = lib.COLECCIONES.map(([carpeta, col, aut]) => `${col} (${carpeta}/, autoridad ${aut})`).join("; ");

const server = new Server({ name: "claudemax-rag", version: "2.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "rag_query",
            description:
                "Búsqueda semántica en el vault V.A.U.L.T (memoria narrativa: qué se decidió, por qué, qué pasó). " +
                `Colecciones: ${COLECCIONES_DOC}. ` +
                `Sin filtro quedan FUERA ${lib.EXCLUIDAS_POR_DEFECTO.join(", ")} (planes y reportes llevan código literal y copan resultados; el Inbox no está revisado) y las notas reemplazadas; pásalas explícitas en \`coleccion\` si las necesitas. ` +
                "Ante conflicto entre fuentes confía: decisiones > docs_formales/specs > entrevistas > conocimiento/aprendizaje/codigo > planes > bitacoras (gana la autoridad, no la fecha). " +
                "Cada resultado abre con [coleccion · autoridad · fecha] ruta — título; si lleva ⚠ CADUCA sus fuentes cambiaron desde que se escribió (verifica contra el código/grafo antes de confiar); ⚠ REVISAR venció su fecha de revisión; ⚠ REEMPLAZADA por otra nota. " +
                "Usa rag_leer con la ruta para el documento completo.",
            inputSchema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Pregunta en lenguaje natural (español o inglés)" },
                    coleccion: { type: "string", description: "Filtro opcional: una colección exacta (incluye las excluidas por defecto)" },
                    proyecto: { type: "string", description: "Filtro opcional por el campo `proyecto` del frontmatter — clave transversal entre colecciones" },
                    topk: { type: "number", description: "Máximo de resultados, por defecto 5" },
                },
                required: ["query"],
            },
        },
        {
            name: "rag_leer",
            description: "Devuelve el documento completo del vault por la ruta que devuelve rag_query (relativa al vault, p. ej. Decisiones/Bitrix-vs-GCP.md). Confinado al vault; tope 80 000 caracteres.",
            inputSchema: { type: "object", properties: { ruta: { type: "string", description: "Ruta relativa al vault" } }, required: ["ruta"] },
        },
        {
            name: "rag_status",
            description: "Estado del RAG: conectividad de BD/Ollama y documentos por colección, proyecto y estado de vigencia.",
            inputSchema: { type: "object", properties: {} },
        },
    ],
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
    const { name, arguments: a = {} } = req.params;
    if (name === "rag_leer") {
        const texto = lib.leerDocumento(VAULT, a.ruta);
        const esError = texto === "ruta inválida" || texto.startsWith("no existe: ");
        return { content: [{ type: "text", text: texto }], isError: esError };
    }
    let res;
    if (name === "rag_query") {
        const args = ["query", a.query];
        if (a.coleccion) args.push("--coleccion", a.coleccion);
        if (a.proyecto) args.push("--proyecto", a.proyecto);
        if (a.topk) args.push("--topk", String(a.topk));
        res = await run(args);
    } else if (name === "rag_status") {
        res = await run(["status"]);
    } else {
        return { content: [{ type: "text", text: `tool desconocida ${name}` }], isError: true };
    }
    return { content: [{ type: "text", text: res.out }], isError: !res.ok };
});

const transport = new StdioServerTransport();
await server.connect(transport);
