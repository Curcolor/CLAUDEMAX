# Recordatorios justo a tiempo — Especificación de Diseño (Sub-proyecto 2 de la mezcla con el setup de trabajo)

**Fecha:** 2026-09-13
**Padre:** [Vault + RAG v2](2026-09-13-vault-rag-v2-design.md) (su preámbulo recoge el diagnóstico y las decisiones globales de los seis sub-proyectos)
**Estado:** Diseño aprobado

## Objetivo

Instalar el mecanismo que en el setup de trabajo del autor resultó más valioso por línea de
código: **recordatorios que llegan en el instante de la decisión, no al arranque de la sesión**.
Un motor único (`hooks/recordar.mjs`, `PreToolUse`) lee recordatorios escritos en markdown y,
cuando la herramienta y el comando/ruta casan, inyecta el texto como `additionalContext`. Nunca
bloquea. Añadir un recordatorio nuevo = escribir un `.md`; sin código ni tocar `settings.json`.

## Por qué así

Los cuatro hooks `recordar-*.py` del setup de trabajo nacieron cada uno de un fallo con fecha
(derivar a `grep` dos veces el mismo día, desplegar sin leer el procedimiento, diagnosticar un
test por su nombre). Su comentario de cabecera repite la misma tesis: *"la regla ya estaba
escrita en CLAUDE.md y en la memoria, y aun así se olvidó; el problema es de TIEMPOS, no de
conocimiento — un recordatorio en el arranque llega demasiado pronto para servir; este llega en
el instante de la decisión"*. Y disparan **cada vez** a propósito: "una marca de 'ya avisé' lo
apagaría justo en la búsqueda que importa, que casi nunca es la primera".

El mecanismo es genérico (tool + patrón → texto); el contenido es del negocio. CLAUDEMAX
instala el mecanismo con cinco recordatorios genéricos (tres de contexto, dos de .NET/WinUI),
más los cuatro originales del setup de trabajo como ejemplos inactivos, y deja el contenido en
manos del usuario.

Descartado: un script por recordatorio (más piezas móviles; el setup de trabajo tenía cuatro
copias del mismo esqueleto) y delegar en el plugin `hookify` (estaba instalado en el setup de
trabajo y se siguió escribiendo Python: no desplazó al patrón propio).

## 1. Formato de un recordatorio

Un archivo `.md` por recordatorio en `.claude/recordatorios/`. Frontmatter = cuándo; cuerpo =
qué inyectar, tal cual.

```yaml
---
tools: [Bash, PowerShell]              # obligatorio; nombres de tool de Claude Code:
                                       #   Grep, Bash, PowerShell, Edit, Write, MultiEdit, Read, Glob
patrones:                              # opcional; regex JS (case-insensitive) contra el texto del tool
  - \bgcloud\b
  - \bkubectl\s+apply\b
rutas:                                 # opcional; globs contra file_path
  - "**/V.A.U.L.T/**/*.md"
siempre: [Grep]                        # opcional; tools (⊆ tools) que disparan sin mirar patrones/rutas
una_vez_por_sesion: false              # opcional; por defecto dispara cada vez
activo: true                           # opcional; false = se ignora sin borrarlo
nota: >                                # opcional; para el humano — por qué existe, fecha y fallo
  2026-08-19: derivé a grep dos veces   #   que lo parió. El motor lo ignora; nunca se inyecta.
---
TEXTO QUE SE INYECTA TAL CUAL como additionalContext.
Corto si dispara en cada edición; largo solo si dispara pocas veces (despliegue).
```

**Texto del tool contra el que se prueban `patrones`:**

| Tool | Texto |
|---|---|
| `Bash`, `PowerShell` | `tool_input.command` |
| `Grep` | `tool_input.pattern` (y `tool_input.path` si existe) |
| `Edit`, `Write`, `MultiEdit`, `Read` | `tool_input.file_path` |
| `Glob` | `tool_input.pattern` |

**Coincidencia:** dispara si `tool_name ∈ tools` **y**:
- `tool_name ∈ siempre` → siempre (sirve para "todo Grep" sin que un patrón comodín dispare
  también en todo Bash);
- no hay `patrones` ni `rutas` → siempre;
- hay `patrones` → alguno casa contra el texto del tool;
- hay `rutas` → alguno casa contra `file_path` (normalizado a `/`; el glob soporta `*`, `?`, `**`);
- hay ambos → basta que case uno de los dos.

