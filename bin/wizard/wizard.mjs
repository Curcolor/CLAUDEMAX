#!/usr/bin/env node
// wizard.mjs — asistente interactivo de instalación de CLAUDEMAX. Flujo de 9 pasos
// descrito en docs/superpowers/specs/2026-08-02-wizard-design.md.
//
// Principio rector (de la spec): el wizard NO reimplementa la instalación, la orquesta.
// Toda la lógica de instalación sigue viviendo en install.sh y bin/components/*.sh; este
// archivo solo recoge decisiones del usuario y las traduce a flags + variables de entorno
// para `bash install.sh`, que se lanza con stdio heredado (paso 8) sin reformatear su
// salida.
//
// Flags propios del wizard (no confundir con los de install.sh):
//   --uninstall   modo desinstalación (delega en uninstall.sh)
//   --dry-run     fuerza modo simulación sin preguntarlo en el paso 7
//   --defaults    acepta todos los valores por defecto sin preguntar nada
//   --no-color    desactiva los colores ANSI

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import * as ui from "./ui.mjs";
import { localizarBash, leerComponentes, detectar } from "./detect.mjs";

const REPO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const INSTALL_SH = path.join(REPO_DIR, "install.sh");
const UNINSTALL_SH = path.join(REPO_DIR, "uninstall.sh");

// --- Flags del wizard ------------------------------------------------------------------

const argv = process.argv.slice(2);
const FLAGS = {
    uninstall: argv.includes("--uninstall"),
    dryRun: argv.includes("--dry-run"),
    defaults: argv.includes("--defaults"),
    noColor: argv.includes("--no-color"),
};
if (FLAGS.noColor) ui.desactivarColores();

// Red de seguridad: sea cual sea el camino de salida (cancelación, error, fin normal),
// deja la interfaz de readline cerrada y la TTY en modo cocido antes de que el proceso
// termine de verdad.
process.on("exit", () => ui.cerrarInterfaz());

// --- Mapa id → descripción de una línea -------------------------------------------------
// Los .sh de bin/components/ no tienen un campo estructurado para esto, así que vive aquí.
// Si install.sh gana un componente nuevo y este mapa no se actualiza, no falla: se muestra
// con una descripción genérica (ver descripcionDe() más abajo).
const DESCRIPCIONES = {
    rtk: "RTK — proxy CLI que reescribe comandos frecuentes (git, npm...) para ahorrar tokens.",
    figma: "MCP de Figma — trae diseños de Figma al contexto de Claude Code.",
    "ui-ux": "Skill UI/UX Pro Max + MCP magic (21st.dev) + hook de auditoría de anti-patrones visuales.",
    "dev-skills": "Skills de disciplina de ingeniería: superpowers, arquitectura, patrones, commits convencionales.",
    rag: "V.A.U.L.T + stack RAG (PGVector + Ollama bge-m3) — memoria semántica del workspace.",
    graphify: "Plugin Understand-Anything — grafo de conocimiento del repo (/understand).",
    "cyber-neo": "Skill de auditoría de seguridad OWASP Top 10 / CWE.",
    parsers: "MCP markitdown + parsers de ingesta (PDF, audio, documentos).",
    rules: "Reglas operativas del workspace + hooks de rituales (git-footer-guard, loop-breaker...).",
};
function descripcionDe(id) {
    return DESCRIPCIONES[id] || `Componente de CLAUDEMAX (sin descripción registrada para "${id}").`;
}

// "Necesaria para" de la tabla de dependencias del paso 3 — puramente informativo.
const NECESARIA_PARA = {
    node: "todo",
    git: "skills, clones",
    claude: "MCPs, plugins",
    docker: "RAG (base vectorial)",
    ollama: "RAG (embeddings)",
    python: "parsers",
    java: "parsers (PDF)",
    winget: "instalar dependencias que falten, automáticamente",
    npm: "todo",
};

// --- Utilidades de ruta ------------------------------------------------------------------

