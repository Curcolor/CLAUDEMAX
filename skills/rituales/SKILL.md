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
`Hubs/Bienvenida.md` del vault y la regla 7 de `CLAUDEMAX.md`). Los rituales escriben aquí:

| Ritual | Carpeta | `coleccion` | Además |
|---|---|---|---|
| `init-proyecto` | `Hubs/<Proyecto>.md` | `hubs` | desde `Hubs/_proyecto.md`; enlázalo en `Bienvenida` (Negocio) |
| `fin-sesion` | `Superpowers/Sesiones/YYYY-MM-DD-HHMM-<proyecto>.md` | `sesiones` | enlázala en `Hubs/Superpowers-Sesiones.md` |
| `fin-dia` | `Bitacoras/YYYY-MM-DD.md` | `bitacoras` | enlázala en `Hubs/Bitacoras.md` |
| `fin-ciclo` | `Superpowers/Sesiones/cierre-<ciclo>.md` | `sesiones` | corre `reindex` y `salud` |

Ningún ritual reindexa salvo `fin-ciclo`: el hook de arranque de sesión hace el reindex
incremental y muestra `rag.mjs salud --resumen` (caducas, huérfanas, enlaces rotos).

## 1. Inicio de sesión (automático, vía hook)

- **Cuándo:** en cada arranque de una sesión de Claude Code (evento `SessionStart`, solo en
  `startup` — no al reanudar), sin que nadie lo pida.
- **Qué lo dispara:** el hook `hooks/session-start.mjs`, registrado por el componente `rules`
  del instalador con timeout de 90 s.
- **Qué hace:** reindexa el RAG de forma incremental (`rag.mjs ingest --silencioso`, tope
  60 s) y resume la salud del vault (`rag.mjs salud --resumen`: caducas, a revisar, huérfanas,
  enlaces rotos); luego detecta el proyecto actual, resume el grafo de Graphify
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

- **Cuándo:** al arrancar un repo/proyecto nuevo dentro del workspace CLAUDEMAX, o cuando el
  usuario dice "nuevo proyecto" / "init project".
- **Comando:**
  ```bash
  node R.A.G/ritual.mjs init-proyecto <ruta> [--proyecto nombre] [--descripcion texto] [--vault ruta]
  ```
- **Qué hace:** crea `<ruta>/.claude/`; copia `templates/rules/proyecto.md` a
  `<ruta>/.claude/CLAUDEMAX.md` sustituyendo los marcadores (`{{PROYECTO}}`, `{{FECHA}}`,
  `{{VAULT}}`, `{{RAG}}`, `{{DESCRIPCION}}`); crea (o completa) `<ruta>/.claude/CLAUDE.md` con
  la línea `@CLAUDEMAX.md`; crea el hub del proyecto `V.A.U.L.T/Hubs/<nombre>.md` desde
  `Hubs/_proyecto.md` (marcadores `{{PROYECTO}}`, `{{FECHA}}`, `{{DESCRIPCION}}`, `{{RUTA}}`).
- **Qué NO hace:** nunca sobrescribe un archivo existente — si `.claude/CLAUDEMAX.md`,
  `.claude/CLAUDE.md` o `Hubs/<nombre>.md` ya están, los respeta e informa por consola. Si no
  encuentra la plantilla `proyecto.md`, avisa claramente y continúa igual con el resto de
  pasos (no falla).

## 3. Fin de sesión (manual, ritual menor)

- **Cuándo:** al cerrar **una sesión de trabajo** de Claude Code, para que la siguiente sesión
  retome el hilo sin perder contexto. Dispara con "fin de sesión", "cerramos la sesión",
  "end of session", "retomar el hilo", "dónde quedamos". **No confundir con `fin-dia`**: este
  ritual es por sesión (puede haber varias al día), `fin-dia` es la bitácora del día completo.
  Úsalo cuando la conversación actual está por terminar, no cuando termina la jornada.
- **Comando:**
  ```bash
  node R.A.G/ritual.mjs fin-sesion [--resumen "texto"] [--proyecto nombre] [--siguiente "texto"] [--vault ruta]
  ```
