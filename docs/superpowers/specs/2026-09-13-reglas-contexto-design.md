# Reglas + contexto por proyecto — Especificación de Diseño (Sub-proyecto 4 de la mezcla con el setup de trabajo)

**Fecha:** 2026-09-13
**Padre:** [Vault + RAG v2](2026-09-13-vault-rag-v2-design.md) (preámbulo con las decisiones globales)
**Reemplaza (en lo que toca a reglas e `init-proyecto`):** [Reglas y rituales](2026-08-01-reglas-rituales-design.md) bloques D2 y E1
**Depende de:** sub-proyectos 1 (taxonomía, `rag-lib.mjs`), 2 (motor de recordatorios) y 3 (MCP graphify y codebase-memory)
**Estado:** Diseño aprobado

## Objetivo

Que el contexto que Claude necesita de cada proyecto viva **fuera del repo**, en
`<RAG_ROOT>/.claude/proyectos/<nombre>.md`, se cargue solo en toda sesión del workspace por la
cadena de `@import` que Claude Code ya resuelve, y nazca de un `init-proyecto` que además deja
listos los dos índices de código. Y reescribir `CLAUDEMAX.md` con las tres reglas que el setup de
trabajo demostró en tres meses y CLAUDEMAX no tenía: dónde vive el contexto, tres memorias con rol,
orden de herramientas de contexto.

## Por qué así

- **Incidente real (2026-07-24):** un `CLAUDE.md` con contexto interno dentro de `MaestraSuite/`
  acabó commiteado y publicado en GitHub. El setup de trabajo lo retiró, lo bloqueó en el
  `.gitignore` y desde entonces todo el contexto vive en `Workspace-Jairo/.claude/CLAUDE.md`
  (19 KB, una sección por proyecto). CLAUDEMAX hacía justo lo contrario: `init-proyecto` escribía
  `<repo>/.claude/CLAUDEMAX.md` y `<repo>/.claude/CLAUDE.md`.
- **Claude Code lo sirve igual desde el workspace.** Documentación de memoria de Claude Code:
  al lanzar desde un subdirectorio se cargan "that directory's plus every ancestor's" `CLAUDE.md`;
  `@import` acepta rutas relativas al archivo que importa, hasta 4 saltos; los comentarios HTML
  de bloque se eliminan antes de entrar al contexto. Así una sesión en `<RAG_ROOT>/MiRepo/` carga
  `<RAG_ROOT>/.claude/CLAUDE.md` → `@CLAUDEMAX.md` → `@proyectos/_indice.md` → `@MiRepo.md`
  (3 saltos; el último relativo a `proyectos/`, porque `@ruta` se resuelve desde el archivo que
  importa), sin hook ni configuración por repo.
- **Un archivo por proyecto, no una sección:** el `CLAUDE.md` único del setup de trabajo mezcla
  reglas, layout del workspace y cinco secciones de MaestraSuite; separar reglas (`CLAUDEMAX.md`,
  del instalador) de contexto (`proyectos/<n>.md`, del usuario) permite reinstalar sin pisar nada.
  Todos los proyectos cargan en toda sesión, igual que en el setup de trabajo: el `_indice.md`
  generado es su "Workspace layout".
- **La prosa la escribe Claude verificando contra el grafo, no un script.** Tres candidatos
  descartados: solo esqueleto (la primera sesión del proyecto arranca sin grafo) y auto-relleno
  por CLI leyendo `csproj`/`package.json` (prosa mecánica que se pudre igual que la del setup de
  trabajo — `MenuProducto` seguía en el `CLAUDE.md` retirado meses después de desaparecer del
  código). `init-proyecto` deja el esqueleto y los índices; la skill `rituales` guía el relleno.
- **Protección doble contra el repo:** determinista (`.gitignore`) y educativa (recordatorio
  justo a tiempo en el instante de escribir). Solo la primera deja archivos ignorados que duplican
  el del workspace; solo la segunda no impide el commit si el recordatorio se ignora.

