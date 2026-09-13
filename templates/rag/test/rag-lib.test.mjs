import { test } from "node:test";
import assert from "node:assert/strict";
import { clasificar, EXCLUIDAS_POR_DEFECTO, CON_BOOST } from "../rag-lib.mjs";

test("clasificar: tabla completa de carpetas → colección y autoridad", () => {
    const casos = [
        ["Hubs/Bienvenida.md",                      "hubs",          "vigente"],
        ["Decisiones/Bitrix-vs-GCP.md",             "decisiones",    "vigente"],
        ["Formales/App/PRD.md",                     "docs_formales", "oficial"],
        ["Superpowers/Specs/2026-01-01-x.md",       "specs",         "diseño-vigente"],
        ["Entrevistas/e1.md",                       "entrevistas",   "fuente-primaria"],
        ["Conocimiento/norma.md",                   "conocimiento",  "referencia"],
        ["Aprendizaje/postmortem.md",               "aprendizaje",   "leccion"],
        ["Codigo/App/Modulo.md",                    "codigo",        "referencia"],
        ["Procesos/alta/proceso.md",                "procesos",      "referencia"],
        ["Revisiones/afinacion.md",                 "revisiones",    "referencia"],
        ["Superpowers/Sesiones/2026-01-01-s.md",    "sesiones",      "personal"],
        ["Bitacoras/bitacora-01-07-2026.md",        "bitacoras",     "historica"],
        ["Superpowers/Planes/plan.md",              "planes",        "historico-tecnico"],
        ["Superpowers/Tareas/t1.md",                "proceso",       "historico-tecnico"],
        ["00-Inbox/captura.md",                     "inbox",         "sin-clasificar"],
    ];
    for (const [rel, coleccion, autoridad] of casos) {
        const r = clasificar(rel);
        assert.equal(r.coleccion, coleccion, rel);
        assert.equal(r.autoridad, autoridad, rel);
        assert.equal(r.conocida, true, rel);
    }
});

test("clasificar: prefijo más específico gana y acepta separador de Windows", () => {
    assert.equal(clasificar("Superpowers\\Sesiones\\nota.md").coleccion, "sesiones");
    // un archivo suelto en Superpowers/ no pertenece a ninguna subcolección
    assert.equal(clasificar("Superpowers/suelto.md").coleccion, "otros");
    // "Codigo-viejo/" no es "Codigo/"
    assert.equal(clasificar("Codigo-viejo/x.md").coleccion, "otros");
});

test("clasificar: carpeta desconocida → otros/referencia y conocida=false", () => {
    const r = clasificar("Cualquiera/nota.md");
    assert.deepEqual(r, { coleccion: "otros", autoridad: "referencia", conocida: false });
});

test("constantes de ranking", () => {
    assert.deepEqual(EXCLUIDAS_POR_DEFECTO, ["planes", "proceso", "inbox"]);
    assert.deepEqual(CON_BOOST, ["decisiones", "hubs"]);
});
