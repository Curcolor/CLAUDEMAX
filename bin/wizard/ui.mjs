#!/usr/bin/env node
// Primitivas de interfaz del wizard de CLAUDEMAX: colores ANSI, banner, tablas y los
// prompts interactivos (texto, oculto, sí/no, menú simple, menú de casillas).
//
// Sin dependencias — solo builtins `node:`. Mismo estilo que hooks/ui-audit.mjs y
// hooks/session-start.mjs: funciones pequeñas, comentarios en español, tolerante a
// entornos degradados (sin TTY, sin color) en vez de reventar.

import * as readlinePromises from "node:readline/promises";

// --- Colores -------------------------------------------------------------------------
// Desactivados si NO_COLOR o CLAUDEMAX_NO_COLOR están definidas, o si stdout no es TTY
// (p. ej. cuando la salida se redirige a un archivo o a una tubería en una prueba).
// wizard.mjs puede forzar la desactivación con desactivarColores() vía --no-color.

const CODIGOS = {
    rojo: "\u001b[0;31m",
    verde: "\u001b[0;32m",
    amarillo: "\u001b[1;33m",
    azul: "\u001b[0;34m",
    atenuado: "\u001b[2m",
    reset: "\u001b[0m",
};

let coloresActivos =
    !(process.env.NO_COLOR || process.env.CLAUDEMAX_NO_COLOR) && process.stdout.isTTY === true;

export function desactivarColores() {
    coloresActivos = false;
}

export function coloresEstanActivos() {
    return coloresActivos;
}

function pintar(codigo, texto) {
    if (!coloresActivos) return texto;
    return `${codigo}${texto}${CODIGOS.reset}`;
}

export const rojo = (texto) => pintar(CODIGOS.rojo, texto);
export const verde = (texto) => pintar(CODIGOS.verde, texto);
export const amarillo = (texto) => pintar(CODIGOS.amarillo, texto);
export const azul = (texto) => pintar(CODIGOS.azul, texto);
export const atenuado = (texto) => pintar(CODIGOS.atenuado, texto);

// Elimina secuencias ANSI para calcular el ancho visible real de una celda de tabla
// (si no, una celda coloreada "parece" más larga de lo que ocupa en pantalla y desalinea
// las columnas).
const ANSI_RE = /\u001b\[[0-9;]*m/g;
function anchoVisible(texto) {
    return String(texto).replace(ANSI_RE, "").length;
}

// --- Banner y títulos ------------------------------------------------------------------

// Mismo arte ASCII que el banner de install.sh (líneas 133-142), para que la experiencia
// del wizard y la del instalador no interactivo se sientan como la misma herramienta.
const ARTE = [
    "  ___ _      _   _   _ ___  ___ __  __  _   __  __",
    " / __| |    /_\\ | | | |   \\| __|  \\/  | /_\\  \\ \\/ /",
    "| (__| |__ / _ \\ |_| | |) | _|| |\\/| |/ _ \\  >  <",
    " \\___|____/_/ \\_\\___/|___/|___|_|  |_/_/ \\_\\/_/\\_\\",
].join("\n");

export function banner() {
    console.log(`\n${azul(ARTE)}\n`);
    console.log("  Asistente de instalación — ahorro de tokens + UI/UX + cerebro RAG + análisis.\n");
}

export function titulo(texto) {
    console.log(`\n${azul("==>")} ${texto}`);
}

// --- Tabla -------------------------------------------------------------------------
// filas: array de arrays de celdas (string-able). La primera fila se trata como
// encabezado: se imprime una línea separadora justo debajo.
export function tabla(filas) {
    if (!Array.isArray(filas) || filas.length === 0) return;

    const columnas = filas[0].length;
    const anchos = new Array(columnas).fill(0);
    for (const fila of filas) {
        for (let i = 0; i < columnas; i++) {
            anchos[i] = Math.max(anchos[i], anchoVisible(fila[i] ?? ""));
        }
    }

    filas.forEach((fila, indiceFila) => {
        const linea = fila
            .map((celda, i) => {
                const texto = String(celda ?? "");
                const relleno = " ".repeat(Math.max(0, anchos[i] - anchoVisible(texto)));
                return texto + relleno;
            })
            .join("   ");
        console.log(`  ${linea}`);
        if (indiceFila === 0) {
            const totalAncho = anchos.reduce((a, b) => a + b, 0) + (columnas - 1) * 3;
            console.log(`  ${"─".repeat(totalAncho)}`);
        }
    });
}

// --- Prompts -------------------------------------------------------------------------
// IMPORTANTE — por qué NO se usa rl.question() encadenado: cuando stdin no es una TTY
// (tuberías, exactamente lo que usan las pruebas automatizadas del wizard) el stream
// entrega TODO su contenido de golpe. readline lo parte en líneas y dispara un evento
// 'line' por cada una tan pronto las tiene — pero rl.question() solo atrapa la PRIMERA
// línea que llegue después de haber sido llamado; las líneas que ya estaban listas antes
// de que hubiera una pregunta pendiente se disparan igualmente como evento 'line' y, al no
// haber ningún callback esperándolas en ese instante, se pierden para siempre. Resultado:
// la segunda pregunta se queda esperando una línea que ya pasó y nunca resuelve.
//
// La forma correcta y documentada de consumir todas las líneas sin perder ninguna es el
// iterador asíncrono de la interfaz (`for await...of rl`): cada línea que llega se encola
// y se entrega en orden a quien llame next(), sin importar si llegan todas de golpe (pipe)
// o una a una según se teclean (TTY real). Por eso aquí solo hay UN consumidor de líneas
// (siguienteLinea()) compartido por preguntar/confirmar/menuSimple/menuMultiple.
let interfazCompartida = null;
let iteradorLineas = null;

function obtenerInterfaz() {
    if (!interfazCompartida) {
        interfazCompartida = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });
        iteradorLineas = interfazCompartida[Symbol.asyncIterator]();
    }
    return interfazCompartida;
}

