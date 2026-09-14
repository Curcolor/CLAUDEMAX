---
tools: [Grep, Bash, PowerShell]
siempre: [Grep]
patrones:
  - '\bgrep\b'
  - '\brg\b'
  - '\bripgrep\b'
  - '\bfind\b'
  - '\bfindstr\b'
  - 'Select-String'
nota: >
  Generalizado del setup de trabajo del autor (2026-08-19: derivó a grep dos veces el mismo día
  con la regla escrita en CLAUDE.md; 2026-09-04: grep "confirmó" un helper que el grafo mostró
  que tenía 2 llamantes de 97). Dispara cada vez a propósito.
---
ORDEN DE HERRAMIENTAS DE CONTEXTO: rag → graphify → codebase-memory → grep, que es el ÚLTIMO recurso.

Antes de esta búsqueda, responde:
1. ¿Es un LITERAL? (string exacto, valor mágico, mensaje de error, SQL) → grep es la herramienta correcta. Sigue.
1b. TRAMPA: ¿sabes EXACTAMENTE qué cadena buscas, o estás PROBANDO CANDIDATOS? Si enumeras nombres posibles y cuentas cuál aparece, NO es una búsqueda literal: es la pregunta "¿qué mecanismo se usa aquí?", que es ESTRUCTURA disfrazada. Va al grafo de código.
2. ¿Es ESTRUCTURA, o "quién usa esto", o vas a escribir un helper/mapeo/regla nuevo? → te equivocaste de herramienta: `rag_query` para qué se decidió y por qué; el grafo de código (graphify / codebase-memory) para qué llama a qué. Y pregunta al grafo si el helper YA EXISTE antes de escribirlo.
3. Si usas grep igual: excluye antes lo generado (`bin/`, `obj/`, `node_modules/`, `*.Designer.cs`, `dist/`) — el corte de `head` se llena de código generado y tapa la respuesta.

grep NO ve despacho por interfaz, inyección de dependencias, `override` ni bindings declarativos — justo lo que usan los frameworks modernos.