`tools` vacío o ausente → recordatorio inválido (se ignora y se registra, ver §2). Archivos cuyo
nombre empieza por `_` se ignoran (plantilla).

Por qué cada campo: `tools` y `patrones` son exactamente `tool_name` + `SENALES` de los hooks del
setup de trabajo; `rutas` cubre el caso `recordar-estandares` (archivos `.cs`/`.xaml` bajo una
carpeta) sin obligar a escribir regex sobre rutas de Windows; `activo` permite apagar uno sin
borrarlo, que es lo primero que se hace al depurar.

## 2. Motor `hooks/recordar.mjs`

**Registro:** `PreToolUse`, matcher `Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read`, timeout 5 s.
Variable de escape: `CLAUDEMAX_RECORDAR=0` (sale antes de leer stdin). Node puro, sin
dependencias, mismo estilo que `hooks/skill-suggest.mjs`.

**Entrada:** JSON del evento por stdin (`tool_name`, `tool_input`, `cwd`, `session_id`),
tolerante a variantes de nombre (`sessionId`, `cwd_path`) como los demás hooks.

**Búsqueda de recordatorios** (en cada invocación, sin caché):
1. Si `CLAUDEMAX_RECORDATORIOS_DIR` está definida, solo ese directorio (pruebas, casos raros).
2. Si no, desde `cwd` sube hasta 4 niveles buscando `.claude/recordatorios/`; recoge **todos**
   los directorios que existan, del más cercano al más lejano.
3. Carga los `*.md` que no empiecen por `_`. Si dos directorios tienen un archivo con el mismo
   nombre, gana el más cercano al `cwd` (el del proyecto pisa al del workspace).

**Decisión:** para cada recordatorio activo, evalúa la coincidencia de §1. Los que casan se
concatenan en un solo `additionalContext`, separados por una línea en blanco, en orden alfabético
de nombre de archivo.

**Salida:** si ninguno casa → exit 0 sin escribir nada. Si alguno casa, una sola línea JSON:

```json
{ "hookSpecificOutput": { "hookEventName": "PreToolUse", "additionalContext": "<texto>" }, "suppressOutput": true }
```

Nunca `decision: "block"`. Exit siempre 0.

**`una_vez_por_sesion`:** estado en `$CLAUDE_CONFIG_DIR/state/recordar.json`
(`{ "sessionId": "...", "disparados": ["nombre.md", ...] }`; `$HOME/.claude` si
`CLAUDE_CONFIG_DIR` no está definida). Al cambiar `session_id` se resetea. Si el evento no trae
`session_id`, el recordatorio se comporta como "cada vez".

**Errores:** frontmatter roto, `tools` ausente o regex inválida → ese recordatorio se ignora y se
añade una línea a `$CLAUDE_CONFIG_DIR/state/recordar.log` (`<fecha> <archivo>: <motivo>`), con el
archivo truncado a las últimas 200 líneas; nunca nada por stderr. Directorio ausente, stdin
vacío o JSON inválido → exit 0 en silencio. Cualquier excepción no prevista → exit 0 en silencio.

**Presupuesto:** todo síncrono, sin procesos hijos; objetivo < 50 ms.

**Plantilla:** `templates/recordatorios/_plantilla.md` con el frontmatter comentado campo a
campo y la guía de longitud: si dispara en cada edición, ≤ 8 líneas; si dispara pocas veces, lo
que haga falta. Añadir un recordatorio = copiar la plantilla y quitar el `_`.

## 3. Recordatorios de fábrica (`templates/recordatorios/`)

Cinco genéricos activos (tres de contexto general, dos de .NET/WinUI) más `ejemplos/maestrasuite/`
con los cuatro originales del setup de trabajo, fieles e inactivos. Los genéricos no llevan
nombres de proyectos, personas ni herramientas de un negocio concreto. Todo se copia a
`<RAG_ROOT>/.claude/recordatorios/` **solo si no existe**: son del usuario desde el primer día y
editarlos es la forma normal de uso.

Cada recordatorio de fábrica lleva `nota:` con su origen (qué fallo lo parió y cuándo), porque
esa es la regla de la casa para los que escriba el usuario.