// Pide la siguiente línea ya escrita por el usuario (o disponible en el pipe). Devuelve ""
// si el stream se acabó (EOF) en vez de colgarse esperando algo que ya no va a llegar.
async function siguienteLinea() {
    obtenerInterfaz();
    const { value, done } = await iteradorLineas.next();
    return done ? "" : value;
}

// Cierra la interfaz compartida (si existe) y restaura el modo cocido de la TTY. Hay que
// llamarla antes de lanzar un proceso hijo con stdio heredado (para que reciba stdin en
// modo normal, no en el raw mode que readline pudo haber activado) y es segura de llamar
// aunque no haya ninguna interfaz abierta.
export function cerrarInterfaz() {
    if (interfazCompartida) {
        interfazCompartida.close();
        interfazCompartida = null;
        iteradorLineas = null;
    }
    if (process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
        try {
            process.stdin.setRawMode(false);
        } catch {
            /* no crítico */
        }
    }
}

export async function preguntar(texto, { defecto } = {}) {
    const sufijo = defecto !== undefined && defecto !== "" ? ` [${defecto}]` : "";
    process.stdout.write(`${texto}${sufijo}: `);
    const respuesta = (await siguienteLinea()).trim();
    return respuesta === "" && defecto !== undefined ? defecto : respuesta;
}

const RESPUESTAS_AFIRMATIVAS = new Set(["s", "si", "sí", "y", "yes"]);

export async function confirmar(texto, { defecto = true } = {}) {
    const sufijo = defecto ? " [S/n]" : " [s/N]";
    process.stdout.write(`${texto}${sufijo}: `);
    const respuesta = (await siguienteLinea()).trim().toLowerCase();
    if (respuesta === "") return defecto;
    return RESPUESTAS_AFIRMATIVAS.has(respuesta);
}

// Lectura sin eco en pantalla (para la clave de Kaggle). Solo es posible en una TTY real
// con setRawMode disponible; si stdin viene de una tubería (pruebas automatizadas, o el
// usuario redirigió entrada) degradamos a preguntar() normal con un aviso — no hay eco de
// terminal que ocultar en ese caso de todas formas, y así seguimos usando la interfaz
// compartida (ver nota de más arriba) en vez de competir por stdin.
//
// En TTY real: cerramos la interfaz compartida antes de leer en raw mode directamente de
// stdin (para que no haya dos consumidores de stdin a la vez) y dejamos que la siguiente
// llamada a preguntar()/confirmar()/menú recree una interfaz nueva — recrearla es seguro
// aquí porque en una TTY real no hay "datos ya buferizados" que perder: el usuario teclea
// en vivo, no como un archivo redirigido de una sola vez.
export async function preguntarOculto(texto) {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
        console.log(atenuado("  (No se puede ocultar la entrada en este entorno — no hay TTY interactiva.)"));
        return preguntar(texto);
    }

    cerrarInterfaz();
    return new Promise((resolve) => {
        process.stdout.write(`${texto}: `);
        const stdin = process.stdin;
        stdin.resume();
        stdin.setRawMode(true);
        stdin.setEncoding("utf8");

        let valor = "";
        const finalizar = () => {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener("data", onData);
            process.stdout.write("\n");
            resolve(valor);
        };
        const onData = (char) => {
            switch (char) {
                case "\n":
                case "\r":
                case "\u0004": // Ctrl-D
                    finalizar();
                    break;
                case "\u0003": // Ctrl-C — respeta la salida habitual del usuario
                    process.stdout.write("\n");
                    process.exit(130);
                    break;
                case "\u007f":
                case "\b": // Backspace / Delete
                    valor = valor.slice(0, -1);
                    break;
                default:
                    valor += char;
                    break;
            }
        };
        stdin.on("data", onData);
    });
}

// Menú de una sola opción: lista numerada, el usuario escribe el número.
// opciones: [{ id, etiqueta }]. Devuelve el id elegido.
export async function menuSimple(opciones) {
    opciones.forEach((op, i) => console.log(`  ${i + 1}. ${op.etiqueta}`));
    for (;;) {
        process.stdout.write(`Elige una opción [1-${opciones.length}]: `);
        const respuesta = (await siguienteLinea()).trim();
        const n = Number(respuesta);
        if (Number.isInteger(n) && n >= 1 && n <= opciones.length) {
            return opciones[n - 1].id;
        }
        console.log(rojo("  Opción inválida."));
    }
}

// Menú de casillas: lista numerada con marca, escribir un número la alterna, Enter
// (línea vacía) confirma la selección actual.
// opciones: [{ id, etiqueta, marcado? }] (marcado por defecto: true). Devuelve los ids
// que quedaron marcados, en el mismo orden en que se recibieron.
export async function menuMultiple(opciones) {
    const estado = opciones.map((op) => ({ ...op, marcado: op.marcado !== false }));
    for (;;) {
        estado.forEach((op, i) => {
            const marca = op.marcado ? verde("[x]") : atenuado("[ ]");
            console.log(`  ${marca} ${i + 1}. ${op.etiqueta}`);
        });
        process.stdout.write("Número para marcar/desmarcar, Enter para confirmar: ");
        const respuesta = (await siguienteLinea()).trim();
        if (respuesta === "") break;
        const n = Number(respuesta);
        if (Number.isInteger(n) && n >= 1 && n <= estado.length) {
            estado[n - 1].marcado = !estado[n - 1].marcado;
        } else {
            console.log(rojo("  Opción inválida."));
        }
    }
    return estado.filter((op) => op.marcado).map((op) => op.id);
}
