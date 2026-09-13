import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const VAULT_TPL = path.join(REPO, "templates", "vault");

test("templates/vault: carpetas de la taxonomía, 17 archivos en Hubs/, 4 plantillas, Obsidian por carpeta", () => {
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
    assert.deepEqual(fs.readdirSync(path.join(VAULT_TPL, "Plantillas")).sort(), ["bitacora.md", "hub.md", "nota.md", "sesion.md"]);
    const graph = JSON.parse(fs.readFileSync(path.join(VAULT_TPL, ".obsidian", "graph.json"), "utf8"));
    assert.ok(graph.colorGroups.every(g => g.query.startsWith("path:")), "los grupos de color van por carpeta, no por tag");
    assert.equal(JSON.parse(fs.readFileSync(path.join(VAULT_TPL, ".obsidian", "templates.json"), "utf8")).folder, "Plantillas");
    // ningún hub escribe conteos fijos en prosa
    for (const h of hubs) {
        const t = fs.readFileSync(path.join(VAULT_TPL, "Hubs", h), "utf8");
        assert.ok(!/\b\d+ notas\b/.test(t), `${h}: el conteo se mide, no se escribe`);
    }
});
