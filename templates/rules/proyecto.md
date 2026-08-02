<!--
    Plantilla de reglas por proyecto. La instancia el ritual `init-proyecto` (script fuera
    del alcance de este archivo, ver docs/superpowers/specs/2026-08-01-reglas-rituales-design.md
    bloque D2) copiando este archivo a `<proyecto>/.claude/CLAUDEMAX.md` y sustituyendo los
    marcadores de abajo. Ningún marcador debe quedar sin reemplazar en el archivo final.

    Marcadores disponibles:
      {{PROYECTO}}     nombre del proyecto (por defecto, el nombre de la carpeta del repo)
      {{FECHA}}        fecha de inicialización del proyecto, formato YYYY-MM-DD
      {{VAULT}}        ruta absoluta a V.A.U.L.T/ del workspace CLAUDEMAX
      {{RAG}}          ruta absoluta a R.A.G/ del workspace CLAUDEMAX
      {{DESCRIPCION}}  una línea libre describiendo el proyecto ("(sin descripción)" si no se aportó)
-->

# Reglas de CLAUDEMAX — {{PROYECTO}}

Este proyecto hereda las reglas operativas completas de la raíz del workspace
(`<RAG_ROOT>/.claude/CLAUDEMAX.md`): idioma, política de modelos, cortacircuitos de 3
intentos, commits sin footer de IA, búsqueda de skills, memoria vía RAG y taxonomía del
vault. No se duplican aquí — si necesitas el texto completo de cada regla con su
justificación, ábrelas en ese archivo. Resumen rápido para esta sesión:

1. Todo en español (docs, comentarios, mensajes, commits); identificadores de código y
   tipos de Conventional Commits en inglés.
2. Subagentes de desarrollo con `model: "sonnet"` explícito; revisiones de código nunca
   se delegan.
3. Al 3er intento fallido con el mismo error, PARA y pregunta al usuario.
4. Conventional Commits, subject en español, sin `Co-authored-by: Claude` ni atribución
   de IA equivalente.
5. Tecnología nueva sin skill instalada → pregunta si crear/buscar una Skill 2.0.
6. El RAG es la única memoria entre sesiones; no reinstales Context7 ni Claude-Mem.
7. Toda nota nueva en el vault lleva el frontmatter de `categoria` (y `proyecto` cuando
   aplique) de `V.A.U.L.T/_plantilla.md`.

## Contexto de {{PROYECTO}}

- **Proyecto:** {{PROYECTO}}
- **Inicializado:** {{FECHA}}
- **Vault:** {{VAULT}}
- **RAG:** {{RAG}}
- **Descripción:** {{DESCRIPCION}}

Al escribir notas de este proyecto en el vault, usa `proyecto: {{PROYECTO}}` en el
frontmatter para que queden relacionadas entre categorías (código, decisiones, journal...).
