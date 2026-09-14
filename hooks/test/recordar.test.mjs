import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import {
    parseRecordatorio, globARegex, textoDelTool, coincide,
    buscarDirectorios, cargarRecordatorios,
    rutaEstado, leerEstado, filtrarPorSesion, guardarEstado,
} from "../recordar-lib.mjs";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "recordatorios");

test("parseRecordatorio: listas en línea y en bloque, booleanos, nota plegada, cuerpo", () => {
    const texto = [
        "---",
        "tools: [Bash, PowerShell]",
        "patrones:",
        "  - '\\bgcloud\\b'",
        "  - \"\\bkubectl\\s+apply\\b\"",
        "rutas: [\"**/*.cs\"]",
        "siempre: [Bash]",
        "una_vez_por_sesion: true",
        "activo: false",
        "nota: >",
        "  2026-09-02: desplegué sin leer.",
        "  Segunda línea.",
        "---",
        "TEXTO",
        "con dos líneas",
    ].join("\n");
    const r = parseRecordatorio(texto, "x.md");
    assert.equal(r.ok, true, r.motivo);
    assert.deepEqual(r.tools, ["Bash", "PowerShell"]);
    assert.deepEqual(r.patrones.map(p => p.source), ["\\bgcloud\\b", "\\bkubectl\\s+apply\\b"]);
    assert.ok(r.patrones.every(p => p.flags.includes("i")));
    assert.deepEqual(r.rutas, ["**/*.cs"]);
    assert.deepEqual(r.siempre, ["Bash"]);
    assert.equal(r.unaVezPorSesion, true);
    assert.equal(r.activo, false);
    assert.equal(r.nota, "2026-09-02: desplegué sin leer. Segunda línea.");
    assert.equal(r.cuerpo, "TEXTO\ncon dos líneas");
    assert.equal(r.nombre, "x.md");
});

test("parseRecordatorio: valores por defecto", () => {
    const r = parseRecordatorio("---\ntools: [Grep]\n---\nhola\n", "g.md");
    assert.equal(r.ok, true);
    assert.deepEqual(r.patrones, []);
    assert.deepEqual(r.rutas, []);
    assert.deepEqual(r.siempre, []);
    assert.equal(r.unaVezPorSesion, false);
    assert.equal(r.activo, true);
    assert.equal(r.cuerpo, "hola");
});

test("parseRecordatorio: inválidos con motivo — sin tools, sin cierre, regex rota, cuerpo vacío", () => {
    assert.match(parseRecordatorio("---\npatrones: [x]\n---\ncuerpo", "a.md").motivo, /tools/);
    assert.match(parseRecordatorio("---\ntools: [Bash]\ncuerpo", "b.md").motivo, /sin cierre/);
    assert.match(parseRecordatorio("---\ntools: [Bash]\npatrones: ['(']\n---\ncuerpo", "c.md").motivo, /regex/);
    assert.match(parseRecordatorio("---\ntools: [Bash]\n---\n\n", "d.md").motivo, /cuerpo vacío/);
    assert.match(parseRecordatorio("sin frontmatter", "e.md").motivo, /frontmatter/);
    assert.equal(parseRecordatorio("---\npatrones: [x]\n---\ncuerpo", "a.md").ok, false);
});

test("globARegex: *, ?, ** y rutas con barra invertida", () => {
    const re = globARegex("**/V.A.U.L.T/**/*.md");
    assert.ok(re.test("C:/Users/x/WORKSPACE/V.A.U.L.T/Decisiones/a.md"));
    assert.ok(re.test("V.A.U.L.T/a.md"));
    assert.ok(!re.test("C:/Users/x/VAULT/a.md"));
    assert.ok(!re.test("C:/Users/x/V.A.U.L.T/a.txt"));
    assert.ok(globARegex("**/*.cs").test("C:/repo/src/Foo.cs"));
    assert.ok(!globARegex("**/*.cs").test("C:/repo/src/Foo.csproj"));
    assert.ok(globARegex("**/MaestraSuite/**/*.xaml").test("D:\\w\\MaestraSuite\\src\\UI\\Main.xaml".replace(/\\/g, "/")));
    assert.ok(globARegex("src/?.cs").test("src/a.cs"));
    assert.ok(!globARegex("src/?.cs").test("src/ab.cs"));
});

test("textoDelTool: qué texto se prueba por tool", () => {
    assert.equal(textoDelTool("Bash", { command: "ls -la" }), "ls -la");
    assert.equal(textoDelTool("PowerShell", { command: "Get-ChildItem" }), "Get-ChildItem");
    assert.equal(textoDelTool("Grep", { pattern: "foo", path: "src" }), "foo src");
    assert.equal(textoDelTool("Edit", { file_path: "C:\\a\\b.cs" }), "C:/a/b.cs");
    assert.equal(textoDelTool("Write", { file_path: "x.md" }), "x.md");
    assert.equal(textoDelTool("Glob", { pattern: "**/*.ts" }), "**/*.ts");
    assert.equal(textoDelTool("Desconocida", { command: "x" }), "");
});

