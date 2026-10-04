---
tools: [Write]
rutas: ["**/docs/superpowers/specs/**", "**/docs/superpowers/plans/**"]
una_vez_por_sesion: true
nota: >
  Sub-proyecto 5 (2026-09-20): los specs y planes son contexto de Claude (regla 6) y el RAG los
  indexa con autoridad. Solo van dentro del repo si el proyecto lo declara.
---
SPECS Y PLANES: ¿el proyecto declara `docs_en_repo: true` en `<RAG_ROOT>/.claude/proyectos/<proyecto>.md`? Si no, este archivo va a `V.A.U.L.T/Superpowers/Specs/` (o `Planes/`), con `proyecto:` en el frontmatter — es contexto de Claude, no documentación del repo (regla 6).
Si sí lo declara, sigue: `fin-ciclo --cerrar` copiará al vault los specs y planes del ciclo con `fuentes:` apuntando al original.