// Convierte una ruta de Windows a la forma POSIX que espera Git Bash (C:\a\b -> /c/a/b).
// Necesario porque RAG_ROOT/VAULT_SRC/RAG_DUMP terminan usados dentro de scripts bash
// (mkdir -p "$RAG_ROOT/...", cp -R, etc.) — el propio ejemplo de la spec usa esta forma
// ("RAG_ROOT=/c/Users/.../WORKSPACE"), así que la igualamos en vez de confiar en que Git
// Bash traduzca por su cuenta una ruta con backslashes recibida como valor de variable.
function aPosix(rutaWindows) {
    const absoluta = path.resolve(rutaWindows).replace(/\\/g, "/");
    const m = absoluta.match(/^([A-Za-z]):(.*)$/);
    if (m) return `/${m[1].toLowerCase()}${m[2]}`;
    return absoluta;
}

function comprobarDestino(ruta) {
    try {
        const existe = fs.existsSync(ruta);
        if (existe) {
            const st = fs.statSync(ruta);
            if (!st.isDirectory()) {
                return { escribible: false, motivo: "ya existe y no es una carpeta" };
            }
            try {
                fs.accessSync(ruta, fs.constants.W_OK);
            } catch {
                return { escribible: false, motivo: "sin permisos de escritura" };
            }
            const contenido = fs.readdirSync(ruta);
            return { escribible: true, existeYNoVacio: contenido.length > 0 };
        }

        // No existe todavía: busca el primer ancestro existente y comprueba que sea
        // escribible (ahí es donde install.sh haría el mkdir -p).
        let actual = ruta;
        let padre = path.dirname(actual);
        while (!fs.existsSync(padre) && padre !== actual) {
            actual = padre;
            padre = path.dirname(actual);
        }
        if (!fs.existsSync(padre)) {
            return { escribible: false, motivo: "ninguna carpeta ancestro existe" };
        }
        try {
            fs.accessSync(padre, fs.constants.W_OK);
        } catch {
            return { escribible: false, motivo: `sin permisos de escritura en ${padre}` };
        }
        return { escribible: true, existeYNoVacio: false };
    } catch (e) {
        return { escribible: false, motivo: e.message };
    }
}

// --- Ejecución de procesos hijos ----------------------------------------------------------

function ejecutar(cmd, args, envExtra = {}) {
    return new Promise((resolve) => {
        const hijo = spawn(cmd, args, {
            stdio: "inherit",
            cwd: REPO_DIR,
            env: { ...process.env, ...envExtra },
        });
        hijo.on("exit", (code, signal) => resolve(code !== null ? code : (signal ? 1 : 0)));
        hijo.on("error", (err) => {
            console.log(ui.rojo(`No se pudo ejecutar "${cmd}": ${err.message}`));
            resolve(1);
        });
    });
}

async function esperarTeclaFinal() {
    // Solo tiene sentido en Windows (para que la ventana de CLAUDEMAX-INSTALLER.cmd no se
    // cierre de golpe) y solo si hay una TTY real esperando input — nunca en --defaults ni
    // en una prueba automatizada con stdin redirigido (colgaría para siempre).
    if (FLAGS.defaults) return;
    if (process.platform !== "win32") return;
    if (!process.stdin.isTTY) return;
    await ui.preguntar("\nPulsa Enter para salir");
}

// --- Paso 1: bienvenida -----------------------------------------------------------------

async function pasoBienvenida() {
    ui.banner();
    console.log(
        "Este asistente prepara tu workspace de CLAUDEMAX: detecta qué falta, deja elegir qué " +
            "componentes instalar, y arma la línea de comando de install.sh para que la revises " +
            "antes de ejecutarla — nunca instala nada por su cuenta.\n"
    );
    if (FLAGS.defaults) return;
    const resp = await ui.preguntar('Enter para continuar, "q" para salir', { defecto: "" });
    if (String(resp).trim().toLowerCase() === "q") {
        console.log("\nCancelado. No se ha tocado nada.");
        process.exit(0);
    }
}