const rec = (over = {}) => ({
    ok: true, nombre: "r.md", tools: ["Bash"], patrones: [], rutas: [], siempre: [],
    unaVezPorSesion: false, activo: true, nota: "", cuerpo: "T", ...over,
});

test("coincide: tabla", () => {
    // tool fuera de tools → no
    assert.equal(coincide(rec(), "Grep", { pattern: "x" }), false);
    // sin patrones ni rutas → siempre
    assert.equal(coincide(rec(), "Bash", { command: "ls" }), true);
    // patrones casa / no casa, case-insensitive
    assert.equal(coincide(rec({ patrones: [/\bgcloud\b/i] }), "Bash", { command: "GCLOUD run deploy" }), true);
    assert.equal(coincide(rec({ patrones: [/\bgcloud\b/i] }), "Bash", { command: "ls" }), false);
    // rutas casa / no casa, con barras invertidas
    const e = rec({ tools: ["Edit"], rutas: ["**/*.cs"] });
    assert.equal(coincide(e, "Edit", { file_path: "C:\\repo\\A.cs" }), true);
    assert.equal(coincide(e, "Edit", { file_path: "C:\\repo\\A.md" }), false);
    // ambos → basta uno
    const ambos = rec({ tools: ["Edit"], patrones: [/Foo/], rutas: ["**/*.xaml"] });
    assert.equal(coincide(ambos, "Edit", { file_path: "C:/repo/Foo.cs" }), true);
    assert.equal(coincide(ambos, "Edit", { file_path: "C:/repo/Bar.xaml" }), true);
    assert.equal(coincide(ambos, "Edit", { file_path: "C:/repo/Bar.cs" }), false);
    // siempre → sí aunque no case ningún patrón
    const s = rec({ tools: ["Grep", "Bash"], siempre: ["Grep"], patrones: [/\bgrep\b/i] });
    assert.equal(coincide(s, "Grep", { pattern: "zzz" }), true);
    assert.equal(coincide(s, "Bash", { command: "ls" }), false);
    assert.equal(coincide(s, "Bash", { command: "git log | grep x" }), true);
    // inactivo → no
    assert.equal(coincide(rec({ activo: false }), "Bash", { command: "ls" }), false);
    // Edit prueba patrones contra file_path
    assert.equal(coincide(rec({ tools: ["Edit"], patrones: [/MaestraSuite/] }), "Edit", { file_path: "C:/w/MaestraSuite/a.cs" }), true);
});

test("buscarDirectorios: sube desde el cwd, del más cercano al más lejano; env anula", () => {
    const dirs = buscarDirectorios(path.join(FIX, "ws", "proy", "src"), {});
    assert.deepEqual(dirs, [
        path.join(FIX, "ws", "proy", ".claude", "recordatorios"),
        path.join(FIX, "ws", ".claude", "recordatorios"),
    ]);
    assert.deepEqual(buscarDirectorios(path.join(FIX, "ws"), {}), [path.join(FIX, "ws", ".claude", "recordatorios")]);
    assert.deepEqual(buscarDirectorios(path.join(FIX, "ws", "proy", "src"), { CLAUDEMAX_RECORDATORIOS_DIR: "/x/y" }), ["/x/y"]);
    // más de 4 niveles por encima no se mira
    assert.deepEqual(buscarDirectorios(path.join(FIX, "ws", "proy", "src", "a", "b", "c", "d", "e"), {}), []);
});

test("cargarRecordatorios: precedencia por nombre, ignora _plantilla, reporta rotos, orden alfabético", () => {
    const dirs = buscarDirectorios(path.join(FIX, "ws", "proy", "src"), {});
    const { recordatorios, rotos } = cargarRecordatorios(dirs);
    assert.deepEqual(recordatorios.map(r => r.nombre), ["a.md", "b.md"]);
    assert.equal(recordatorios.find(r => r.nombre === "b.md").cuerpo, "B DEL PROYECTO");
    assert.equal(rotos.length, 1);
    assert.match(rotos[0].archivo, /roto\.md$/);
    assert.match(rotos[0].motivo, /tools/);
    assert.deepEqual(cargarRecordatorios(["/no/existe"]), { recordatorios: [], rotos: [] });
});

