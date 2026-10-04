---
proyecto: {{PROYECTO}}
ruta: {{RUTA}}
descripcion: {{DESCRIPCION}}
inicializado: {{FECHA}}
docs_en_repo: false
---
<!--
    Contexto de {{PROYECTO}} para Claude Code. Lo creó `ritual.mjs init-proyecto` desde
    templates/rules/proyecto.md y desde ese momento es TUYO: la reinstalación no lo toca.
    docs_en_repo: `true` si este repo publica sus specs y planes en `docs/superpowers/`; entonces
    `fin-ciclo --cerrar` los copia al vault. Con `false` van directamente a V.A.U.L.T/Superpowers/.
    Lo carga toda sesión del workspace vía .claude/CLAUDEMAX.md → proyectos/_indice.md.
    Rellena las secciones consultando el grafo (codebase-memory get_architecture, graphify
    query_graph), nunca de memoria; deja vacía la que no tenga nada real todavía. Tope ~150
    líneas: lo largo va al vault (Codigo/ con fuentes:) y se enlaza desde aquí.
    Claude Code elimina estos comentarios al cargar el archivo: no cuestan contexto.
-->
# {{PROYECTO}}

{{DESCRIPCION}}. Ruta: `{{RUTA}}` (`{{RUTA_ABS}}`). Notas del vault con `proyecto: {{PROYECTO}}`;
hub `Hubs/{{PROYECTO}}.md`. Grafo: `graphify-out/graph.json` del repo (regenerar con
`graphify extract . --code-only`); índice de codebase-memory: `index_repository` sobre `{{RUTA_ABS}}`.

## Estructura
<!-- carpetas de primer nivel y qué vive en cada una; capas/proyectos y quién depende de quién -->

## Comandos
<!-- build, test, run: los exactos, con las banderas que importan -->

## Estado
<!-- qué está desplegado y dónde, con fecha; decisiones vigentes que condicionan el trabajo -->

## Trampas que ya costaron tiempo
<!-- una viñeta por trampa: síntoma, causa, qué hacer; con la fecha en que costó -->

## Convenciones
<!-- idioma del dominio, patrones obligatorios (MVVM, DI…), qué no se commitea -->
