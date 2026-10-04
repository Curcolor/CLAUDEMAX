---
name: rituales
description: "Documenta los cinco rituales de ciclo de vida de CLAUDEMAX — inicio de sesión (automático), init de proyecto, fin de sesión, fin de día y fin de ciclo — cuándo se disparan y los comandos exactos. Trigger con \"fin de sesión\", \"cerramos la sesión\", \"end of session\", \"retomar el hilo\", \"dónde quedamos\", \"fin del día\", \"terminamos por hoy\", \"end of day\", \"cierre de ciclo\", \"fin de sprint\", \"context dump\", \"nuevo proyecto\", \"init project\", \"ritual\"."
---

# Rituales de ciclo de vida de CLAUDEMAX

Cinco rituales cubren el ciclo de vida completo de una sesión o proyecto en CLAUDEMAX: uno
automático (inicio de sesión) y cuatro manuales que ejecuta el script `ritual.mjs` (vive junto
a `rag.mjs`, en `R.A.G/ritual.mjs` una vez instalado — mismo `.env`, misma convención de ruta
del vault). El repo es la fuente de verdad: ningún ritual manual se dispara solo — el usuario
lo pide explícitamente o le pide al modelo que lo invoque.

## Dónde escribe cada ritual (la carpeta da la colección)

La colección y la autoridad de una nota las da su carpeta, no el frontmatter (ver
`Hubs/Bienvenida.md` del vault y la regla 9 de `CLAUDEMAX.md`). Los rituales escriben aquí:

| Ritual | Carpeta | `coleccion` | Además |
|---|---|---|---|
| `init-proyecto` | `<RAG_ROOT>/.claude/proyectos/<slug>.md` + `Hubs/<Proyecto>.md` | `hubs` (el hub) | regenera `proyectos/_indice.md`; `.gitignore` del repo; indexa codebase-memory y graphify; enlaza el hub en `Bienvenida` (Negocio) |
| `fin-sesion` | `Superpowers/Sesiones/YYYY-MM-DD-HHMM-<proyecto>.md` | `sesiones` | la enlaza en `Hubs/Superpowers-Sesiones.md`; graba `commit` |
| `fin-dia` | `Bitacoras/YYYY-MM-DD.md` | `bitacoras` | la enlaza en `Hubs/Bitacoras.md`; lista las sesiones del día |
| `fin-ciclo` | `Superpowers/Sesiones/YYYY-MM-DD-cierre-<ciclo>.md` | `sesiones` | rota `Hubs/Pendientes.md`; enlaza huérfanas; copia specs (`docs_en_repo`); los tres índices |

**Reparto del trabajo:** el script hace toda la mecánica —la nota sale de `Plantillas/`, con su
frontmatter, enlazada en su hub, con el rango git del ciclo y la lista de qué revisar—; el modelo
escribe solo la prosa, que es lo único que no se puede automatizar. Ningún ritual reindexa salvo
`fin-ciclo --cerrar --si`: el hook de arranque de sesión hace el ingest incremental y muestra
`rag.mjs salud --resumen` (caducas, huérfanas, enlaces rotos, avisos de `Pendientes.md`).

**Rango del ciclo:** desde el `commit:` de la última nota de sesión o de cierre del proyecto (el
que exista con fecha más reciente) hasta HEAD, más lo que aún no está commiteado. Sin notas
previas: la base de la rama con `main`/`master`, o el primer commit si se trabaja sobre `main`.
`--desde <ref>` lo sobrescribe.

## 1. Inicio de sesión (automático, vía hook)

- **Cuándo:** en cada arranque de una sesión de Claude Code (evento `SessionStart`, solo en
  `startup` — no al reanudar), sin que nadie lo pida.
- **Qué lo dispara:** el hook `hooks/session-start.mjs`, registrado por el componente `rules`
  del instalador con timeout de 90 s.
- **Qué hace:** si el repo actual no tiene `.claude/proyectos/<nombre>.md` en el workspace,
  avisa con el comando `init-proyecto` exacto (§2); reindexa el RAG de forma incremental (`rag.mjs ingest --silencioso`, tope
  60 s) y resume la salud del vault (`rag.mjs salud --resumen`: caducas, a revisar, huérfanas,
  enlaces rotos y avisos de formato de `Hubs/Pendientes.md`); luego detecta el proyecto actual, resume el grafo de Graphify
  (`graphify-out/graph.json`) si existe, y consulta el RAG
  (`rag.mjs query "<proyecto>" --proyecto <proyecto> --topk 3`) si la base responde. Emite
  todo como un único bloque de contexto con cabecera explícita.
- **Qué NO hace:** no bloquea el arranque — el reindex tiene tope de 60 s y el resto ~5 s; un
  corte deja el índice consistente (el ingest es atómico por archivo) y lo avisa. No falla si
  Docker está apagado (se omite en silencio — es un caso normal), y nunca vuelca el grafo
  completo: solo conteos, tipos/capas principales y el top de nodos más conectados.
