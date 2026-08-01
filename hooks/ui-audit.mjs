#!/usr/bin/env node
// Hook PostToolUse de CLAUDEMAX: auditoría determinística de anti-patrones de UI.
//
// Lee el evento del hook por stdin. Si la herramienta fue Edit/Write/MultiEdit sobre
// un archivo de interfaz (.css/.scss/.tsx/.jsx/.vue/.svelte/.html), aplica ~15 reglas
// regex de bajo falso-positivo contra "slop" visual (gradient text de relleno, sombras
// neón, nombres placeholder, tarjetas idénticas como andamio, etc.) y emite un
// <system-reminder> por hallazgo para que el agente los revise en su siguiente turno.
//
// Nunca bloquea la edición: cualquier fallo o esquema inesperado hace que el hook
// salga en silencio con código 0. Igual que hacía el antiguo hooks/dcp-lite-dedup.mjs,
// toleramos variantes de nombres de campo porque el schema del evento ha cambiado
// entre versiones de Claude Code.
//
// Reglas adaptadas de los anti-patrones de pbakaus/impeccable (Apache-2.0), también
// consolidados en skills/ui-ux-pro-max/SKILL.md ("Consolidado: taste").
//
// Registrado por bin/components/ui-ux.sh como PostToolUse con matcher "Edit|Write".
// Variable de escape: CLAUDEMAX_UI_AUDIT=0 desactiva el hook sin desinstalar nada.

import fs from "node:fs";
import path from "node:path";

// Salida inmediata si el usuario desactivó el hook — ni siquiera leemos stdin.
if (String(process.env.CLAUDEMAX_UI_AUDIT || "") === "0") {
    process.exit(0);
}

const MAX_FINDINGS = 6;
const MAX_CONTENT_SIZE = 2_000_000; // ~2MB: por encima de esto no vale la pena regexear un archivo de UI.
const UI_EXTENSIONS = new Set([".css", ".scss", ".tsx", ".jsx", ".vue", ".svelte", ".html"]);
const AUDITED_TOOLS = new Set(["Edit", "Write", "MultiEdit"]);

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

