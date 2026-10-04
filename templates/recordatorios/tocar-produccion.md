---
tools: [Bash, PowerShell]
patrones:
  - '\bgcloud\b'
  - '\bgsutil\b'
  - '\baws\s'
  - '\baz\s'
  - '\bkubectl\s+(apply|delete|rollout)\b'
  - '\bterraform\s+(apply|destroy)\b'
  - '\bpulumi\s+up\b'
  - '\bdocker\s+push\b'
  - '\bhelm\s+(install|upgrade|uninstall)\b'
  - '\bfly\s+deploy\b'
  - '\bvercel\s+--prod\b'
  - '\bnetlify\s+deploy\b'
  - '\brun\s+deploy\b'
  - '--prod\b'
  - '\bpublicar\.ps1\b'
nota: >
  Generalizado del setup de trabajo del autor (2026-09-02: desplegó una versión sin leer ninguna
  de las cuatro fuentes que documentaban el procedimiento; creó un bucket que nadie pidió y
  estuvo a punto de bajar producción de 3 instancias a 1 con un comando guardado que se había
  podrido). "Lo que hiciste fue improvisar sobre producción."
---
VAS A TOCAR PRODUCCIÓN. Antes del primer comando:

1. Lee el procedimiento escrito, no lo improvises: `rag_query "procedimiento de despliegue"` y `rag_query "pendientes de despliegue"` (y `Hubs/Pendientes.md`). Si no existe, dilo antes de seguir.
2. RESPALDO PRIMERO — y no cuenta hasta RESTAURARLO en una base scratch. Con esa base se mide producción; lo que hay allí no se lee de ninguna nota.
3. Si solo cambió el código, despliega SOLO la imagen/artefacto, sin banderas de configuración: el comando completo guardado se pudre (número de instancias, secretos que se REEMPLAZAN en bloque).
4. Lo LOCAL no toca producción. La INFRAESTRUCTURA NUEVA la decide el humano, no tú: si el procedimiento no cubre el caso, se dice y se pregunta — no se inventa.
5. Al terminar, inventaría lo que creaste (buckets, reglas de red, secretos, revisiones) y dilo.
