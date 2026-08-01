# Taxonomía, Backends de Embeddings y Skills Nuevas (Subproyecto F) — Especificación de Diseño

**Fecha:** 2026-08-01
**Padre:** [Diseño maestro CLAUDEMAX](2026-07-19-claudemax-master-design.md)
**Estado:** Diseño aprobado

## Objetivo

Cuatro bloques independientes que comparten una entrega:

1. **Taxonomía con color** para V.A.U.L.T y R.A.G: seis categorías, marcado por frontmatter + tags anidados, relación transversal por proyecto, y color propio por categoría en el grafo de Obsidian.
2. **Backend de embeddings conmutable** en el RAG: `ollama` (por defecto), `remote` (otra máquina de la red) y `kaggle` (lotes grandes en GPU gratuita).
3. **Skill `no-ai-slop`** como fork propio en formato Skills 2.0, en español.
4. **Auditoría de UI** — anti-patrones de Impeccable consolidados en `ui-ux-pro-max` más un hook propio determinístico post-edición.

## Registro de decisiones (de la investigación upstream 2026-08-01)

| Decisión | Elección | Motivo |
|---|---|---|
| `pbakaus/impeccable` (Apache-2.0, 53.7k⭐) | **No instalar entera.** Portar sus anti-patrones nuevos a `ui-ux-pro-max` + escribir hook propio inspirado en sus 59 reglas | Sus 23 comandos competirían con `ui-ux-pro-max` por el mismo prompt; su CLI Node escribe hooks por proveedor y no encaja en el modelo copiar-archivos del repo. Lo valioso es el *enforcement* determinístico, que sí podemos tener sin la dependencia |
| `garrytan/gstack` (MIT, 125.7k⭐) | **Descartado** | No es una skill: es un harness completo (23 herramientas, memoria en Supabase, Playwright, CI, telemetría, requiere Bun). Compite con el rol de CLAUDEMAX |
| `petergyang/no-ai-slop` (MIT, 3.7k⭐) | **Fork propio en Skills 2.0**, traducido | 2 archivos de texto sin dependencias; cubre slop de *prosa*, dominio ausente del catálogo. No solapa con la sección `taste` (slop *visual*) |
| `obra/superpowers` | Sin cambios | Ya lo clona `dev-skills.sh` desde el inicio |
| Kaggle | **Backend conmutable, solo para lotes** | Confirmado: `kaggle kernels push/status/output` automatiza el ciclo y `BAAI/bge-m3` corre en un T4 gratis con los mismos 1024 dims. Pero es batch asíncrono (minutos por lote), cuota ~30 h GPU/semana y verificación telefónica manual única. Nunca para consultas en vivo |
| Alternativa recomendada a Kaggle | Backend `remote` (`OLLAMA_URL` a otra máquina de la red) | Latencia de LAN, cero fricción operativa. Es la primera opción para quien tenga una GPU en casa |

## Bloque 1 — Taxonomía

### Las seis categorías

| Categoría | Color | Decimal (Obsidian) | Contenido |
|---|---|---|---|
| `codigo` | `#4A90D9` azul | 4886745 | Repos, arquitectura, snippets, grafos de Graphify |
| `proyectos` | `#5CB85C` verde | 6076508 | Planes, decisiones, sprints, specs |
| `organizacion` | `#9B59B6` morado | 10181046 | Empresa, marca, clientes, procesos |
| `investigacion` | `#E8912D` naranja | 15241517 | PDFs parseados, papers, transcripciones |
| `personal` | `#E05C6E` rojo suave | 14703726 | Journal diario, ideas del Inbox |
| `aprendizaje` | `#17A2B8` turquesa | 1548984 | Apuntes de tecnologías, tutoriales, skills |

Subcolores: cada tag anidado `#<categoria>/<subtema>` recibe una variante más clara del color base, añadida a `graph.json` por el usuario a medida que crea subtemas. La plantilla incluye un ejemplo por categoría.

### Marcado de notas

Frontmatter YAML obligatorio; los tags anidados son el complemento flexible:

```yaml
---
categoria: codigo          # una de las seis; obligatoria
proyecto: claudemax        # clave transversal: relaciona notas de distintas categorías
tags: [codigo/rag, codigo/pgvector]
fecha: 2026-08-01
fuente: informe.pdf        # opcional; lo rellenan los parsers
---
```

`proyecto` es lo que vincula documentos entre categorías: una nota `codigo` y una `organizacion` con `proyecto: acme` quedan relacionadas aunque vivan en carpetas distintas. Si falta `categoria`, el ingestor la infiere de la carpeta (`Codigo/` → `codigo`) y, si tampoco puede, la deja en `null` y avisa.

### Estructura del vault

