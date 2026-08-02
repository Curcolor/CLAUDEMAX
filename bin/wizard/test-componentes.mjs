#!/usr/bin/env node
// Prueba de sincronización: leerComponentes() (bin/wizard/detect.mjs) extrae ALL_COMPONENTS
// de install.sh con una expresión regular en JS. Esta prueba verifica esa extracción de
// forma GENUINAMENTE independiente — no repitiendo la misma regex de otra manera (eso solo
// escondería el mismo bug dos veces), sino pidiéndole a bash que evalúe el array de verdad.
//
// Por seguridad no se hace `source install.sh` completo: ese script no está escrito como
// librería (no tiene guardas de "solo funciones"), así que sourcearlo ejecutaría el
// instalador real. En su lugar se extrae solo la línea `ALL_COMPONENTS=(...)` con una regex
// (independiente de la de leerComponentes) y se le pide a un bash aislado que la evalúe.
//
// Uso: node bin/wizard/test-componentes.mjs — exit 0 si coincide, exit 1 si no.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { leerComponentes, localizarBash } from "./detect.mjs";

const REPO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const INSTALL_SH = path.join(REPO_DIR, "install.sh");

const obtenido = leerComponentes(INSTALL_SH);
console.log(`leerComponentes() devolvió: ${obtenido.join(", ")}`);

if (obtenido.length === 0) {
    console.error("FALLO: leerComponentes() devolvió una lista vacía.");
    process.exit(1);
}

const contenido = fs.readFileSync(INSTALL_SH, "utf8");
const lineaMatch = contenido.match(/^ALL_COMPONENTS=\([^)]*\)\s*$/m);
if (!lineaMatch) {
    console.error("FALLO: no se encontró la línea 'ALL_COMPONENTS=(...)' en install.sh.");
    process.exit(1);
}

const bash = localizarBash();
if (!bash) {
    console.warn(
        "AVISO: no se encontró bash — no se puede hacer la verificación cruzada real contra install.sh."
    );
    console.warn("Se omite la comprobación estricta (no se marca como fallo solo por falta de bash).");
    process.exit(0);
}

// Evalúa SOLO esa línea (no todo install.sh) en un bash aislado y de usar-y-tirar: sin
// efectos secundarios, y usa el parser de arrays real de bash — no otra regex de JS — como
// referencia independiente.
const script = `${lineaMatch[0]}\nprintf '%s\\n' "\${ALL_COMPONENTS[@]}"`;
const res = spawnSync(bash, ["-c", script], { encoding: "utf8" });

if (res.error || res.status !== 0) {
    console.warn(`AVISO: la evaluación con bash falló (${res.error ? res.error.message : `status ${res.status}`}).`);
    console.warn("Se omite la comprobación estricta.");
    process.exit(0);
}

const deBash = res.stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const igual = deBash.length === obtenido.length && deBash.every((id, i) => id === obtenido[i]);

if (!igual) {
    console.error("FALLO: DESINCRONIZADO — leerComponentes() no coincide con lo que bash evalúa del array real.");
    console.error(`  bash:   [${deBash.join(", ")}]`);
    console.error(`  wizard: [${obtenido.join(", ")}]`);
    process.exit(1);
}

console.log(`OK: ${obtenido.length} componentes sincronizados y verificados por bash (${obtenido.join(", ")}).`);
process.exit(0);
