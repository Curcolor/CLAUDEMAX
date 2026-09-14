---
# Recordatorio justo a tiempo de CLAUDEMAX. Copia este archivo, quítale el "_" del nombre y
# rellena el frontmatter. El hook recordar.mjs lo inyecta como contexto en el instante en que
# la tool y el comando/ruta casan. Nunca bloquea. Los archivos que empiezan por "_" se ignoran.
#
# tools      obligatorio. Tools de Claude Code: Grep, Bash, PowerShell, Edit, Write, MultiEdit, Read, Glob.
# patrones   opcional. Regex JS (sin barras, case-insensitive) contra el texto del tool:
#            Bash/PowerShell → el comando; Grep → el patrón; Edit/Write/Read → la ruta.
#            Si un patrón lleva comas, usa la forma en bloque ("- ...") y no la lista en línea.
# rutas      opcional. Globs (*, ?, **) contra file_path. Ej.: "**/V.A.U.L.T/**/*.md", "**/*.cs".
# excluir    opcional. Globs contra file_path que ANULAN el disparo (ganan incluso a `siempre`).
#            Ej.: rutas "**/.claude/**" con excluir "**/.claude/recordatorios/**".
# siempre    opcional. Tools (de las de arriba) que disparan sin mirar patrones ni rutas.
# una_vez_por_sesion  opcional (false). true = solo la primera vez por sesión de Claude Code.
# activo     opcional (true). false = se ignora sin borrarlo.
# nota       opcional. Para ti: qué fallo lo parió y cuándo. El motor no lo inyecta.
#
# Coincidencia: tool ∈ tools Y la ruta no casa con `excluir` Y (tool ∈ siempre, O sin patrones
# ni rutas, O algún patrón casa, O alguna ruta casa).
#
# Longitud: si dispara en cada edición, ≤ 8 líneas — se paga muchas veces por sesión. Si dispara
# pocas veces (un despliegue), lo que haga falta. Escríbelo para el instante de la decisión:
# qué comprobar ANTES de ejecutar esto, y por qué (el fallo real, con fecha).
tools: []
patrones: []
rutas: []
excluir: []
siempre: []
una_vez_por_sesion: false
activo: true
nota: >
  AAAA-MM-DD: qué pasó y cuánto costó.
---
TEXTO QUE SE INYECTA TAL CUAL.
