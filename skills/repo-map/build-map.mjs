#!/usr/bin/env node
// repo-map / build-map.mjs
// Walks the cwd, respects .gitignore (inline minimal parser), and writes a
// compact repo map to .claude/repo-map.md. Pure Node — no npm deps.

import fs from "node:fs";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const DEPTH = Number(args.depth ?? args._[0] ?? 4);
const MAX_FILES = Number(args["max-files"] ?? 2000);
const OUT = args.out ?? path.join(".claude", "repo-map.md");
const ROOT = process.cwd();

// Always-skip directories (independent of .gitignore).
const HARD_IGNORE = new Set([
    ".git", "node_modules", ".next", ".turbo", ".cache", ".venv", "venv",
    "__pycache__", "dist", "build", "out", "target", ".idea", ".vscode",
    ".DS_Store", ".pytest_cache", ".mypy_cache", "coverage"
]);

const TEXT_EXT = new Set([
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".py", ".go", ".rs",
    ".java", ".kt", ".rb", ".php", ".cs", ".swift",
    ".md", ".json", ".yaml", ".yml", ".toml"
]);

const SYMBOL_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".py", ".go", ".rs"]);

const gitignorePatterns = loadGitignore(ROOT);

function parseArgs(argv) {
    const out = { _: [] };
    for (const a of argv) {
        const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
        if (m) out[m[1]] = m[2] ?? true;
        else out._.push(a);
    }
    return out;
}

function loadGitignore(root) {
    const file = path.join(root, ".gitignore");
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith("#"))
        .map(globToRegex);
}

// Minimal gitignore-style glob → regex. Handles *, **, ?, leading /, trailing /.
function globToRegex(pattern) {
    let p = pattern;
    let anchored = false;
    if (p.startsWith("/")) { anchored = true; p = p.slice(1); }
    let dirOnly = false;
    if (p.endsWith("/")) { dirOnly = true; p = p.slice(0, -1); }
    // escape regex metachars except glob ones
    let rx = "";
    let i = 0;
    while (i < p.length) {
        const c = p[i];
        if (c === "*") {
            if (p[i + 1] === "*") { rx += ".*"; i += 2; if (p[i] === "/") i++; }
            else { rx += "[^/]*"; i++; }
        } else if (c === "?") { rx += "[^/]"; i++; }
        else if ("\\.+^$|()[]{}".includes(c)) { rx += "\\" + c; i++; }
        else { rx += c; i++; }
    }
    if (!anchored) rx = "(?:^|/)" + rx;
    else rx = "^" + rx;
    rx += dirOnly ? "(?:/|$)" : "(?:$|/)";
    return new RegExp(rx);
}

function isIgnored(relPath) {
    for (const rx of gitignorePatterns) {
        if (rx.test(relPath)) return true;
    }
    return false;
}

// ---- tree walk ----

let fileCount = 0;
const filesByDir = new Map();   // dir -> [{name, size}]
const sourceFiles = [];         // {abs, rel}

function walk(dir, depth) {
    if (depth > DEPTH) return;
    if (fileCount >= MAX_FILES) return;

    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }

    entries.sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    for (const ent of entries) {
        if (HARD_IGNORE.has(ent.name)) continue;
        const abs = path.join(dir, ent.name);
        const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
        if (isIgnored(rel) || isIgnored(rel + (ent.isDirectory() ? "/" : ""))) continue;

        if (ent.isDirectory()) {
            walk(abs, depth + 1);
        } else if (ent.isFile()) {
            fileCount++;
            if (fileCount > MAX_FILES) return;
            const parent = path.relative(ROOT, dir).replace(/\\/g, "/") || ".";
            const size = safeSize(abs);
            if (!filesByDir.has(parent)) filesByDir.set(parent, []);
            filesByDir.get(parent).push({ name: ent.name, size });
            const ext = path.extname(ent.name);
            if (SYMBOL_EXT.has(ext)) sourceFiles.push({ abs, rel });
        }
    }
}

function safeSize(abs) {
    try { return fs.statSync(abs).size; } catch { return 0; }
}

walk(ROOT, 0);

