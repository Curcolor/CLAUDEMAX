# Vault + RAG v2 — Especificación de Diseño (Sub-proyecto 1 de la mezcla con el setup de trabajo)

**Fecha:** 2026-09-13
**Padre:** [Diseño maestro CLAUDEMAX](2026-07-19-claudemax-master-design.md)
**Reemplaza (en lo que toca al vault y al RAG):** [Taxonomía, backends y skills](2026-08-01-taxonomia-backends-skills-design.md) (bloque 1) y [Workspace RAG](2026-07-19-workspace-rag-design.md)
**Estado:** Diseño aprobado

## Preámbulo — de dónde sale esto

El 2026-09-13 se comparó CLAUDEMAX con el setup de Claude Code que el autor usa a diario en su
trabajo (`~/.claude` + `Workspace-Jairo/`, tres meses de uso: 47 notas de sesión, 107 memorias,
60+ bitácoras, un RAG en Python con pgvector, cuatro hooks Python y un vault de Obsidian con 20
hubs). Conclusión del diagnóstico:

- **El setup de trabajo tiene los principios de diseño correctos** porque cada uno nació de un
  fallo con fecha: recordatorios "justo a tiempo" en el instante de la decisión, modelo de
  autoridad en el RAG, hubs sin huérfanos, contexto de Claude fuera de los repos, tres índices
  que se regeneran juntos. Pero está acoplado a un negocio y a una máquina (rutas absolutas).
- **CLAUDEMAX tiene el empaquetado correcto** (instalador idempotente, wizard, 13 skills de
  conocimiento, RAG multi-backend), pero sus reglas y su taxonomía nunca se contrastaron con uso
  real, y tres de sus decisiones el setup de trabajo ya demostró equivocadas: escribir `.claude/`
  dentro del repo, volcar el grafo de código al RAG, y prohibir la memoria nativa y Context7.

**Decisión global:** CLAUDEMAX sigue siendo el instalador; lo que instala pasa a ser la
generalización del diseño del setup de trabajo. Lo específico del negocio (despliegue GCP, suite
de la API, XAML) queda fuera del repo; el *mecanismo* sí entra.

### Decisiones tomadas el 2026-09-13 (aplican a los seis sub-proyectos)

| Tema | Decisión | Motivo |
|---|---|---|
| Taxonomía del vault | Carpetas-género del setup de trabajo + `proyecto` como eje transversal (en vez de `tema/*`). Se retiran las 6 `categoria`. | Las carpetas están probadas tres meses; `proyecto` ya existe en `rag.mjs` y en el MCP y cumple el mismo rol que `tema`. Bonus: `VAULT_MODE=import` de un vault existente funciona sin renombrar carpetas. |
| Recordatorios justo a tiempo | Un motor (`hooks/recordar.mjs`) + recordatorios en markdown en `<RAG_ROOT>/.claude/recordatorios/`. | Añadir un recordatorio = escribir un `.md`, sin código ni tocar `settings.json`. Hookify estaba instalado en el setup de trabajo y aun así se siguió escribiendo Python: no desplazó al patrón propio. |
| Contexto por proyecto | `init-proyecto` escribe `<RAG_ROOT>/.claude/proyectos/<nombre>.md` + `@import` en el CLAUDE.md del workspace + `Hubs/<Proyecto>.md`. **Nunca dentro del repo.** | Incidente real: un `CLAUDE.md` con contexto interno acabó publicado en GitHub (2026-07-24). Claude Code carga los CLAUDE.md de los directorios padre, así que el workspace lo sirve igual. |
| Grafo de código | Se retira la ingesta de `graph.json` al RAG. Consulta en vivo por MCP `graphify` (por proyecto) + componente nuevo `codebase-memory`. Orden: cerebro → graphify → codebase-memory → grep. | Medido en el setup de trabajo: 257 notas de nodos/aristas eran más de la mitad del vault y ahogaban las búsquedas. "Lo generado se queda en su herramienta; lo narrado va al vault." |
| Regla 6 (memoria) | Se reescribe a "tres memorias con rol": memoria nativa de Claude Code = gotchas cortos; vault+RAG = narrativa y decisiones; grafo = estructura. Sin prohibir Context7. | El setup de trabajo usa las tres a la vez y funciona; la prohibición no tenía evidencia. |
| Rituales | `fin-sesion` → `Superpowers/Sesiones/`; `fin-dia` → `Bitacoras/`; `fin-ciclo` corre los tres índices juntos y actualiza `Pendientes.md`. | "Se desincronizan a la vez y se arreglan a la vez." |
| SessionStart | Reindexa el RAG incremental al arrancar (matcher `startup`, timeout 90 s). | Sin esto el RAG solo se actualiza en `fin-ciclo` y responde con lo de la semana pasada. |

