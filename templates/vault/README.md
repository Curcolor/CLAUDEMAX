# V.A.U.L.T

Vault de Obsidian — ESTRICTAMENTE notas en markdown.

## Taxonomía (seis categorías)

Cada nota lleva un frontmatter YAML con `categoria` (obligatoria) y `proyecto`
(opcional, transversal). Copia `_plantilla.md` para empezar una nota nueva.

| Carpeta          | `categoria`     | Color                | Contenido |
|---|---|---|---|
| `Codigo/`         | `codigo`        | `#4A90D9` azul       | Repos, arquitectura, snippets, grafos de Graphify |
| `Proyectos/`      | `proyectos`     | `#5CB85C` verde      | Planes, decisiones, sprints, specs |
| `Organizacion/`   | `organizacion`  | `#9B59B6` morado     | Empresa, marca, clientes, procesos |
| `Investigacion/`  | `investigacion` | `#E8912D` naranja    | PDFs parseados, papers, transcripciones |
| `Journal/`        | `personal`      | `#E05C6E` rojo suave | Journal diario, ideas del Inbox |
| `Aprendizaje/`    | `aprendizaje`   | `#17A2B8` turquesa   | Apuntes de tecnologías, tutoriales, skills |

`00-Inbox/` — capturas sin clasificar (los parsers escriben aquí); sin categoría
propia hasta que la nota se mueve a su carpeta definitiva.

```yaml
---
categoria: codigo          # una de las seis; obligatoria
proyecto: claudemax        # clave transversal: relaciona notas de distintas categorías
tags: [codigo/rag, codigo/pgvector]
fecha: 2026-08-01
fuente: informe.pdf        # opcional; lo rellenan los parsers
---
```

`proyecto` es lo que vincula documentos entre categorías: una nota `codigo` y
una `organizacion` con `proyecto: acme` quedan relacionadas aunque vivan en
carpetas distintas. Si falta `categoria`, el ingestor del RAG la infiere de la
carpeta (`Codigo/` → `codigo`) y, si tampoco puede, la deja sin categoría y avisa.

Colores en el grafo: `.obsidian/graph.json` trae un grupo por categoría con su
color base más un ejemplo de subcolor por tag anidado (`#<categoria>/<subtema>`);
duplica esas entradas a medida que creas subtemas nuevos.

Se indexa en el RAG con `R.A.G/rag.mjs ingest`.