## 1. Archivos y cadena de carga

```
<RAG_ROOT>/.claude/
├── CLAUDE.md                 del usuario; el instalador solo garantiza la línea `@CLAUDEMAX.md`
├── CLAUDEMAX.md              reglas v3 (el instalador lo pisa); TERMINA con `@proyectos/_indice.md`
├── proyecto.md               plantilla de proyectos/<n>.md (el instalador la pisa)
├── proyectos/
│   ├── _indice.md            GENERADO por init-proyecto: layout del workspace + un @import por proyecto
│   └── <nombre>.md           contexto del proyecto — del usuario desde el día 1; nunca se pisa
└── recordatorios/            (sub-proyecto 2) + contexto-fuera-del-repo.md (este spec)
```

- **`_indice.md`** lo regenera `init-proyecto` en cada ejecución leyendo el frontmatter de todos
  los `proyectos/*.md` (sin los que empiezan por `_`). Formato:

  ```markdown
  # Proyectos del workspace

  Un archivo por proyecto en `.claude/proyectos/`. Para añadir uno: `node R.A.G/ritual.mjs init-proyecto <ruta>`.

  - **MiRepo** — `MiRepo` — API de catálogos en .NET 8. @MiRepo.md
  - **otro-repo** — `Herramientas/otro-repo` — (sin descripción) @otro-repo.md
  ```

  Los imports van **sin** `proyectos/`: Claude Code resuelve `@ruta` relativa al archivo que la
  contiene, y `_indice.md` ya vive en `proyectos/`.

  El instalador crea `proyectos/` y un `_indice.md` con solo la cabecera si faltan, para que el
  import de `CLAUDEMAX.md` nunca apunte a un archivo inexistente.
- **Por qué el import vive en `CLAUDEMAX.md` y no en `CLAUDE.md`:** `CLAUDE.md` es del usuario y
  el instalador ya lo respeta; `CLAUDEMAX.md` es plantilla estable. El usuario no tiene que tocar
  nada por proyecto.
- **`<nombre>`** es un *slug*: el nombre del proyecto con espacios y caracteres fuera de
  `[A-Za-z0-9._-]` sustituidos por `-`, sin `-` repetidos ni en los extremos. Razón: `@ruta`
  termina en el primer espacio. El nombre humano (`--proyecto` o el de la carpeta) va tal cual
  en el frontmatter y en `Hubs/<Proyecto>.md`; el slug solo nombra el archivo.
- **Coste de contexto:** cada `proyectos/<n>.md` debe quedar por debajo de ~150 líneas (la
  documentación de Claude Code recomienda <200 por archivo). Lo que no cabe va al vault
  (`Codigo/` con `fuentes:`) y se referencia desde la sección correspondiente.

## 2. `proyecto.md` v2 (plantilla de `proyectos/<nombre>.md`)

Deja de resumir las reglas (carga en el mismo contexto que `CLAUDEMAX.md`; duplicar es gasto) y
pasa a ser el esqueleto del proyecto. La guía para quien rellena va en comentarios HTML, que
Claude Code elimina al cargar: coste cero de contexto, visibles al abrir el archivo.