- **Escape:** `CLAUDEMAX_SESSION_CONTEXT=0`.
- No hay comando que invocar — es puramente automático.

## 2. Init de proyecto (manual)

- **Cuándo:** al empezar a trabajar en un repo del workspace que todavía no tiene
  `.claude/proyectos/<nombre>.md` (el hook de arranque lo avisa: "Sin contexto de proyecto…"), o
  cuando el usuario dice "nuevo proyecto" / "init project".
- **Comando:**
  ```bash
  node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--sin-indexar] [--sin-gitignore] [--vault ruta]
  ```
- **Qué hace, en orden:**
  1. crea `<RAG_ROOT>/.claude/proyectos/<slug>.md` desde la plantilla `proyecto.md`: frontmatter
     `proyecto/ruta/descripcion/inicializado` y cinco secciones vacías con su guía en comentarios.
     `<slug>` es el nombre sin espacios ni tildes (`Otro Repo` → `Otro-Repo.md`);
  2. regenera `proyectos/_indice.md`, que `CLAUDEMAX.md` importa: el contexto de todos los
     proyectos se carga en cualquier sesión del workspace sin nada dentro de los repos;
  3. crea el hub `V.A.U.L.T/Hubs/<nombre>.md` desde `Hubs/_proyecto.md`;
  4. si `<ruta>` es un repo git, añade `/CLAUDE.md`, `/CLAUDE.local.md` y `/.claude/` a su
     `.gitignore` (salvo `--sin-gitignore`);
  5. si encuentra `<ruta>/.claude/CLAUDEMAX.md` del diseño anterior, avisa de que hay que migrarlo
     a mano — no borra nada;
  6. indexa el repo con codebase-memory (`index_repository`, modo `moderate`) y extrae su grafo
     con `graphify extract <ruta> --code-only` (salvo `--sin-indexar`; si falta un binario, dice
     cómo instalarlo y sigue).
- **Qué NO hace:** nunca sobrescribe `proyectos/<slug>.md` ni el hub si ya existen; nunca escribe
  dentro del repo salvo el `.gitignore`; no escribe la prosa — eso es el paso siguiente.
- **Después — guion para el modelo**, en una sesión abierta en el repo. Rellena
  `proyectos/<slug>.md` verificando contra el grafo, nunca de memoria:
  1. **Estructura:** `get_architecture` de codebase-memory y `query_graph` / `get_neighbors` de
     graphify → carpetas de primer nivel, capas y quién depende de quién.
  2. **Comandos:** léelos de los archivos reales (`*.sln`/`*.csproj`, `package.json`,
     `pyproject.toml`, `Makefile`) y pruébalos si es barato.
  3. **Estado**, **Trampas que ya costaron tiempo** y **Convenciones** se quedan vacías hasta que
     haya algo real que escribir, con su fecha. No inventes.
  4. Tope ~150 líneas: lo largo va al vault (`Codigo/` con `fuentes:`) y se enlaza.

## 3. Fin de sesión (manual, ritual menor)

- **Cuándo:** al cerrar **una sesión de trabajo** de Claude Code, para que la siguiente sesión
  retome el hilo sin perder contexto. Dispara con "fin de sesión", "cerramos la sesión",
  "end of session", "retomar el hilo", "dónde quedamos". **No confundir con `fin-dia`**: este
  ritual es por sesión (puede haber varias al día), `fin-dia` es la bitácora del día completo.
- **Comando** (desde el repo en el que se trabajó):
  ```bash
  node R.A.G/ritual.mjs fin-sesion [--proyecto nombre] [--resumen "texto"] [--siguiente "texto"] [--desde ref] [--vault ruta]
  ```
- **Qué hace el script:**
  1. crea `V.A.U.L.T/Superpowers/Sesiones/YYYY-MM-DD-HHMM-<proyecto>.md` desde
     `Plantillas/sesion.md` (si dos caen en el mismo minuto, la segunda gana `-2.md`), con
     `proyecto`, `fecha` y `commit` = HEAD del repo (vacío sin repo);
  2. rellena **Documentos del ciclo** con los specs y planes del rango: los del vault como
     wikilink; los del repo (solo con `docs_en_repo: true`) como ruta entre backticks;
  3. la enlaza en `Hubs/Superpowers-Sesiones.md`;
  4. `--resumen` / `--siguiente`, si vienen, van a "Qué se hizo de verdad" / "Qué sigue".
- **Después — lo que escribe el modelo** en esa nota: **Qué se hizo de verdad** (el recorrido real,
  con los desvíos y los errores: lo que la spec y el plan no cuentan) y **Qué sigue** (lo primero
  que hará la próxima sesión). `--resumen` queda como atajo: una línea por terminal no sustituye
  a la prosa.