```
V.A.U.L.T/
├── .obsidian/graph.json     # seis grupos de color + ejemplos de subcolor
├── 00-Inbox/                # capturas sin clasificar (los parsers escriben aquí)
├── Codigo/                  # una subcarpeta por repo
├── Proyectos/               # una subcarpeta por proyecto
├── Organizacion/            # una subcarpeta por empresa/cliente
├── Investigacion/
├── Aprendizaje/
├── Journal/                 # YYYY-MM-DD.md (ritual de fin de día, subproyecto D)
└── _plantilla.md            # nota vacía con el frontmatter listo para copiar
```

### Cambios en el RAG

`schema.sql` gana columnas y se hace idempotente para bases ya creadas:

```sql
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS proyecto  TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS tags      TEXT[];
CREATE INDEX IF NOT EXISTS chunks_categoria_idx ON chunks(categoria);
CREATE INDEX IF NOT EXISTS chunks_proyecto_idx  ON chunks(proyecto);
```

`rag.mjs`:
- Parsea el frontmatter antes de trocear; el bloque YAML no se emite como chunk pero sus valores se propagan a todos los chunks del archivo.
- `query` acepta `--categoria <c>` y `--proyecto <p>` (combinables); la salida muestra la categoría de cada resultado.
- `status` agrupa por categoría además de por proyecto.

MCP `rag_query` gana los parámetros `categoria` y `proyecto` con la lista de valores válidos en su `description`, para que el modelo pueda filtrar sin adivinar.

**Parsers:** al convertir un archivo escriben el frontmatter automáticamente (`categoria: investigacion`, `fuente: <archivo original>`, `fecha` de hoy). Se documenta en el README; no requiere código nuevo del instalador, solo el flujo documentado y la plantilla.

**Graphify:** el `.ua/knowledge-graph.json` de cada repo se indexa con `categoria: codigo` y `proyecto: <nombre del repo>`. Reparto de roles confirmado: el **JSON va al LLM** (comprensión rápida de la arquitectura sin abrir archivos) y la **página/dashboard es para el humano**. `rag.mjs ingest` acepta rutas `.json` de Graphify además de `.md`, aplanándolas a texto indexable (nodo: resumen, aristas: relaciones).

## Bloque 2 — Backend de embeddings conmutable

`.env` gana:

```bash
EMBED_BACKEND=ollama          # ollama | remote | kaggle
OLLAMA_URL=http://localhost:11434
# remote: misma variable apuntando a otra máquina
#   OLLAMA_URL=http://192.168.1.50:11434
# kaggle: solo para lotes grandes (reindex), nunca para consultas
KAGGLE_USERNAME=
KAGGLE_KEY=
KAGGLE_KERNEL_SLUG=          # <usuario>/claudemax-embed
```

Reglas duras:

- **Las consultas usan siempre un backend síncrono** (`ollama` o `remote`). Si `EMBED_BACKEND=kaggle` y se llama `query`, se cae automáticamente a Ollama local y se avisa una vez. Kaggle no puede responder en el bucle interactivo.
- `ingest` y `reindex` aceptan `--backend <b>` para forzar el backend de esa corrida.
- El backend `remote` es idéntico a `ollama`: solo cambia la URL. No requiere código nuevo más allá de la documentación y la validación de conectividad en `status`.

### Ruta Kaggle (batch)

Archivos nuevos en `templates/rag/kaggle/`:

- `kernel-metadata.json` — plantilla con `enable_gpu: true`, `enable_internet: true`, `kernel_type: script`, `dataset_sources` apuntando al dataset de chunks.
- `embed_kernel.py` — script que corre en Kaggle: lee `chunks.jsonl` del dataset, carga `BAAI/bge-m3` vía `FlagEmbedding` (`use_fp16=True`), calcula los vectores densos de 1024 dims y escribe `/kaggle/working/embeddings.parquet`.

Módulo nuevo `templates/rag/kaggle-embed.mjs` (para no engordar `rag.mjs`), con el ciclo:

1. Empaqueta los chunks pendientes en un único `staging/chunks.jsonl` (evita el límite práctico por archivo y la lentitud de miles de archivos sueltos).
2. `kaggle datasets version -p staging -m "lote N"` (la primera vez, `kaggle datasets create`).
3. `kaggle kernels push -p kaggle/`.
4. Poll con `kaggle kernels status` hasta `complete` (con timeout configurable y mensajes de progreso).
5. `kaggle kernels output -p out/`.
6. Carga el parquet y hace upsert en pgvector.

Si el CLI `kaggle` no está instalado o falta la credencial, el backend avisa con el comando exacto a ejecutar y **cae a Ollama** en vez de fallar.

**Instalador (`rag.sh`):** acepta `KAGGLE_USERNAME`/`KAGGLE_KEY` como variables de entorno; si están presentes, las escribe en `.env`, hace `pip install kaggle` y escribe `~/.kaggle/kaggle.json` con permisos restringidos. Si no están, no hace nada — Kaggle es estrictamente opcional. La documentación advierte del paso manual de verificación telefónica en la web de Kaggle, necesario una sola vez para habilitar GPU e Internet en los kernels.

