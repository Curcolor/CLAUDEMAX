---
categoria:            # obligatoria — una de: codigo | proyectos | organizacion | investigacion | personal | aprendizaje
proyecto:              # opcional — clave transversal, relaciona notas de distintas categorías (ej. claudemax)
tags: []               # tags anidados, ej. [codigo/rag, codigo/pgvector]
fecha:                 # ej. 2026-08-01
fuente:                # opcional — lo rellenan los parsers al convertir un archivo (ej. informe.pdf)
---

# Título de la nota

Copia este archivo y rellena el frontmatter antes de escribir. Si omites `categoria`,
`rag.mjs ingest` la infiere de la carpeta donde vive la nota (`Codigo/` → `codigo`,
`Proyectos/` → `proyectos`, etc.); si tampoco puede inferirla, queda sin categoría y se avisa.