### `orden-herramientas.md`

```yaml
tools: [Grep, Bash, PowerShell]
siempre: [Grep]
patrones: ['\bgrep\b', '\brg\b', '\bripgrep\b', '\bfind\b', '\bfindstr\b', 'Select-String']
```

(`Grep` dispara siempre; en `Bash`/`PowerShell` solo cuando el comando trae un buscador — casi
siempre a mitad de una tubería, por eso los patrones no están anclados al inicio.)

Texto:

> ORDEN DE HERRAMIENTAS DE CONTEXTO: rag → graphify → codebase-memory → grep, que es el ÚLTIMO
> recurso.
>
> Antes de esta búsqueda, responde:
> 1. ¿Es un LITERAL? (string exacto, valor mágico, mensaje de error, SQL) → grep es la
>    herramienta correcta. Sigue.
> 1b. TRAMPA: ¿sabes EXACTAMENTE qué cadena buscas, o estás PROBANDO CANDIDATOS? Si enumeras
>    nombres posibles y cuentas cuál aparece, NO es una búsqueda literal: es la pregunta "¿qué
>    mecanismo se usa aquí?", que es ESTRUCTURA disfrazada. Va al grafo de código.
> 2. ¿Es ESTRUCTURA, o "quién usa esto", o vas a escribir un helper/mapeo/regla nuevo? → te
>    equivocaste de herramienta: `rag_query` para qué se decidió y por qué; el grafo de código
>    (graphify / codebase-memory) para qué llama a qué. Y pregunta al grafo si el helper YA
>    EXISTE antes de escribirlo.
> 3. Si usas grep igual: excluye antes lo generado (`bin/`, `obj/`, `node_modules/`,
>    `*.Designer.cs`, `dist/`) — el corte de `head` se llena de código generado y tapa la
>    respuesta.
>
> grep NO ve despacho por interfaz, inyección de dependencias, `override` ni bindings
> declarativos — justo lo que usan los frameworks modernos.

### `tocar-produccion.md`

```yaml
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
```

Texto:

> VAS A TOCAR PRODUCCIÓN. Antes del primer comando:
>
> 1. Lee el procedimiento escrito, no lo improvises: `rag_query "procedimiento de despliegue"`
>    y `rag_query "pendientes de despliegue"` (y `Hubs/Pendientes.md`). Si no existe, dilo antes
>    de seguir.
> 2. RESPALDO PRIMERO — y no cuenta hasta RESTAURARLO en una base scratch. Con esa base se mide
>    producción; lo que hay allí no se lee de ninguna nota.
> 3. Si solo cambió el código, despliega SOLO la imagen/artefacto, sin banderas de
>    configuración: el comando completo guardado se pudre (número de instancias, secretos que se
>    REEMPLAZAN en bloque).
> 4. Lo LOCAL no toca producción. La INFRAESTRUCTURA NUEVA la decide el humano, no tú: si el
>    procedimiento no cubre el caso, se dice y se pregunta — no se inventa.
> 5. Al terminar, inventaría lo que creaste (buckets, reglas de red, secretos, revisiones) y
>    dilo.

### `editar-vault.md`

```yaml
tools: [Edit, Write, MultiEdit]
rutas: ["**/V.A.U.L.T/**/*.md"]
```

Texto (dispara en cada edición del vault → corto):

> NOTA DEL VAULT (regla 7): la colección la da la carpeta — guárdala en la de su género y
> arranca de `Plantillas/nota.md`. Enlázala desde su hub en `Hubs/`. Si describe código o un
> documento, `fuentes:` (rutas/globs desde la raíz del workspace). Si sustituye a otra nota,
> `reemplaza: [nombre]`; si vence, `revisar:`. Nunca escribas "hay N notas": el conteo se mide.
> Antes de reescribir una nota de `Codigo/`, relee el código, no la prosa vieja.

### `estandares-dotnet.md`

Generalización de `recordar-estandares-maestrasuite.py`. Dispara en cada edición de C#/XAML →
corto.

```yaml
tools: [Edit, Write, MultiEdit]
rutas: ["**/*.cs", "**/*.xaml"]
nota: >
  Generalizado del setup de trabajo (2026-08-19, CuadroGuardadoApi.EstadoTexto reescrito a mano
  cuando ya existía). Ajusta el punto 3 a los estándares de tu casa.
```