function lineAt(content, index) {
    let line = 1;
    const upto = index < content.length ? index : content.length;
    for (let i = 0; i < upto; i++) {
        if (content[i] === "\n") line++;
    }
    return line;
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Extracción del contenido resultante del archivo -----------------------------
// Preferimos el contenido que venga en el propio evento (p. ej. `content` de Write,
// que ya trae el archivo completo). Si no está, leemos el archivo del disco: el hook
// PostToolUse se dispara después de que la herramienta ya escribió el cambio.
function extractContent(evt, input, filePath) {
    if (input && typeof input.content === "string") return input.content;

    const resp = pick(evt, ["tool_response", "toolResponse", "output", "result"]);
    if (resp && typeof resp === "object") {
        const fromResp = pick(resp, ["content", "newContent", "fileContent", "file_content"]);
        if (typeof fromResp === "string") return fromResp;
    }

    try {
        return fs.readFileSync(filePath, "utf8");
    } catch {
        return null;
    }
}

// --- Reglas ------------------------------------------------------------------------
// Cada regla produce hallazgos como { id, index, message }. `message` ya combina
// "<problema>. <sugerencia>" en español, listo para el <system-reminder> final.

function ruleFromRegex(content, id, regex, message) {
    const out = [];
    const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
    let m;
    while ((m = re.exec(content))) {
        out.push({ id, index: m.index, message });
        if (m[0].length === 0) re.lastIndex++; // evita bucle infinito en matches de longitud cero
    }
    return out;
}

function ruleGradientText(content) {
    const out = [];
    const clipRe = /-?(?:webkit-)?background-clip\s*:\s*text/gi;
    let m;
    let lastReported = -Infinity;
    while ((m = clipRe.exec(content))) {
        // Deduplica: `background-clip: text` y `-webkit-background-clip: text` suelen ir
        // pegados para compatibilidad de navegador — es un solo uso lógico, no dos hallazgos.
        if (m.index - lastReported < 150) continue;
        const start = Math.max(0, m.index - 300);
        const end = Math.min(content.length, m.index + 300);
        if (/gradient/i.test(content.slice(start, end))) {
            out.push({
                id: "gradient-text",
                index: m.index,
                message: "Texto con gradiente (background-clip: text + gradient) usado como recurso decorativo por defecto. " +
                    "Usa color sólido con buen contraste; reserva el gradiente para un acento ya justificado por el sistema de diseño."
            });
            lastReported = m.index;
        }
    }
    return out;
}

const ICON_GLYPHS = ["✓", "✔", "✗", "✘", "★", "☆", "→", "←", "↑", "↓", "▲", "▼", "◆", "●", "○", "♦", "♥", "‣", "»", "«", "✅", "🔒", "🛡️", "🚀", "⭐"];

function ruleUnicodeGlyphIcon(content) {
    const alt = ICON_GLYPHS.map(escapeRegex).join("|");
    const re = new RegExp(`>\\s*(?:${alt})\\s*<`, "gu");
    return ruleFromRegex(content, "unicode-glyph-icon", re,
        "Glifo unicode usado como ícono de contenido en vez de un componente de ícono real. " +
        "Usa un ícono SVG/componente de la librería de íconos del proyecto, con accesibilidad (aria-label) apropiada.");
}

function ruleHardOffsetShadow(content) {
    const re = /box-shadow\s*:\s*-?\d+px\s+-?\d+px\s+0(?:px)?\b/gi;
    return ruleFromRegex(content, "hard-offset-shadow", re,
        "box-shadow con offset duro y blur 0 (look neobrutalista) fuera de un sistema declaradamente neobrutalista. " +
        "Si el resto del diseño no es neobrutalista, usa una sombra con blur y opacidad baja en su lugar.");
}

const MONOSPACE_FAMILIES = /(monospace|Consolas|Menlo|Courier|Fira Code|JetBrains Mono|SF Mono|Roboto Mono|Source Code Pro|IBM Plex Mono)/i;
const CODE_ISH_TAG = /\b(code|pre|kbd|samp)\b/i;

function ruleMonospaceProse(content) {
    const out = [];

    // Bloques CSS: `selector { ... font-family: <mono>; ... }` donde el selector no es code/pre/kbd/samp.
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = ruleRe.exec(content))) {
        const selector = m[1].trim();
        const body = m[2];
        if (!/font-family\s*:/i.test(body)) continue;
        if (!MONOSPACE_FAMILIES.test(body)) continue;
        if (CODE_ISH_TAG.test(selector)) continue;
        // m[1] (el selector) captura cualquier whitespace/salto de línea colgante del bloque
        // anterior porque el regex de bloques CSS no distingue "}" de fin de regla vs. inicio
        // de selector — saltamos ese whitespace para apuntar la línea al selector real.
        const leadingWs = m[1].length - m[1].trimStart().length;
        out.push({
            id: "monospace-prose",
            index: m.index + leadingWs,
            message: "Fuente monoespaciada aplicada a contenido que no es código (selector fuera de code/pre/kbd/samp). " +
                "Reserva monospace para code/pre/valores literales; usa la tipografía del sistema para el resto del contenido."
        });
    }

    // Clase utilitaria Tailwind `font-mono` en un tag que no es code/pre/kbd/samp.
    const tagRe = /<(\w+)[^>]*className=(["'])(?:(?!\2).)*\bfont-mono\b(?:(?!\2).)*\2/gi;
    while ((m = tagRe.exec(content))) {
        if (CODE_ISH_TAG.test(m[1])) continue;
        out.push({
            id: "monospace-prose",
            index: m.index,
            message: "Clase font-mono aplicada a un elemento que no es código (no es code/pre/kbd/samp). " +
                "Reserva monospace para code/pre/valores literales; usa la tipografía del sistema para el resto del contenido."
        });
    }

    return out;
}

function isSaturatedColor(str) {
    const hex = str.match(/#([0-9a-fA-F]{6})\b/);
    if (hex) {
        const r = parseInt(hex[1].slice(0, 2), 16), g = parseInt(hex[1].slice(2, 4), 16), b = parseInt(hex[1].slice(4, 6), 16);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max >= 200 && (max - min) >= 150) return true;
    }
    const rgb = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgb) {
        const r = +rgb[1], g = +rgb[2], b = +rgb[3];
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max >= 200 && (max - min) >= 150) return true;
    }
    return false;
}