### Descomposición

| # | Sub-proyecto | Depende de |
|---|---|---|
| **1** | **Vault + RAG** (este spec) | — |
| 2 | Motor de recordatorios justo a tiempo | — |
| 3 | Grafo en vivo: MCP graphify por proyecto + componente codebase-memory | 2 |
| 4 | Reglas + contexto: `CLAUDEMAX.md` reescrito, `init-proyecto` → `.claude/proyectos/` | 1, 3 |
| 5 | Rituales: fin-sesion/fin-dia/fin-ciclo rediseñados, `Pendientes.md` | 1, 3 |
| 6 | Instalador + docs: wizard, uninstall, README/INSTALL, `test-componentes` | todos |

Cada uno lleva su propio spec → plan → implementación. Este es el primero porque 4 y 5 dependen
de sus nombres y su schema.

## Objetivo de este spec

Reemplazar la taxonomía de seis categorías del vault por la de carpetas-género con autoridad,
portar al RAG en Node el ranking del setup de trabajo (regla de conflicto, boost, exclusión de
ruido), añadir lectura de documento completo por MCP, retirar la ingesta del grafo, reindexar al
arrancar la sesión, y —lo nuevo respecto al setup de trabajo— **detectar automáticamente notas que
ya no reflejan la realidad** (fuentes que cambiaron, decisiones reemplazadas, fechas de revisión
vencidas).

## 1. Vault

### 1.1 Carpetas

```
V.A.U.L.T/
├── Hubs/                 Bienvenida.md, Pendientes.md, un hub por carpeta, un hub por proyecto
├── 00-Inbox/             aterrizaje de parsers (markitdown/whisper/pdf), sin clasificar
├── Bitacoras/            diario cronológico — lo escribe fin-dia
├── Decisiones/           elecciones con alternativas descartadas — máxima autoridad
├── Conocimiento/         referencia estable: normas, manuales, convenciones, PDFs parseados
├── Aprendizaje/          postmortems largos (los cortos van a la memoria nativa de Claude Code)
├── Entrevistas/          palabras textuales del dueño de un proceso
├── Revisiones/           afinaciones sobre algo que ya existe y ya corre
├── Codigo/               código explicado en prosa (producto → proyecto → subsistema); NUNCA el volcado del grafo
├── Procesos/             qué hace la organización y quién responde
├── Formales/             espejo .md generado de documentos formales; no se edita a mano (opcional)
├── Superpowers/
│   ├── Specs/            el qué y el porqué de un ciclo, antes de planificar
│   ├── Planes/           el cómo, paso a paso, de un ciclo aprobado
│   ├── Tareas/           qué se ejecutó de verdad contra cada plan (briefs/reportes SDD)
│   └── Sesiones/         cierre narrativo de una sesión — lo escribe fin-sesion
├── Plantillas/           nota.md, bitacora.md, sesion.md, hub.md — excluida del índice
└── .obsidian/            grupos de color por carpeta (path:), no por tag
```

Mapeo desde el layout anterior de CLAUDEMAX (se documenta en README; no hay herramienta de
migración automática — ningún vault real tiene ese layout con contenido):

| Antes | Ahora |
|---|---|
| `Journal/` | `Bitacoras/` |
| `Proyectos/` | `Superpowers/Specs/`, `Superpowers/Planes/` o `Decisiones/` según qué sea la nota |
| `Organizacion/` | `Procesos/` (procesos, roles) o `Conocimiento/` (legal, marca, contratos) |
| `Investigacion/` | `Conocimiento/` |
| `00-Inbox/` con notas de sesión | `Superpowers/Sesiones/` |
| `README.md` por carpeta | se retira; el hub en `Hubs/` es la documentación |
| `_plantilla.md` en raíz | `Plantillas/nota.md` |

### 1.2 Frontmatter

Mínimo. `coleccion` y `autoridad` **no** van en el frontmatter: se derivan de la carpeta, así no
hay deriva entre lo que dice la nota y dónde está.