Texto:

> ESTÁNDARES .NET / WinUI — antes de este cambio:
> 1. Si vas a escribir un helper, mapeo o regla nuevos: pregunta al grafo de código si YA
>    EXISTE (graphify / codebase-memory). Reescribir a mano algo que ya existía es el fallo más
>    repetido. Si el grafo no encuentra algo recién escrito, reindexa antes de concluir que no
>    existe.
> 2. Si es un arreglo: causa raíz, no síntoma. grep no ve `x:Bind`, despacho por interfaz, DI
>    ni `override`. Lee las ASERCIONES del test que falla, no solo su nombre.
> 3. Estándares de la casa: dominio sin UI ni BD; ViewModels con CommunityToolkit.Mvvm y bindeo
>    por `x:Bind` (no `DataContext`); parámetros de negocio versionados — nunca hardcodear una
>    regla que el diseño marca parametrizable; dominio y UI en español, inglés solo en tipos de
>    framework.
> 4. Trampas de WinUI: un `SelectedIndex` en XAML dispara `SelectionChanged` durante
>    `InitializeComponent` (bandera `_listo` al final del constructor, no un guard por control);
>    un `--` dentro de un comentario XAML o csproj tumba el compilador sin decir dónde;
>    `IsEnabled` no existe en `Panel`.
> 5. Nombres de clientes o personas: nunca en código, tests ni mensajes de commit.

### `pruebas-dotnet.md`

Generalización de `recordar-rojos-de-la-suite-api.py`.

```yaml
tools: [Bash, PowerShell]
patrones: ['\bdotnet\s+test\b', '\.Tests\b', '\bprobar-[\w-]+\.ps1\b']
nota: >
  Generalizado del setup de trabajo (2026-09-09: media sesión y seis pasadas diagnosticando un
  test por su NOMBRE porque Select-String se comió el mensaje).
```

Texto:

> VAS A CORRER UNA SUITE .NET. Cómo se lee un rojo:
> 1. EL MENSAJE, NO LA LÍNEA [FAIL]. Si filtras la salida con Select-String / grep / head, el
>    filtro se come el mensaje de error y te quedas con el nombre del test — que induce a
>    diagnosticar de memoria. Vuelca a archivo o corre sin filtro. UNA PASADA DE LA QUE NO SE
>    LEE EL ERROR NO CUENTA COMO PASADA.
> 2. Una nota o memoria que nombra un síntoma es una HIPÓTESIS, no un diagnóstico: compárala con
>    el `Actual:` / `Expected:` reales.
> 3. UN ROJO QUE SE REPITE: comprueba si es PREEXISTENTE antes de tocar nada —
>    `git stash && git checkout main && dotnet test --filter <test>; git checkout - && git stash pop`.
>    Zanja la única pregunta que importa: "¿qué es mío?".
> 4. NO encadenes pasadas para confirmar: se contaminan entre sí (límites de peticiones, residuos
>    en la BD de pruebas) y cada pasada abortada deja residuo que rompe la siguiente.
> 5. Si la suite toca una base de datos, averigua ANTES qué borra (limpiadores que llaman a la
>    función real) y si hay algo que perder.
> 6. `Select-Object -First N` sobre la invocación de un `.ps1` mata el proceso hijo antes de que
>    termine. Captura en variable y filtra después.

### `ejemplos/maestrasuite/` — los cuatro originales, fieles e inactivos

Traducción al formato `.md` de los cuatro `recordar-*.py` del setup de trabajo, **texto
íntegro** (incluidos nombres de tests, rutas y fechas), con `activo: false` y la docstring del
`.py` en `nota:`. Sirven como referencia de cómo se escribe un recordatorio nacido de un fallo
real, y el autor los activa en su workspace de Maestra cambiando `activo`.