- **Qué NO hace:** no reindexa el RAG ni los grafos (es barato a propósito; lo hace el arranque de
  la próxima sesión). Sin repo git crea la nota igual, sin rango ni documentos, y lo avisa.

## 4. Fin de día (manual, ritual menor)

- **Cuándo:** el usuario dice "terminamos por hoy", "fin del día", "end of day" o
  "context dump" al cerrar la jornada **completa** (no una sesión individual — para eso es
  `fin-sesion`).
- **Comando:**
  ```bash
  node R.A.G/ritual.mjs fin-dia [--resumen "texto"] [--vault ruta]
  ```
- **Qué hace el script:** si falta, crea `V.A.U.L.T/Bitacoras/YYYY-MM-DD.md` desde
  `Plantillas/bitacora.md` y la enlaza en `Hubs/Bitacoras.md`; reconstruye su sección **Sesiones
  de hoy** con un wikilink por cada nota de `Superpowers/Sesiones/` del día (sin duplicar: se
  puede llamar varias veces); `--resumen` añade una entrada `## HH:MM` al final.
- **Después — lo que escribe el modelo:** Objetivos, Decisiones (con su porqué), Hallazgos,
  Bloqueos y Próximo paso.
- **Qué NO hace:** no mira git ni índices, y no reindexa: es la diferencia deliberada con
  `fin-ciclo`.

## 5. Fin de ciclo (manual, ritual mayor — en dos fases)

- **Cuándo:** el usuario dice "cierre de ciclo", "fin de sprint" o equivalente, al terminar un
  ciclo de trabajo (una rama, un sub-proyecto). Un `fin-ciclo` por repo.
- **Por qué dos fases:** la prosa tiene que existir antes de indexar; si no, el RAG indexa una nota
  de cierre vacía y notas de `Codigo/` desactualizadas.

**Fase 1 — preparar** (no toca nada fuera del vault y no pide confirmación):

```bash
node R.A.G/ritual.mjs fin-ciclo [--ciclo nombre] [--proyecto nombre] [--desde ref] [--vault ruta]
```

Crea `Superpowers/Sesiones/YYYY-MM-DD-cierre-<ciclo>.md` desde `Plantillas/cierre.md` (`<ciclo>` =
`--ciclo` o la rama actual) con `desde` = commit de inicio del ciclo y `commit` vacío —una nota de
cierre con `commit` vacío es un ciclo **abierto**; si ya hay una, se respeta—, la enlaza en su hub
e imprime la lista de tareas:

1. notas con `fuentes:` que casan con archivos del ciclo, con hasta 5 archivos cada una;
2. huérfanas nuevas y el hub al que irán;
3. avisos de formato de `Hubs/Pendientes.md`, línea por línea;
4. con `docs_en_repo: true`, los specs y planes del repo que se copiarán al vault.

**Entre fases — guion de prosa para el modelo**, en este orden:

1. Por cada nota de la lista 1: **reléela contra el grafo** (codebase-memory `get_code_snippet` /
   `trace_path`, graphify `query_graph`) y reescribe lo que ya no es cierto. Nunca copies prosa
   vieja. Anótala en la sección **Notas de Codigo/ revisadas** de la nota de cierre.
2. Pon al día `Hubs/Pendientes.md` en su formato de una línea: lo terminado baja a «Cerrado
   recientemente» como `- (origen → cierre) qué se cerró — [[nota]]`; lo nuevo entra en «Abierto»
   como `- (YYYY-MM-DD) qué falta — qué desbloquea — [[nota]]`, ordenado por qué desbloquea antes.
   Corrige los avisos de la lista 3 (un párrafo bloquea la rotación).
3. Escribe **Qué se hizo de verdad** (el recorrido con sus desvíos y errores) y **Qué sigue**.

**Fase 2 — cerrar:**

```bash
node R.A.G/ritual.mjs fin-ciclo --cerrar        # imprime lo que haría; no toca nada
node R.A.G/ritual.mjs fin-ciclo --cerrar --si [--sin-indexar]
```

Con `--si`, en orden: enlaza las huérfanas nuevas en su hub; rota `Pendientes.md` (lo cerrado en
este ciclo se copia a **Cerrado en este ciclo** de la nota; lo de ciclos anteriores sale del
índice, y lo que no esté ya en ninguna nota de cierre va a **Archivado de Pendientes**: nada se
pierde); copia specs y planes al vault (`docs_en_repo`) con `espejo_de:` y `fuentes:` al original;
regenera **los tres índices juntos** —codebase-memory, graphify y `rag.mjs ingest` incremental—;
corre `rag.mjs salud` y `rag.mjs status`; y graba `commit` = HEAD en la nota, que cierra el ciclo.
Un índice que falla es un aviso con el comando para reintentar, nunca aborta. Sin nota de cierre
abierta, sale con 1 y pide correr primero la fase 1.

---

Config: skill.yaml · Schema: schema.json