```markdown
---
proyecto: {{PROYECTO}}
ruta: {{RUTA}}
descripcion: {{DESCRIPCION}}
inicializado: {{FECHA}}
---
<!--
    Contexto de {{PROYECTO}} para Claude Code. Lo carga toda sesión del workspace vía
    .claude/CLAUDEMAX.md → proyectos/_indice.md. Rellena las secciones consultando el grafo
    (codebase-memory get_architecture / graphify), nunca de memoria; deja vacía la que no tenga
    nada real todavía. Tope ~150 líneas: lo largo va al vault (Codigo/ con fuentes:) y se enlaza.
-->
# {{PROYECTO}}

{{DESCRIPCION}}. Ruta: `{{RUTA}}/` (`{{RUTA_ABS}}`). Notas del vault con `proyecto: {{PROYECTO}}`;
hub `Hubs/{{PROYECTO}}.md`. Grafo: `{{RUTA}}/graphify-out/graph.json` (regenerar con
`graphify extract . --code-only`); índice codebase-memory: `index_repository` sobre `{{RUTA_ABS}}`.

## Estructura
<!-- carpetas de primer nivel y qué vive en cada una; capas/proyectos y quién depende de quién -->

## Comandos
<!-- build, test, run — los exactos, con las banderas que importan -->

## Estado
<!-- qué está desplegado/dónde, con fecha; decisiones vigentes que condicionan el trabajo -->

## Trampas que ya costaron tiempo
<!-- una viñeta por trampa: síntoma, causa, qué hacer; con la fecha en que costó -->

## Convenciones
<!-- idioma del dominio, patrones obligatorios (MVVM, DI…), qué no se commitea -->
```

Marcadores: `{{PROYECTO}}` (nombre humano), `{{RUTA}}` (relativa a `RAG_ROOT`, con `/`; si el
repo está fuera del workspace, igual a `{{RUTA_ABS}}`), `{{RUTA_ABS}}`, `{{DESCRIPCION}}`,
`{{FECHA}}`. Ninguno queda sin sustituir en el archivo final; `ritual.mjs` lo comprueba.

## 3. `init-proyecto` v2 (`templates/rag/ritual.mjs`)

```
node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto]
                                          [--sin-indexar] [--sin-gitignore] [--vault ruta]
```

`RAG_ROOT` = `resolverRagRoot(HERE)` de `rag-lib.mjs` (variable `RAG_ROOT` o el padre de `R.A.G/`),
igual que `rag.mjs`. Las funciones puras (slug, marcadores, índice, `.gitignore`, detección del
diseño anterior) viven en `templates/rag/proyectos-lib.mjs` para probarlas sin procesos.
Pasos, en orden; cada uno imprime una línea `ritual: …` diciendo qué hizo o por qué no:

1. **`proyectos/<slug>.md`** desde `proyecto.md` (localizada como hoy: `<RAG_ROOT>/.claude/proyecto.md`
   instalado, o `templates/rules/proyecto.md` en el repo). A diferencia de v1, el comentario HTML
   de la plantilla **no** se quita: en v2 es la guía de relleno y forma parte del archivo final.
   Si el archivo ya existe se respeta y se dice. Sin plantilla: aviso y sigue.
2. **`proyectos/_indice.md`** regenerado siempre (sección 1). Un `proyectos/<n>.md` sin
   frontmatter legible entra en el índice con `(sin descripción)` y ruta `?`, y se avisa.
3. **`Hubs/<Proyecto>.md`** desde `Hubs/_proyecto.md` — igual que hoy (se respeta si existe).
4. **`.gitignore` del repo** (solo si `<ruta>/.git` existe y no se pasó `--sin-gitignore`):
   añade al final, bajo el comentario `# CLAUDEMAX: el contexto de Claude vive en el workspace, no en el repo`,
   las líneas `/CLAUDE.md`, `/CLAUDE.local.md` y `/.claude/` que falten — **ancladas a la raíz**:
   sin ancla, `CLAUDE.md` ignoraría también archivos legítimos en subcarpetas (el propio CLAUDEMAX
   versiona `templates/rules/CLAUDE.md`). Una línea equivalente sin ancla ya presente (`CLAUDE.md`,
   `.claude/`, `.claude`) cuenta como hecha. Sin duplicar el comentario. Idempotente. Crea el
   `.gitignore` si no existe.
5. **Layout viejo:** si existe `<ruta>/.claude/CLAUDEMAX.md` y su primera línea de contenido
   empieza por `# Reglas de CLAUDEMAX —` (cabecera de la plantilla vieja), avisa: "diseño
   anterior: el contexto va ahora en `<RAG_ROOT>/.claude/proyectos/<slug>.md`; copia lo que
   valga y borra `<ruta>/.claude/CLAUDEMAX.md` (y `<ruta>/.claude/CLAUDE.md` si solo contiene
   `@CLAUDEMAX.md`)". No borra nada.