// --- Paso 2: destino del workspace -------------------------------------------------------

async function pasoDestino() {
    ui.titulo("2. Destino del workspace");
    const porDefecto = path.join(os.homedir(), "Desktop", "WORKSPACE");

    if (FLAGS.defaults) {
        const chequeo = comprobarDestino(porDefecto);
        if (!chequeo.escribible) {
            console.log(ui.rojo(`No se puede usar "${porDefecto}": ${chequeo.motivo}`));
            process.exit(1);
        }
        console.log(`  Destino: ${porDefecto}`);
        return path.resolve(porDefecto);
    }

    for (;;) {
        const respuesta = String(
            await ui.preguntar("¿Dónde creamos la carpeta raíz del workspace?", { defecto: porDefecto })
        ).trim();
        const destino = path.resolve(respuesta || porDefecto);
        const chequeo = comprobarDestino(destino);

        if (!chequeo.escribible) {
            console.log(ui.rojo(`  No se puede escribir en "${destino}": ${chequeo.motivo}. Prueba otra ruta.`));
            continue;
        }
        if (chequeo.existeYNoVacio) {
            const seguir = await ui.confirmar(
                `  "${destino}" ya existe y no está vacío. ¿Continuar de todas formas?`,
                { defecto: false }
            );
            if (!seguir) continue;
        }
        return destino;
    }
}

// --- Paso 3: chequeo de dependencias ------------------------------------------------------

function formatearEstado(item) {
    if (!item.disponible) return `${ui.rojo("✗")} no encontrado`;
    if (item.id === "docker" && !item.corriendo) return `${ui.amarillo("✓")} instalado (Docker Desktop apagado)`;
    return `${ui.verde("✓")} instalado`;
}

function formatearNombre(item) {
    if (item.id === "node" && item.detalle) return `node ${item.detalle}`;
    if (item.id === "python" && item.detalle) return `python ${item.detalle.replace(/^Python\s+/i, "")}`;
    if (item.id === "java" && item.detalle) return "java";
    return item.id;
}

async function pasoDependencias() {
    ui.titulo("3. Chequeo de dependencias");
    const resultado = detectar(REPO_DIR);

    if (!resultado.ok) {
        console.log(ui.amarillo(`  No se pudo ejecutar la detección automática (${resultado.error}).`));
        console.log(ui.atenuado("  Seguimos sin esta información — instala manualmente lo que haga falta."));
        return resultado;
    }

    const orden = ["node", "git", "claude", "docker", "ollama", "python", "java"];
    const filas = [["Dependencia", "Estado", "Necesaria para"]];
    for (const id of orden) {
        const item = resultado.items[id];
        if (!item) continue;
        filas.push([formatearNombre(item), formatearEstado(item), NECESARIA_PARA[id] || ""]);
    }
    ui.tabla(filas);

    const faltantes = orden.filter((id) => {
        const item = resultado.items[id];
        return item && (!item.disponible || (id === "docker" && !item.corriendo));
    });

    if (faltantes.length > 0) {
        console.log("");
        console.log(ui.amarillo(`  Faltan o están apagadas: ${faltantes.join(", ")}.`));
        console.log(
            ui.atenuado(
                "  No se instalan aquí: los componentes correspondientes ya saben instalarlas solos " +
                    "(ac_rag_ensure_deps vía winget, ac_parsers_ensure_python) cuando les toque ejecutarse."
            )
        );
        if (!resultado.items.winget?.disponible) {
            console.log(ui.atenuado("  winget tampoco está disponible — puede que tengas que instalar algo a mano."));
        }
        if (!FLAGS.defaults) {
            await ui.confirmar("  ¿Continuar de todas formas?", { defecto: true });
        }
    }

    return resultado;
}

// --- Paso 4: selección de componentes -----------------------------------------------------

