#!/usr/bin/env node
// Envoltura del wizard sobre la detección de dependencias y sobre bin/install.sh.
//
// Decisión de enfoque (pedida explícitamente por la especificación): para detectar
// dependencias, este módulo NO reimplementa `command -v` binario por binario en Node.
// En su lugar lanza UN SOLO proceso bash que:
//   1. hace `source` de bin/lib/detect.sh y llama a ac_detect_all() — exactamente la misma
//      función que usa bin/install.sh, así que node/git/npm/claude/os nunca pueden divergir
//      entre "lo que detecta el wizard" y "lo que detecta el instalador real";
//   2. añade unos pocos `command -v` extra para las herramientas que detect.sh no cubre
//      pero que el wizard sí necesita mostrar (docker + su daemon, ollama, python, java,
//      winget) — necesarios porque detect.sh solo se preocupa de lo que bin/install.sh exige
//      como mínimo (curl/git/node/npm/claude), no de las dependencias de los componentes;
//   3 vuelca todo como líneas `CLAVE=valor` por stdout, fáciles de parsear.
//
// Se prefirió UN bash -c en vez de N invocaciones de `command -v X` (una por binario)
// porque: (a) reutiliza ac_detect_all tal cual, cumpliendo "ejecutarla, no reimplementarla";
// (b) en Windows cada spawn de bash cuesta bastante (cientos de ms) — un solo proceso es
// más robusto ante entornos lentos que nueve; (c) un único punto de fallo es más fácil de
// degradar con gracia (si bash no aparece, se informa una sola vez, no nueve).

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Localiza bash en Windows en el orden pedido por la especificación:
//   1. `bash` resoluble en el PATH (cubre Git Bash, WSL, MSYS2, lo que haya)
//   2. %ProgramFiles%\Git\bin\bash.exe (instalación estándar de Git for Windows, todos los usuarios)
//   3. %LOCALAPPDATA%\Programs\Git\bin\bash.exe (instalación de Git for Windows solo-usuario)
// En macOS/Linux el paso 1 casi siempre basta (bash del sistema).
// Comprueba que un bash sea utilizable para el instalador. En Windows descarta el
// bash de WSL: monta el disco en /mnt/c en vez de /c, así que las rutas que le
// pasamos (RAG_ROOT, AC_REPO_DIR) no resolverían. Git Bash reporta OSTYPE=msys;
// WSL reporta linux-gnu.
function bashUtilizable(bin) {
    const r = spawnSync(bin, ["-c", "echo $OSTYPE"], {
        encoding: "utf8", windowsHide: true, timeout: 10000
    });
    if (r.error || r.status !== 0) return false;
    const tipo = (r.stdout || "").trim();
    if (process.platform === "win32" && !/^msys|^cygwin/.test(tipo)) return false;
    return true;
}

export function localizarBash() {
    // En Windows se prueban primero las rutas conocidas de Git for Windows: el PATH
    // puede tener antes el bash de WSL, que no nos sirve (ver bashUtilizable).
    const candidatos = [];
    if (process.platform === "win32") {
        for (const base of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.LOCALAPPDATA]) {
            if (!base) continue;
            candidatos.push(path.join(base, "Git", "bin", "bash.exe"));
            candidatos.push(path.join(base, "Programs", "Git", "bin", "bash.exe"));
        }
    }
    for (const candidato of candidatos) {
        if (fs.existsSync(candidato) && bashUtilizable(candidato)) return candidato;
    }
    // Último recurso: el bash del PATH, siempre que pase la comprobación.
    if (bashUtilizable("bash")) return "bash";
    return null;
}

// Extrae ALL_COMPONENTS de bin/install.sh con una expresión regular — el wizard nunca
// mantiene su propia copia de la lista de componentes (ver bin/install.sh:57).
export function leerComponentes(rutaInstallSh) {
    const contenido = fs.readFileSync(rutaInstallSh, "utf8");
    const m = contenido.match(/ALL_COMPONENTS=\(([^)]*)\)/);
    if (!m) {
        throw new Error(`No se pudo extraer ALL_COMPONENTS de ${rutaInstallSh} — ¿cambió el formato del archivo?`);
    }
    return m[1].trim().split(/\s+/).filter(Boolean);
}

