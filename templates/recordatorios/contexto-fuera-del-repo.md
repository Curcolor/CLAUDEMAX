---
tools: [Edit, Write, MultiEdit]
rutas: ["**/CLAUDE.md", "**/CLAUDE.local.md", "**/.claude/**"]
excluir:
  - "**/.claude/proyectos/**"
  - "**/.claude/recordatorios/**"
  - "**/.claude/hooks/**"
  - "**/.claude/skills/**"
  - "**/.claude/mcp/**"
  - "**/.claude/projects/**"
  - "**/.claude/plans/**"
  - "**/.claude/state/**"
  - "**/.claude/agents/**"
  - "**/.claude/commands/**"
  - "**/.claude/settings*.json"
  - "**/.claude/CLAUDEMAX.md"
  - "**/.claude/proyecto.md"
nota: >
  Generalizado del setup de trabajo del autor (2026-07-24: un CLAUDE.md con contexto interno
  dentro del repo acabó commiteado y publicado en GitHub). Regla 6 de CLAUDEMAX.md.
  `excluir` deja fuera lo que Claude Code y CLAUDEMAX escriben legítimamente bajo .claude/.
---
CONTEXTO FUERA DEL REPO (regla 6): ¿esta ruta está dentro de un repo git? Entonces PARA — el contexto de Claude no se escribe en el repo (2026-07-24: un CLAUDE.md interno acabó publicado en GitHub).
- Contexto de un proyecto → `<RAG_ROOT>/.claude/proyectos/<proyecto>.md`, en su sección (Estructura, Comandos, Estado, Trampas, Convenciones). Si no existe: `node R.A.G/ritual.mjs init-proyecto <ruta>`.
- Una regla → `templates/rules/CLAUDEMAX.md` del repo de CLAUDEMAX, y reinstalar. Lo largo → el vault (`Codigo/` con `fuentes:`).
- Si es el `.claude/CLAUDE.md` del propio workspace o algo de `~/.claude/`, sigue.