6. **Índices** (salvo `--sin-indexar`), vía `indices-lib.mjs` (sección 4), con la salida del
   proceso hijo en vivo (`stdio: inherit`):
   - codebase-memory: `index_repository --repo-path <abs> --mode moderate`.
   - graphify: `extract <abs> --code-only` con cwd = `<ruta>` (el grafo queda en
     `<ruta>/graphify-out/`).
   Si falta un binario: una línea con cómo instalarlo (`bash install.sh --only codebase-memory`
   / `--only graphify`) y se sigue. Un índice que falla no aborta el ritual (código de salida
   distinto de 0 → aviso). Ninguno de los dos toca la base de datos del RAG.
7. **Cierre:** `ritual: init-proyecto completo para "<Proyecto>". Abre una sesión en <ruta> y
   rellena las secciones de .claude/proyectos/<slug>.md consultando el grafo (skill rituales, §2).`

Idempotencia: ejecutar dos veces no cambia nada salvo regenerar `_indice.md` y reindexar.
`--proyecto` con nombre distinto al de la carpeta crea otro `proyectos/<slug>.md` — es lo
esperado (un repo puede alojar dos proyectos lógicos).

## 4. `indices-lib.mjs` (`templates/rag/`, se instala junto a `rag.mjs`)

Funciones puras + dos ejecutores. El sub-proyecto 5 las reutiliza en `fin-ciclo`.

```js
export function resolverCodebaseMemory(env)   // { cmd, args, shell } | null
export function resolverGraphify(env)         // { cmd, args, shell } | null
export function indexarCodebaseMemory(rutaRepo, { env, spawn })  // { ok, codigo, aviso }
export function extraerGraphify(rutaRepo, { env, spawn })        // { ok, codigo, aviso }
```

- `resolverCodebaseMemory`: `codebase-memory-mcp` en el PATH (`.exe`/sin extensión → directo;
  `.cmd` → `shell: true`) → `node <npm root -g>/codebase-memory-mcp/bin.js` (se llama `npm root -g`
  una vez, timeout 10 s) → `null`.
- `resolverGraphify`: `graphify` en el PATH → `python -m graphify` → `py -3 -m graphify` (probando
  `-c "import graphify"`, como hace `graphify-auto-lib.mjs`) → `null`.
- Los ejecutores reciben `spawn` inyectable (por defecto `spawnSync`) para probar sin lanzar nada
  real; devuelven `aviso` con el texto de instalación cuando el resolver da `null`.
- En Windows `buscarEnPath` solo acepta `.exe`/`.cmd`/`.bat` (un archivo sin extensión, como los
  shims de pip, no se puede lanzar desde Node), y `resolverCodebaseMemory` prefiere `node bin.js`
  a un `.cmd` para no pasar por el shell.
- `buscarEnPath` se duplica desde `graphify-auto-lib.mjs` (12 líneas): esa lib se instala en
  `$CLAUDE_CONFIG_DIR/mcp/` y esta en `R.A.G/`; no comparten directorio y ninguna puede depender
  del repo.

## 5. `CLAUDEMAX.md` v3 (`templates/rules/CLAUDEMAX.md`)

Reglas 1–5 sin cambios (idioma, política de modelos, cortacircuitos de 3 intentos, commits,
búsqueda de skills). La cabecera HTML apunta a este spec. El archivo termina con la línea
`@proyectos/_indice.md`. Tope: 200 líneas.

**6. Dónde vive el contexto (regla dura).** Todo el contexto de Claude vive en
`<RAG_ROOT>/.claude/` (reglas en `CLAUDEMAX.md`, un archivo por proyecto en `proyectos/`,
recordatorios) o en el vault. Ningún repo lleva `CLAUDE.md`, `CLAUDE.local.md` ni `.claude/`
— incidente 2026-07-24. Contexto nuevo de un proyecto → editar su `proyectos/<n>.md` en la
sección que corresponda; si el archivo pasa de ~150 líneas, lo largo va al vault (`Codigo/`
con `fuentes:`) y se enlaza. Proyecto nuevo → `ritual.mjs init-proyecto`. Refuerzo: recordatorio
`contexto-fuera-del-repo`.