```yaml
---
proyecto: claudemax          # eje transversal; opcional pero recomendado
tags: [rag, pgvector]        # libres
fecha: 2026-09-13
fuente: informe.pdf          # opcional; lo rellenan los parsers
# --- vigencia (sección 3.4), todos opcionales ---
fuentes:                     # rutas o globs relativos a RAG_ROOT: lo que esta nota describe
  - MiRepo/src/Controles/MenuLateral*.xaml
reemplaza: [Bitrix-vs-GCP]   # esta nota deja obsoleta a aquella (nombre de nota o ruta)
revisar: 2026-10-08          # pasada esta fecha, la nota hay que revisarla
---
```

### 1.3 Colecciones y autoridad

Derivadas de la carpeta; gana el prefijo más específico (`Superpowers/Sesiones` antes que
`Superpowers`).

| Carpeta | `coleccion` | `autoridad` | Búsqueda por defecto |
|---|---|---|---|
| `Hubs/` | `hubs` | `vigente` | sí, **+boost** |
| `Decisiones/` | `decisiones` | `vigente` | sí, **+boost** |
| `Formales/` | `docs_formales` | `oficial` | sí |
| `Superpowers/Specs/` | `specs` | `diseño-vigente` | sí |
| `Entrevistas/` | `entrevistas` | `fuente-primaria` | sí |
| `Conocimiento/` | `conocimiento` | `referencia` | sí |
| `Aprendizaje/` | `aprendizaje` | `leccion` | sí |
| `Codigo/` | `codigo` | `referencia` | sí |
| `Procesos/` | `procesos` | `referencia` | sí |
| `Revisiones/` | `revisiones` | `referencia` | sí |
| `Superpowers/Sesiones/` | `sesiones` | `personal` | sí |
| `Bitacoras/` | `bitacoras` | `historica` | sí |
| `Superpowers/Planes/` | `planes` | `historico-tecnico` | **no** |
| `Superpowers/Tareas/` | `proceso` | `historico-tecnico` | **no** |
| `00-Inbox/` | `inbox` | `sin-clasificar` | **no** |
| `Plantillas/` | — | — | fuera del índice |
| cualquier otra | `otros` | `referencia` | sí, con aviso al final del ingest |

Por qué `planes` y `proceso` quedan fuera por defecto: en el setup de trabajo los planes llevaban
C#/XAML literal y eran el 59 % del índice (601 de 1024 chunks, medido 2026-07-25); una consulta
por "cómo funciona la autenticación" devolvía cinco fragmentos del mismo plan en vez de la nota de
`Codigo/`. Siguen indexados: se piden con `coleccion` explícita.

**Regla de conflicto** entre fuentes que se contradicen (va en la descripción del tool MCP para que
el modelo la aplique, y en el boost del ranking):

    decisiones > docs_formales / specs > entrevistas > conocimiento / aprendizaje / codigo > planes > bitacoras

Gana la de mayor autoridad, no la más reciente.

**Avisos por autoridad** (una línea en cada resultado):

| `autoridad` | Aviso |
|---|---|
| `vigente` | decisión o estado vigente |
| `oficial` | documento formal vigente |
| `diseño-vigente` | spec de diseño aprobada |
| `fuente-primaria` | entrevista: requerimiento dicho por quien es dueño del proceso |
| `referencia` | material de referencia |
| `leccion` | postmortem: lección aprendida de un error |
| `personal` | nota personal de cierre de sesión |
| `historica` | bitácora histórica: la decisión pudo cambiar después |
| `historico-tecnico` | plan o reporte técnico ya ejecutado |
| `sin-clasificar` | en Inbox: sin revisar ni clasificar |

## 2. Hubs, plantillas y Obsidian

### 2.1 Hubs (`templates/vault/Hubs/`)

Regla sin excepciones: **cada carpeta del vault es una carpeta más una nota-hub en `Hubs/`** que
la encabeza. Se instalan con `VAULT_MODE=create`; con `import`/`connect` solo se añaden los que
falten, nunca se pisa uno existente.

- **`Bienvenida.md`** — puerta de entrada y, a propósito, la única nota que puede no tener enlaces
  entrantes. Explica: la regla "una carpeta = un hub"; las tres familias de hubs (**negocio**: uno
  por proyecto; **carpeta**: uno por género; **raíz**: `Pendientes`); la regla de oro "lo generado
  se queda en su herramienta; lo narrado va al vault"; cómo se consulta (`rag_query`, `rag_leer`) y
  la regla de conflicto; el ritual de cierre (remite a la skill `rituales`). Texto genérico, sin
  referencias a ningún negocio.