async function pasoComponentes() {
    ui.titulo("4. Selección de componentes");
    const idsDetectados = leerComponentes(INSTALL_SH);

    if (FLAGS.defaults) {
        console.log(`  Componentes (todos): ${idsDetectados.join(", ")}`);
        return idsDetectados;
    }

    const opciones = idsDetectados.map((id) => ({ id, etiqueta: `${id} — ${descripcionDe(id)}`, marcado: true }));
    const seleccionados = await ui.menuMultiple(opciones);
    if (seleccionados.length === 0) {
        console.log(ui.amarillo("  No quedó ningún componente marcado — no se instalará nada."));
    }
    return seleccionados;
}

// --- Paso 5: vault (solo si 'rag' está seleccionado) ---------------------------------------

async function pasoVault() {
    ui.titulo("5. Vault (V.A.U.L.T)");
    if (FLAGS.defaults) {
        console.log("  Modo: crear desde cero.");
        return { VAULT_MODE: "create" };
    }

    const modo = await ui.menuSimple([
        { id: "create", etiqueta: "Crear desde cero (plantilla con la taxonomía de seis categorías)" },
        { id: "import", etiqueta: "Importar uno existente" },
        { id: "connect", etiqueta: "Conectar a uno remoto (git)" },
    ]);
    const env = { VAULT_MODE: modo };

    if (modo === "import") {
        for (;;) {
            const src = String(await ui.preguntar("  Ruta del vault existente (VAULT_SRC)")).trim();
            if (src && fs.existsSync(src)) {
                env.VAULT_SRC = aPosix(src);
                break;
            }
            console.log(ui.rojo(`  "${src}" no existe. Inténtalo de nuevo.`));
        }
    } else if (modo === "connect") {
        const remoto = String(await ui.preguntar("  URL de git del vault remoto (VAULT_REMOTE)")).trim();
        if (remoto) env.VAULT_REMOTE = remoto;
        else console.log(ui.amarillo("  URL vacía — VAULT_REMOTE no se establecerá."));
    }
    return env;
}

// --- Paso 6: RAG + Kaggle opcional (solo si 'rag' está seleccionado) -----------------------

async function pasoRag() {
    ui.titulo("6. RAG (stack + Kaggle opcional)");
    if (FLAGS.defaults) {
        console.log("  Modo: crear desde cero. Kaggle: omitido.");
        return { RAG_MODE: "create" };
    }

    const modo = await ui.menuSimple([
        { id: "create", etiqueta: "Crear desde cero (Docker Compose + schema + Ollama bge-m3)" },
        { id: "import", etiqueta: "Importar un dump existente" },
        { id: "connect", etiqueta: "Conectar a un Postgres remoto" },
    ]);
    const env = { RAG_MODE: modo };

    if (modo === "import") {
        const dump = String(
            await ui.preguntar("  Ruta del archivo de dump (RAG_DUMP, opcional — Enter para omitir)")
        ).trim();
        if (dump) env.RAG_DUMP = aPosix(dump);
    } else if (modo === "connect") {
        const url = String(await ui.preguntar("  URL de conexión Postgres (RAG_REMOTE_URL)")).trim();
        if (url) env.RAG_REMOTE_URL = url;
        else console.log(ui.amarillo("  URL vacía — RAG_REMOTE_URL no se establecerá."));
    }

    const quiereKaggle = await ui.confirmar(
        "  ¿Configurar el backend opcional de Kaggle (embeddings por lotes en GPU)?",
        { defecto: false }
    );
    if (quiereKaggle) {
        const usuario = String(await ui.preguntar("  Usuario de Kaggle (KAGGLE_USERNAME)")).trim();
        const clave = String(await ui.preguntarOculto("  Clave de Kaggle (KAGGLE_KEY, no se mostrará en pantalla)")).trim();
        if (usuario && clave) {
            env.KAGGLE_USERNAME = usuario;
            env.KAGGLE_KEY = clave;
            console.log(
                ui.amarillo(
                    "  Recuerda: Kaggle exige una verificación telefónica manual (una sola vez) en " +
                        "kaggle.com/settings → Phone Verification, para habilitar GPU e Internet en los kernels."
                )
            );
        } else {
            console.log(ui.amarillo("  Usuario o clave vacíos — se omite el backend de Kaggle."));
        }
    }

    return env;
}