function ruleNeonShadow(content, prop, id, label) {
    const out = [];
    const re = new RegExp(`${prop}\\s*:\\s*([^;]+);`, "gi");
    let m;
    while ((m = re.exec(content))) {
        const value = m[1];
        // El offset X/Y suele escribirse sin unidad cuando es 0 ("0 0 40px ..."), así que
        // el "px" en los dos primeros números es opcional; el blur (tercer número) sí lo exige.
        const blurMatch = value.match(/-?\d+(?:px)?\s+-?\d+(?:px)?\s+(\d+)px/);
        if (!blurMatch) continue;
        const blur = parseInt(blurMatch[1], 10);
        if (blur < 24) continue;
        if (!isSaturatedColor(value)) continue;
        out.push({
            id,
            index: m.index,
            message: `${label} con blur alto y color muy saturado (glow neón). ` +
                "Baja la saturación del color o el blur; un acento sutil rara vez necesita un glow tan intenso."
        });
    }
    return out;
}

function rulePlaceholderName(content) {
    return ruleFromRegex(content, "placeholder-name", /\bJohn\s+Doe\b|\bJane\s+Doe\b/g,
        "Nombre de relleno genérico (John Doe / Jane Doe). " +
        "Usa un nombre de ejemplo realista y variado, o deja el campo claramente marcado como dato de prueba.");
}

function rulePlaceholderImageService(content) {
    const re = /randomuser\.me|unsplash\.com\/random|picsum\.photos|placehold\.co|via\.placeholder\.com|ui-avatars\.com|dicebear\.com|pravatar\.cc/gi;
    return ruleFromRegex(content, "placeholder-image-service", re,
        "Servicio de imagen placeholder genérico (randomuser.me, unsplash.com/random, picsum.photos, etc.). " +
        "Usa un asset real del proyecto o un placeholder local versionado, no un servicio externo aleatorio.");
}

function ruleLoremIpsum(content) {
    return ruleFromRegex(content, "lorem-ipsum", /lorem ipsum/gi,
        "Texto de relleno \"lorem ipsum\". Sustitúyelo por copy real o un ejemplo representativo del contenido final.");
}

function ruleEmDashAbuse(content) {
    const re = /—/g;
    const count = (content.match(re) || []).length;
    if (count <= 2) return [];
    const firstIndex = content.indexOf("—");
    return [{
        id: "em-dash-abuse",
        index: firstIndex,
        message: `Abuso del guion largo (—): ${count} apariciones en el archivo. ` +
            "Usa punto, coma o guion normal; el em-dash repetido es una de las señales más claras de prosa generada por IA."
    }];
}

function ruleEyebrowBeforeHeading(content) {
    const re = />([A-Z0-9][A-Z0-9 /&\-]{1,40})<\/[a-zA-Z][\w.]*>\s*\n?\s*<h[12][ >]/g;
    const out = [];
    let m;
    while ((m = re.exec(content))) {
        out.push({
            id: "eyebrow-before-heading",
            index: m.index,
            message: "Texto corto en MAYÚSCULAS justo antes de un h1/h2 (kicker/eyebrow decorativo). " +
                "Solo úsalo si aporta jerarquía real (categoría, breadcrumb); si no, elimínalo."
        });
    }
    return out;
}

function ruleIdenticalCards(content) {
    const occurrences = [];
    const classNameRe = /\b(?:className|class)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    let m;
    while ((m = classNameRe.exec(content))) {
        occurrences.push({ value: m[1], index: m.index });
    }
    occurrences.sort((a, b) => a.index - b.index);

    const MIN_LEN = 12; // ignora className triviales/cortos ("flex", "card") que son ruido, no andamiaje
    const PROXIMITY = 400; // caracteres máximos entre ocurrencias consecutivas para contarlas como "seguidas"
    const out = [];
    let i = 0;
    while (i < occurrences.length) {
        if (occurrences[i].value.length < MIN_LEN) { i++; continue; }
        let j = i + 1;
        while (
            j < occurrences.length &&
            occurrences[j].value === occurrences[i].value &&
            (occurrences[j].index - occurrences[j - 1].index) < PROXIMITY
        ) {
            j++;
        }
        const streakLen = j - i;
        if (streakLen >= 3) {
            out.push({
                id: "identical-cards",
                index: occurrences[i].index,
                message: "Mismo className repetido 3+ veces seguidas (tarjetas idénticas usadas como andamio). " +
                    "Decide qué elemento pesa más y dale distinto tamaño/peso visual; no uses una rejilla uniforme para evitar decidir jerarquía."
            });
        }
        i = j;
    }
    return out;
}