// ---- symbol extraction (regex-based, deliberately lightweight) ----

const SYMBOL_PATTERNS = {
    ".js":  /^\s*(?:export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*))|^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    ".jsx": null,  // same as .js
    ".ts":  null,
    ".tsx": null,
    ".mjs": null,
    ".cjs": null,
    ".py":  /^\s*(?:def|class)\s+([A-Za-z_][\w]*)/gm,
    ".go":  /^\s*func\s+(?:\([^)]+\)\s+)?([A-Z][\w]*)|^\s*type\s+([A-Z][\w]*)\s+(?:struct|interface|=)/gm,
    ".rs":  /^\s*(?:pub\s+)?(?:fn|struct|enum|trait)\s+([A-Za-z_][\w]*)/gm
};
SYMBOL_PATTERNS[".jsx"] = SYMBOL_PATTERNS[".js"];
SYMBOL_PATTERNS[".ts"]  = SYMBOL_PATTERNS[".js"];
SYMBOL_PATTERNS[".tsx"] = SYMBOL_PATTERNS[".js"];
SYMBOL_PATTERNS[".mjs"] = SYMBOL_PATTERNS[".js"];
SYMBOL_PATTERNS[".cjs"] = SYMBOL_PATTERNS[".js"];

const symbolsByFile = new Map();
for (const { abs, rel } of sourceFiles) {
    if (safeSize(abs) > 256 * 1024) continue; // skip files >256KB
    let body;
    try { body = fs.readFileSync(abs, "utf8"); } catch { continue; }
    const ext = path.extname(abs);
    const rx = SYMBOL_PATTERNS[ext];
    if (!rx) continue;
    const found = new Set();
    let m;
    rx.lastIndex = 0;
    while ((m = rx.exec(body)) !== null) {
        const name = m[1] || m[2];
        if (name) found.add(name);
        if (found.size >= 25) break;
    }
    if (found.size > 0) symbolsByFile.set(rel, [...found]);
}

// ---- emit markdown ----

function renderTree() {
    // Expand to include every prefix dir, even ones that contain only subdirs.
    const allDirs = new Set(filesByDir.keys());
    for (const d of [...allDirs]) {
        if (d === ".") continue;
        const parts = d.split("/");
        for (let i = 1; i < parts.length; i++) {
            allDirs.add(parts.slice(0, i).join("/"));
        }
    }
    const dirs = [...allDirs].sort();
    const lines = [];
    for (const d of dirs) {
        const depth = d === "." ? 0 : d.split("/").length;
        const indent = "  ".repeat(depth);
        if (d !== ".") {
            lines.push(`${"  ".repeat(depth - 1)}${d.split("/").pop()}/`);
        }
        const files = filesByDir.get(d) || [];
        for (const f of files) {
            const kb = f.size >= 1024 ? `${(f.size / 1024).toFixed(1)}k` : `${f.size}b`;
            lines.push(`${indent}${f.name}  ${"`"}${kb}${"`"}`);
        }
    }
    return lines.join("\n");
}

function renderSymbols() {
    const entries = [...symbolsByFile.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([f, syms]) => `- **${f}**: ${syms.join(", ")}`).join("\n");
}

const now = new Date().toISOString();
const md = `# Repo map

_Generated by ABSOLUTE-CLAUDE repo-map skill on ${now}_
_Root: \`${ROOT}\` · depth=${DEPTH} · files=${fileCount}${fileCount >= MAX_FILES ? " (capped)" : ""}_

## Tree

\`\`\`
${renderTree()}
\`\`\`

## Symbols

${symbolsByFile.size > 0 ? renderSymbols() : "_No JS/TS/Py/Go/Rust files indexed._"}

---
_Approx output: ${md_tokens_estimate()} tokens. Re-run with \`/repomap\` to refresh._
`;

function md_tokens_estimate() {
    // crude: chars / 4
    return Math.round((renderTree().length + renderSymbols().length) / 4);
}

// Ensure .claude/ exists in cwd.
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);

console.log(`repo-map: wrote ${OUT} (${fileCount} files, ${symbolsByFile.size} files with symbols)`);