- **Un hub por carpeta** (14): `Inbox`, `Bitacoras`, `Decisiones`, `Conocimiento`, `Aprendizaje`,
  `Entrevistas`, `Revisiones`, `Codigo`, `Procesos`, `Formales`, `Superpowers-Specs`,
  `Superpowers-Planes`, `Superpowers-Tareas`, `Superpowers-Sesiones`. Estructura fija:
  frontmatter (`tags`, `titulo`, `actualizado`) → qué contiene → cuándo nace una nota aquí → qué
  NO va aquí → lista de notas como wikilinks. Regla escrita en cada uno: **el conteo se mide, no se
  escribe** — nunca "hay 47 notas" en prosa; el setup de trabajo llegó a decir "las 3 existentes"
  con 47 en la carpeta.
- **`Pendientes.md`** — el índice único de lo que está abierto. Dos secciones: `## Abierto`
  (ordenado por qué desbloquea antes; cada ítem con fecha de origen) y `## Cerrado recientemente`.
  Lo actualiza `fin-ciclo` (sub-proyecto 5).
- **`_proyecto.md`** — plantilla del hub por proyecto (`{{PROYECTO}}`, `{{DESCRIPCION}}`,
  `{{FECHA}}`, `{{RUTA}}`); la instancia `init-proyecto` (sub-proyecto 4). Empieza por `_` y el
  ingest la ignora.

### 2.2 Plantillas (`Plantillas/`)

Excluida del índice. Registrada como carpeta de plantillas en `.obsidian/templates.json`.

- `nota.md` — frontmatter de 1.2 (reemplaza a `_plantilla.md`).
- `bitacora.md` — objetivos del día (máx. 3) / actividades (hora, actividad, resultado) /
  decisiones con justificación y alternativas descartadas / hallazgos y riesgos / bloqueos /
  evidencias / próximo paso. Sin campos del negocio original (`dia_practica`, Trello).
- `sesion.md` — qué se hizo de verdad, desvíos y errores, wikilinks a su spec, su plan y los nodos
  de `Codigo/` que tocó, qué sigue.
- `hub.md` — para carpetas nuevas que cree el usuario, con la estructura fija de 2.1.

### 2.3 Obsidian (`.obsidian/graph.json`)

Grupos de color por `path:` (carpeta), no por tag. Paleta reutilizada de la taxonomía anterior:

| Color | Carpetas |
|---|---|
| `#C9A227` dorado | `Hubs/`, `Decisiones/` |
| `#4A90D9` azul | `Codigo/` |
| `#5CB85C` verde | `Superpowers/` |
| `#9B59B6` morado | `Procesos/`, `Conocimiento/`, `Formales/` |
| `#E8912D` naranja | `Entrevistas/`, `Revisiones/` |
| `#E05C6E` rojo suave | `Bitacoras/`, `Superpowers/Sesiones/` |
| `#17A2B8` turquesa | `Aprendizaje/` |
| `#8A8A8A` gris | `00-Inbox/` |

## 3. RAG

### 3.1 Schema (`templates/rag/schema.sql`)

