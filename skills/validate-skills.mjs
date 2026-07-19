#!/usr/bin/env node
// Validates every skill directory under skills/ against the Skills 2.0 contract:
//   SKILL.md   — frontmatter with name (== dir name) and description
//   skill.yaml — name (== dir name), version, kind, triggers, schema
//   schema.json — valid JSON with definitions.inputs and definitions.outputs
//   every entry in skill.yaml `scripts` exists on disk
// Exit 0 when all pass; exit 1 with an error listing otherwise.
// Dependency-free: node: built-ins only. Parses the small YAML subset we use
// (top-level `key: value` and `key: [a, b]` / block lists with "- ").

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
    if (!fs.existsSync(skillMd)) { fail("missing SKILL.md"); continue; }
    const fm = parseFrontmatter(fs.readFileSync(skillMd, "utf8"));
    if (!fm) fail("SKILL.md has no parseable frontmatter");
    else {
        if (fm.name !== dir) fail(`SKILL.md frontmatter name "${fm.name}" != dir name`);
        if (!fm.description) fail("SKILL.md frontmatter missing description");
    }

    // skill.yaml
    const yamlPath = path.join(base, "skill.yaml");
    if (!fs.existsSync(yamlPath)) { fail("missing skill.yaml"); continue; }
    const cfg = parseMiniYaml(fs.readFileSync(yamlPath, "utf8"));
    if (cfg.name !== dir) fail(`skill.yaml name "${cfg.name}" != dir name`);
    for (const req of ["version", "kind", "schema"]) {
        if (!cfg[req]) fail(`skill.yaml missing ${req}`);
    }
    if (!Array.isArray(cfg.triggers) || cfg.triggers.length === 0) {
        fail("skill.yaml triggers must be a non-empty list");
    }
    if (cfg.kind && !["knowledge", "tool"].includes(cfg.kind)) {
        fail(`skill.yaml kind "${cfg.kind}" not knowledge|tool`);
    }
    for (const s of cfg.scripts || []) {
        if (!fs.existsSync(path.join(base, s))) fail(`declared script missing: ${s}`);
    }

    // schema.json
    const schemaPath = path.join(base, "schema.json");
    if (!fs.existsSync(schemaPath)) { fail("missing schema.json"); continue; }
    let schema;
    try { schema = JSON.parse(fs.readFileSync(schemaPath, "utf8")); }
    catch (e) { fail(`schema.json invalid JSON: ${e.message}`); continue; }
    if (!schema.definitions?.inputs) fail("schema.json missing definitions.inputs");
    if (!schema.definitions?.outputs) fail("schema.json missing definitions.outputs");
}

if (errors.length) {
    console.error(`validate-skills: ${errors.length} error(s)`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
}
console.log(`validate-skills: OK (${dirs.length} skills)`);
