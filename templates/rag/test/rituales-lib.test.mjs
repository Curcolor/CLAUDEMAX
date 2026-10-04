import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
    casaGlob, hubDeNota, enlazarEnHub, esqueletoNota, grabarCommit, notasAfectadas,
    gitReal, detectarRepo, ultimaNotaConCommit, rangoDelCiclo, specsYPlanesDelCiclo,
    rotarPendientes, copiaDeSpec, esCopia,
} from "../rituales-lib.mjs";

const hayGit = spawnSync("git", ["--version"]).status === 0;

test("casaGlob: **/, *, ?, mayúsculas y barras invertidas; sirve con archivos borrados", () => {
    assert.equal(casaGlob("MiRepo/src/**/*.cs", "MiRepo/src/Dominio/Motor.cs"), true);
    assert.equal(casaGlob("MiRepo/src/*.cs", "MiRepo/src/Dominio/Motor.cs"), false);
    assert.equal(casaGlob("**/*.xaml", "MiRepo/UI/Main.xaml"), true);
    assert.equal(casaGlob("MiRepo/a?.md", "MiRepo/a1.md"), true);
    assert.equal(casaGlob("mirepo/**", "MiRepo/lo-que-sea.txt"), true);
    assert.equal(casaGlob("MiRepo/**", "MiRepo\\borrado.cs"), true);
});

test("hubDeNota: Superpowers, Inbox, subcarpeta, y sin hub para Hubs/ y Plantillas/", () => {
    assert.equal(hubDeNota("Superpowers/Sesiones/2026-09-20-x.md"), "Hubs/Superpowers-Sesiones.md");
    assert.equal(hubDeNota("00-Inbox/pegado.md"), "Hubs/Inbox.md");
    assert.equal(hubDeNota("Codigo/Producto/Modulo.md"), "Hubs/Codigo.md");
    assert.equal(hubDeNota("Decisiones/x.md"), "Hubs/Decisiones.md");
    assert.equal(hubDeNota("Hubs/Codigo.md"), null);
    assert.equal(hubDeNota("Plantillas/nota.md"), null);
    assert.equal(hubDeNota("suelta.md"), null);
});