Idempotente. Sobre una base existente con el schema anterior: `ALTER TABLE chunks ADD COLUMN IF
NOT EXISTS …` para las columnas nuevas, `DROP COLUMN IF EXISTS categoria`, y creación de
`documentos`. Como cambian las carpetas, tras migrar se exige `rag.mjs reindex` — `status` lo
avisa mientras `documentos` esté vacía y `chunks` no.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Una fila por nota: metadatos y estado de vigencia.
CREATE TABLE IF NOT EXISTS documentos (
  source          TEXT PRIMARY KEY,      -- ruta relativa al vault, separador /
  titulo          TEXT,
  coleccion       TEXT NOT NULL,
  autoridad       TEXT NOT NULL,
  proyecto        TEXT,
  tags            TEXT[],
  fecha           DATE,
  content_hash    TEXT NOT NULL,         -- SHA-256 del archivo completo
  fuentes         TEXT[],                -- globs declarados en el frontmatter
  firma_origen    TEXT,                  -- hash conjunto de las fuentes cuando la nota se escribió/cambió
  estado          TEXT NOT NULL DEFAULT 'vigente',  -- vigente | caduca | reemplazada | revisar
  reemplazada_por TEXT,
  revisar         DATE,
  actualizado     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trozos embebidos; coleccion/autoridad/proyecto desnormalizados para no hacer join en la consulta caliente.
CREATE TABLE IF NOT EXISTS chunks (
  id           BIGSERIAL PRIMARY KEY,
  source       TEXT NOT NULL,
  coleccion    TEXT NOT NULL,
  autoridad    TEXT NOT NULL,
  proyecto     TEXT,
  heading      TEXT,
  orden        INT NOT NULL,
  content      TEXT NOT NULL,
  embedding    vector(1024) NOT NULL
);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS chunks_source_idx    ON chunks(source);
CREATE INDEX IF NOT EXISTS chunks_coleccion_idx ON chunks(coleccion);
CREATE INDEX IF NOT EXISTS chunks_proyecto_idx  ON chunks(proyecto);
```

Migración desde el schema anterior (bloque `DO $$ … $$` idempotente): `DROP COLUMN IF EXISTS
categoria`, `DROP COLUMN IF EXISTS content_hash`, `DROP COLUMN IF EXISTS mtime`, `DROP INDEX IF
EXISTS chunks_source_hash`, `ADD COLUMN IF NOT EXISTS autoridad TEXT NOT NULL DEFAULT
'referencia'`, `ADD COLUMN IF NOT EXISTS orden INT NOT NULL DEFAULT 0`.

### 3.2 Ingest (`rag.mjs ingest [--backend …] [--silencioso]`)

1. Recorre el vault. Solo `.md`. Excluye `Plantillas/`, `.obsidian/`, `.trash/`, cualquier
   entrada que empiece por `.` o `_`, y `node_modules/`. **Se retira `flattenGraph` y la ingesta
   de `graph.json`, `knowledge-graph.json` y `domain-graph.json`.**
2. Por archivo: `content_hash = sha256(bytes)`. Si `documentos` tiene la misma `(source,
   content_hash)` → **sin cambios**: no se embebe, no se toca `chunks`; solo se reevalúa la
   vigencia (3.4), que es barata.
3. Si cambió o es nuevo: parsea frontmatter (`proyecto`, `tags`, `fecha`, `fuentes`, `reemplaza`,
   `revisar`); clasifica por carpeta (1.3); `titulo` = primer `# ` o nombre del archivo; `fecha` =
   frontmatter > `dd-mm-yyyy` en el nombre > `yyyy-mm-dd` en el nombre > mtime. Limpia wikilinks
   antes de embeber (`[[a|b]]`→`b`, `[[a]]`→`a`). Trocea (3.3). Embebe en lotes de 16 con el
   backend efectivo (`ollama`/`remote`/`kaggle` se conservan tal cual). En **una transacción por
   archivo**: `DELETE FROM chunks WHERE source=$1`, inserta chunks, `UPSERT documentos` con
   `firma_origen = firma_actual` (la nota cambió → se bendice contra sus fuentes de hoy).
4. Borra de `documentos` y `chunks` las rutas que ya no existen en disco.
5. Aplica `reemplaza:` (3.4) después de recorrer todo, para que el orden de archivos no importe.
6. Resumen: `indexados N | sin cambios M | fallidos F`, lista de fallidos con su error, lista de
   archivos en carpeta desconocida (`otros`), lista de `Codigo/*.md` sin `fuentes:`.
7. `--silencioso`: exit 0 siempre. Sin él: 1 si hubo fallidos o el RAG no respondió.

### 3.3 Troceado (`chunkMarkdown`)

Corta en encabezados `^#{1,3} ` (no `#{1,6}`: los niveles 4–6 son subdivisiones internas, no
unidades de sentido). Empaqueta bloques consecutivos hasta ~2400 caracteres (~600 tokens de
`bge-m3`); un bloque que solo exceda se parte con solape de 200. `heading` = último encabezado
visto. `orden` = posición del trozo en la nota.

### 3.4 Vigencia — detectar notas que ya no reflejan la realidad

Problema que resuelve: "la prosa se pudre, el grafo no". El setup de trabajo lo mitigó a mano
("releer contra graphify antes de escribir") y su wiki lo resolvió automáticamente con una firma
de origen. Aquí se generaliza al vault entero. Tres mecanismos, todos evaluados en cada ingest,
sin trabajo manual salvo declarar la fuente una vez.

**a) `fuentes:` + firma de origen** — para `Codigo/`, `Procesos/`, `Conocimiento/`, `Formales/`.

- El ingest resuelve cada glob de `fuentes` relativo a `RAG_ROOT` (`fs.globSync` de Node 22; si
  no está disponible, un matcher propio de `*`/`**`), ordena las rutas, hashea el contenido de cada
  archivo y calcula `firma_actual = sha256(ruta1:hash1\nruta2:hash2…)`. `RAG_ROOT` sale de `.env`
  si está definido; si no, es el directorio padre de `R.A.G/` (el mismo que contiene `V.A.U.L.T/`).
