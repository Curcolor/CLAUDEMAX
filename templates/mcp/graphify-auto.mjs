#!/usr/bin/env node
// Envoltorio MCP de graphify para CLAUDEMAX. Registrado una sola vez a nivel usuario
// (`claude mcp add -s user graphify -- node <este archivo>`); en cada sesión localiza el
// graphify-out/graph.json del proyecto actual (CLAUDE_PROJECT_DIR, que Claude Code pasa al
// proceso del MCP; o el cwd subiendo) y lanza el servidor real de graphify sobre él como proxy
// transparente. Si falta el grafo o graphify, sirve un mini-servidor MCP con una única tool,
// graphify_estado, que dice exactamente qué falta y cómo arreglarlo — así el MCP nunca aparece
// caído en /mcp y el modelo recibe la instrucción en vez de un error opaco.
//
// Por qué un envoltorio: graphify sirve UN graph.json por servidor; registrarlo por proyecto
// obliga a tocar configuración por cada repo. Ver docs/superpowers/specs/2026-09-13-grafo-en-vivo-design.md.
// Sin dependencias; recordar que en Windows un .cmd solo se puede lanzar con shell: true.

import process from "node:process";
import { spawn } from "node:child_process";
import { resolverGrafo, resolverServidor, textoEstado } from "./graphify-auto-lib.mjs";

const DEBUG = String(process.env.GRAPHIFY_AUTO_DEBUG || "") === "1";
const log = (...a) => { if (DEBUG) process.stderr.write(a.join(" ") + "\n"); };

const proyecto = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const grafo = resolverGrafo(process.env, process.cwd());
const servidor = grafo ? resolverServidor(process.env) : null;
log("grafo:", grafo, "servidor:", servidor && servidor.cmd);

if (grafo && servidor) {
    // Proxy transparente: stdin/stdout del hijo son los del envoltorio.
    const args = [...servidor.args, grafo];
    const child = servidor.shell
        ? spawn(`"${servidor.cmd}" ${args.map(a => `"${a}"`).join(" ")}`, { stdio: "inherit", shell: true, windowsHide: true })
        : spawn(servidor.cmd, args, { stdio: "inherit", windowsHide: true });
    child.on("error", e => { log("error al lanzar:", e.message); process.exit(1); });
    child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
    for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { try { child.kill(s); } catch {} });
} else {
    servirAviso();
}

// --- Mini-servidor MCP de aviso (JSON-RPC 2.0 por stdio, una línea por mensaje) --------------

function servirAviso() {
    const TOOL = {
        name: "graphify_estado",
        description: "Diagnóstico del grafo de código de graphify para este proyecto: si falta el grafo o graphify, dice cómo generarlo o instalarlo.",
        inputSchema: { type: "object", properties: {} },
    };
    const responder = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
    const fallar = (id, code, message) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");

    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => {
        buffer += chunk;
        let i;
        while ((i = buffer.indexOf("\n")) >= 0) {
            const linea = buffer.slice(0, i).trim();
            buffer = buffer.slice(i + 1);
            if (linea) atender(linea);
        }
    });
    process.stdin.on("end", () => process.exit(0));

    function atender(linea) {
        let msg;
        try { msg = JSON.parse(linea); } catch { return; }
        const { id, method, params = {} } = msg;
        if (id === undefined || id === null) return;   // notificación: sin respuesta
        switch (method) {
            case "initialize":
                responder(id, {
                    protocolVersion: params.protocolVersion || "2024-11-05",
                    capabilities: { tools: {} },
                    serverInfo: { name: "graphify-auto", version: "1.0.0" },
                });
                break;
            case "ping":
                responder(id, {});
                break;
            case "tools/list":
                responder(id, { tools: [TOOL] });
                break;
            case "tools/call":
                if (params.name !== TOOL.name) { fallar(id, -32602, `tool desconocida: ${params.name}`); break; }
                responder(id, { content: [{ type: "text", text: textoEstado(grafo, servidor, proyecto) }], isError: false });
                break;
            default:
                fallar(id, -32601, `método no soportado por graphify-auto: ${method}`);
        }
    }
}