**7. Tres memorias con rol** (sustituye a la regla 6 actual). Memoria nativa de Claude Code
(`~/.claude/projects/<p>/memory/`) = gotchas cortos, correcciones y preferencias — "no hagas X
porque Y", ≤3 líneas. Vault + RAG = narrativa: decisiones con alternativas descartadas, specs,
sesiones, aprendizajes largos. Grafo (graphify / codebase-memory) = estructura del código, en
vivo. **Lo generado se queda en su herramienta; lo narrado va al vault**: nunca volcar el grafo
al vault (257 notas de ruido en el setup de trabajo). Context7 se permite para documentación de
librerías externas — no es memoria del proyecto y no compite con nada de esto. Se retira la
prohibición anterior.

**8. Orden de herramientas de contexto.** `rag_query` → `graphify` → `codebase-memory` → grep,
que es el último recurso. Literal (string exacto, mensaje de error, SQL) → grep es correcto.
Estructura, "quién usa esto", "¿ya existe un helper así?" → grafo. Deriva doc↔código: el RAG
trae el requerimiento exacto, el grafo confirma con `get_neighbors` que algo real lo usa —
existir no es estar en uso. **La prosa se pudre, el grafo no**: toda descripción de arquitectura
escrita a mano, incluida la de `proyectos/<n>.md`, se verifica contra el grafo antes de confiar.
`codebase-memory` no se refresca solo: `ready` significa que hay índice, no que esté al día;
reindexar (`index_repository`) antes de concluir que algo "no existe". Refuerzo: recordatorio
`orden-herramientas`.

**9. Taxonomía y vigencia del vault** = regla 7 actual. **10. Recordatorios justo a tiempo** =
regla 8 actual, con la ruta actualizada.

## 6. Refuerzos

### 6.1 Recordatorio `contexto-fuera-del-repo.md` (de fábrica, activo)

```yaml
tools: [Edit, Write, MultiEdit]
rutas: ["**/CLAUDE.md", "**/CLAUDE.local.md", "**/.claude/**"]
excluir:
  - "**/.claude/proyectos/**"
  - "**/.claude/recordatorios/**"
  - "**/.claude/hooks/**"
  - "**/.claude/skills/**"
  - "**/.claude/mcp/**"
  - "**/.claude/projects/**"      # memoria nativa de Claude Code: dispararía en cada memoria
  - "**/.claude/plans/**"
  - "**/.claude/state/**"
  - "**/.claude/agents/**"
  - "**/.claude/commands/**"
  - "**/.claude/settings*.json"
  - "**/.claude/CLAUDEMAX.md"
  - "**/.claude/proyecto.md"
```

Texto (≤8 líneas): ¿esta ruta está dentro de un repo git? Entonces PARA — el contexto de Claude
no va en el repo (2026-07-24: un `CLAUDE.md` interno acabó en GitHub). Va en
`<RAG_ROOT>/.claude/proyectos/<proyecto>.md`, en la sección que toque; reglas en
`CLAUDEMAX.md`; lo largo al vault. Si es el `.claude/CLAUDE.md` del propio workspace o de
`~/.claude/`, sigue.

**Campo nuevo del motor: `excluir`** (lista de globs, misma sintaxis que `rutas`). En
`coincide`, antes de todo lo demás: si `input.file_path` casa con alguno, el recordatorio no
dispara — ni con `siempre`. `_plantilla.md` lo documenta. `parseRecordatorio` lo devuelve como
`excluir: []` por defecto.

### 6.2 `session-start.mjs`

