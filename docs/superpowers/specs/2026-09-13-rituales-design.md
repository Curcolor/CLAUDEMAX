# Rituales de cierre — Especificación de Diseño (Sub-proyecto 5 de la mezcla con el setup de trabajo)

**Fecha:** 2026-09-13
**Padre:** [Vault + RAG v2](2026-09-13-vault-rag-v2-design.md) (preámbulo con las decisiones globales)
**Reemplaza (en lo que toca a fin-sesion, fin-dia y fin-ciclo):** [Reglas y rituales](2026-08-01-reglas-rituales-design.md) bloque D
**Depende de:** sub-proyectos 1 (taxonomía, `fuentes:`, `rag.mjs salud`), 3 (codebase-memory y graphify) y 4 (`proyectos/<n>.md`, `indices-lib.mjs`)
**Estado:** Diseño aprobado

## Objetivo

Que cerrar una sesión, un día o un ciclo deje el vault, los hubs, `Pendientes.md` y los tres índices
**sincronizados sin depender de la memoria de nadie**: el script hace toda la mecánica (dónde va la
nota, su frontmatter, a qué hub se enlaza, qué notas describen código que cambió, qué pendientes se
archivan, los tres índices juntos) y Claude escribe solo la prosa, que es lo único que no se puede
automatizar.

## Por qué así

- **En el setup de trabajo el ritual de cierre de ciclo era prosa en la `Bienvenida` del vault**
  (cuatro pasos: nota de sesión, releer los `Codigo-*` tocados, una línea en cada hub y
  `Pendientes.md`, los tres índices). Funcionaba cuando se recordaba. Las notas de sesión que
  produjo son buenas —4–9 KB de diagnóstico real, tablas, desvíos— y eso solo lo escribe el modelo.
- **El `fin-sesion --resumen "texto"` de CLAUDEMAX produce lo contrario**: una línea pasada por
  la terminal. Se descarta como forma principal; queda por compatibilidad.
- **`Pendientes.md` del setup de trabajo mide 187 KB.** Su propia cabecera advierte "si esta nota
  empieza a contar historias, se desincroniza y vuelve el problema que vino a resolver", y aun así
  se llenó de secciones narrativas. Una regla escrita no basta: hace falta un formato que una
  función pueda comprobar y una rotación que saque lo viejo.
- **Los tres índices "se desincronizan a la vez y se arreglan a la vez"** (setup de trabajo). El
  `fin-ciclo` actual de CLAUDEMAX corre un `reindex` completo del RAG y solo *recuerda* graphify;
  codebase-memory ni aparece.
- **Alternativas descartadas:** todo por flags (prosa pobre); sin script, solo instrucciones en la
  skill (es lo que tenía el setup de trabajo, y así se olvidan enlaces y se pudre `Pendientes`); un
  script por ritual (duplica configuración y detección); `Pendientes` generado desde casillas
  `- [ ]` (pierde el orden por "qué desbloquea antes", que es juicio humano); rango del ciclo por
  fecha (mezcla ramas) o solo manual (se olvida).

## 1. Flujo: cada ritual en dos tiempos

### 1.1 `fin-sesion` (barato; varios al día)

```
node R.A.G/ritual.mjs fin-sesion [--proyecto n] [--resumen t] [--siguiente t] [--desde ref] [--vault r]
```

1. Crea `Superpowers/Sesiones/YYYY-MM-DD-HHMM-<slug>.md` desde `Plantillas/sesion.md`
   (`rutaLibre` evita pisar otra del mismo minuto). Frontmatter: `proyecto`, `tags: [sesion]`,
   `fecha`, `commit` (HEAD del repo; vacío sin repo).
2. Rellena **Documentos del ciclo** con wikilinks a los specs y planes del rango (§2).
3. Enlaza la nota en `Hubs/Superpowers-Sesiones.md` (§2.6).
4. `--resumen` / `--siguiente`, si vienen, van a "Qué se hizo de verdad" / "Qué sigue".
5. Imprime la ruta y: "escribe *Qué se hizo de verdad* (desvíos y errores incluidos) y *Qué sigue*".

