import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const RAG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(RAG_DIR, "..", "..");

// Workspace temporal con el layout instalado: R.A.G/ (el ritual y sus libs), .claude/proyecto.md,
// V.A.U.L.T/Hubs/_proyecto.md y un repo MiRepo/ con .git/ (basta el directorio).
function workspace() {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "ritual-"));
    fs.mkdirSync(path.join(ws, "R.A.G"));
    for (const f of ["ritual.mjs", "rag-lib.mjs", "proyectos-lib.mjs", "indices-lib.mjs"]) {
        fs.copyFileSync(path.join(RAG_DIR, f), path.join(ws, "R.A.G", f));
    }
    fs.mkdirSync(path.join(ws, ".claude"));
    fs.copyFileSync(path.join(REPO, "templates", "rules", "proyecto.md"), path.join(ws, ".claude", "proyecto.md"));
    fs.mkdirSync(path.join(ws, "V.A.U.L.T", "Hubs"), { recursive: true });
    fs.copyFileSync(path.join(REPO, "templates", "vault", "Hubs", "_proyecto.md"), path.join(ws, "V.A.U.L.T", "Hubs", "_proyecto.md"));
    fs.mkdirSync(path.join(ws, "MiRepo", ".git"), { recursive: true });
    return { ws, limpiar: () => fs.rmSync(ws, { recursive: true, force: true }) };
}

// Ejecuta el ritual copiado. RAG_ROOT se quita del entorno: nunca debe apuntar al workspace real.
function ritual(ws, args, env = {}) {
    return new Promise(resolve => {
        const base = { ...process.env };
        delete base.RAG_ROOT;
        execFile(process.execPath, [path.join(ws, "R.A.G", "ritual.mjs"), ...args],
            { cwd: ws, env: { ...base, ...env }, encoding: "utf8", timeout: 60_000 },
            (err, stdout, stderr) => resolve({ status: err ? (typeof err.code === "number" ? err.code : 1) : 0, out: `${stdout}${stderr}` }));
    });
}

const leer = (...p) => fs.readFileSync(path.join(...p), "utf8");