// --- Construcción de la línea de comando / entorno para install.sh -------------------------

function construirArgumentos(estado) {
    const idsDetectados = leerComponentes(INSTALL_SH);
    const excluidos = idsDetectados.filter((id) => !estado.componentes.includes(id));
    const args = [aPosix(INSTALL_SH)];
    for (const id of excluidos) args.push("--skip", id);
    if (estado.simulacion) args.push("--dry-run");
    return args;
}

function construirEnv(estado) {
    return { RAG_ROOT: aPosix(estado.destino), ...(estado.vault || {}), ...(estado.rag || {}) };
}

function comillasSiHaceFalta(valor) {
    return /\s/.test(valor) ? `"${valor}"` : valor;
}

// ocultarClave=true por defecto: la línea es "auditable" (se ve exactamente qué se va a
// ejecutar) pero no hay razón para volcar la clave de Kaggle en texto plano en la terminal
// / en un log — se sigue pasando sin máscara al entorno real del proceso hijo (env, más
// abajo), solo se enmascara en lo que se IMPRIME en pantalla.
function construirLineaComando(estado, { ocultarClave = true } = {}) {
    const env = construirEnv(estado);
    const args = construirArgumentos(estado);
    const partes = Object.entries(env).map(([clave, valor]) => {
        const mostrado = ocultarClave && clave === "KAGGLE_KEY" ? "*".repeat(8) : valor;
        return `${clave}=${comillasSiHaceFalta(String(mostrado))}`;
    });
    return [...partes, "bash", ...args.map(comillasSiHaceFalta)].join(" ");
}

// --- Paso 7: resumen y confirmación -------------------------------------------------------

async function pasoResumen(estado) {
    ui.titulo("7. Resumen y confirmación");
    console.log("\nEsto es exactamente lo que se va a ejecutar:\n");
    console.log(`  ${construirLineaComando(estado)}\n`);

    if (FLAGS.dryRun) {
        estado.simulacion = true;
        console.log(ui.atenuado("(--dry-run pasado al wizard: se fuerza modo simulación, no se cambia nada.)"));
        if (!FLAGS.defaults) {
            const seguir = await ui.confirmar("¿Continuar?", { defecto: true });
            if (!seguir) {
                console.log("\nCancelado. No se ha tocado nada.");
                process.exit(0);
            }
        }
        return;
    }
    if (FLAGS.defaults) {
        estado.simulacion = false;
        return;
    }

    const eleccion = await ui.menuSimple([
        { id: "ejecutar", etiqueta: "Ejecutar la instalación de verdad" },
        { id: "simular", etiqueta: "Simular (--dry-run) — no cambia nada, solo imprime" },
        { id: "cancelar", etiqueta: "Cancelar" },
    ]);
    if (eleccion === "cancelar") {
        console.log("\nCancelado. No se ha tocado nada.");
        process.exit(0);
    }
    estado.simulacion = eleccion === "simular";
}

// --- Paso 8: ejecución ---------------------------------------------------------------------

async function pasoEjecucion(estado) {
    ui.titulo("8. Ejecución");
    const bash = localizarBash();
    if (!bash) {
        console.log(ui.rojo("No se encontró bash (ni en el PATH ni en las rutas conocidas de Git for Windows)."));
        console.log("Instala Git for Windows: https://git-scm.com/download/win");
        process.exit(1);
    }
    console.log(ui.atenuado(`(usando bash: ${bash})\n`));

    const args = construirArgumentos(estado).slice(1); // el primer elemento es install.sh; lo pasamos aparte
    const env = construirEnv(estado);
    // Cierra la interfaz de readline antes de heredar stdio: el hijo debe recibir stdin en
    // modo normal, no en el estado que readline pudo haberle dejado.
    ui.cerrarInterfaz();
    return ejecutar(bash, [aPosix(INSTALL_SH), ...args], env);
}