test("estado por sesión: dispara una vez, no repite, se resetea al cambiar de sesión, tolera JSON roto", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "recordar-estado-"));
    const env = { CLAUDE_CONFIG_DIR: tmp };
    assert.equal(rutaEstado(env), path.join(tmp, "state", "recordar.json"));
    const unaVez = { ok: true, nombre: "u.md", unaVezPorSesion: true, activo: true, tools: ["Bash"], patrones: [], rutas: [], siempre: [], cuerpo: "U" };
    const cadaVez = { ...unaVez, nombre: "c.md", unaVezPorSesion: false };

    let estado = leerEstado(env);
    let { visibles, estado: e1 } = filtrarPorSesion([unaVez, cadaVez], "s1", estado);
    assert.deepEqual(visibles.map(r => r.nombre), ["u.md", "c.md"]);
    guardarEstado(env, e1);
    assert.deepEqual(JSON.parse(fs.readFileSync(rutaEstado(env), "utf8")), { sessionId: "s1", disparados: ["u.md"] });

    ({ visibles, estado: e1 } = filtrarPorSesion([unaVez, cadaVez], "s1", leerEstado(env)));
    assert.deepEqual(visibles.map(r => r.nombre), ["c.md"]);

    ({ visibles, estado: e1 } = filtrarPorSesion([unaVez, cadaVez], "s2", leerEstado(env)));
    assert.deepEqual(visibles.map(r => r.nombre), ["u.md", "c.md"]);
    assert.equal(e1.sessionId, "s2");

    // sin session_id → se comporta como cada vez y no toca el estado
    ({ visibles } = filtrarPorSesion([unaVez], null, leerEstado(env)));
    assert.deepEqual(visibles.map(r => r.nombre), ["u.md"]);

    fs.writeFileSync(rutaEstado(env), "{corrupto");
    assert.deepEqual(leerEstado(env), { sessionId: null, disparados: [] });
    fs.rmSync(tmp, { recursive: true, force: true });
});

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "recordar.mjs");

// Ejecuta el hook con un evento por stdin; devuelve { status, stdout, stderr }.
function correrHook(evento, env = {}) {
    return new Promise(resolve => {
        const child = execFile(process.execPath, [HOOK], { env: { ...process.env, ...env }, timeout: 10_000 },
            (err, stdout, stderr) => resolve({ status: err ? (err.code ?? 1) : 0, stdout, stderr }));
        child.stdin.end(evento === null ? "" : JSON.stringify(evento));
    });
}

test("hook: Bash con ls dispara a.md y b.md del fixture (b del proyecto), en orden alfabético", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "recordar-e2e-"));
    const cwd = path.join(FIX, "ws", "proy", "src");
    const r = await correrHook({ tool_name: "Bash", tool_input: { command: "ls -la" }, cwd, session_id: "s1" }, { CLAUDE_CONFIG_DIR: tmp });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stderr, "");
    const out = JSON.parse(r.stdout);
    assert.equal(out.hookSpecificOutput.hookEventName, "PreToolUse");
    assert.equal(out.hookSpecificOutput.additionalContext, "A DEL WORKSPACE\n\nB DEL PROYECTO");
    assert.equal(out.suppressOutput, true);
    // b.md es una_vez_por_sesion: la segunda vez solo sale a.md
    const r2 = await correrHook({ tool_name: "Bash", tool_input: { command: "ls" }, cwd, session_id: "s1" }, { CLAUDE_CONFIG_DIR: tmp });
    assert.equal(JSON.parse(r2.stdout).hookSpecificOutput.additionalContext, "A DEL WORKSPACE");
    // el roto quedó anotado en el log, no en stderr
    assert.match(fs.readFileSync(path.join(tmp, "state", "recordar.log"), "utf8"), /roto\.md: falta `tools`/);
    fs.rmSync(tmp, { recursive: true, force: true });
});

test("hook: sin coincidencia, stdin vacío, JSON roto y CLAUDEMAX_RECORDAR=0 → exit 0 sin salida", async () => {
    const cwd = path.join(FIX, "ws", "proy", "src");
    // Ojo: en el fixture b.md no tiene patrones, así que casa con CUALQUIER Bash; por eso el
    // caso "sin coincidencia" usa Grep, que ningún recordatorio del fixture declara.
    for (const [evento, env] of [
        [{ tool_name: "Grep", tool_input: { pattern: "x" }, cwd }, {}],
        [null, {}],
        [{ tool_name: "Bash", tool_input: { command: "ls" }, cwd }, { CLAUDEMAX_RECORDAR: "0" }],
        [{ tool_name: "Bash", tool_input: { command: "ls" }, cwd: "/no/existe/en/ningun/sitio" }, {}],
    ]) {
        const r = await correrHook(evento, env);
        assert.equal(r.status, 0);
        assert.equal(r.stdout, "");
        assert.equal(r.stderr, "");
    }
    // JSON roto por stdin
    const roto = await new Promise(resolve => {
        const child = execFile(process.execPath, [HOOK], { timeout: 10_000 }, (err, stdout, stderr) => resolve({ status: err ? 1 : 0, stdout, stderr }));
        child.stdin.end("{no es json");
    });
    assert.deepEqual(roto, { status: 0, stdout: "", stderr: "" });
});