- **Si la nota cambió** (paso 3 del ingest) → `firma_origen = firma_actual`. La nota se bendice.
- **Si la nota no cambió** y `firma_actual ≠ firma_origen` → `estado = 'caduca'`. Sus fuentes se
  movieron y la prosa no. Si vuelve a coincidir (alguien revirtió el cambio) → `'vigente'`.
- Glob que no resuelve ningún archivo: aviso "fuente sin coincidencias"; la firma se calcula con las
  que sí existen; si ninguna existe → `'caduca'` (la fuente desapareció).
- Nota en `Codigo/` **sin** `fuentes:` → listada al final del ingest: "no se puede detectar si
  caducó". Empuja el hábito sin bloquear.
- Límite conocido: corregir una tilde en la nota la bendice contra fuentes que sí cambiaron.
  Aceptado — la alternativa (bendecir solo cuando cambia `actualizado:` en el frontmatter) exige
  disciplina manual, que es justo lo que falló.

**b) `reemplaza:`** — para `Decisiones/`, `Specs/`, `Conocimiento/`.

- Valor: lista de nombres de nota (sin extensión, como un wikilink) o rutas relativas al vault.
  Un nombre se resuelve por nombre de archivo en todo el vault; si coincide con más de una nota,
  aviso "ambiguo: usa la ruta" y sin efecto.
- La nota apuntada pasa a `estado = 'reemplazada'`, `reemplazada_por = <source de la nueva>`.
- **Sale de la búsqueda por defecto** (como `planes`). Si aparece por filtro explícito de
  `coleccion`, lleva el aviso. No se borra: es historia.
- Destino inexistente → aviso, sin efecto. Si la nota que reemplaza desaparece del disco, la
  reemplazada vuelve a `'vigente'` en el siguiente ingest.

**c) `revisar:`** — para lo que vence (créditos, políticas, contratos, decisiones provisionales).

- Fecha ISO. Pasada la fecha → `estado = 'revisar'`. Se muestra con aviso; **no** se excluye.
- Precedencia si coinciden varios estados: `reemplazada` > `caduca` > `revisar` > `vigente`.

**Avisos en la consulta** (una línea al inicio del resultado, antes del aviso de autoridad):

    ⚠ CADUCA — sus fuentes cambiaron desde que se escribió; verifica contra el código/grafo antes de confiar.
    ⚠ REVISAR — venció el 2026-10-08.
    ⚠ REEMPLAZADA por [[X]].

### 3.5 Consulta (`rag.mjs query "<texto>" [--coleccion C] [--proyecto P] [--topk N] [--json]`)

```sql
SELECT c.source, d.titulo, c.coleccion, c.autoridad, c.proyecto, d.fecha, d.estado,
       d.reemplazada_por, d.revisar, c.heading, c.content,
       1 - (c.embedding <=> $1) AS score
FROM chunks c JOIN documentos d USING (source)
WHERE ( ($2::text IS NULL AND c.coleccion NOT IN ('planes','proceso','inbox') AND d.estado <> 'reemplazada')
        OR c.coleccion = $2 )
  [AND c.proyecto = $3]
ORDER BY (c.embedding <=> $1) - CASE WHEN c.coleccion IN ('decisiones','hubs') THEN 0.05 ELSE 0 END
LIMIT $k
```

El boost de 0.05 a `decisiones`/`hubs` es la regla de autoridad en el ranking (valor del setup de
trabajo; se sube si un caso real lo pide). `--categoria` desaparece. Salida por chunk:

    [decisiones · vigente · 2026-07-12] Decisiones/Bitrix-vs-GCP.md — Bitrix vs GCP
    (decisión o estado vigente)
    <contenido>

Con `--json`, el array de filas tal cual (lo consume el MCP).

### 3.6 Otros comandos

- `rag.mjs init` — aplica `schema.sql` (con la migración).
- `rag.mjs reindex [--backend …]` — `TRUNCATE chunks, documentos` + ingest completo.
- `rag.mjs status` — conectividad BD/Ollama; chunks y documentos por `coleccion` y por
  `proyecto`; conteo por `estado`; aviso "schema migrado: ejecuta `reindex`" si aplica.