// --- Paso 9: resumen final ------------------------------------------------------------------

async function pasoFinal(codigo) {
    ui.titulo("9. Resumen final");
    if (codigo === 0) {
        console.log(ui.verde("La instalación terminó sin errores fatales (código de salida 0)."));
    } else {
        console.log(ui.rojo(`El instalador terminó con código ${codigo} — revisa la salida de arriba.`));
    }
    console.log("\nPróximos pasos:");
    console.log("  1. Reinicia Claude Code para que carguen los hooks y skills nuevos.");
    console.log("  2. Prueba: /understand           — grafo de conocimiento del proyecto (Graphify)");
    console.log("  3. Prueba: /mcp → rag             — búsqueda semántica sobre tu V.A.U.L.T");
    console.log("  4. node <RAG_ROOT>/R.A.G/ritual.mjs fin-sesion");
    console.log("  5. Ver README.md para la documentación completa.");
    await esperarTeclaFinal();
    process.exit(codigo);
}

// --- Modo desinstalación -------------------------------------------------------------------

async function modoDesinstalar() {
    ui.banner();
    ui.titulo("Desinstalación de CLAUDEMAX");

    console.log("Esto va a eliminar:");
    console.log("  - Skills instaladas (superpowers, ui-ux-pro-max, cyber-neo, dev-skills...)");
    console.log("  - Los cuatro hooks de reglas/rituales, el hook de auditoría de UI y el de rtk");
    console.log("  - Registros de MCP (figma, rag, markitdown) y el plugin Graphify");
    console.log("  - El binario de rtk\n");
    console.log(ui.atenuado("Se conserva:"));
    console.log(ui.atenuado("  - El vault (V.A.U.L.T) y el volumen de datos del RAG"));
    console.log(ui.atenuado("  - Las reglas del workspace en <RAG_ROOT>/.claude/ (pueden estar editadas)"));
    console.log(ui.atenuado("  - Dependencias de sistema (Docker, Ollama, Python, Java)"));
    console.log(ui.atenuado("  - RTK.md y la referencia @RTK.md en tu CLAUDE.md\n"));

    const respuesta = await ui.preguntar('Escribe la palabra "desinstalar" para confirmar (cualquier otra cosa cancela)');
    if (String(respuesta).trim() !== "desinstalar") {
        console.log("\nCancelado. No se ha tocado nada.");
        process.exit(0);
    }

    const bash = localizarBash();
    if (!bash) {
        console.log(ui.rojo("No se encontró bash (ni en el PATH ni en las rutas conocidas de Git for Windows)."));
        console.log("Instala Git for Windows: https://git-scm.com/download/win");
        process.exit(1);
    }

    const args = [aPosix(UNINSTALL_SH)];
    if (FLAGS.dryRun) args.push("--dry-run");

    ui.titulo("Ejecutando uninstall.sh");
    ui.cerrarInterfaz();
    const codigo = await ejecutar(bash, args);

    ui.titulo("Listo");
    console.log(codigo === 0 ? ui.verde("Desinstalación completada.") : ui.rojo(`uninstall.sh terminó con código ${codigo}.`));
    await esperarTeclaFinal();
    process.exit(codigo);
}

// --- Orquestación principal ------------------------------------------------------------------

async function main() {
    if (FLAGS.uninstall) {
        await modoDesinstalar();
        return;
    }

    const estado = {};
    await pasoBienvenida();
    estado.destino = await pasoDestino();
    estado.deteccion = await pasoDependencias();
    estado.componentes = await pasoComponentes();

    if (estado.componentes.includes("rag")) {
        estado.vault = await pasoVault();
        estado.rag = await pasoRag();
    } else {
        estado.vault = {};
        estado.rag = {};
    }

    await pasoResumen(estado);
    const codigo = await pasoEjecucion(estado);
    await pasoFinal(codigo);
}

main().catch((err) => {
    console.error(ui.rojo(`\nError inesperado en el wizard: ${err && err.stack ? err.stack : err}`));
    process.exit(1);
});