- **Qué hace:** escribe una nota nueva en
  `V.A.U.L.T/Superpowers/Sesiones/YYYY-MM-DD-HHMM-<proyecto>.md` (frontmatter `proyecto`
  detectado o el pasado por `--proyecto`, `tags: [sesion]`, `fecha`). El cuerpo lleva
  un título con el proyecto y la hora, una sección "Qué se hizo" con `--resumen`, y una
  sección "Siguiente paso" con `--siguiente` si se pasa. El proyecto se detecta igual que
  `hooks/session-start.mjs`: nombre de la carpeta raíz del repo git
  (`git rev-parse --show-toplevel`), con fallback al cwd si no hay repo. Si dos ejecuciones
  caen en el mismo minuto, no se pisan: la segunda nota gana el sufijo `-2.md`, `-3.md`...
- **Sin `--resumen`:** no falla — escribe la nota con una plantilla vacía (sección "Qué se
  hizo" con un marcador para completar a mano) y lo dice explícitamente por consola.
- **Qué NO hace — a propósito:** no reindexa el RAG ni reconstruye Graphify (misma razón que
  `fin-dia`: es barato y se puede llamar en cada cierre de sesión). Termina recordando que hay
  que enlazar la nota desde `Hubs/Superpowers-Sesiones.md` y que el arranque de la próxima
  sesión la reindexa.

## 4. Fin de día (manual, ritual menor)

- **Cuándo:** el usuario dice "terminamos por hoy", "fin del día", "end of day" o
  "context dump" al cerrar la jornada **completa** (no una sesión individual — para eso es
  `fin-sesion`).
- **Comando:**
  ```bash
  node R.A.G/ritual.mjs fin-dia [--resumen "texto"] [--vault ruta]
  ```
- **Qué hace:** escribe o añade en `V.A.U.L.T/Bitacoras/YYYY-MM-DD.md` (frontmatter
  `tags: [bitacora]`, `fecha`). Si el archivo del día ya existe, **añade** una nueva entrada
  encabezada con la hora (`## HH:MM`) en vez de sobrescribir — puede llamarse varias veces el
  mismo día y cada llamada suma una entrada.
- **Qué NO hace — a propósito:** no reindexa el RAG ni reconstruye Graphify. Es la diferencia
  deliberada con `fin-ciclo`: un ritual que se ejecuta a diario no debe pagar el coste de un
  reindexado completo. Termina recordando que hay que enlazar la bitácora desde
  `Hubs/Bitacoras.md` y que el arranque de la próxima sesión la reindexa.

## 5. Fin de ciclo (manual, ritual mayor — exige confirmación)

- **Cuándo:** el usuario dice "cierre de ciclo", "fin de sprint" o equivalente, al cerrar un
  sprint o ciclo de trabajo completo.
- **Comando:**
  ```bash
  node R.A.G/ritual.mjs fin-ciclo [--ciclo nombre] [--proyecto nombre] [--si] [--vault ruta]
  ```
- **Qué hace sin `--si`:** solo imprime el plan detallado de lo que haría (nota de cierre a
  escribir, reindexado a ejecutar, recordatorios pendientes) y sale con éxito **sin tocar
  nada ni conectarse a la base de datos**.
- **Qué hace con `--si`:** escribe la nota de cierre en
  `V.A.U.L.T/Superpowers/Sesiones/cierre-<ciclo>.md`; ejecuta `rag.mjs reindex` (respeta
  `EMBED_BACKEND` del `.env` compartido; si hay credenciales de Kaggle configuradas y el
  vault tiene muchas notas, sugiere `--backend kaggle` para acelerar — no lo fuerza) y
  `rag.mjs salud`; recuerda ejecutar `graphify extract .` en los repos activos para regenerar
  sus grafos de Graphify; e imprime documentos indexados por colección y estado de vigencia.
- **Qué NO hace:** nunca reindexa sin confirmación explícita — es el único de los cinco
  rituales que exige `--si`, porque reindexa toda la base. Si la base de datos no responde al
  pedir el resumen final, avisa y omite solo esa parte; el resto del ritual ya se ejecutó.

---

Config: skill.yaml · Schema: schema.json
