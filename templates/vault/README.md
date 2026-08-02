# V.A.U.L.T

Vault de Obsidian — ESTRICTAMENTE notas en markdown.

## Taxonomía (seis categorías)

Cada nota lleva un frontmatter YAML con `categoria` (obligatoria) y `proyecto`
(opcional, transversal). Copia `_plantilla.md` para empezar una nota nueva.

| Carpeta          | `categoria`                      | Significado |
|---|---|---|
| `00-Inbox/`       | `personal` (tag `personal/sesion`)   | Lo último que se habló en cada sesión de Claude Code: continuidad de contexto entre sesiones (qué se estaba haciendo, en qué punto se quedó, qué sigue). Lo escribe el ritual `fin-sesion`. |
| `Journal/`        | `personal` (tag `personal/bitacora`) | Bitácoras: registro cronológico del trabajo diario. Lo escribe el ritual `fin-dia`. |
| `Aprendizaje/`    | `aprendizaje`                     | Errores cometidos y su lección, para no repetirlos. Postmortems: qué falló, por qué, cómo evitarlo la próxima vez. |
| `Investigacion/`  | `investigacion`                   | Cosas que se preguntan e investigan: estilos de diseño, comparativas de herramientas, papers, PDFs parseados, transcripciones — lo que consultas para decidir. |
| `Organizacion/`   | `organizacion`                    | Parte legal y conceptual de la organización: miembros y roles, estatutos, contratos, marca, procesos internos, clientes. |
| `Codigo/`         | `codigo`                          | Repos, arquitectura, snippets, grafos de Graphify. |
| `Proyectos/`      | `proyectos`                       | Planes, decisiones, sprints, specs. |

Nota: son seis valores de `categoria` (`personal` cubre tanto `00-Inbox/` como
`Journal/`, diferenciados por el tag anidado) repartidos en siete carpetas. Cada
carpeta trae su propio `README.md` con ejemplos concretos de qué nota va ahí y qué
NO — léelo antes de escribir en una carpeta por primera vez.

Qué NO va en cada una, resumido (el porqué completo está en el `README.md` de cada
carpeta):

- `00-Inbox/`: NO es una bitácora del día completo (eso es `Journal/`), ni notas ya
  clasificadas por tema — cuando el contenido de una sesión interesa a largo plazo,
  se mueve a su carpeta definitiva.
- `Journal/`: NO es el resumen de continuidad entre sesiones (eso es `00-Inbox/`).
- `Aprendizaje/`: NO son apuntes de tecnologías ni tutoriales — esa era la
  definición vieja. Sin un error de por medio, no es una nota de `Aprendizaje/`.
- `Investigacion/`: NO es la decisión ya tomada (eso es `Proyectos/`) ni un error ya
  cometido (eso es `Aprendizaje/`) — es lo que consultas *antes* de decidir.
- `Organizacion/`: NO es el trabajo técnico o de producto de un proyecto concreto
  (eso es `Proyectos/` o `Codigo/`), aunque compartan `proyecto` como clave
  transversal.
- `Codigo/`: NO son decisiones de negocio de un proyecto (eso es `Proyectos/`).
- `Proyectos/`: NO es la parte legal/conceptual de la organización (eso es
  `Organizacion/`).

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
