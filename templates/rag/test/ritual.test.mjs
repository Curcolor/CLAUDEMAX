import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, spawnSync } from "node:child_process";

const RAG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(RAG_DIR, "..", "..");
const hayGit = spawnSync("git", ["--version"]).status === 0;

// Fecha local, como la calcula ritual.mjs (toISOString es UTC: de noche en Colombia ya es mañana).
function hoyLocal() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Workspace temporal con el layout instalado: R.A.G/ (el ritual y sus libs), .claude/proyecto.md,
// V.A.U.L.T/Hubs/_proyecto.md y un repo MiRepo/ con .git/ (basta el directorio).
function workspace() {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "ritual-"));
    fs.mkdirSync(path.join(ws, "R.A.G"));
    for (const f of ["ritual.mjs", "rag-lib.mjs", "proyectos-lib.mjs", "indices-lib.mjs", "rituales-lib.mjs"]) {
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
function ritual(ws, args, env = {}, cwd = ws) {
    return new Promise(resolve => {
        const base = { ...process.env };
        delete base.RAG_ROOT;
        execFile(process.execPath, [path.join(ws, "R.A.G", "ritual.mjs"), ...args],
            { cwd, env: { ...base, ...env }, encoding: "utf8", timeout: 60_000 },
            (err, stdout, stderr) => resolve({ status: err ? (typeof err.code === "number" ? err.code : 1) : 0, out: `${stdout}${stderr}` }));
    });
}

const leer = (...p) => fs.readFileSync(path.join(...p), "utf8");

// Vault con las plantillas de los rituales, los hubs que enlazan y Pendientes.md de fábrica.
function vaultCompleto(ws) {
    const V = p => path.join(ws, "V.A.U.L.T", p);
    for (const d of ["Plantillas", "Hubs", "Superpowers/Sesiones", "Superpowers/Specs", "Superpowers/Planes", "Bitacoras", "Codigo"]) {
        fs.mkdirSync(V(d), { recursive: true });
    }
    for (const f of ["sesion.md", "bitacora.md", "cierre.md"]) {
        fs.copyFileSync(path.join(REPO, "templates", "vault", "Plantillas", f), V(`Plantillas/${f}`));
    }
    for (const h of ["Superpowers-Sesiones", "Superpowers-Specs", "Superpowers-Planes", "Bitacoras", "Codigo"]) {
        fs.writeFileSync(V(`Hubs/${h}.md`), `---\ntags: [hub]\n---\n\n# ${h}\n\n## Notas\n-\n\nRelacionado: [[Bienvenida]]\n`);
    }
    fs.copyFileSync(path.join(REPO, "templates", "vault", "Hubs", "Pendientes.md"), V("Hubs/Pendientes.md"));
}

// Repo git de verdad (sustituye el .git/ vacío de workspace()) con un primer commit.
function repoGit(ws, nombre = "MiRepo") {
    const repo = path.join(ws, nombre);
    fs.rmSync(path.join(repo, ".git"), { recursive: true, force: true });
    fs.mkdirSync(path.join(repo, "docs", "superpowers", "specs"), { recursive: true });
    fs.mkdirSync(path.join(repo, "src"), { recursive: true });
    const git = args => spawnSync("git", args, { cwd: repo, encoding: "utf8" });
    git(["init", "-q"]);
    git(["config", "user.email", "prueba@example.com"]);
    git(["config", "user.name", "Prueba"]);
    fs.writeFileSync(path.join(repo, "src", "motor.cs"), "// v1\n");
    git(["add", "-A"]);
    git(["commit", "-qm", "primer commit"]);
    return { repo, git };
}

// La ficha del proyecto declara que publica sus specs en el repo.
function docsEnRepo(ws, nombre = "MiRepo") {
    const ficha = path.join(ws, ".claude", "proyectos", `${nombre}.md`);
    fs.writeFileSync(ficha, leer(ficha).replace("docs_en_repo: false", "docs_en_repo: true"));
}

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

test("fin-sesion: nota desde la plantilla con commit, enlazada en su hub y con los specs del ciclo; la siguiente solo lista lo nuevo",
    { skip: !hayGit && "sin git" }, async () => {
        const { ws, limpiar } = workspace();
        try {
            vaultCompleto(ws);
            const { repo, git } = repoGit(ws);
            await ritual(ws, ["init-proyecto", repo, "--sin-indexar"]);
            docsEnRepo(ws);
            fs.writeFileSync(path.join(repo, "docs", "superpowers", "specs", "2026-09-20-x-design.md"), "# Spec\n");
            git(["add", "-A"]);
            git(["commit", "-qm", "spec del ciclo"]);
            const head = git(["rev-parse", "HEAD"]).stdout.trim();
            const r = await ritual(ws, ["fin-sesion"], {}, repo);
            assert.equal(r.status, 0, r.out);
            const dir = path.join(ws, "V.A.U.L.T", "Superpowers", "Sesiones");
            const [nota] = fs.readdirSync(dir);
            const texto = leer(dir, nota);
            assert.match(texto, /^---\nproyecto: MiRepo\n/);
            assert.ok(texto.includes(`commit: ${head}`), texto);
            assert.match(texto, /# Sesión — \d{4}-\d{2}-\d{2} · MiRepo/);
            assert.match(texto, /## Qué se hizo de verdad/);
            assert.match(texto, /- Spec: `MiRepo\/docs\/superpowers\/specs\/2026-09-20-x-design\.md`/, "del repo, en backticks");
            assert.ok(leer(ws, "V.A.U.L.T", "Hubs", "Superpowers-Sesiones.md").includes(`[[${nota.replace(".md", "")}]]`), "enlazada en su hub");
            assert.match(r.out, /escribe/i);
            // segunda sesión tras otro spec: solo el nuevo
            fs.writeFileSync(path.join(repo, "docs", "superpowers", "specs", "2026-09-21-y-design.md"), "# Otro\n");
            git(["add", "-A"]);
            git(["commit", "-qm", "otro spec"]);
            const r2 = await ritual(ws, ["fin-sesion", "--resumen", "hecho", "--siguiente", "lo otro"], {}, repo);
            assert.equal(r2.status, 0, r2.out);
            const segunda = fs.readdirSync(dir).filter(f => f !== nota).map(f => leer(dir, f))[0];
            assert.match(segunda, /2026-09-21-y-design/);
            assert.ok(!segunda.includes("2026-09-20-x-design"), "el spec del ciclo anterior ya no cuenta");
            assert.match(segunda, /## Qué se hizo de verdad\nhecho\n/);
            assert.match(segunda, /## Qué sigue\nlo otro\n/);
        } finally { limpiar(); }
    });

test("fin-sesion sin repo git: crea el esqueleto, lo enlaza y avisa", async () => {
    const { ws, limpiar } = workspace();
    try {
        vaultCompleto(ws);
        const suelto = path.join(ws, "suelto");
        fs.mkdirSync(suelto);
        const r = await ritual(ws, ["fin-sesion", "--proyecto", "Suelto"], {}, suelto);
        assert.equal(r.status, 0, r.out);
        assert.match(r.out, /no hay repo git/);
        const dir = path.join(ws, "V.A.U.L.T", "Superpowers", "Sesiones");
        const texto = leer(dir, fs.readdirSync(dir)[0]);
        assert.match(texto, /^---\nproyecto: Suelto\n/);
        assert.match(texto, /^commit:\s*$/m);
        assert.equal((await ritual(ws, ["fin-sesion", "--vault", path.join(ws, "no-existe")], {}, suelto)).status, 1,
            "sin vault es el único error que aborta");
    } finally { limpiar(); }
});