`desde` para `fin-sesion` = el `commit` más reciente entre las notas de sesión **y** de cierre del
proyecto.

### 1.2 `fin-dia`

```
node R.A.G/ritual.mjs fin-dia [--resumen t] [--vault r]
```

1. Si falta, crea `Bitacoras/YYYY-MM-DD.md` desde `Plantillas/bitacora.md` y la enlaza en
   `Hubs/Bitacoras.md`.
2. Actualiza su sección **Sesiones de hoy** con wikilinks a las notas de `Superpowers/Sesiones/`
   cuyo nombre empieza por la fecha de hoy (sin duplicar).
3. `--resumen` añade una entrada `## HH:MM` al final, como hoy.
4. Imprime: "rellena Objetivos, Decisiones, Hallazgos, Bloqueos y Próximo paso".

`fin-dia` no mira git ni índices.

### 1.3 `fin-ciclo` (dos fases: la prosa tiene que existir antes de indexar)

```
node R.A.G/ritual.mjs fin-ciclo [--ciclo n] [--proyecto n] [--desde ref] [--vault r]           # preparar
node R.A.G/ritual.mjs fin-ciclo --cerrar [--si] [--ciclo n] [--proyecto n] [--sin-indexar] ...  # cerrar
```

**Preparar** (no pide `--si`; solo crea el esqueleto):

1. Calcula el rango (§2.2); `desde` = `commit` de la última nota de cierre del proyecto.
2. Crea `Superpowers/Sesiones/YYYY-MM-DD-cierre-<ciclo>.md` desde `Plantillas/cierre.md` si no
   existe (`<ciclo>` = `--ciclo`, o `slugProyecto(rama actual)`, o `ciclo` si no hay repo o HEAD
   está desacoplado). Frontmatter:
   `proyecto`, `tags: [sesion, cierre-ciclo]`, `fecha`, `ciclo`, `desde` (commit), `commit` vacío
   (se graba al cerrar). Rellena "Documentos del ciclo".
3. Imprime la **lista de tareas**, en este orden:
   - notas con `fuentes:` que casan con archivos del ciclo (§2.3), cada una con hasta 5 archivos:
     "reléela contra el grafo antes de editarla";
   - huérfanas nuevas (§2.5) y a qué hub irán;
   - avisos de `Pendientes.md` (§3.2), línea por línea;
   - con `docs_en_repo: true`: specs/planes del repo que se copiarán al vault;
   - "escribe la prosa de <nota>, actualiza esas notas y `Pendientes.md`; luego `fin-ciclo --cerrar --si`".

**Cerrar** (`--cerrar`; sin `--si` imprime lo que haría y sale 0):

1. Localiza la nota de cierre abierta del proyecto (la última `*-cierre-*` con `commit` vacío); si no
   hay, avisa "corre primero fin-ciclo" y sale 1.
2. Enlaza las huérfanas nuevas en el hub de su carpeta (§2.6).
3. Rota `Pendientes.md` (§3.3).
4. Con `docs_en_repo: true`, copia specs y planes del ciclo al vault (§2.7) y los enlaza en su hub.
5. **Los tres índices juntos** (salvo `--sin-indexar`): `indexarCodebaseMemory(repo)`,
   `extraerGraphify(repo)` y `node rag.mjs ingest` (incremental). Cada fallo es un aviso con el
   comando para reintentar; nunca aborta.
6. `node rag.mjs salud` y `node rag.mjs status` (salida en vivo).
7. Graba `commit: <HEAD>` en la nota de cierre. Es lo último: marca el ciclo como cerrado aunque un
   índice haya fallado (el aviso ya se dio).

Se retiran del `fin-ciclo` actual: el `reindex` completo, la sugerencia de Kaggle y el `import("pg")`
directo (el resumen lo da `rag.mjs status`).

## 2. Detección

### 2.1 Proyecto y repo