Tras detectar el proyecto: si el cwd está dentro de un repo git cuyo ancestro (hasta 4 niveles,
sin contar la raíz del propio repo) tiene `.claude/proyectos/`, y ningún archivo de ahí describe
el repo — ni `proyectos/<slug>.md` ni un `proyectos/*.md` cuyo `ruta:` sea la del repo (relativa
al workspace o absoluta; cubre `init-proyecto --proyecto otro-nombre`) —, añade al bloque de
contexto una línea: `Sin contexto de proyecto para "<n>": corre node <RAG_ROOT>/R.A.G/ritual.mjs init-proyecto <ruta>`.
Sin `.claude/proyectos/` arriba (workspace sin instalar) no dice nada. El slug se calcula con la
misma función que `proyectos-lib.mjs` (duplicada: el hook no importa de `R.A.G/`).

### 6.3 Skill `rituales` §2

Comando y flags nuevos; qué hace paso a paso (sección 3); **guion de relleno post-init** para el
modelo: abrir la sesión en el repo, `get_architecture` de codebase-memory y `god-nodes`/`query_graph`
de graphify → rellenar **Estructura** y **Comandos** (los comandos se leen de `csproj`/
`package.json`/`Makefile` reales, y se prueban si es barato); **Estado, Trampas y Convenciones
se dejan vacías** hasta que haya algo real — no inventar. Recordar el tope de ~150 líneas.

## 7. Instalador y desinstalador

- `bin/components/rules.sh` (`ac_rules_install_templates`): además de lo actual, `mkdir -p
  <RAG_ROOT>/.claude/proyectos` y crea `_indice.md` con la cabecera de la sección 1 si falta
  (nunca lo pisa: lo regenera `init-proyecto`). `ac_rules_recordatorios` ya copia cualquier `.md`
  nuevo de `templates/recordatorios/` si falta — el recordatorio 6.1 entra sin cambios.
- `bin/components/rag.sh`: copia `proyectos-lib.mjs` e `indices-lib.mjs` junto a `rag-lib.mjs` y `ritual.mjs`.
- `bin/uninstall.sh`: no toca `proyectos/` (contenido del usuario); lo dice en el resumen final
  junto al vault.
- Sin componente nuevo; `ALL_COMPONENTS` no cambia.

## 8. Pruebas (`node:test`, sin base de datos, sin red)

- **`templates/rag/test/ritual.test.mjs`** — workspace temporal `ws/` con `R.A.G/` (copia de
  `ritual.mjs`, `rag-lib.mjs`, `proyectos-lib.mjs`, `indices-lib.mjs`), `.claude/proyecto.md`, `V.A.U.L.T/Hubs/_proyecto.md`
  y un repo `ws/MiRepo/` con `.git/` vacío (basta el directorio). Se ejecuta `ritual.mjs` como
  proceso hijo con `execFile` (lección del sub-proyecto 1) y siempre `--sin-indexar` salvo la
  prueba de índices:
  1. crea `.claude/proyectos/MiRepo.md` con todos los marcadores sustituidos (ninguna `{{` en el
     resultado), frontmatter `proyecto/ruta/descripcion/inicializado`, `ruta: MiRepo`;
  2. `_indice.md` lista el proyecto con su `@MiRepo.md`; tras un segundo
     `init-proyecto ws/Otro Repo --descripcion "x"` lista dos, el segundo como `Otro-Repo.md` y
     `**Otro Repo**`;
  3. `.gitignore` de `MiRepo/` contiene el comentario y las tres líneas; segunda ejecución no
     duplica; con `--sin-gitignore` no se crea; un repo sin `.git/` no recibe `.gitignore`;
  4. `Hubs/MiRepo.md` creado; una segunda ejecución respeta `proyectos/MiRepo.md` modificado a
     mano (contenido intacto) y el hub;
  5. `MiRepo/.claude/CLAUDEMAX.md` con la cabecera vieja → la salida contiene "diseño anterior" y
     el archivo sigue existiendo;
  6. con un `PATH` vacío y sin `--sin-indexar`: salida con los dos avisos de instalación y
     código de salida 0.