| Archivo | `tools` | `siempre` / `patrones` / `rutas` | Origen |
|---|---|---|---|
| `orden-busqueda.md` | `[Grep, Bash, PowerShell]` | `siempre: [Grep]`; `patrones: ['\bgrep\b', '\brg ', 'ripgrep', '\bfind ', 'Select-String', 'findstr']` | `recordar-orden-busqueda.py` |
| `despliegue.md` | `[Bash, PowerShell]` | `patrones: ['\bgcloud ', '\bgsutil ', 'publicar\.ps1', 'sql export', 'sql import', 'authorized-networks', 'run deploy']` | `recordar-despliegue.py` |
| `estandares-maestrasuite.md` | `[Edit, Write, MultiEdit]` | `rutas: ["**/MaestraSuite/**/*.cs", "**/MaestraSuite/**/*.xaml"]` | `recordar-estandares-maestrasuite.py` |
| `rojos-suite-api.md` | `[Bash, PowerShell]` | `patrones: ['probar-api\.ps1', 'Maestra\.Api\.Catalogos\.Tests']` | `recordar-rojos-de-la-suite-api.py` |

El cuerpo de cada uno es la constante `RECORDATORIO` del `.py` correspondiente, sin cambios
(se conservan hasta las tildes ausentes del original: fidelidad antes que estilo). Fuente: los
cuatro archivos en `COPY/Workspace-Jairo/.claude/`, leídos el 2026-09-13.

`validar-xaml.py` (PostToolUse que valida XML bien formado) **no** es un recordatorio: queda
fuera de alcance (ver §7).

## 4. Instalación, reglas y documentación

**`bin/components/rules.sh`:**
- `ac_rules_hook "recordar.mjs" "PreToolUse" "Grep|Bash|PowerShell|Edit|Write|MultiEdit|Read" "CLAUDEMAX_RECORDAR" "5"`.
- Nueva función `ac_rules_recordatorios`: crea `<RAG_ROOT>/.claude/recordatorios/`; copia
  `_plantilla.md` siempre (es del repo), los cinco de fábrica solo si faltan, y
  `ejemplos/maestrasuite/*.md` solo si faltan. Si `RAG_ROOT` no está definida, avisa y omite
  solo esta parte (el hook se instala igual y buscará `.claude/recordatorios/` subiendo desde
  el cwd). El motor no entra en subdirectorios: `ejemplos/` no se carga aunque se active un
  archivo ahí — para usarlo se copia al nivel superior.

**`bin/uninstall.sh`:** retira el hook (`ac_remove_hook … recordar.mjs`) y borra
`$CLAUDE_CONFIG_DIR/hooks/recordar.mjs` y `state/recordar.*`; los `.md` del usuario en
`<RAG_ROOT>/.claude/recordatorios/` se quedan.

**Wizard:** sin cambios — va dentro del componente `rules`.

**`templates/rules/CLAUDEMAX.md`:** sección nueva y corta al final:

> ## 8. Recordatorios justo a tiempo
>
> Las reglas que se olvidan a mitad de una tarea larga no se arreglan repitiéndolas aquí: se
> convierten en un recordatorio en `<RAG_ROOT>/.claude/recordatorios/<nombre>.md` (frontmatter
> `tools`/`patrones`/`rutas` + texto), que el hook `recordar.mjs` inyecta en el instante en que
> vas a ejecutar el comando o editar el archivo que lo dispara. Criterio: una regla que se
> olvidó dos veces se convierte en recordatorio, con la fecha y el fallo que lo parió en un
> comentario. Copia `_plantilla.md` para crear uno; no toques `settings.json`. Cuando recibas
> uno, aplícalo antes de seguir.

(El sub-proyecto 4 reescribe el archivo entero; esto es lo mínimo para que la regla exista.)

**Docs:** `README.md` — fila nueva en la tabla de hooks (`recordar.mjs` · `PreToolUse` · no
bloquea · `CLAUDEMAX_RECORDAR=0`) y un párrafo "Recordatorios justo a tiempo" tras la tabla de
reglas con el formato, los cinco de fábrica y los ejemplos; `INSTALL.md` — `hooks/recordar.mjs` y
`templates/recordatorios/` en el árbol. `skills/rituales` sin cambios.

## 5. Errores

| Situación | Comportamiento |
|---|---|
| `CLAUDEMAX_RECORDAR=0` | exit 0 antes de leer stdin |
| stdin vacío / JSON inválido / sin `tool_name` | exit 0, sin salida |
| ningún `.claude/recordatorios/` en 4 niveles | exit 0, sin salida |
| recordatorio con frontmatter roto o sin `tools` | se ignora; línea en `state/recordar.log` |
| regex inválida en `patrones` | se ignora ese recordatorio; línea en el log |
| `una_vez_por_sesion` sin `session_id` en el evento | dispara cada vez |
| estado `recordar.json` corrupto | se reescribe desde cero |
| dos recordatorios con el mismo nombre en workspace y proyecto | gana el del proyecto (más cercano al cwd) |
| excepción no prevista | exit 0, sin salida (`main().catch(() => process.exit(0))`) |