const TPL = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "recordatorios");

test("templates/recordatorios: archivos exactos, los de fábrica válidos y activos, los ejemplos válidos e inactivos, sin 'Maestra' en los genéricos", () => {
    assert.deepEqual(fs.readdirSync(TPL).sort(), ["_plantilla.md", "editar-vault.md", "ejemplos", "estandares-dotnet.md", "orden-herramientas.md", "pruebas-dotnet.md", "tocar-produccion.md"]);
    assert.deepEqual(fs.readdirSync(path.join(TPL, "ejemplos", "maestrasuite")).sort(), ["despliegue.md", "estandares-maestrasuite.md", "orden-busqueda.md", "rojos-suite-api.md"]);
    for (const f of ["editar-vault.md", "estandares-dotnet.md", "orden-herramientas.md", "pruebas-dotnet.md", "tocar-produccion.md"]) {
        const texto = fs.readFileSync(path.join(TPL, f), "utf8");
        const r = parseRecordatorio(texto, f);
        assert.equal(r.ok, true, `${f}: ${r.motivo}`);
        assert.equal(r.activo, true, f);
        assert.ok(r.nota.length > 10, `${f}: sin nota de origen`);
        assert.ok(!/maestra/i.test(texto), `${f}: menciona Maestra`);
    }
    for (const f of ["despliegue.md", "estandares-maestrasuite.md", "orden-busqueda.md", "rojos-suite-api.md"]) {
        const r = parseRecordatorio(fs.readFileSync(path.join(TPL, "ejemplos", "maestrasuite", f), "utf8"), f);
        assert.equal(r.ok, true, `${f}: ${r.motivo}`);
        assert.equal(r.activo, false, f);
    }
    // la plantilla NO parsea como recordatorio válido a propósito (tools vacío) — y empieza por _
    assert.equal(parseRecordatorio(fs.readFileSync(path.join(TPL, "_plantilla.md"), "utf8"), "_plantilla.md").ok, false);
});

test("de fábrica: disparan con los eventos que deben", async () => {
    const env = { CLAUDEMAX_RECORDATORIOS_DIR: TPL };
    const casos = [
        [{ tool_name: "Grep", tool_input: { pattern: "foo" } }, /ORDEN DE HERRAMIENTAS/],
        [{ tool_name: "Bash", tool_input: { command: "git log | grep fix" } }, /ORDEN DE HERRAMIENTAS/],
        [{ tool_name: "PowerShell", tool_input: { command: "Get-Content x | Select-String y" } }, /ORDEN DE HERRAMIENTAS/],
        [{ tool_name: "Bash", tool_input: { command: "gcloud run deploy api --image x" } }, /VAS A TOCAR PRODUCCIÓN/],
        [{ tool_name: "PowerShell", tool_input: { command: ".\\publicar.ps1" } }, /VAS A TOCAR PRODUCCIÓN/],
        [{ tool_name: "Edit", tool_input: { file_path: "C:\\w\\V.A.U.L.T\\Decisiones\\x.md" } }, /NOTA DEL VAULT/],
        [{ tool_name: "Write", tool_input: { file_path: "C:/repo/src/Foo.cs" } }, /ESTÁNDARES \.NET/],
        [{ tool_name: "Edit", tool_input: { file_path: "C:/repo/src/Main.xaml" } }, /ESTÁNDARES \.NET/],
        [{ tool_name: "Bash", tool_input: { command: "dotnet test tests/Api.Tests" } }, /VAS A CORRER UNA SUITE \.NET/],
        [{ tool_name: "PowerShell", tool_input: { command: "./db/probar-api.ps1" } }, /VAS A CORRER UNA SUITE \.NET/],
    ];
    for (const [evento, re] of casos) {
        const r = await correrHook({ ...evento, cwd: TPL }, env);
        assert.equal(r.status, 0);
        assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, re, JSON.stringify(evento));
    }
    for (const evento of [
        { tool_name: "Bash", tool_input: { command: "git status" } },
        { tool_name: "Edit", tool_input: { file_path: "C:/repo/README.md" } },
    ]) {
        const r = await correrHook({ ...evento, cwd: TPL }, env);
        assert.equal(r.stdout, "", JSON.stringify(evento));
    }
});