- **`rag.mjs salud`** — informe de salud del vault, sin BD salvo para leer `estado`. Exit 0
  siempre. Lista:
  - huérfanas: notas en carpetas indexadas sin ningún wikilink entrante desde `Hubs/*.md`;
  - enlaces rotos: wikilinks en `Hubs/*.md` que no resuelven a ninguna nota;
  - caducas, a revisar, reemplazadas (desde `documentos`), y reemplazadas que siguen enlazadas
    desde un hub;
  - `Codigo/*.md` sin `fuentes:`.
  Lo consumen `session-start.mjs` (una línea), el recordatorio JIT al editar el vault
  (sub-proyecto 2) y `fin-ciclo` (sub-proyecto 5), que además cruza `fuentes` con `git diff
  --name-only` desde el último cierre para listar exactamente qué notas de `Codigo/` dejó
  caducas ese ciclo.

### 3.7 MCP (`templates/rag/mcp-server.mjs`)

Sigue siendo un wrapper stdio sobre `rag.mjs` sin acceso directo a la BD. Tres tools:

- **`rag_query(query, coleccion?, proyecto?, topk?)`** — la descripción lleva la lista de
  colecciones, cuáles quedan fuera por defecto y por qué, la regla de conflicto, y qué significa
  cada aviso de vigencia. `categoria` desaparece.
- **`rag_leer(ruta)`** — nuevo. Devuelve el documento completo por la ruta que devuelve
  `rag_query`. Confinado al vault: `path.resolve(VAULT, ruta)` debe empezar por `VAULT` resuelto;
  si no, "ruta inválida". Tope 80 000 caracteres. Antes de esto había que hacer `Read` con ruta
  absoluta, que el modelo no conoce.
- **`rag_status()`** — la salida de `status`.

### 3.8 SessionStart (`hooks/session-start.mjs`)

Antes de consultar el RAG para el proyecto detectado:

1. Corre `node rag.mjs ingest --silencioso` con tope de **60 s** (el setup de trabajo usa 90 s;
   como el ingest es atómico por archivo, un corte deja el índice consistente). Si la BD u Ollama no
   responden en 3 s, salta sin ruido.
2. Corre `rag.mjs salud` (barato, sin embeddings).
3. Añade al contexto dos líneas: `rag: indexados 3 | sin cambios 212` (o `reindex parcial — corre
   rag.mjs ingest` si cortó) y `salud: 3 caducas · 1 a revisar · 2 huérfanas` (omitida si todo
   está en cero).

Registro en `settings.json`: `SessionStart` con `matcher: "startup"` y `timeout: 90`.
`bin/lib/claude-config.sh::ac_merge_hook` gana un parámetro opcional de `timeout` y respeta el
`matcher`. El resto del hook (resumen de grafo, consulta al RAG) no cambia.

## 4. Cambios colaterales mínimos fuera del RAG

Solo lo necesario para no dejar rutas rotas entre este spec y los siguientes:

- `templates/rules/CLAUDEMAX.md`, regla 7: "Toda nota nueva en el vault nace de
  `Plantillas/nota.md`; la colección la da la carpeta, no el frontmatter; toda nota queda enlazada
  desde su hub en `Hubs/`; si describe código, lleva `fuentes:`; si sustituye una decisión, lleva
  `reemplaza:`." El resto de reglas se reescribe en el sub-proyecto 4.
- `README.md`: sección "Taxonomía" reemplazada por las tablas de 1.1 y 1.3 más un párrafo de
  vigencia (3.4); fila `rag` de la tabla de componentes actualizada (sin ingesta de grafos, con
  `rag_leer` y `salud`).
- `templates/rag/ritual.mjs`: solo rutas y frontmatter para que no rompa — `fin-sesion` escribe en
  `Superpowers/Sesiones/`, `fin-dia` en `Bitacoras/`, `init-proyecto` crea el hub del proyecto en
  `Hubs/` en vez de `Proyectos/<nombre>/00-indice.md`; ninguno escribe `categoria`. El rediseño de
  rituales es el sub-proyecto 5.
- `skills/rituales/SKILL.md`: rutas actualizadas.
- `bin/components/rag.sh`: instala `templates/vault/` nuevo; con `VAULT_MODE=import|connect` copia
  `Hubs/*` y `Plantillas/*` solo si faltan.

## 5. Errores

Regla: nada de esto tumba una sesión ni un ingest completo.

