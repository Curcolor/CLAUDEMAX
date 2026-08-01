# Proyectos

Una carpeta por proyecto: `Proyectos/<nombre-proyecto>/`.

Cada nota lleva el frontmatter de la taxonomía (ver `../_plantilla.md`):

```yaml
---
categoria: proyectos
proyecto: <nombre-proyecto>
tags: [proyectos/sprint-1]
fecha: 2026-08-01
---
```

`proyecto` es la clave transversal: notas en `Codigo/`, `Organizacion/`, etc.
con el mismo `proyecto` quedan relacionadas en el RAG aunque vivan en carpetas
distintas.

Código de colores (Obsidian → Settings → Appearance → Graph, o edita
`.obsidian/graph.json`):
- Toda la carpeta comparte el color base de `categoria: proyectos`
  (`#5CB85C` verde) vía el grupo `path:Proyectos`.
- Sub-colores por subtema vía grupos `tag:#proyectos/<subtopic>`.
Duplica las entradas de ejemplo en `graph.json` para cada subtema nuevo.