## Bloque 3 — Skill `no-ai-slop`

`skills/no-ai-slop/` en formato Skills 2.0 completo, cuerpo en español y triggers bilingües:

- Lista de palabras prohibidas (delve, leverage, foster, robust, paradigm shift, …) con equivalentes en español (profundizar en, aprovechar, fomentar, robusto, cambio de paradigma).
- Los 14 patrones nombrados: contrastes binarios ("no es X, es Y"), throat-clearing, revelaciones con dos puntos, atribución evasiva, verbos falsamente contundentes, ritmo robótico, kickers falsamente profundos, abuso del em-dash, slop de formato.
- Flujo de 6 pasos con autoevaluación.
- `kind: knowledge`, sin scripts.

**Convivencia con `caveman`:** su `description` deja explícito que actúa sobre *prosa destinada a humanos* (documentación, README, artículos, mensajes), no sobre respuestas de sesión — donde manda `caveman`. Objetivos opuestos: `caveman` comprime al extremo, `no-ai-slop` preserva voz humana natural.

Se añade a `FIRST_PARTY_SKILLS` en `dev-skills.sh` y al loop de `uninstall.sh`; el validador pasa a `OK (5 skills)`.

## Bloque 4 — Auditoría de UI

### Consolidación en `ui-ux-pro-max`

Se añaden a la sección "Consolidado: taste" los anti-patrones de `craft-floor.md` que aún no están, con atribución a Impeccable (Apache-2.0):

- **Gradient text** como recurso decorativo por defecto.
- **Plantilla hero-metric** (tres métricas grandes bajo el hero, sin datos reales detrás).
- **Tarjetas del mismo tamaño como andamio**: rejilla de contenedores idénticos usada para evitar decidir jerarquía.
- **Hard-offset shadow** fuera de un contexto deliberadamente neobrutalista.
- **Monospace como disfraz de "técnico"** en contenido que no es código.
- **Claro/oscuro elegido por categoría de producto** en vez de por la escena de uso real.

### Hook determinístico `hooks/ui-audit.mjs`

Hook `PostToolUse` con matcher `Edit|Write`, registrado con el merger JSONC existente. Node sin dependencias, misma convención que el antiguo `dcp-lite-dedup.mjs`:

- Lee el evento por stdin; si el archivo editado no es de UI (`.css`, `.scss`, `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`), sale en silencio con código 0.
- Aplica ~15 reglas regex de bajo falso-positivo sobre el contenido escrito: gradient text (`background-clip:text` junto a `gradient`), glifos unicode como iconos en JSX, `box-shadow` de offset duro sin blur, `font-family` monospace en cuerpo de texto, glow neón (`box-shadow` con color saturado y blur alto), nombres/avatares de relleno (`John Doe`, `randomuser.me`, `unsplash.com/random`), abuso de em-dash, kicker/eyebrow en mayúsculas sobre un heading, tres tarjetas idénticas consecutivas.
- Emite una línea `<system-reminder>` por hallazgo, con el número de línea y la corrección sugerida. Nunca bloquea la edición.
- Variable de escape `CLAUDEMAX_UI_AUDIT=0` para desactivarlo sin desinstalar.
- `uninstall.sh` lo elimina con `ac_remove_hook` (misma lógica que se conserva para los hooks heredados).

El hook lo instala el componente `ui-ux` (junto a la skill), no un componente nuevo.

## Verificación

1. `node skills/validate-skills.mjs` → `OK (5 skills)`.
2. Taxonomía: vault de prueba con una nota por categoría → `rag.mjs ingest` → `status` muestra las seis; `query "..." --categoria codigo` filtra correctamente; dos notas de categorías distintas con el mismo `proyecto` se recuperan juntas al filtrar por proyecto.
3. Backends: `EMBED_BACKEND=ollama` funciona; con `EMBED_BACKEND=kaggle` una `query` avisa y cae a Ollama; `rag.mjs ingest --backend kaggle` sin credenciales avisa con el comando exacto y cae a Ollama sin fallar.
4. Hook de UI: escribir un archivo `.tsx` con gradient text y `John Doe` dispara dos `<system-reminder>`; un `.py` no dispara nada; con `CLAUDEMAX_UI_AUDIT=0` no dispara nada.
5. Dry-runs y `bash -n` de todo verdes; `uninstall.sh --dry-run` incluye la limpieza del hook y de la skill nueva.
6. Migración: aplicar `schema.sql` sobre una base ya existente no da error y añade las columnas.

## Fuera de alcance

- Instalar Impeccable como componente (descartado arriba) y gstack (descartado).
- Rituales que escriben el journal con su frontmatter de categoría → subproyecto D.
- Reglas operativas empaquetadas → subproyecto E.
