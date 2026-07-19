#!/usr/bin/env node
// Valida cada directorio de skill bajo skills/ contra el contrato Skills 2.0:
//   SKILL.md   — frontmatter con name (== nombre del dir) y description
//   skill.yaml — name (== nombre del dir), version, kind, triggers, schema
//   schema.json — JSON válido con definitions.inputs y definitions.outputs
//   cada entrada en `scripts` de skill.yaml existe en disco
// Exit 0 si todo pasa; exit 1 con un listado de errores en caso contrario.
// Sin dependencias: solo built-ins de node. Parsea el pequeño subconjunto de
// YAML que usamos (`key: value` de nivel superior y `key: [a, b]` / listas en
// bloque con "- ").

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillsDir = path.dirname(fileURLToPath(import.meta.url));
const errors = [];

function parseFrontmatter(md) {
    const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) return null;
    return parseMiniYaml(m[1]);
}

function parseMiniYaml(text) {
    const out = {};
    let listKey = null;
    for (const raw of text.split(/\r?\n/)) {
        if (!raw.trim() || raw.trim().startsWith("#")) continue;
        const listItem = raw.match(/^\s+-\s+(.*)$/);
        if (listItem && listKey) {
            out[listKey].push(stripQuotes(listItem[1]));
            continue;
        }
        const kv = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!kv) continue;
        const [, key, valRaw] = kv;
        const val = valRaw.trim();
        if (val === "" || val === "|" || val === ">") {
            out[key] = [];
            listKey = key;
        } else if (val.startsWith("[")) {
            out[key] = val.replace(/^\[|\]$/g, "").split(",")
                .map(s => stripQuotes(s.trim())).filter(Boolean);
            listKey = null;
        } else {
            out[key] = stripQuotes(val);
            listKey = null;
        }
    }
    return out;
}

function stripQuotes(s) {
    return s.replace(/^["']|["']$/g, "");
}

const dirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

for (const dir of dirs) {
    const base = path.join(skillsDir, dir);
    const fail = msg => errors.push(`${dir}: ${msg}`);

    // SKILL.md
    const skillMd = path.join(base, "SKILL.md");
    if (!fs.existsSync(skillMd)) { fail("falta SKILL.md"); continue; }
    const fm = parseFrontmatter(fs.readFileSync(skillMd, "utf8"));
    if (!fm) fail("SKILL.md no tiene frontmatter parseable");
    else {
        if (fm.name !== dir) fail(`el name del frontmatter de SKILL.md "${fm.name}" no coincide con el nombre del directorio`);
        if (!fm.description) fail("al frontmatter de SKILL.md le falta description");
    }

    // skill.yaml
    const yamlPath = path.join(base, "skill.yaml");
    if (!fs.existsSync(yamlPath)) { fail("falta skill.yaml"); continue; }
    const cfg = parseMiniYaml(fs.readFileSync(yamlPath, "utf8"));
    if (cfg.name !== dir) fail(`el name de skill.yaml "${cfg.name}" no coincide con el nombre del directorio`);
    for (const req of ["version", "kind", "schema"]) {
        if (!cfg[req]) fail(`a skill.yaml le falta ${req}`);
    }
    if (!Array.isArray(cfg.triggers) || cfg.triggers.length === 0) {
        fail("triggers de skill.yaml debe ser una lista no vacía");
    }
    if (cfg.kind && !["knowledge", "tool"].includes(cfg.kind)) {
        fail(`kind de skill.yaml "${cfg.kind}" no es knowledge|tool`);
    }
    for (const s of cfg.scripts || []) {
        if (!fs.existsSync(path.join(base, s))) fail(`script declarado no encontrado: ${s}`);
    }

    // schema.json
    const schemaPath = path.join(base, "schema.json");
    if (!fs.existsSync(schemaPath)) { fail("falta schema.json"); continue; }
    let schema;
    try { schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")); }
    catch (e) { fail(`schema.json no es JSON válido: ${e.message}`); continue; }
    if (!schema.definitions?.inputs) fail("a schema.json le falta definitions.inputs");
    if (!schema.definitions?.outputs) fail("a schema.json le falta definitions.outputs");
}

if (errors.length) {
    console.error(`validate-skills: ${errors.length} error(es)`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
}
console.log(`validate-skills: OK (${dirs.length} skills)`);