const SCRIPT_DETECCION = `
set -u
. bin/lib/detect.sh
ac_detect_all

printf 'AC_HAS_NODE=%s\\n' "$AC_HAS_NODE"
printf 'AC_NODE_VERSION=%s\\n' "$(node --version 2>/dev/null || true)"
printf 'AC_HAS_GIT=%s\\n' "$AC_HAS_GIT"
printf 'AC_HAS_CLAUDE=%s\\n' "$AC_HAS_CLAUDE"
printf 'AC_HAS_NPM=%s\\n' "$AC_HAS_NPM"
printf 'AC_OS=%s\\n' "$AC_OS"

if command -v docker >/dev/null 2>&1; then
    printf 'AC_HAS_DOCKER=1\\n'
    if docker info >/dev/null 2>&1; then printf 'AC_DOCKER_RUNNING=1\\n'; else printf 'AC_DOCKER_RUNNING=0\\n'; fi
else
    printf 'AC_HAS_DOCKER=0\\n'
    printf 'AC_DOCKER_RUNNING=0\\n'
fi

if command -v ollama >/dev/null 2>&1; then printf 'AC_HAS_OLLAMA=1\\n'; else printf 'AC_HAS_OLLAMA=0\\n'; fi

if command -v python >/dev/null 2>&1; then
    printf 'AC_HAS_PYTHON=1\\n'
    printf 'AC_PYTHON_VERSION=%s\\n' "$(python --version 2>&1 | tr -d '\\r\\n')"
elif command -v python3 >/dev/null 2>&1; then
    printf 'AC_HAS_PYTHON=1\\n'
    printf 'AC_PYTHON_VERSION=%s\\n' "$(python3 --version 2>&1 | tr -d '\\r\\n')"
else
    printf 'AC_HAS_PYTHON=0\\n'
fi

if command -v java >/dev/null 2>&1; then
    printf 'AC_HAS_JAVA=1\\n'
    printf 'AC_JAVA_VERSION=%s\\n' "$(java -version 2>&1 | head -n1 | tr -d '\\r\\n')"
else
    printf 'AC_HAS_JAVA=0\\n'
fi

if command -v winget >/dev/null 2>&1; then printf 'AC_HAS_WINGET=1\\n'; else printf 'AC_HAS_WINGET=0\\n'; fi
`;

function parsearSalida(stdout) {
    const datos = {};
    for (const linea of stdout.split("\n")) {
        const idx = linea.indexOf("=");
        if (idx === -1) continue;
        datos[linea.slice(0, idx).trim()] = linea.slice(idx + 1).trim();
    }
    return datos;
}

const B = (v) => v === "1";

// Ejecuta la detección real. repoDir: raíz del repo (para que `. bin/lib/detect.sh`
// resuelva). Devuelve { ok: true, bash, items } o { ok: false, error } si no hay bash.
export function detectar(repoDir, { bashPath } = {}) {
    const bash = bashPath || localizarBash();
    if (!bash) {
        return { ok: false, error: "no se encontró bash (ni en PATH ni en las rutas de Git for Windows)" };
    }

    const res = spawnSync(bash, ["-c", SCRIPT_DETECCION], {
        cwd: repoDir,
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 2_000_000,
    });

    if (res.error) {
        return { ok: false, error: `fallo al ejecutar bash: ${res.error.message}` };
    }
    const datos = parsearSalida(res.stdout || "");

    return {
        ok: true,
        bash,
        raw: datos,
        items: {
            node: { id: "node", disponible: B(datos.AC_HAS_NODE), detalle: datos.AC_NODE_VERSION || "" },
            git: { id: "git", disponible: B(datos.AC_HAS_GIT) },
            claude: { id: "claude", disponible: B(datos.AC_HAS_CLAUDE) },
            npm: { id: "npm", disponible: B(datos.AC_HAS_NPM) },
            docker: {
                id: "docker",
                disponible: B(datos.AC_HAS_DOCKER),
                corriendo: B(datos.AC_DOCKER_RUNNING),
            },
            ollama: { id: "ollama", disponible: B(datos.AC_HAS_OLLAMA) },
            python: { id: "python", disponible: B(datos.AC_HAS_PYTHON), detalle: datos.AC_PYTHON_VERSION || "" },
            java: { id: "java", disponible: B(datos.AC_HAS_JAVA), detalle: datos.AC_JAVA_VERSION || "" },
            winget: { id: "winget", disponible: B(datos.AC_HAS_WINGET) },
        },
        os: datos.AC_OS || "",
    };
}