| Situación | Comportamiento |
|---|---|
| Docker/Ollama no responden | `ingest`: una línea "rag no disponible: arranca Docker Desktop y Ollama", exit 0 con `--silencioso`, 1 sin él. `query`/MCP: el mismo texto como resultado, no excepción. Timeout de conexión 3 s. |
| Un archivo falla (frontmatter roto, encoding, embed HTTP 500) | Se salta y se lista en "fallidos"; el resto sigue. Transacción por archivo: nunca chunks parciales. |
| Frontmatter YAML inválido | Se trata como sin frontmatter, con aviso. La nota se indexa. |
| `fuentes:` con glob sin coincidencias | Aviso; firma con las que existen; si ninguna → `caduca`. |
| `reemplaza:` a nota inexistente | Aviso; sin efecto. |
| Carpeta desconocida | `coleccion = otros`, listada al final. |
| `rag_leer` con ruta fuera del vault o `..` | "ruta inválida". |
| Ingest cortado por el timeout del hook | Índice consistente por atomicidad; la línea de contexto dice "reindex parcial — corre `rag.mjs ingest`". |
| BD con schema anterior (`categoria`) | `init` migra; `status` avisa "schema migrado: ejecuta `reindex`" mientras `documentos` esté vacía y `chunks` no. |

## 6. Pruebas (`templates/rag/test/`, `node --test`)

**Unitarias — sin BD ni Ollama:**

- `clasificar(ruta)`: la tabla completa de 1.3, prefijo más específico, carpeta desconocida →
  `otros`, `Plantillas/` y `_x.md` excluidas.
- `parseFrontmatter`: `proyecto`, `tags`, `fuentes` (lista), `reemplaza` (lista y escalar),
  `revisar` (fecha), YAML roto → sin frontmatter + aviso.
- `extraerFecha`: frontmatter > `dd-mm-yyyy` > `yyyy-mm-dd` > mtime.
- `limpiarWikilinks`; `chunkMarkdown` (corte en `#`–`###` y no en `####`, empaquetado 2400,
  solape 200, `heading` y `orden` correctos).
- `firmaDe(fuentes, root)` sobre un fixture: cambia si cambia un archivo; igual si no; estable ante
  orden de globs; glob sin coincidencias.
- `salud()` sobre un vault fixture: huérfana detectada, enlace roto detectado, `Codigo/` sin
  `fuentes` listado, hub enlazando una reemplazada listado.

**Integración — se saltan solas si `PG_URL` u Ollama no responden:**

- `init` sobre BD vacía → schema; `init` sobre BD con `categoria` → migrada y `status` pide
  `reindex`.
- `ingest` fixture → `status` cuadra por colección; segundo `ingest` → todo "sin cambios" y cero
  llamadas a embed (se cuenta con un mock del endpoint).
- `query` sin filtro → ningún resultado de `planes`/`proceso`/`inbox`/`reemplazada`; con
  `--coleccion planes` → sí.
- Boost: dos notas de texto casi idéntico en `Decisiones/` y `Bitacoras/` → la decisión primero.
- Vigencia (a): nota con `fuentes` → editar la fuente → `ingest` → `estado = caduca` y aviso en
  `query`; editar la nota → `ingest` → `vigente`.
- Vigencia (b): `reemplaza` → la vieja desaparece del default y aparece con aviso por filtro;
  borrar la nueva → la vieja vuelve a `vigente`.
- Vigencia (c): `revisar` en el pasado → `estado = revisar` y aviso.
- Borrar un archivo → `ingest` → sus filas desaparecen de `chunks` y `documentos`.
- MCP: `rag_leer` con `..` → "ruta inválida"; `rag_leer` de una ruta válida → contenido.

**Instalador:** `bin/wizard/test-componentes.mjs` gana un caso para `rag` que verifica que el
vault creado tiene las 13 carpetas de primer nivel de 1.1 más las 4 de `Superpowers/`, los 17
archivos de `Hubs/` (`Bienvenida`, `Pendientes`, 14 hubs de carpeta, `_proyecto.md`), las 4
plantillas, y que `settings.json` tiene `session-start.mjs` bajo `SessionStart` con
`matcher: "startup"` y `timeout: 90`.

## 7. Fuera de alcance

Van en los sub-proyectos siguientes, en orden: motor de recordatorios justo a tiempo (2); MCP
`graphify` por proyecto y componente `codebase-memory` (3); reescritura de `CLAUDEMAX.md` e
`init-proyecto` → `<RAG_ROOT>/.claude/proyectos/` (4); rediseño de rituales y `Pendientes.md`
automático (5); wizard, uninstall y documentación completa (6). Este spec toca `ritual.mjs`, la
regla 7 y el README **solo** lo mínimo de la sección 4.
