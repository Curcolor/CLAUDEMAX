import { test } from "node:test";
import assert from "node:assert/strict";
import { casaGlob, hubDeNota, enlazarEnHub, esqueletoNota, grabarCommit, notasAfectadas } from "../rituales-lib.mjs";

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