test("init-proyecto: contexto en .claude/proyectos, índice, hub y .gitignore; nada dentro del repo", async () => {
    const { ws, limpiar } = workspace();
    try {
        const r = await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo"), "--descripcion", "API de catálogos", "--sin-indexar"]);
        assert.equal(r.status, 0, r.out);
        const ctx = leer(ws, ".claude", "proyectos", "MiRepo.md");
        assert.ok(!ctx.includes("{{"), "sin marcadores");
        assert.match(ctx, /^---\r?\nproyecto: MiRepo\r?\nruta: MiRepo\r?\ndescripcion: API de catálogos\r?\ninicializado: \d{4}-\d{2}-\d{2}\r?\ndocs_en_repo: false\r?\n---/);
        assert.match(ctx, /## Estructura/);
        assert.ok(ctx.includes(`(\`${path.join(ws, "MiRepo").replace(/\\/g, "/")}\`)`), "ruta absoluta con /");
        assert.match(leer(ws, ".claude", "proyectos", "_indice.md"), /^- \*\*MiRepo\*\* — `MiRepo` — API de catálogos @MiRepo\.md$/m);
        assert.ok(fs.existsSync(path.join(ws, "V.A.U.L.T", "Hubs", "MiRepo.md")));
        assert.equal(leer(ws, "MiRepo", ".gitignore"),
            "# CLAUDEMAX: el contexto de Claude vive en el workspace, no en el repo\n/CLAUDE.md\n/CLAUDE.local.md\n/.claude/\n");
        assert.ok(!fs.existsSync(path.join(ws, "MiRepo", ".claude")), "nada de .claude/ dentro del repo");
        assert.match(r.out, /--sin-indexar/);
    } finally { limpiar(); }
});

test("init-proyecto: segundo proyecto con espacios, índice con dos, idempotente y respeta lo editado", async () => {
    const { ws, limpiar } = workspace();
    try {
        await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo"), "--sin-indexar"]);
        const ctxPath = path.join(ws, ".claude", "proyectos", "MiRepo.md");
        fs.appendFileSync(ctxPath, "\nEDITADO A MANO\n");
        const giAntes = leer(ws, "MiRepo", ".gitignore");
        fs.mkdirSync(path.join(ws, "Herramientas", "Otro Repo"), { recursive: true });
        const r = await ritual(ws, ["init-proyecto", path.join(ws, "Herramientas", "Otro Repo"), "--descripcion", "x", "--sin-indexar"]);
        assert.equal(r.status, 0, r.out);
        const r2 = await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo"), "--sin-indexar"]);
        assert.match(r2.out, /ya existe — se respeta/);
        assert.match(leer(ctxPath), /EDITADO A MANO/);
        assert.equal(leer(ws, "MiRepo", ".gitignore"), giAntes, "gitignore idempotente");
        const indice = leer(ws, ".claude", "proyectos", "_indice.md");
        assert.match(indice, /^- \*\*MiRepo\*\* — `MiRepo` — \(sin descripción\) @MiRepo\.md$/m);
        assert.match(indice, /^- \*\*Otro Repo\*\* — `Herramientas\/Otro Repo` — x @Otro-Repo\.md$/m);
        assert.ok(!fs.existsSync(path.join(ws, "Herramientas", "Otro Repo", ".gitignore")), "sin .git no se crea .gitignore");
        assert.ok(fs.existsSync(path.join(ws, "V.A.U.L.T", "Hubs", "Otro Repo.md")));
    } finally { limpiar(); }
});

test("init-proyecto: --sin-gitignore, aviso del diseño anterior, slug en uso por otro proyecto y ruta ausente", async () => {
    const { ws, limpiar } = workspace();
    try {
        const viejo = path.join(ws, "MiRepo", ".claude", "CLAUDEMAX.md");
        fs.mkdirSync(path.dirname(viejo), { recursive: true });
        fs.writeFileSync(viejo, "# Reglas de CLAUDEMAX — MiRepo\n\nEste proyecto hereda…\n");
        const r = await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo"), "--sin-gitignore", "--sin-indexar"]);
        assert.equal(r.status, 0, r.out);
        assert.ok(!fs.existsSync(path.join(ws, "MiRepo", ".gitignore")));
        assert.match(r.out, /diseño anterior/);
        assert.ok(fs.existsSync(viejo), "no borra nada");
        fs.mkdirSync(path.join(ws, "Mi Repo"));
        await ritual(ws, ["init-proyecto", path.join(ws, "Mi Repo"), "--sin-indexar"]);
        fs.mkdirSync(path.join(ws, "otro"));
        const r2 = await ritual(ws, ["init-proyecto", path.join(ws, "otro"), "--proyecto", "Mi-Repo", "--sin-indexar"]);
        assert.match(r2.out, /es de "Mi Repo"/);
        assert.match(leer(ws, ".claude", "proyectos", "Mi-Repo.md"), /^---\r?\nproyecto: Mi Repo\r?\n/);
        assert.equal((await ritual(ws, ["init-proyecto"])).status, 1);
    } finally { limpiar(); }
});

test("init-proyecto sin --sin-indexar y sin binarios: avisa cómo instalar ambos y sale 0", async () => {
    const { ws, limpiar } = workspace();
    const vacio = fs.mkdtempSync(path.join(os.tmpdir(), "sin-path-"));
    try {
        const r = await ritual(ws, ["init-proyecto", path.join(ws, "MiRepo")], { PATH: vacio, Path: vacio });
        assert.equal(r.status, 0, r.out);
        assert.match(r.out, /install\.sh --only codebase-memory/);
        assert.match(r.out, /install\.sh --only graphify/);
    } finally {
        limpiar();
        fs.rmSync(vacio, { recursive: true, force: true });
    }
});