- Repo = `git rev-parse --show-toplevel` desde el cwd. Sin git → no hay detección: se crea el
  esqueleto, se omiten rango, notas afectadas y copias, y se avisa.
- Proyecto = `--proyecto`, o el `proyecto:` del `proyectos/*.md` cuyo `ruta:` es el repo (relativa a
  `RAG_ROOT` o absoluta), o el nombre de la carpeta del repo. `docs_en_repo` sale de ese archivo.

### 2.2 Rango del ciclo

- Candidatos a `desde`: el `commit:` de las notas de `Superpowers/Sesiones/` con `proyecto: <n>`
  (para `fin-ciclo`, solo las `*-cierre-*` con `commit` no vacío). Gana el commit que exista en el
  repo con **fecha de commit más reciente** (`git show -s --format=%ct`), no el nombre de archivo.
- `--desde <ref>` sobrescribe.
- Sin candidato válido (primer ciclo, o commits perdidos por rebase): `git merge-base HEAD main`,
  luego `master`; sin ninguna, el primer commit (`git rev-list --max-parents=0 HEAD`). Si había
  candidatos pero ninguno existe, aviso "el commit del último cierre ya no existe".
- Archivos del ciclo = `git diff --name-only <desde>..HEAD` ∪ rutas de `git status --porcelain`
  (lo sin commitear cuenta: el cierre suele ir antes del último commit). Rutas del repo →
  relativas a `RAG_ROOT` con `/` para compararlas con `fuentes:`.
- `fechaDesde` = fecha ISO del commit `desde`.

### 2.3 Notas afectadas

