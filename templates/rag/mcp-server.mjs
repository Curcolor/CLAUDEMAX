#!/usr/bin/env node
// Thin MCP stdio wrapper over rag.mjs — no direct DB access here.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAG = path.join(HERE, "rag.mjs");

function run(args) {
    return new Promise(resolve => {
        execFile(process.execPath, [RAG, ...args], { timeout: 60000 },
            (err, stdout, stderr) => resolve({ ok: !err, out: stdout || stderr || String(err) }));
    });
}

const server = new Server(
    { name: "claudemax-rag", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "rag_query",
            description: "Semantic search over the CLAUDEMAX knowledge base (V.A.U.L.T notes indexed in PGVector). Returns matching chunks with source, heading and score.",
            inputSchema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Natural-language question (Spanish or English)" },
                    project: { type: "string", description: "Optional project filter (folder name under Projects/)" },
                    topk: { type: "number", description: "Max results, default 5" }
                },
                required: ["query"]
            }
        },
        {
            name: "rag_status",
            description: "RAG health: DB/Ollama connectivity and chunk counts per project.",
            inputSchema: { type: "object", properties: {} }
        }
    ]
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
    const { name, arguments: a = {} } = req.params;
    let res;
    if (name === "rag_query") {
        const args = ["query", a.query, "--json"];
        if (a.project) args.push("--project", a.project);
        if (a.topk) args.push("--topk", String(a.topk));
        res = await run(args);
    } else if (name === "rag_status") {
        res = await run(["status"]);
    } else {
        return { content: [{ type: "text", text: `unknown tool ${name}` }], isError: true };
    }
    return { content: [{ type: "text", text: res.out }], isError: !res.ok };
});

const transport = new StdioServerTransport();
await server.connect(transport);