function ruleFakeStarRating(content) {
    return ruleFromRegex(content, "fake-star-rating", /[★☆⭐]{3,}/gu,
        "Secuencia de glifos de estrella como rating estático. " +
        "Usa un componente de rating real con datos verificables, o quítalo si no hay reseñas reales.");
}

function ruleMarketingVerbHeading(content) {
    const verbs = /\b(unleash\w*|revolutioniz\w*|elevat\w*|seamless(?:ly)?|empower\w*|supercharg\w*|effortless(?:ly)?|unlock\w*)\b/i;
    const headingRe = /<h[123][^>]*>([\s\S]*?)<\/h[123]>/gi;
    const out = [];
    let m;
    while ((m = headingRe.exec(content))) {
        if (verbs.test(m[1])) {
            out.push({
                id: "marketing-verb-heading",
                index: m.index,
                message: "Verbo de marketing de relleno (unleash/elevate/seamless/revolutionize/...) en un heading. " +
                    "Dile al lector qué hace el producto en concreto, no una promesa vacía."
            });
        }
    }
    return out;
}

function ruleFakeVerifiedBadge(content) {
    const re = /(?:✅|✔️|☑️|🛡️|🔒)\s*(?:Verified|Trusted|Certified|Official|Secure)\b/giu;
    return ruleFromRegex(content, "fake-verified-badge", re,
        "Insignia de \"verificado/confiable\" con un emoji junto a la palabra, sin verificación real detrás. " +
        "Solo muéstrala si hay una verificación real; si no, quítala.");
}

const RULES = [
    ruleGradientText,
    ruleUnicodeGlyphIcon,
    ruleHardOffsetShadow,
    ruleMonospaceProse,
    content => ruleNeonShadow(content, "box-shadow", "neon-glow-shadow", "box-shadow"),
    content => ruleNeonShadow(content, "text-shadow", "neon-text-glow", "text-shadow"),
    rulePlaceholderName,
    rulePlaceholderImageService,
    ruleLoremIpsum,
    ruleEmDashAbuse,
    ruleEyebrowBeforeHeading,
    ruleIdenticalCards,
    ruleFakeStarRating,
    ruleMarketingVerbHeading,
    ruleFakeVerifiedBadge,
];

// --- Programa principal --------------------------------------------------------------

async function main() {
    const raw = await readAllStdin();
    if (!raw) { process.exit(0); }

    let evt;
    try { evt = JSON.parse(raw); } catch { process.exit(0); return; }

    const tool = pick(evt, ["tool_name", "toolName", "tool", "name"]);
    if (!tool || !AUDITED_TOOLS.has(String(tool))) { process.exit(0); return; }

    const input = pick(evt, ["tool_input", "toolInput", "input", "arguments"]) || {};
    const filePath = pick(input, ["file_path", "filePath", "path"]);
    if (!filePath || typeof filePath !== "string") { process.exit(0); return; }

    const ext = path.extname(filePath).toLowerCase();
    if (!UI_EXTENSIONS.has(ext)) { process.exit(0); return; }

    const content = extractContent(evt, input, filePath);
    if (typeof content !== "string" || content.length === 0) { process.exit(0); return; }
    if (content.length > MAX_CONTENT_SIZE) { process.exit(0); return; }

    let findings = [];
    for (const rule of RULES) {
        try { findings = findings.concat(rule(content)); } catch { /* una regla rota nunca debe tumbar el hook */ }
    }
    findings.sort((a, b) => a.index - b.index);

    if (findings.length === 0) { process.exit(0); return; }

    const shown = findings.slice(0, MAX_FINDINGS);
    for (const f of shown) {
        const line = lineAt(content, f.index);
        process.stdout.write(`<system-reminder>ui-audit: ${filePath}:${line} — ${f.message}</system-reminder>\n`);
    }
    const omitted = findings.length - shown.length;
    if (omitted > 0) {
        process.stdout.write(`<system-reminder>ui-audit: se omitieron ${omitted} hallazgo(s) adicional(es) en ${filePath} (máximo ${MAX_FINDINGS} por edición).</system-reminder>\n`);
    }

    process.exit(0);
}

main().catch(() => process.exit(0));