## 6. Pruebas (`hooks/test/recordar.test.mjs`, `node --test`, sin BD ni red)

El motor expone sus funciones puras desde `hooks/recordar-lib.mjs` (parseo, coincidencia,
búsqueda de directorios, estado) para probarlas sin lanzar procesos; `recordar.mjs` es el
envoltorio de stdin/stdout. Casos:

- **Parseo:** listas en línea y en bloque; `activo: false`; `una_vez_por_sesion: true`; sin
  `tools` → inválido con motivo; frontmatter sin cierre → inválido.
- **Coincidencia (tabla):** tool fuera de `tools` → no; sin `patrones` ni `rutas` → sí; tool en
  `siempre` → sí aunque no case ningún patrón; regex casa / no casa (case-insensitive); glob
  casa / no casa con `\` en la ruta; ambos → basta uno; regex inválida → inválido con motivo;
  `Grep` prueba contra `pattern`; `Edit` prueba `patrones` contra `file_path`.
- **Búsqueda:** fixture con `ws/.claude/recordatorios/{a.md,b.md}` y
  `ws/proy/.claude/recordatorios/{b.md}`; desde `ws/proy/src` encuentra ambos directorios; `b`
  es el del proyecto; `_plantilla.md` se ignora; `CLAUDEMAX_RECORDATORIOS_DIR` anula la búsqueda.
- **Estado:** con `CLAUDE_CONFIG_DIR` temporal — primer disparo escribe `disparados`; segundo
  con el mismo `session_id` no dispara; `session_id` distinto vuelve a disparar; JSON corrupto
  se reescribe.
- **Extremo a extremo (proceso hijo):** evento `Bash` con `gcloud run deploy` → JSON con
  `additionalContext` que contiene "VAS A TOCAR PRODUCCIÓN" y exit 0; evento `Bash` con `ls` →
  sin salida y exit 0; stdin vacío → exit 0; `CLAUDEMAX_RECORDAR=0` → exit 0 sin salida; `Edit`
  de `…/V.A.U.L.T/Decisiones/x.md` → contiene "NOTA DEL VAULT"; `Grep` cualquiera → contiene
  "ORDEN DE HERRAMIENTAS".
- **Instalación:** `templates/recordatorios/` tiene exactamente `_plantilla.md`,
  `orden-herramientas.md`, `tocar-produccion.md`, `editar-vault.md`, `estandares-dotnet.md`,
  `pruebas-dotnet.md` y `ejemplos/maestrasuite/{orden-busqueda,despliegue,estandares-maestrasuite,rojos-suite-api}.md`;
  los cinco de fábrica parsean como válidos y activos; los cuatro ejemplos parsean como válidos
  e inactivos; ninguno de los cinco genéricos contiene "Maestra".
- **Extremo a extremo (adicionales):** `Edit` de `…/src/Foo.cs` → contiene "ESTÁNDARES .NET";
  `Bash` con `dotnet test tests/X.Tests` → contiene "VAS A CORRER UNA SUITE .NET"; los archivos
  de `ejemplos/` copiados a un directorio de prueba no disparan (inactivos) hasta cambiar
  `activo: true`.

## 7. Fuera de alcance

Recordatorios por proyecto creados por `init-proyecto` (sub-proyecto 4); ajuste del texto de
`orden-herramientas` cuando `codebase-memory` esté instalado (sub-proyecto 3); listar
recordatorios rotos desde `rag.mjs salud` (podría hacerse leyendo `state/recordar.log`; no
ahora); comandos CLI para crear/listar recordatorios (copiar la plantilla basta); un hook
`PostToolUse` que valide XML bien formado en `.xaml`/`.csproj` (el `validar-xaml.py` del setup
de trabajo — candidato al sub-proyecto 7 junto con la skill .NET/WinUI); la skill 2.0
`dotnet-winui` (sub-proyecto 7, anotado en la descomposición del spec padre).
