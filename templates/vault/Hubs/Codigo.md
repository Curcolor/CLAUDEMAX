---
tags: [hub]
titulo: Codigo
actualizado: 2026-09-13
---

# Codigo

El código real explicado en prosa, en tres niveles: producto → proyecto → subsistema. Colección
`codigo`, autoridad `referencia`. **Nunca el volcado del grafo**: la estructura (qué llama a qué,
qué hereda de qué) se consulta en vivo en el grafo de código; aquí va el *por qué* quedó así.

## Cuándo nace una nota aquí
Cuando un módulo necesita explicación que el código no da solo. **Toda nota de `Codigo/` declara
`fuentes:`** (rutas o globs de los archivos que describe): así el RAG la marca como CADUCA cuando
esos archivos cambian y la prosa no. Sin `fuentes:`, `rag.mjs salud` la lista como no verificable.

Antes de escribir o reescribir una nota, releer el código/grafo — jamás copiar prosa vieja.
Código dentro de una nota: solo patrones reutilizables cortos; la lógica larga va como prosa +
ruta del archivo + símbolo.

## Qué NO va aquí
Nodos y aristas generados por herramientas, ni snippets largos.

## Notas
-

Relacionado: [[Bienvenida]]
