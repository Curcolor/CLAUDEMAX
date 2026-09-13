---
tags: [hub]
titulo: Bienvenida
actualizado: 2026-09-13
---

# Bienvenida

Este es **V.A.U.L.T**, el segundo cerebro del workspace: la memoria narrativa del trabajo — qué
se hizo, qué se decidió y por qué —, indexada por el RAG para preguntarla en lenguaje natural.
No es documentación de usuario ni el código en sí: es el contexto que le falta a cualquiera,
persona o agente, que llega sin haber vivido las últimas semanas.

Es la puerta de entrada y, a propósito, la única nota que puede no tener enlaces entrantes.

## Cómo está organizado
Una regla sin excepciones: **cada carpeta del vault es una carpeta más una nota-hub en `Hubs/`**
que la encabeza — qué contiene, cuándo nace una nota ahí, qué no va ahí, y la lista de sus notas.
Tres familias de hubs:

**Negocio** — uno por proyecto (los crea `ritual.mjs init-proyecto` desde `Hubs/_proyecto.md`):
-

**Carpeta** — uno por género de nota:
- [[Decisiones]] — elecciones con alternativas descartadas; máxima autoridad del RAG.
- [[Superpowers-Specs]] — el qué y el porqué de un ciclo.
- [[Superpowers-Planes]] — el cómo, paso a paso (fuera de la búsqueda por defecto).
- [[Superpowers-Tareas]] — qué se ejecutó contra cada plan (fuera de la búsqueda por defecto).
- [[Superpowers-Sesiones]] — el cierre narrativo de una sesión o ciclo.
- [[Codigo]] — el código explicado en prosa; nunca el volcado del grafo.
- [[Conocimiento]] — referencia estable: normas, manuales, convenciones.
- [[Aprendizaje]] — postmortems largos.
- [[Entrevistas]] — palabras textuales de quien es dueño de un proceso.
- [[Revisiones]] — afinaciones sobre algo que ya corre.
- [[Procesos]] — qué hace la organización y quién responde.
- [[Formales]] — espejo generado de documentos formales; no se edita a mano.
- [[Bitacoras]] — el día a día, con fecha.
- [[Inbox]] — aterrizaje sin clasificar (fuera de la búsqueda por defecto).

**Raíz** — infraestructura transversal:
- [[Pendientes]] — el índice único de lo que está abierto.

## Qué se busca aquí y qué no
Se busca **narrativa e intención**: por qué algo quedó así, qué se descartó, qué pasó en una
sesión larga. No se busca la estructura del código (qué llama a qué) — eso vive en el grafo de
código y se consulta en vivo. Regla de oro: **lo generado se queda en su herramienta; lo narrado
va al vault.**

## Cómo se consulta
Desde Claude Code, MCP `rag`: `rag_query(query, coleccion?, proyecto?, topk?)` y
`rag_leer(ruta)`. La colección y la autoridad las da la carpeta. Ante conflicto entre fuentes:
**decisiones > docs_formales/specs > entrevistas > conocimiento/aprendizaje/codigo > planes >
bitacoras** — gana la autoridad, no la fecha.

## Vigencia: las notas avisan cuando se pudren
- Una nota que describe código o un documento declara `fuentes:`; si esas fuentes cambian y la
  nota no, el RAG la marca **CADUCA**.
- Una nota que sustituye a otra declara `reemplaza:`; la vieja queda **REEMPLAZADA** y sale de la
  búsqueda por defecto.
- Una nota que vence declara `revisar:`; pasada la fecha queda **A REVISAR**.
`rag.mjs salud` lista todo eso, más las notas huérfanas (sin enlace desde su hub) y los enlaces
rotos. El arranque de cada sesión muestra el resumen.

## El ritual de cierre
Al terminar una sesión larga o un ciclo: nota en [[Superpowers-Sesiones]]; actualizar solo las
notas de [[Codigo]] que el ciclo dejó caducas (releyendo el código, no la prosa vieja); una línea
en el hub de cada carpeta donde nació algo; actualizar [[Pendientes]]; y regenerar los índices
juntos. La skill `rituales` tiene los comandos.
