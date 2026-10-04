import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { localizarBash } from "../../../bin/wizard/detect.mjs";
import { CABECERA_INDICE } from "../proyectos-lib.mjs";
import { analizarPendientes, analizarHubs, walkVault } from "../rag-lib.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const VAULT_TPL = path.join(REPO, "templates", "vault");

test("templates/vault: carpetas de la taxonomía, 17 archivos en Hubs/, 5 plantillas, Obsidian por carpeta", () => {
    const carpetas = ["Hubs", "00-Inbox", "Bitacoras", "Decisiones", "Conocimiento", "Aprendizaje", "Entrevistas",
        "Revisiones", "Codigo", "Procesos", "Formales", "Superpowers", "Plantillas"];
    for (const c of carpetas) assert.ok(fs.statSync(path.join(VAULT_TPL, c)).isDirectory(), c);
    for (const s of ["Specs", "Planes", "Tareas", "Sesiones"]) assert.ok(fs.statSync(path.join(VAULT_TPL, "Superpowers", s)).isDirectory(), s);
    for (const viejo of ["Journal", "Proyectos", "Organizacion", "Investigacion", "_plantilla.md", "README.md"]) {
        assert.ok(!fs.existsSync(path.join(VAULT_TPL, viejo)), `${viejo} debe haberse retirado`);
    }
    const hubs = fs.readdirSync(path.join(VAULT_TPL, "Hubs")).filter(f => f.endsWith(".md")).sort();
    assert.deepEqual(hubs, ["Aprendizaje.md", "Bienvenida.md", "Bitacoras.md", "Codigo.md", "Conocimiento.md", "Decisiones.md",
        "Entrevistas.md", "Formales.md", "Inbox.md", "Pendientes.md", "Procesos.md", "Revisiones.md",
        "Superpowers-Planes.md", "Superpowers-Sesiones.md", "Superpowers-Specs.md", "Superpowers-Tareas.md", "_proyecto.md"]);
    assert.deepEqual(fs.readdirSync(path.join(VAULT_TPL, "Plantillas")).sort(),
        ["bitacora.md", "cierre.md", "hub.md", "nota.md", "sesion.md"]);
    // las secciones que rellenan los rituales existen en sus plantillas
    for (const [archivo, seccion] of [["sesion.md", "## Qué se hizo de verdad"], ["cierre.md", "## Cerrado en este ciclo"],
        ["bitacora.md", "## Sesiones de hoy"], ["sesion.md", "## Documentos del ciclo"], ["cierre.md", "## Documentos del ciclo"]]) {
        assert.match(fs.readFileSync(path.join(VAULT_TPL, "Plantillas", archivo), "utf8").replace(/\r\n/g, "\n"),
            new RegExp(`\\n${seccion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n`), archivo);
    }
    for (const archivo of ["sesion.md", "cierre.md"]) {
        assert.match(fs.readFileSync(path.join(VAULT_TPL, "Plantillas", archivo), "utf8"), /^commit:\s*$/m, `${archivo}: commit en el frontmatter`);
    }
    const graph = JSON.parse(fs.readFileSync(path.join(VAULT_TPL, ".obsidian", "graph.json"), "utf8"));
    assert.ok(graph.colorGroups.every(g => g.query.startsWith("path:")), "los grupos de color van por carpeta, no por tag");
    assert.equal(JSON.parse(fs.readFileSync(path.join(VAULT_TPL, ".obsidian", "templates.json"), "utf8")).folder, "Plantillas");
    // el Pendientes de la plantilla es el ejemplo del formato: no puede tener avisos ni enlaces rotos
    const pend = fs.readFileSync(path.join(VAULT_TPL, "Hubs", "Pendientes.md"), "utf8");
    assert.match(pend, /Un pendiente = UNA línea/, "documenta el formato");
    const avisos = analizarPendientes(pend, "2026-09-20").avisos.filter(a => a.tipo !== "antiguo");
    assert.deepEqual(avisos, [], JSON.stringify(avisos));
    const todos = [...walkVault(VAULT_TPL)];
    assert.deepEqual(analizarHubs(VAULT_TPL, todos).enlacesRotos, [], "los ejemplos en comentarios no cuentan");
    // ningún hub escribe conteos fijos en prosa
    for (const h of hubs) {
        const t = fs.readFileSync(path.join(VAULT_TPL, "Hubs", h), "utf8");
        assert.ok(!/\b\d+ notas\b/.test(t), `${h}: el conteo se mide, no se escribe`);
    }
});

