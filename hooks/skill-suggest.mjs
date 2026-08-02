#!/usr/bin/env node
// Hook UserPromptSubmit de CLAUDEMAX: detecta menciones de tecnologías nuevas (lenguajes,
// frameworks, motores...) en el prompt del usuario y, si no hay una Skill 2.0 instalada para
// esa tecnología y no se ha avisado ya en esta sesión, inyecta un <system-reminder> para que
// el modelo le pregunte al usuario si quiere crear/buscar una Skill 2.0 para ella (regla 5 de
// CLAUDEMAX.md — ahorro de tokens / búsqueda de skills).
//
// Nunca bloquea — es aviso puro, igual que loop-breaker.mjs; el único hook que bloquea es
// git-footer-guard.mjs. Degrada en silencio ante cualquier error: si algo falla, el hook sale
// con código 0 sin avisar nada, nunca rompe el prompt del usuario.
//
// Estado por sesión en $CLAUDE_CONFIG_DIR/state/skill-suggest.json (fallback $HOME/.claude si
// CLAUDE_CONFIG_DIR no está definido — mismo criterio que bin/lib/claude-config.sh). Se guarda
// qué tecnologías ya se avisaron en la sesión actual (session_id del evento); al cambiar de
// sesión, el estado se resetea. Lee el evento del hook por stdin (JSON), tolerante a variantes
// de nombres de campo entre versiones de Claude Code, igual que hooks/ui-audit.mjs.
//
// Antes de avisar, comprueba los nombres de directorio de $CLAUDE_CONFIG_DIR/skills/: si ya
// hay una skill instalada que corresponde a la tecnología detectada, no avisa.
//
// Registrado por bin/components/rules.sh como UserPromptSubmit (sin matcher).
// Variable de escape: CLAUDEMAX_SKILL_SUGGEST=0 desactiva el hook sin desinstalar nada.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

// Salida inmediata si el usuario desactivó el hook — ni siquiera leemos stdin.
if (String(process.env.CLAUDEMAX_SKILL_SUGGEST || "") === "0") {
    process.exit(0);
}

const MAX_PROMPT_LEN = 20_000; // no vale la pena regexear prompts absurdamente largos
const MAX_NOTIFIED = 200;      // tope defensivo del set "ya avisado esta sesión"

function readAllStdin() {
    return new Promise(resolve => {
        let buf = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", c => { buf += c; });
        process.stdin.on("end", () => resolve(buf));
        process.stdin.on("error", () => resolve(buf));
        // Seguridad: si stdin es una TTY (invocación manual), no cuelgues para siempre.
        if (process.stdin.isTTY) resolve("");
    });
}

// Toma el primer campo presente entre varios nombres posibles — el schema del evento
// de hooks de Claude Code ha usado snake_case y camelCase en distintas versiones.
function pick(obj, keys) {
    if (!obj || typeof obj !== "object") return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
}

// --- Resolución de $CLAUDE_CONFIG_DIR (con el mismo fallback que bin/lib/claude-config.sh) --

function configDir() {
    const envDir = process.env.CLAUDE_CONFIG_DIR;
    if (envDir && envDir.trim()) return envDir;
    return path.join(os.homedir(), ".claude");
}

function statePath() {
    return path.join(configDir(), "state", "skill-suggest.json");
}

function loadState() {
    try {
        const raw = fs.readFileSync(statePath(), "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.notified)) {
            return { sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null, notified: parsed.notified };
        }
    } catch { /* sin estado previo o corrupto: empezamos de cero, no es un error del hook */ }
    return { sessionId: null, notified: [] };
}

function saveState(state) {
    try {
        fs.mkdirSync(path.dirname(statePath()), { recursive: true });
        fs.writeFileSync(statePath(), JSON.stringify(state, null, 2), "utf8");
    } catch { /* si no se puede persistir, el hook sigue sin romperse — solo pierde memoria */ }
}

// --- Slugs y comprobación de skills ya instaladas ---------------------------------------

