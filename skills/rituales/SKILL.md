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

## Semántica de las categorías del vault (para escribir notas)

Cada ritual que escribe una nota lo hace en la carpeta y con la `categoria` que le
corresponde según esta tabla — es lo que hay que tener presente al clasificar cualquier nota
nueva, no solo las que escriben los rituales (ver `V.A.U.L.T/README.md` y el `README.md` de
cada carpeta para el detalle completo con ejemplos):

| Carpeta | `categoria` | Significado |
|---|---|---|
| `00-Inbox/` | `personal` (tag `personal/sesion`) | Lo último que se habló en cada sesión de Claude Code: continuidad entre sesiones (qué se hizo, en qué punto se quedó, qué sigue). Lo escribe `fin-sesion`. |
| `Journal/` | `personal` (tag `personal/bitacora`) | Bitácoras: registro cronológico del trabajo diario. Lo escribe `fin-dia`. |
| `Aprendizaje/` | `aprendizaje` | Errores cometidos y su lección (postmortems: qué falló, por qué, cómo evitarlo). NO son apuntes de tecnologías ni tutoriales. |
| `Investigacion/` | `investigacion` | Lo que se pregunta e investiga para decidir algo: estilos de diseño, comparativas de herramientas, papers, PDFs parseados, transcripciones. |
| `Organizacion/` | `organizacion` | Parte legal y conceptual de la organización: miembros y roles, estatutos, contratos, marca, procesos internos, clientes. |
| `Codigo/` | `codigo` | Repos, arquitectura, snippets, grafos de Graphify. |
| `Proyectos/` | `proyectos` | Planes, decisiones, sprints, specs. |

## 1. Inicio de sesión (automático, vía hook)

- **Cuándo:** en cada arranque de una sesión de Claude Code (evento `SessionStart`), sin que
  nadie lo pida.
- **Qué lo dispara:** el hook `hooks/session-start.mjs`, registrado por el componente `rules`
  del instalador.
- **Qué hace:** detecta el proyecto actual, resume el grafo de Graphify
  (`.ua/knowledge-graph.json`) si existe, y consulta el RAG
  (`rag.mjs query "<proyecto>" --proyecto <proyecto> --topk 3`) si la base responde. Emite
  todo como un único bloque de contexto con cabecera explícita.
- **Qué NO hace:** no bloquea ni retrasa el arranque de la sesión más de ~5s, no falla si
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
  la línea `@CLAUDEMAX.md`; crea `V.A.U.L.T/Proyectos/<nombre>/00-indice.md` con el
  frontmatter de taxonomía (`categoria: proyectos`, `proyecto: <nombre>`, `fecha`, `tags`).
- **Qué NO hace:** nunca sobrescribe un archivo existente — si `.claude/CLAUDEMAX.md`,
  `.claude/CLAUDE.md` o `00-indice.md` ya están, los respeta e informa por consola. Si no
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
  `V.A.U.L.T/00-Inbox/YYYY-MM-DD-HHMM-<proyecto>.md` (frontmatter `categoria: personal`,
  tag `personal/sesion`, `proyecto` detectado o el pasado por `--proyecto`). El cuerpo lleva
  un título con el proyecto y la hora, una sección "Qué se hizo" con `--resumen`, y una
  sección "Siguiente paso" con `--siguiente` si se pasa. El proyecto se detecta igual que
  `hooks/session-start.mjs`: nombre de la carpeta raíz del repo git
  (`git rev-parse --show-toplevel`), con fallback al cwd si no hay repo. Si dos ejecuciones
  caen en el mismo minuto, no se pisan: la segunda nota gana el sufijo `-2.md`, `-3.md`...
- **Sin `--resumen`:** no falla — escribe la nota con una plantilla vacía (sección "Qué se
  hizo" con un marcador para completar a mano) y lo dice explícitamente por consola.
- **Qué NO hace — a propósito:** no reindexa el RAG ni reconstruye Graphify (misma razón que
  `fin-dia`: es barato y se puede llamar en cada cierre de sesión). Termina recordando que el
  contenido se indexará en el próximo `rag.mjs ingest`.

## 4. Fin de día (manual, ritual menor)

- **Cuándo:** el usuario dice "terminamos por hoy", "fin del día", "end of day" o
  "context dump" al cerrar la jornada **completa** (no una sesión individual — para eso es
  `fin-sesion`).
- **Comando:**
  ```bash
  node R.A.G/ritual.mjs fin-dia [--resumen "texto"] [--vault ruta]
  ```
- **Qué hace:** escribe o añade en `V.A.U.L.T/Journal/YYYY-MM-DD.md` (frontmatter
  `categoria: personal`, tag `personal/bitacora`, `proyecto: journal`). Si el archivo del día
  ya existe, **añade** una nueva entrada encabezada con la hora (`## HH:MM`) en vez de
  sobrescribir — puede llamarse varias veces el mismo día y cada llamada suma una entrada.
- **Qué NO hace — a propósito:** no reindexa el RAG ni reconstruye Graphify. Es la diferencia
  deliberada con `fin-ciclo`: un ritual que se ejecuta a diario no debe pagar el coste de un
  reindexado completo. Termina recordando que el contenido se indexará en el próximo
  `rag.mjs ingest`.

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
  `V.A.U.L.T/Proyectos/<proyecto>/ciclos/<ciclo>.md`; ejecuta `rag.mjs reindex` (respeta
  `EMBED_BACKEND` del `.env` compartido; si hay credenciales de Kaggle configuradas y el
  vault tiene muchas notas, sugiere `--backend kaggle` para acelerar — no lo fuerza); recuerda
  ejecutar `/understand` en los repos activos para regenerar sus grafos de Graphify; e
  imprime un resumen final de documentos indexados por categoría.
- **Qué NO hace:** nunca reindexa sin confirmación explícita — es el único de los cinco
  rituales que exige `--si`, porque reindexa toda la base. Si la base de datos no responde al
  pedir el resumen final, avisa y omite solo esa parte; el resto del ritual ya se ejecutó.

---

Config: skill.yaml · Schema: schema.json