test("enlazarEnHub: sustituye el guion vacío, añade al final, no duplica, crea la sección y usa la ruta si es ambiguo", () => {
    const hub = ["# Codigo", "", "## Notas", "-", "", "Relacionado: [[Bienvenida]]", ""].join("\n");
    const a = enlazarEnHub(hub, { nombre: "Motor", ruta: "Codigo/Motor.md", titulo: "El motor" });
    assert.equal(a.cambiado, true);
    assert.match(a.texto, /## Notas\n- \[\[Motor\]\] — El motor\n/);
    assert.ok(!a.texto.includes("\n-\n"), "el guion vacío se sustituye");
    const b = enlazarEnHub(a.texto, { nombre: "Otra", ruta: "Codigo/Otra.md", titulo: "Otra nota" });
    assert.match(b.texto, /- \[\[Motor\]\] — El motor\n- \[\[Otra\]\] — Otra nota\n/);
    assert.deepEqual(enlazarEnHub(b.texto, { nombre: "Motor", ruta: "Codigo/Motor.md", titulo: "El motor" }),
        { texto: b.texto, cambiado: false });
    const sinSeccion = ["# Codigo", "", "Relacionado: [[Bienvenida]]", ""].join("\n");
    const c = enlazarEnHub(sinSeccion, { nombre: "Motor", ruta: "Codigo/Motor.md", titulo: "El motor" });
    assert.match(c.texto, /## Notas\n- \[\[Motor\]\] — El motor\n\nRelacionado/);
    const d = enlazarEnHub(hub, { nombre: "Motor", ruta: "Codigo/Producto/Motor.md", titulo: "El motor", ambiguo: true });
    assert.match(d.texto, /\[\[Codigo\/Producto\/Motor\]\]/);
    // un ejemplo dentro de un comentario no cuenta como "ya enlazada"
    const conEjemplo = hub.replace("## Notas", "## Notas\n<!-- ejemplo: - [[Motor]] -->");
    assert.equal(enlazarEnHub(conEjemplo, { nombre: "Motor", ruta: "Codigo/Motor.md", titulo: "El motor" }).cambiado, true);
});

test("esqueletoNota: fecha, claves de frontmatter (conserva las demás) y contenido de secciones", () => {
    const plantilla = [
        "---", "proyecto:", "tags: [sesion]", "fecha: {{date:YYYY-MM-DD}}", "---", "",
        "# Sesión — {{date:YYYY-MM-DD}}", "",
        "## Qué se hizo de verdad", "(texto de ejemplo de la plantilla)", "",
        "## Documentos del ciclo", "- Spec: [[ ]]", "",
        "## Qué sigue", "-", "",
    ].join("\n");
    const out = esqueletoNota(plantilla, {
        fecha: "2026-09-20",
        frontmatter: { proyecto: "CLAUDEMAX", commit: "abc123" },
        secciones: { "Documentos del ciclo": "- Spec: [[2026-09-13-rituales-design]]" },
    });
    assert.match(out, /^---\nproyecto: CLAUDEMAX\ntags: \[sesion\]\nfecha: 2026-09-20\ncommit: abc123\n---\n/);
    assert.match(out, /# Sesión — 2026-09-20/);
    assert.match(out, /## Documentos del ciclo\n- Spec: \[\[2026-09-13-rituales-design\]\]\n\n## Qué sigue/);
    assert.match(out, /## Qué se hizo de verdad\n\(texto de ejemplo de la plantilla\)/);
    // CRLF de entrada (core.autocrlf) da la misma salida
    assert.equal(esqueletoNota(plantilla.replace(/\n/g, "\r\n"), {
        fecha: "2026-09-20",
        frontmatter: { proyecto: "CLAUDEMAX", commit: "abc123" },
        secciones: { "Documentos del ciclo": "- Spec: [[2026-09-13-rituales-design]]" },
    }), out);
});

test("grabarCommit: sustituye el valor vacío y lo añade si falta", () => {
    const con = "---\nproyecto: X\ncommit:\n---\n\n# Nota\n";
    assert.match(grabarCommit(con, "abc123"), /^---\nproyecto: X\ncommit: abc123\n---/);
    const sin = "---\nproyecto: X\n---\n\n# Nota\n";
    assert.match(grabarCommit(sin, "abc123"), /^---\nproyecto: X\ncommit: abc123\n---/);
    assert.match(grabarCommit("# Sin frontmatter\n", "abc123"), /^# Sin frontmatter/);
    assert.match(grabarCommit(con.replace(/\n/g, "\r\n"), "abc123"), /^---\nproyecto: X\ncommit: abc123\n---/);
});

test("notasAfectadas: cruza fuentes con los archivos del ciclo y corta la lista en 5", () => {
    const notas = [
        { rel: "Codigo/Motor.md", fuentes: ["MiRepo/src/Motor/**"] },
        { rel: "Codigo/UI.md", fuentes: ["MiRepo/ui/**/*.xaml"] },
        { rel: "Decisiones/x.md", fuentes: [] },
    ];
    const archivos = ["MiRepo/src/Motor/a.cs", "MiRepo/src/Motor/b.cs", "MiRepo/src/Motor/c.cs",
        "MiRepo/src/Motor/d.cs", "MiRepo/src/Motor/e.cs", "MiRepo/src/Motor/f.cs", "MiRepo/otro.txt"];
    const r = notasAfectadas(notas, archivos);
    assert.deepEqual(r.map(n => n.rel), ["Codigo/Motor.md"]);
    assert.equal(r[0].archivos.length, 5);
    assert.equal(r[0].total, 6);
    assert.deepEqual(notasAfectadas(notas, ["MiRepo/ui/Main.xaml"]).map(n => n.rel), ["Codigo/UI.md"]);
});

// git falso: responde por el prefijo del comando.
function gitFalso(respuestas) {
    const llamadas = [];
    const exec = (args) => {
        llamadas.push(args.join(" "));
        for (const [prefijo, valor] of Object.entries(respuestas)) {
            if (args.join(" ").startsWith(prefijo)) return valor;
        }
        return null;
    };
    exec.llamadas = llamadas;
    return exec;
}

test("ultimaNotaConCommit: gana la fecha de commit más reciente, no el nombre del archivo", () => {
    const notas = [
        { rel: "Superpowers/Sesiones/2026-09-01-a.md", commit: "aaa" },
        { rel: "Superpowers/Sesiones/2026-09-20-b.md", commit: "bbb" },
        { rel: "Superpowers/Sesiones/2026-09-10-c.md", commit: "ccc" },
    ];
    const exec = gitFalso({ "show -s --format=%ct aaa": "100", "show -s --format=%ct bbb": "", "show -s --format=%ct ccc": "300" });
    assert.deepEqual(ultimaNotaConCommit(notas, exec), { rel: "Superpowers/Sesiones/2026-09-10-c.md", commit: "ccc", ts: 300 });
    assert.equal(ultimaNotaConCommit([], exec), null);
});

test("rangoDelCiclo: --desde manda; sin candidatos usa merge-base main, luego master, luego el primer commit", () => {
    const base = { "rev-parse --show-toplevel": "/w/MiRepo", "show -s --format=%cI": "2026-09-01T10:00:00-05:00" };
    const conDesde = rangoDelCiclo({ repo: "/w/MiRepo", ragRoot: "/w", desde: "HEAD~3", notas: [],
        exec: gitFalso({ ...base, "diff --name-only HEAD~3..HEAD": "src/a.cs\nsrc/b.cs", "status --porcelain": " M src/c.cs" }) });
    assert.equal(conDesde.desde, "HEAD~3");
    assert.deepEqual(conDesde.archivos, ["MiRepo/src/a.cs", "MiRepo/src/b.cs", "MiRepo/src/c.cs"]);
    assert.equal(conDesde.fechaDesde, "2026-09-01");
    const conMain = rangoDelCiclo({ repo: "/w/MiRepo", ragRoot: "/w", notas: [],
        exec: gitFalso({ ...base, "merge-base HEAD main": "m41n", "diff --name-only": "", "status --porcelain": "" }) });
    assert.equal(conMain.desde, "m41n");
    const conMaster = rangoDelCiclo({ repo: "/w/MiRepo", ragRoot: "/w", notas: [],
        exec: gitFalso({ ...base, "merge-base HEAD master": "m4st", "diff --name-only": "", "status --porcelain": "" }) });
    assert.equal(conMaster.desde, "m4st");
    const raiz = rangoDelCiclo({ repo: "/w/MiRepo", ragRoot: "/w", notas: [],
        exec: gitFalso({ ...base, "rev-list --max-parents=0 HEAD": "r00t\notr4", "diff --name-only": "", "status --porcelain": "" }) });
    assert.equal(raiz.desde, "r00t", "con varias raíces se queda con la primera");
    // trabajando sobre main, la base de la rama es HEAD (rango vacío): primer ciclo = desde la raíz
    const enMain = rangoDelCiclo({ repo: "/w/MiRepo", ragRoot: "/w", notas: [],
        exec: gitFalso({ ...base, "rev-parse HEAD": "h3ad", "merge-base HEAD main": "h3ad",
            "rev-list --max-parents=0 HEAD": "r00t", "diff --name-only": "", "status --porcelain": "" }) });
    assert.equal(enMain.desde, "r00t");
    // candidato que ya no existe → cae a merge-base y avisa
    const perdido = rangoDelCiclo({ repo: "/w/MiRepo", ragRoot: "/w", notas: [{ rel: "x.md", commit: "vi3jo" }],
        exec: gitFalso({ ...base, "merge-base HEAD main": "m41n", "diff --name-only": "", "status --porcelain": "" }) });
    assert.equal(perdido.desde, "m41n");
    assert.match(perdido.aviso, /ya no existe/);
});

test("gitReal + rangoDelCiclo con git de verdad: rutas sin commitear y renombres", { skip: !hayGit && "sin git" }, () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "rango-"));
    try {
        const repo = path.join(ws, "MiRepo");
        fs.mkdirSync(path.join(repo, "src"), { recursive: true });
        const git = args => spawnSync("git", args, { cwd: repo, encoding: "utf8" });
        git(["init", "-q"]);
        git(["config", "user.email", "prueba@example.com"]);
        git(["config", "user.name", "Prueba"]);
        fs.writeFileSync(path.join(repo, "src", "a.cs"), "// a\n");
        fs.writeFileSync(path.join(repo, "src", "b.cs"), "// b\n");
        git(["add", "-A"]);
        git(["commit", "-qm", "uno"]);
        const primero = git(["rev-parse", "HEAD"]).stdout.trim();
        fs.writeFileSync(path.join(repo, "src", "a.cs"), "// a2\n");       // " M src/a.cs" (espacio inicial)
        git(["mv", "src/b.cs", "src/c.cs"]);                                  // "R  src/b.cs -> src/c.cs"
        fs.writeFileSync(path.join(repo, "nuevo.md"), "# x\n");              // "?? nuevo.md"
        assert.equal(detectarRepo(path.join(repo, "src")), path.resolve(repo));
        const r = rangoDelCiclo({ repo, ragRoot: ws, desde: primero });
        assert.deepEqual(r.archivos, ["MiRepo/nuevo.md", "MiRepo/src/a.cs", "MiRepo/src/c.cs"]);
        assert.match(r.fechaDesde, /^\d{4}-\d{2}-\d{2}$/);
        assert.equal(gitReal(ws)(["rev-parse", "--show-toplevel"]), null, "fuera de un repo devuelve null");
    } finally { fs.rmSync(ws, { recursive: true, force: true }); }
});

test("specsYPlanesDelCiclo: del repo solo con docs_en_repo; del vault por proyecto y fecha", () => {
    const r = specsYPlanesDelCiclo({
        docsEnRepo: true,
        repoRel: "MiRepo",
        archivos: ["MiRepo/docs/superpowers/specs/2026-09-20-x-design.md", "MiRepo/docs/superpowers/plans/2026-09-20-x.md", "MiRepo/src/a.cs"],
        notasVault: [
            { rel: "Superpowers/Specs/vieja.md", proyecto: "CLAUDEMAX", fecha: "2026-08-01" },
            { rel: "Superpowers/Planes/nueva.md", proyecto: "CLAUDEMAX", fecha: "2026-09-20" },
            { rel: "Superpowers/Specs/otra.md", proyecto: "OtroProyecto", fecha: "2026-09-20" },
        ],
        proyecto: "CLAUDEMAX",
        fechaDesde: "2026-09-13",
    });
    assert.deepEqual(r.specsRepo, ["MiRepo/docs/superpowers/specs/2026-09-20-x-design.md"]);
    assert.deepEqual(r.planesRepo, ["MiRepo/docs/superpowers/plans/2026-09-20-x.md"]);
    assert.deepEqual(r.vault, ["Superpowers/Planes/nueva.md"]);
    assert.deepEqual(specsYPlanesDelCiclo({ docsEnRepo: false, repoRel: "MiRepo",
        archivos: ["MiRepo/docs/superpowers/specs/x.md"], notasVault: [], proyecto: "X", fechaDesde: "2026-01-01" }).specsRepo, []);
    assert.deepEqual(specsYPlanesDelCiclo({ docsEnRepo: true, repoRel: ".",
        archivos: ["docs/superpowers/specs/x.md"], notasVault: [], proyecto: "X", fechaDesde: "2026-01-01" }).specsRepo,
        ["docs/superpowers/specs/x.md"], "repo en la raíz del workspace");
});

const PENDIENTES = [
    "# Pendientes", "",
    "## Abierto", "### CLAUDEMAX",
    "- (2026-09-01) queda el sub-proyecto 6 — [[x]]", "",
    "## Cerrado recientemente",
    "### CLAUDEMAX",
    "- (2026-09-01 → 2026-09-20) rituales de cierre — [[2026-09-20-cierre-rituales]]",
    "- (2026-08-01 → 2026-09-01) contexto fuera del repo — [[2026-09-13-cierre-reglas]]",
    "- (2026-07-01 → 2026-08-01) vault v2 — [[nota-perdida]]",
    "### OtroProyecto",
    "- (2026-05-01 → 2026-06-01) algo de otro — [[y]]", "",
    "Relacionado: [[Bienvenida]]", "",
].join("\n");

test("rotarPendientes: copia lo del ciclo, saca lo anterior, archiva lo que no esté en ninguna nota de cierre y no toca otros proyectos", () => {
    const r = rotarPendientes(PENDIENTES, {
        proyecto: "CLAUDEMAX",
        fechaDesde: "2026-09-13",
        yaArchivado: linea => linea.includes("contexto fuera del repo"),
    });
    assert.equal(r.bloqueado, false);
    assert.equal(r.cerradosCiclo.length, 1);
    assert.match(r.cerradosCiclo[0], /rituales de cierre/);
    assert.equal(r.archivar.length, 1);
    assert.match(r.archivar[0], /vault v2/);
    assert.match(r.texto, /rituales de cierre/);
    assert.ok(!r.texto.includes("contexto fuera del repo"), "lo de ciclos anteriores sale del índice");
    assert.ok(!r.texto.includes("vault v2"));
    assert.match(r.texto, /### OtroProyecto\n- \(2026-05-01 → 2026-06-01\) algo de otro/, "otro proyecto intacto");
    assert.match(r.texto, /## Abierto\n### CLAUDEMAX\n- \(2026-09-01\)/, "Abierto no se toca");
    // idempotente
    assert.equal(rotarPendientes(r.texto, { proyecto: "CLAUDEMAX", fechaDesde: "2026-09-13", yaArchivado: () => true }).texto, r.texto);
    // la última subsección termina en el pie "Relacionado:", que se conserva con su línea en blanco
    const otro = rotarPendientes(PENDIENTES, { proyecto: "OtroProyecto", fechaDesde: "2026-09-13", yaArchivado: () => true });
    assert.match(otro.texto, /### OtroProyecto\n-\n\nRelacionado: \[\[Bienvenida\]\]\n$/);
    // proyecto sin subsección propia cuando las hay: no se toca nada
    assert.equal(rotarPendientes(PENDIENTES, { proyecto: "Nadie", fechaDesde: "2026-09-13" }).texto, PENDIENTES);
});

test("rotarPendientes: sin subsecciones rota toda la sección; con párrafo se bloquea y no cambia nada", () => {
    const plano = ["## Abierto", "-", "", "## Cerrado recientemente",
        "- (2026-08-01 → 2026-09-01) algo viejo — [[z]]", ""].join("\n");
    const r = rotarPendientes(plano, { proyecto: "CLAUDEMAX", fechaDesde: "2026-09-13", yaArchivado: () => true });
    assert.equal(r.cerradosCiclo.length, 0);
    assert.ok(!r.texto.includes("algo viejo"));
    assert.match(r.texto, /## Cerrado recientemente\n-\n/, "la sección vacía conserva un guion");
    // con el comentario de la plantilla: se conserva el comentario y vuelve el guion
    const conComentario = ["## Cerrado recientemente", "<!-- formato:", "     - (a → b) x — [[y]] -->",
        "- (2026-08-01 → 2026-09-01) algo viejo — [[z]]", "", "Relacionado: [[Bienvenida]]", ""].join("\n");
    const c = rotarPendientes(conComentario, { proyecto: "CLAUDEMAX", fechaDesde: "2026-09-13", yaArchivado: () => true });
    assert.equal(c.texto, ["## Cerrado recientemente", "<!-- formato:", "     - (a → b) x — [[y]] -->", "-", "",
        "Relacionado: [[Bienvenida]]", ""].join("\n"));
    const conParrafo = ["## Cerrado recientemente", "Aquí alguien se puso a contar una historia.",
        "- (2026-08-01 → 2026-09-01) algo — [[z]]", ""].join("\n");
    const b = rotarPendientes(conParrafo, { proyecto: "CLAUDEMAX", fechaDesde: "2026-09-13", yaArchivado: () => true });
    assert.equal(b.bloqueado, true);
    assert.equal(b.texto, conParrafo);
    assert.deepEqual(b.lineas, [2]);
});

test("copiaDeSpec y esCopia: frontmatter propio, aviso de origen y detección", () => {
    const original = "---\nfecha: 2026-09-20\n---\n\n# Spec\n\ncuerpo\n";
    const copia = copiaDeSpec(original, { proyecto: "CLAUDEMAX", fuente: "Herramientas/CLAUDEMAX/docs/superpowers/specs/x.md" });
    assert.match(copia, /^---\nproyecto: CLAUDEMAX\nfuentes:\n  - Herramientas\/CLAUDEMAX\/docs\/superpowers\/specs\/x\.md\nespejo_de: Herramientas\/CLAUDEMAX\/docs\/superpowers\/specs\/x\.md\nfecha: 2026-09-20\n---\n/);
    assert.match(copia, /> Copia de `Herramientas\/CLAUDEMAX\/docs\/superpowers\/specs\/x\.md` generada por fin-ciclo — edita el original\./);
    assert.match(copia, /# Spec\n\ncuerpo/);
    assert.equal(esCopia(copia), true);
    assert.equal(esCopia(original), false);
    // sobre una copia previa no duplica el aviso ni el frontmatter
    assert.equal(copiaDeSpec(copia, { proyecto: "CLAUDEMAX", fuente: "Herramientas/CLAUDEMAX/docs/superpowers/specs/x.md" }), copia);
    // un spec que muestra un frontmatter de ejemplo en su cuerpo no es una copia
    assert.equal(esCopia("---\nfecha: 2026-09-20\n---\n\n```yaml\nespejo_de: algo\n```\n"), false);
    // conserva las listas de otras claves y sustituye las de fuentes
    const conListas = "---\ntags:\n  - spec\n  - rituales\nfuentes:\n  - viejo/x.md\nfecha: 2026-09-20\n---\n\n# S\n";
    assert.match(copiaDeSpec(conListas, { proyecto: "P", fuente: "R/s.md" }),
        /^---\nproyecto: P\nfuentes:\n  - R\/s\.md\nespejo_de: R\/s\.md\ntags:\n  - spec\n  - rituales\nfecha: 2026-09-20\n---\n/);
    // sin frontmatter y con CRLF
    assert.match(copiaDeSpec("# Plan\r\n\r\ntexto\r\n", { proyecto: "P", fuente: "R/p.md" }), /^---\nproyecto: P\n[\s\S]*---\n\n> Copia de `R\/p\.md`[^\n]*\n\n# Plan\n\ntexto\n$/);
});