- **`templates/rag/test/indices-lib.test.mjs`** — `resolverCodebaseMemory`/`resolverGraphify` con
  un `PATH` temporal que contiene binarios falsos (mismo `pathConFalso` que
  `graphify-auto.test.mjs`) → `{ cmd, args, shell }` correctos; `PATH` vacío y sin `npm`/`python`
  → `null`; `indexarCodebaseMemory` con `spawn` falso recibe `["cli","index_repository","--repo-path",<abs>,"--mode","moderate"]`
  y `extraerGraphify` recibe `["extract",<abs>,"--code-only"]` con `cwd` = repo; con resolver
  `null` → `{ ok: false, aviso: /install.sh --only/ }`.
- **`hooks/test/recordar.test.mjs`** — `excluir`: recordatorio con `rutas: ["**/.claude/**"]` y
  `excluir: ["**/.claude/proyectos/**"]` dispara para `/ws/repo/.claude/CLAUDE.md` y no para
  `/ws/.claude/proyectos/x.md`; `excluir` gana sobre `siempre`; sin `excluir` → `[]`.
- **`templates/rag/test/proyectos-lib.test.mjs`** — slug (espacios, tildes, extremos), ruta para el
  índice (relativa/absoluta/`.`), marcadores, `leerProyecto` con CRLF, `generarIndice`,
  `completarGitignore` (vacío, sin salto final, idempotente, equivalentes), `esClaudemaxViejo`, y
  la plantilla `proyecto.md` v2.
- **`hooks/test/session-start.test.mjs`** — repo temporal con `git init`: sin `.claude/proyectos/`
  arriba → sin salida; con él → aviso; con `proyectos/api.md` de `ruta: MiRepo` → sin salida; con
  `proyectos/MiRepo.md` → sin salida.
- **`rules.sh`** — `ac_rules_install_templates` en bash aislado crea `proyectos/_indice.md` con la
  cabecera exacta y no lo pisa en la segunda pasada.
- **Instalador:** `bin/wizard/test-componentes.mjs` sigue en verde; dry-run de `--only rules`
  muestra `mkdir -p …/.claude/proyectos`; `validate-skills.mjs` en verde tras editar `rituales`.

## 9. Casos límite

| Caso | Comportamiento |
|---|---|
| `<ruta>` fuera de `RAG_ROOT` | `{{RUTA}}` = ruta absoluta; el proyecto entra igual en `_indice.md` |
| Dos proyectos cuyo slug coincide (`Mi Repo` y `Mi-Repo`) | el segundo encuentra el archivo existente, lo respeta y avisa que el slug ya está en uso |
| `proyectos/<n>.md` sin frontmatter (editado a mano) | entra en `_indice.md` con `(sin descripción)` y ruta `?`; aviso |
| `.gitignore` sin salto de línea final | se añade `\n` antes del bloque |
| `graphify extract` tarda minutos | salida en vivo; el usuario puede pasar `--sin-indexar` y correrlo luego |
| `npm root -g` falla | `resolverCodebaseMemory` → `null` con aviso; no aborta |
| `_indice.md` borrado por el usuario | el siguiente `init-proyecto` lo regenera; mientras, el import de `CLAUDEMAX.md` apunta a un archivo inexistente y Claude Code lo ignora |
| Sesión lanzada desde `<RAG_ROOT>` (raíz) | carga todos los `proyectos/*.md`, como cualquier otra sesión |

## 10. Fuera de alcance

`fin-ciclo` corriendo `indices-lib` y `rag.mjs ingest` juntos, `Pendientes.md`, notas de `Codigo/`
caducas contra `git diff` (sub-proyecto 5); migración automática de un `<repo>/.claude/CLAUDEMAX.md`
viejo (se avisa, no se mueve); reglas por ruta (`.claude/rules/` con `paths:`) para cargar solo el
proyecto activo — se anota como evolución posible si el número de proyectos hace crecer el
contexto; `.mcp.json` por workspace.
