import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, spawnSync } from "node:child_process";

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "session-start.mjs");
const hayGit = spawnSync("git", ["--version"]).status === 0;

function correr(cwd) {
    return new Promise(resolve => {
        const env = { ...process.env };
        delete env.CLAUDEMAX_RAG_DIR;
        delete env.CLAUDEMAX_SESSION_CONTEXT;
        const child = execFile(process.execPath, [HOOK], { env, timeout: 20_000 },
            (err, stdout) => resolve({ status: err ? (err.code ?? 1) : 0, stdout }));
        child.stdin.end(JSON.stringify({ hook_event_name: "SessionStart", source: "startup", cwd }));
    });
}

test("session-start: avisa si el repo no tiene contexto en .claude/proyectos/; calla si lo tiene por nombre o por ruta, o si no hay workspace",
    { skip: !hayGit && "sin git" }, async () => {
        const ws = fs.mkdtempSync(path.join(os.tmpdir(), "ss-"));
        try {
            const repo = path.join(ws, "MiRepo");
            fs.mkdirSync(repo);
            assert.equal(spawnSync("git", ["init", "-q"], { cwd: repo }).status, 0);
            assert.equal((await correr(repo)).stdout, "", "sin .claude/proyectos/ arriba no dice nada");
            const proyectos = path.join(ws, ".claude", "proyectos");
            fs.mkdirSync(proyectos, { recursive: true });
            const r = await correr(repo);
            assert.equal(r.status, 0);
            assert.match(r.stdout, /Sin contexto de proyecto para "MiRepo"/);
            assert.match(r.stdout, /ritual\.mjs" init-proyecto/);
            fs.writeFileSync(path.join(proyectos, "api.md"), "---\nproyecto: api\nruta: MiRepo\n---\n");
            assert.equal((await correr(repo)).stdout, "", "por ruta");
            fs.rmSync(path.join(proyectos, "api.md"));
            fs.writeFileSync(path.join(proyectos, "MiRepo.md"), "---\nproyecto: MiRepo\nruta: otra/cosa\n---\n");
            assert.equal((await correr(repo)).stdout, "", "por nombre");
        } finally {
            fs.rmSync(ws, { recursive: true, force: true });
        }
    });