test("ac_merge_hook: registra matcher y timeout, y es idempotente", () => {
    const bash = localizarBash();
    if (!bash) { console.log("sin bash — se salta"); return; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "merge-hook-"));
    const settings = path.join(tmp, "settings.json");
    const lib = path.join(REPO, "bin", "lib", "jsonc.sh").replace(/\\/g, "/");
    const s = settings.replace(/\\/g, "/");
    const script = `source "${lib}" && ac_merge_hook "${s}" SessionStart "node /x/session-start.mjs" startup 90 && ac_merge_hook "${s}" SessionStart "node /x/session-start.mjs" startup 90`;
    const r = spawnSync(bash, ["-c", script], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    const cfg = JSON.parse(fs.readFileSync(settings, "utf8"));
    assert.equal(cfg.hooks.SessionStart.length, 1, "idempotente: un solo grupo");
    assert.deepEqual(cfg.hooks.SessionStart[0], { matcher: "startup", hooks: [{ type: "command", command: "node /x/session-start.mjs", timeout: 90 }] });
    // sin timeout no se añade la clave
    spawnSync(bash, ["-c", `source "${lib}" && ac_merge_hook "${s}" PostToolUse "node /x/otro.mjs"`], { encoding: "utf8" });
    const cfg2 = JSON.parse(fs.readFileSync(settings, "utf8"));
    assert.deepEqual(cfg2.hooks.PostToolUse[0], { hooks: [{ type: "command", command: "node /x/otro.mjs" }] });
    fs.rmSync(tmp, { recursive: true, force: true });
});

test("templates/rules/CLAUDEMAX.md v3: diez reglas, termina importando el índice, ≤ 200 líneas, sin prohibir Context7", () => {
    const t = fs.readFileSync(path.join(REPO, "templates", "rules", "CLAUDEMAX.md"), "utf8").replace(/\r\n/g, "\n");
    assert.deepEqual([...t.matchAll(/^## (\d+)\. /gm)].map(m => Number(m[1])), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const s of ["## 6. Dónde vive el contexto", "## 7. Tres memorias con rol", "## 8. Orden de herramientas de contexto",
        "## 9. Taxonomía y vigencia del vault", "## 10. Recordatorios justo a tiempo"]) {
        assert.ok(t.includes(s), s);
    }
    assert.equal(t.trimEnd().split("\n").at(-1), "@proyectos/_indice.md");
    assert.ok(t.split("\n").length <= 200, `${t.split("\n").length} líneas`);
    assert.ok(!/No reinstales ni sugieras Context7/.test(t), "la prohibición de Context7 se retiró");
    assert.match(t, /2026-09-13-reglas-contexto-design\.md/);
    // ningún @ fuera de backticks salvo el import final (Claude Code lo tomaría como import)
    const sinCodigo = t.replace(/`[^`\n]*`/g, "").replace(/<!--[\s\S]*?-->/g, "");
    assert.deepEqual(sinCodigo.match(/(^|\s)@\S+/gm).map(s => s.trim()), ["@proyectos/_indice.md"]);
});

test("rules.sh: ac_rules_install_templates crea proyectos/_indice.md con la cabecera del índice y no lo pisa", () => {
    const bash = localizarBash();
    if (!bash) { console.log("sin bash — se salta"); return; }
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "rules-tpl-"));
    const u = p => p.replace(/\\/g, "/");
    const script = `export AC_REPO_DIR="${u(REPO)}" RAG_ROOT="${u(ws)}" && source "${u(REPO)}/bin/lib/log.sh" && source "${u(REPO)}/bin/components/rules.sh" && ac_rules_install_templates`;
    const r = spawnSync(bash, ["-c", script], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    const indice = path.join(ws, ".claude", "proyectos", "_indice.md");
    assert.equal(fs.readFileSync(indice, "utf8"), CABECERA_INDICE);
    assert.ok(fs.existsSync(path.join(ws, ".claude", "CLAUDEMAX.md")));
    fs.writeFileSync(indice, "EDITADO");
    assert.equal(spawnSync(bash, ["-c", script], { encoding: "utf8" }).status, 0);
    assert.equal(fs.readFileSync(indice, "utf8"), "EDITADO");
    fs.rmSync(ws, { recursive: true, force: true });
});