Todas las notas del vault con `fuentes:` no vacío, donde **algún glob casa con algún archivo del
ciclo**. El cruce es sobre texto con `casaGlob(patron, ruta)` (misma semántica que `globARegex` de
`recordar-lib.mjs`: `**/`, `**`, `*`, `?`; insensible a mayúsculas; `\` → `/`), así que también
detecta archivos **borrados**, que `firma_origen` no ve porque ya no están en disco.

### 2.4 Specs y planes del ciclo

- Con `docs_en_repo: true`: archivos del ciclo bajo `docs/superpowers/specs/*.md` y
  `docs/superpowers/plans/*.md` del repo.
- Siempre: notas de `Superpowers/Specs/` y `Superpowers/Planes/` con `proyecto: <n>` y fecha de
  modificación ≥ `fechaDesde`.
- En la nota: `- Spec: [[nombre]]` / `- Plan: [[nombre]]`, uno por línea. Los del repo
  (`docs_en_repo`) van como wikilink solo en la nota de cierre, porque `--cerrar` crea su copia en el
  vault (§2.7); en la nota de sesión van como ruta entre backticks, para no dejar enlaces rotos.

### 2.5 Huérfanas nuevas

`analizarHubs` (rag-lib) → huérfanas; "nuevas" = fecha de modificación ≥ `fechaDesde`. El total de
huérfanas se imprime aparte ("y N huérfanas anteriores al ciclo").

### 2.6 Hub de una nota y enlazado

- `hubDeNota(rel)`: `Superpowers/<X>/…` → `Hubs/Superpowers-<X>.md`; `00-Inbox/…` → `Hubs/Inbox.md`;
  cualquier otra → `Hubs/<primera carpeta>.md` (`Codigo/Producto/x.md` → `Hubs/Codigo.md`). Las
  notas de `Hubs/` y `Plantillas/` no se enlazan.
- `enlazarEnHub(textoHub, { nombre, ruta, titulo, ambiguo })` añade `- [[nombre]] — titulo` (o
  `[[ruta-sin-.md]]` si el nombre es ambiguo) al final de la sección `## Notas`: sustituye una línea
  que sea solo `-`; no duplica si el wikilink ya está en cualquier parte del hub; si no hay
  `## Notas`, la crea antes de la línea `Relacionado:` o al final. Devuelve `{ texto, cambiado }`.
- Hub inexistente → aviso, no se crea.

### 2.7 Copia de specs y planes (`docs_en_repo: true`)

- Cada spec/plan del ciclo del repo → `V.A.U.L.T/Superpowers/{Specs,Planes}/<mismo nombre>`.
- `copiaDeSpec(texto, { proyecto, fuente })` antepone (o sustituye) el frontmatter con `proyecto`,
  `fuentes: [<ruta relativa a RAG_ROOT>]` y `espejo_de: <misma ruta>`, y tras él la línea
  `> Copia de \`<ruta>\` generada por fin-ciclo — edita el original.`
- Solo se sobrescribe un destino que ya sea copia (`esCopia` = tiene `espejo_de:`); una nota escrita
  a mano con ese nombre → aviso, no se toca.
- Vigencia: al ingerir, `fuentes` apunta al original; si luego cambia sin nuevo cierre, la copia sale
  `CADUCA` en el RAG.

### 2.8 Refuerzo de dónde van specs y planes

- **Regla 9** de `CLAUDEMAX.md`, línea nueva: "Specs y planes van a `V.A.U.L.T/Superpowers/{Specs,Planes}/`
  —son contexto de Claude (regla 6)—, salvo que el proyecto declare `docs_en_repo: true` en su
  `proyectos/<n>.md`; entonces van a `docs/superpowers/` del repo y `fin-ciclo` los copia al vault."
- **Recordatorio `specs-en-vault.md`** (de fábrica, activo): `tools: [Write]`,
  `rutas: ["**/docs/superpowers/specs/**", "**/docs/superpowers/plans/**"]`, `una_vez_por_sesion: true`.
  Texto: comprueba `docs_en_repo` en `proyectos/<n>.md`; si no es `true`, guarda en
  `V.A.U.L.T/Superpowers/{Specs,Planes}/` con `proyecto:` en el frontmatter.
- `proyecto.md` gana `docs_en_repo: false` en el frontmatter (explícito); `leerProyecto` devuelve
  `docsEnRepo`; `generarIndice` añade ` (docs en repo)` tras la ruta.
- `WORKSPACE/.claude/proyectos/CLAUDEMAX.md` pasa a `docs_en_repo: true` (CLAUDEMAX es open source y
  sus specs son documentación pública).

## 3. `Pendientes.md`

### 3.1 Formato

```markdown
## Abierto
### CLAUDEMAX
- (2026-09-13) qué falta — qué desbloquea — [[donde-esta-el-detalle]]

## Cerrado recientemente
### CLAUDEMAX
- (2026-09-13 → 2026-09-20) qué se cerró — [[sesion-o-decision]]
```

- Un pendiente = **una línea** `- (YYYY-MM-DD) …`; lo cerrado, `- (origen → cierre) …` (también
  `->`). El porqué vive en la nota enlazada.
- `### <Proyecto>` es opcional; sin subsecciones, todo pertenece a cualquier proyecto.
- `## Abierto` se ordena a mano por qué desbloquea antes. El script nunca lo reordena ni lo toca.
- `Hubs/Pendientes.md` de la plantilla documenta esto en comentarios HTML.

### 3.2 `analizarPendientes(texto, hoy)` (rag-lib, pura)

Devuelve `{ abiertos, cerrados, avisos: [{ linea, tipo, texto }] }`. Tipos:

| Tipo | Cuándo |
|---|---|
| `parrafo` | dentro de `## Abierto` / `## Cerrado recientemente`, una línea que no es pendiente, `###`, blanco ni comentario HTML (incluidas continuaciones con sangría) |
| `sin-fecha` | `- ` sin `(YYYY-MM-DD)` al inicio; en Cerrado, sin fecha de cierre |
| `larga` | pendiente de más de 300 caracteres |
| `sin-enlace` | cerrado sin `[[…]]` |
| `antiguo` | abierto con origen de más de 60 días respecto a `hoy` (informativo) |

Texto fuera de esas dos secciones (cabecera, `Relacionado:`) no se analiza. `rag.mjs salud` añade
`pendientes: avisos` (sin contar `antiguo`) al informe y al resumen: `Pendientes: N avisos`. Sin
`Hubs/Pendientes.md`, nada.

### 3.3 Rotación — `rotarPendientes(texto, { proyecto, fechaDesde, yaArchivado })`

Solo sobre la subsección `### <proyecto>` de `## Cerrado recientemente` (o toda la sección si no hay
subsecciones):

1. Si `analizarPendientes` da algún `parrafo` en esa zona → `{ bloqueado: true, lineas }`, sin cambios.
2. **Cerrados en este ciclo** (fecha de cierre ≥ `fechaDesde`): se devuelven en `cerradosCiclo`
   para la sección `## Cerrado en este ciclo` de la nota de cierre (sin duplicar). Se quedan en
   `Pendientes.md`.
3. **Cerrados antes** (fecha de cierre < `fechaDesde`): salen de `Pendientes.md`. Los que
   `yaArchivado(linea)` no encuentra en ninguna nota `*-cierre-*` del proyecto se devuelven en
   `archivar` para `## Archivado de Pendientes` de esta nota. Nada se pierde.
4. Una subsección que queda vacía conserva su `###` con una línea `-`.

Idempotente: aplicarla dos veces con los mismos datos no cambia nada más.

## 4. Piezas

| Archivo | Cambio |
|---|---|
| `templates/rag/rituales-lib.mjs` | **nuevo**, funciones puras; git por `exec(args, cwd)` inyectable: `detectarRepo`, `ultimaNotaConCommit`, `rangoDelCiclo`, `casaGlob`, `notasAfectadas`, `specsYPlanesDelCiclo`, `hubDeNota`, `enlazarEnHub`, `esqueletoNota`, `rotarPendientes`, `copiaDeSpec`, `esCopia`, `grabarCommit` |
| `templates/rag/rag-lib.mjs` | `analizarPendientes` |
| `templates/rag/rag.mjs` | `salud` incluye Pendientes |
| `templates/rag/ritual.mjs` | `fin-sesion`, `fin-dia`, `fin-ciclo` reescritos sobre la lib; flags `--cerrar`, `--desde`, `--sin-indexar` |
| `templates/rag/proyectos-lib.mjs`, `templates/rules/proyecto.md` | `docs_en_repo` |
| `templates/vault/Plantillas/cierre.md` | **nueva**: Qué se hizo de verdad · Documentos del ciclo · Notas de Codigo/ revisadas · Cerrado en este ciclo · Qué sigue |
| `templates/vault/Plantillas/sesion.md`, `bitacora.md` | `commit:` en sesión; sección "Sesiones de hoy" en bitácora |
| `templates/vault/Hubs/Pendientes.md` | formato documentado |
| `templates/recordatorios/specs-en-vault.md` | **nuevo** |
| `templates/rules/CLAUDEMAX.md` | regla 9 + línea de specs |
| `bin/components/rag.sh` | copia `rituales-lib.mjs` |
| `skills/rituales/*` | §3–5 reescritas (dos fases de `fin-ciclo`, guion de prosa); versión 2.2.0 |
| `README.md`, `INSTALL.md` | sección Rituales |

`esqueletoNota(plantilla, { frontmatter, fecha, secciones })`: sustituye `{{date:YYYY-MM-DD}}` por
`fecha`, reescribe las claves de frontmatter dadas (añade las que falten, conserva las demás) y, para
cada `secciones[titulo] = texto`, pone `texto` bajo `## titulo` en lugar del contenido de ejemplo de
la plantilla. `grabarCommit(texto, sha)` sustituye el valor de `commit:` en el frontmatter (y lo
añade si falta).

## 5. Errores

| Caso | Comportamiento |
|---|---|
| Vault inexistente | error y salida 1 (único caso que aborta) |
| Sin repo git | esqueleto sin detección; aviso |
| `commit` del último cierre no existe | merge-base con main/master → primer commit; aviso |
| `--cerrar` sin nota de cierre abierta | "corre primero `fin-ciclo`"; salida 1 |
| `--cerrar` sin `--si` | imprime lo que haría; salida 0 |
| Índice / ingest / salud fallan | aviso con el comando exacto; se sigue; `commit` se graba igual |
| `Pendientes.md` con `parrafo` | no rota; lista líneas; se sigue |
| Hub inexistente | aviso; la nota queda huérfana y `salud` la seguirá listando |
| Nombre de nota ambiguo | wikilink con ruta |
| Destino de copia escrito a mano | aviso; no se toca |

## 6. Pruebas (`node:test`, sin base de datos)

- **`templates/rag/test/rituales-lib.test.mjs`**:
  - `rangoDelCiclo` con `exec` falso: gana el commit con fecha más reciente; commit inexistente →
    merge-base con `main`; sin `main` → `master`; sin ambas → primer commit; con `--desde`; archivos
    = diff ∪ porcelain, convertidos a rutas del workspace.
  - `casaGlob`: `**/`, `*`, `?`, mayúsculas, barras invertidas, archivo borrado.
  - `notasAfectadas`: nota con `fuentes` que casa / no casa; lista hasta 5 archivos.
  - `hubDeNota`: Superpowers, Inbox, subcarpeta de Codigo, Hubs/Plantillas → `null`.
  - `enlazarEnHub`: sustituye `-`, añade al final de `## Notas`, no duplica, crea la sección, ambiguo.
  - `rotarPendientes`: en ciclo → `cerradosCiclo`; anteriores → fuera + `archivar` solo si no están
    archivados; subsecciones por proyecto (no toca la de otro); sin subsecciones; bloqueo por
    `parrafo`; idempotente.
  - `copiaDeSpec`/`esCopia`: frontmatter nuevo o sustituido, línea de aviso, `fuentes` y `espejo_de`.
  - `esqueletoNota`: fecha, claves de frontmatter, secciones.
- **`templates/rag/test/rag-lib.test.mjs`**: `analizarPendientes`, un caso por tipo de aviso y
  `antiguo` con `hoy` inyectado; texto fuera de las secciones ignorado; CRLF.
- **`templates/rag/test/ritual.test.mjs`** (extremo a extremo, **git real** en un workspace temporal
  con `git init`, `user.name`/`user.email` locales y commits):
  1. `fin-sesion` crea la nota con `commit` = HEAD, la enlaza en el hub y lista el spec del repo
     (`docs_en_repo: true`); un segundo `fin-sesion` tras un commit nuevo lista solo el spec nuevo.
  2. `fin-dia` crea la bitácora, la enlaza y lista las sesiones de hoy.
  3. `fin-ciclo` (preparar) crea `*-cierre-<rama>.md` sin `commit`, e imprime la nota de `Codigo/`
     cuya `fuentes:` casa con un archivo cambiado y un aviso de `Pendientes.md`.
  4. `fin-ciclo --cerrar` sin `--si` no cambia nada; con `--si --sin-indexar` enlaza la huérfana,
     rota `Pendientes.md`, copia el spec al vault con `espejo_de` y graba `commit` = HEAD.
  5. Sin repo git: `fin-sesion` crea el esqueleto y avisa.
- **`templates/rag/test/instalacion.test.mjs`**: `Plantillas/` con 5 archivos; `Hubs/Pendientes.md`
  sin avisos de `analizarPendientes`.
- **`hooks/test/recordar.test.mjs`**: 7 recordatorios de fábrica; `specs-en-vault` dispara con Write en
  `docs/superpowers/specs/x.md` y no en `docs/otra.md`.
- **Instalador**: `test-componentes` en verde; dry-run de `--only rag` copia `rituales-lib.mjs`.

## 7. Fuera de alcance

Reescribir automáticamente notas de `Codigo/` (se listan; las reescribe el modelo leyendo el grafo);
reordenar `## Abierto`; migrar el `Pendientes.md` de 187 KB del setup de trabajo (su dueño lo pasa al
formato a mano, con los avisos de `salud` como guía); cierre de ciclo multi-repo en una sola llamada
(un `fin-ciclo` por repo); sincronizar `docs_en_repo` en sentido vault → repo; instalador y wizard
(sub-proyecto 6).