function normalizeSlug(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function installedSkillSlugs() {
    try {
        const dir = path.join(configDir(), "skills");
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        return entries.filter(e => e.isDirectory()).map(e => normalizeSlug(e.name)).filter(Boolean);
    } catch {
        return [];
    }
}

// Compara los slugs candidatos de una tecnología contra los directorios de skills ya
// instalados. Para slugs cortos (<=3 caracteres, p.ej. "go", "r") exige igualdad exacta para
// no producir falsos positivos ("r" jamás debería "contener" cualquier nombre de skill).
function hasSkillInstalled(tech, installedSlugs) {
    if (installedSlugs.length === 0) return false;
    for (const rawSlug of tech.slugs) {
        const slug = normalizeSlug(rawSlug);
        if (!slug) continue;
        for (const installed of installedSlugs) {
            if (installed === slug) return true;
            if (slug.length > 3 && installed.length > 3 && (installed.includes(slug) || slug.includes(installed))) {
                return true;
            }
        }
    }
    return false;
}

// --- Diccionario de tecnologías -----------------------------------------------------------
// ~40 tecnologías con patrones de detección. Cada entrada tiene:
//   name    — nombre canónico a mostrar en el aviso.
//   slugs   — candidatos de slug para comparar contra directorios de $CLAUDE_CONFIG_DIR/skills/.
//   patterns — regex que bastan por sí solas para dar la tecnología por detectada.
//   ambiguous — { word, context } opcional: para palabras cortas o que coinciden con palabras
//               comunes del español/inglés (Go, R, Unity, Angular, Vue, Astro, Prisma, Pandas,
//               Julia, Bun, Phoenix, Rails...), solo cuenta como detección si la palabra Y una
//               palabra de contexto de programación aparecen ambas en el prompt.
const TECHS = [
    { name: "C#", slugs: ["csharp", "c-sharp"], patterns: [/\bc#/i, /\bc-sharp\b/i, /\bcsharp\b/i] },
    { name: ".NET", slugs: ["dotnet"], patterns: [
        /\bdotnet\b/i, /\basp\.net\b/i, /(?:^|\s)\.net\b/i,
        /\b\.net\s*(?:core|framework|standard|maui|[3-9](?:\.\d+)?)\b/i,
    ] },
    { name: "WinUI 3", slugs: ["winui", "winui3"], patterns: [/\bwinui\s*3\b/i, /\bwinui3\b/i] },
    { name: "XAML", slugs: ["xaml"], patterns: [/\bxaml\b/i] },
    { name: "Rust", slugs: ["rust"], patterns: [/\brust\b/i, /\bcargo\.toml\b/i, /\brustc\b/i, /\btokio\b/i] },
    { name: "Go (Golang)", slugs: ["go", "golang"], patterns: [
        /\bgolang\b/i, /\bgoroutines?\b/i, /\bgo\.mod\b/i,
        /\bgo\s+(?:module|routine|build|test|run|fmt|mod|get|channel|func|package)\b/i,
    ], ambiguous: {
        word: /\bgo\b/i,
        context: /\b(?:lenguaje|language|programar|programming|c[oó]digo|code|backend|servidor|server|compilar|compile|m[oó]dulo|module|api|microservicio|microservice)\b/i,
    } },
    { name: "R (lenguaje)", slugs: ["r", "rlang"], patterns: [
        /\brstudio\b/i, /\btidyverse\b/i, /\bggplot2?\b/i, /\bdplyr\b/i, /\bcran\b/i,
    ], ambiguous: {
        word: /\bR\b/, // case-sensitive: solo la "R" mayúscula aislada cuenta como candidata
        context: /\b(?:lenguaje|language|script|programar|programming|data|datos|estad[ií]stica|statistics|dataframe)\b/i,
    } },
    { name: "Kotlin", slugs: ["kotlin"], patterns: [/\bkotlin\b/i] },
    { name: "Swift", slugs: ["swift"], patterns: [/\bswift\b/i] },
    { name: "SwiftUI", slugs: ["swiftui"], patterns: [/\bswiftui\b/i] },
    { name: "Flutter", slugs: ["flutter"], patterns: [/\bflutter\b/i] },
    { name: "Django", slugs: ["django"], patterns: [/\bdjango\b/i] },
    { name: "Laravel", slugs: ["laravel"], patterns: [/\blaravel\b/i] },
    { name: "Unity", slugs: ["unity"], patterns: [
        /\bunity3d\b/i, /\bunity\s*(?:engine|editor|hub)\b/i, /\bgameobject\b/i, /\bmonobehaviour\b/i,
    ], ambiguous: {
        word: /\bunity\b/i,
        context: /\b(?:engine|motor|juego|game|editor|c#|3d|escena|scene|prefab|asset|gameobject)\b/i,
    } },
    { name: "Godot", slugs: ["godot"], patterns: [/\bgodot\b/i] },
    { name: "Terraform", slugs: ["terraform"], patterns: [/\bterraform\b/i] },
    { name: "Kubernetes", slugs: ["kubernetes", "k8s"], patterns: [/\bkubernetes\b/i, /\bk8s\b/i, /\bkubectl\b/i] },
    { name: "Elixir", slugs: ["elixir"], patterns: [/\belixir\b/i] },
    { name: "Phoenix", slugs: ["phoenix"], patterns: [
        /\bphoenix\s+framework\b/i, /\bliveview\b/i, /\bphx\.(?:new|server|gen)\b/i,
    ], ambiguous: {
        word: /\bphoenix\b/i,
        context: /\b(?:elixir|liveview|erlang|beam|framework)\b/i,
    } },
    { name: "Svelte", slugs: ["svelte", "sveltekit"], patterns: [/\bsvelte\b/i, /\bsveltekit\b/i] },
    { name: "Astro", slugs: ["astro"], patterns: [
        /\bastro\.config\b/i, /\.astro\b/i, /\bastro\s+framework\b/i,
    ], ambiguous: {
        word: /\bastro\b/i,
        context: /\b(?:framework|island|islands|ssr|frontend|componente|component|build)\b/i,
    } },
    { name: "Vue", slugs: ["vue", "vuejs"], patterns: [/\bvue\.?js\b/i, /\bvuex\b/i, /\bvue\s*3\b/i, /\bvue\b/i] },
    { name: "Angular", slugs: ["angular"], patterns: [
        /@angular\//i, /\bangular\s*(?:cli|material)\b/i, /\bangularjs\b/i,
    ], ambiguous: {
        word: /\bangular\b/i,
        context: /\b(?:framework|componente|component|typescript|directiva|directive|servicio|service|standalone|m[oó]dulo|module|frontend|cli)\b/i,
    } },
    { name: "Spring Boot", slugs: ["spring-boot", "springboot"], patterns: [/\bspring\s*boot\b/i, /\bspringboot\b/i] },
    { name: "Ruby on Rails", slugs: ["rails", "ruby-on-rails"], patterns: [
        /\bruby\s+on\s+rails\b/i, /\brubyonrails\b/i, /\bactiverecord\b/i,
    ], ambiguous: {
        word: /\brails\b/i,
        context: /\b(?:ruby|gem|activerecord|controller|migraci[oó]n|migration|scaffold)\b/i,
    } },
    { name: "GraphQL", slugs: ["graphql"], patterns: [/\bgraphql\b/i] },
    { name: "Prisma", slugs: ["prisma"], patterns: [
        /\bprisma\.schema\b/i, /\bprisma\s+(?:orm|client|migrate)\b/i, /@prisma\/client/i,
    ], ambiguous: {
        word: /\bprisma\b/i,
        context: /\b(?:orm|schema|migrate|migraci[oó]n|database|base de datos|typescript|node)\b/i,
    } },
    { name: "Tauri", slugs: ["tauri"], patterns: [/\btauri\b/i] },
    { name: "Electron", slugs: ["electron", "electronjs"], patterns: [
        /\belectron\.?js\b/i, /\belectron-builder\b/i,
    ], ambiguous: {
        word: /\belectron\b/i,
        context: /\b(?:app|framework|node|desktop|chromium|escritorio)\b/i,
    } },
    { name: "PyTorch", slugs: ["pytorch"], patterns: [/\bpytorch\b/i] },
    { name: "TensorFlow", slugs: ["tensorflow"], patterns: [/\btensorflow\b/i] },
    { name: "Pandas", slugs: ["pandas"], patterns: [
        /\bimport\s+pandas\b/i, /\bpd\.dataframe\b/i, /\bpd\.read_csv\b/i,
    ], ambiguous: {
        word: /\bpandas\b/i,
        context: /\b(?:dataframe|python|numpy|csv|data|datos|import pandas|pd\.)\b/i,
    } },
    { name: "Next.js", slugs: ["nextjs", "next-js"], patterns: [/\bnext\.js\b/i, /\bnextjs\b/i] },
    { name: "Nuxt", slugs: ["nuxt"], patterns: [/\bnuxt\b/i] },
    { name: "Scala", slugs: ["scala"], patterns: [/\bscala\b/i] },
    { name: "Haskell", slugs: ["haskell"], patterns: [/\bhaskell\b/i] },
    { name: "Julia", slugs: ["julia", "julialang"], patterns: [/\bjulialang\b/i], ambiguous: {
        word: /\bjulia\b/i,
        context: /\b(?:lenguaje|language|programar|paquete|package|dataframe|jupyter|notebook|num[eé]rico|numeric|cient[ií]fico|scientific)\b/i,
    } },
    { name: "Zig", slugs: ["zig"], patterns: [/\bzig\b/i] },
    { name: "Deno", slugs: ["deno"], patterns: [/\bdeno\b/i] },
    { name: "Bun", slugs: ["bun"], patterns: [
        /\bbun\.js\b/i, /\bbunx\b/i, /\bbun\s+(?:install|run|add)\b/i,
    ], ambiguous: {
        word: /\bbun\b/i,
        context: /\b(?:runtime|javascript|typescript|npm|node|instalar|paquete|package)\b/i,
    } },
    { name: "React Native", slugs: ["react-native", "reactnative"], patterns: [/\breact[\s-]?native\b/i] },
    { name: "NestJS", slugs: ["nestjs", "nest-js"], patterns: [/\bnest\.?js\b/i] },
    { name: "FastAPI", slugs: ["fastapi"], patterns: [/\bfastapi\b/i] },
];

// Índice de la primera aparición de la tecnología en el texto, o -1 si no hay match.
function matchIndex(tech, text) {
    let best = Infinity;
    for (const re of tech.patterns) {
        const m = re.exec(text);
        if (m && m.index < best) best = m.index;
    }
    if (tech.ambiguous) {
        const wordMatch = tech.ambiguous.word.exec(text);
        if (wordMatch && tech.ambiguous.context.test(text) && wordMatch.index < best) {
            best = wordMatch.index;
        }
    }
    return best === Infinity ? -1 : best;
}

// De entre las tecnologías detectadas (y no filtradas), la "primera" es la que aparece antes
// en el texto del prompt (spec: "Máximo 1 tecnología avisada por prompt, la primera detectada").
function detectTech(text, alreadyNotified, installedSlugs) {
    let winner = null;
    let winnerIndex = Infinity;
    for (const tech of TECHS) {
        const primarySlug = normalizeSlug(tech.slugs[0]);
        if (alreadyNotified.has(primarySlug)) continue;
        if (hasSkillInstalled(tech, installedSlugs)) continue;
        const idx = matchIndex(tech, text);
        if (idx >= 0 && idx < winnerIndex) {
            winner = tech;
            winnerIndex = idx;
        }
    }
    return winner;
}

// --- Mensaje ---------------------------------------------------------------------------

function reminderText(tech) {
    return `<system-reminder>CLAUDEMAX skill-suggest: se detectó una mención de "${tech.name}" y no hay ` +
        `una Skill 2.0 instalada para esta tecnología. Antes de continuar, pregunta al usuario si quiere ` +
        `que crees o busques una Skill 2.0 para ${tech.name}. Menciona el compromiso: instalarla añade ` +
        `contexto extra en cada sesión futura, pero a cambio mejora la calidad y la consistencia de las ` +
        `respuestas sobre ${tech.name}. Si el usuario prefiere no hacerlo, continúa sin la skill y no ` +
        `vuelvas a preguntar por ${tech.name} en esta sesión.</system-reminder>`;
}

// --- Programa principal ------------------------------------------------------------------

async function main() {
    const raw = await readAllStdin();
    if (!raw) { process.exit(0); return; }

    let evt;
    try { evt = JSON.parse(raw); } catch { process.exit(0); return; }

    let prompt = pick(evt, ["prompt", "user_prompt", "userPrompt", "message", "text"]);
    if (typeof prompt !== "string" || !prompt.trim()) { process.exit(0); return; }
    if (prompt.length > MAX_PROMPT_LEN) prompt = prompt.slice(0, MAX_PROMPT_LEN);

    const sessionId = pick(evt, ["session_id", "sessionId"]);

    const state = loadState();
    let notifiedList = state.notified;
    if (typeof sessionId === "string" && sessionId && state.sessionId !== sessionId) {
        // Sesión nueva (o primera vez que vemos una con id): resetea lo avisado.
        notifiedList = [];
        state.sessionId = sessionId;
    }
    const alreadyNotified = new Set(notifiedList.map(normalizeSlug));

    const installedSlugs = installedSkillSlugs();
    const tech = detectTech(prompt, alreadyNotified, installedSlugs);

    if (!tech) {
        // Aunque no haya aviso, persiste el posible reseteo de sesión.
        state.notified = notifiedList;
        saveState(state);
        process.exit(0);
        return;
    }

    const primarySlug = normalizeSlug(tech.slugs[0]);
    notifiedList = notifiedList.concat([primarySlug]);
    if (notifiedList.length > MAX_NOTIFIED) notifiedList = notifiedList.slice(-MAX_NOTIFIED);
    state.notified = notifiedList;
    saveState(state);

    process.stdout.write(reminderText(tech) + "\n");
    process.exit(0);
}

main().catch(() => process.exit(0));
