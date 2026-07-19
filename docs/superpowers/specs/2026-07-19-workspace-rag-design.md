# Workspace + RAG (Subproyecto B) — Especificación de Diseño

**Fecha:** 2026-07-19
**Padre:** [Diseño maestro de CLAUDEMAX](2026-07-19-claudemax-master-design.md)
**Estado:** Diseño aprobado

## Objetivo

Construir la capa de conocimiento de CLAUDEMAX: el esqueleto del vault de Obsidian V.A.U.L.T y el stack de recuperación R.A.G (PostgreSQL + PGVector vía Docker Compose, embeddings `bge-m3` de Ollama, CLI en Node + wrapper MCP delgado), instalable mediante un nuevo componente `rag` del instalador que soporta los modos crear / importar / conectar tanto para el vault como para la base de datos.

## Registro de decisiones

| Decisión | Elección |
|---|---|
| Despliegue del almacén vectorial | Docker Compose, imagen `pgvector/pgvector:pg17`, volumen persistente, puerto host 5433 (evita chocar con cualquier PG nativo en 5432) |
| Interfaz de consulta | Núcleo CLI (`rag.mjs`) + wrapper MCP stdio delgado (`mcp-server.mjs`) que expone las mismas funciones como herramientas dentro de la sesión |
| Modelo de embeddings | `bge-m3` vía API HTTP local de Ollama — multilingüe (vault en español + código en inglés), 1024 dimensiones |
| Lenguaje de implementación | Node ≥18. R.A.G/ lleva su propio `package.json` (deps: `pg`, `@modelcontextprotocol/sdk`) — excepción a la regla del repo de ir sin dependencias, justificada: el protocolo de cable de PG y MCP necesitan librerías reales |
| Modos de configuración | Tanto el vault como el RAG soportan crear-desde-cero / importar-existente / conectar-remoto, manejados por flags de componente ahora, por el wizard interactivo más adelante |

## Disposición de directorios (creada en la raíz elegida)

```
<root>/
├── V.A.U.L.T/
│   ├── .obsidian/graph.json    # color groups per project (committed template)
│   ├── 00-Inbox/
│   ├── Projects/               # one folder per project; tags #<project>/<subtopic>
│   └── Journal/                # daily logs (sub-project D writes here)
└── R.A.G/
    ├── docker-compose.yml
    ├── .env.example            # PG_URL, OLLAMA_URL, EMBED_MODEL=bge-m3
    ├── package.json
    ├── schema.sql
    ├── rag.mjs                 # CLI: init | ingest <path> | query "<text>" [--project P] [--json] [--topk N] | reindex | status
    └── mcp-server.mjs          # MCP stdio server: tools rag_query, rag_status
```

Las plantillas de todo lo anterior viven en este repo bajo `templates/rag/` y `templates/vault/`; el componente del instalador las copia a la raíz elegida.

## Esquema de base de datos

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS chunks (
  id          BIGSERIAL PRIMARY KEY,
  source      TEXT NOT NULL,          -- absolute file path
  project     TEXT,                   -- derived from Projects/<name>/ or #tag
  heading     TEXT,                   -- nearest markdown heading
  content     TEXT NOT NULL,
  content_hash TEXT NOT NULL,         -- sha1; skip re-embed when unchanged
  mtime       TIMESTAMPTZ,
  embedding   vector(1024)
);
CREATE UNIQUE INDEX IF NOT EXISTS chunks_source_hash ON chunks(source, content_hash);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks
  USING hnsw (embedding vector_cosine_ops);
```

## Comportamiento del pipeline

- **Ingesta:** recorre la ruta dada (por defecto: el vault) en busca de archivos `.md`; divide por encabezados markdown apuntando a ~500 tokens por chunk con ~50 tokens de solape; salta los chunks cuyo `(source, content_hash)` ya existe; embebe vía `POST {OLLAMA_URL}/api/embed` con el modelo `bge-m3`; hace upsert. Elimina las filas de la BD cuyo archivo fuente desapareció.
- **Consulta:** embebe la pregunta, `SELECT ... ORDER BY embedding <=> $1 LIMIT k` (coseno), con `WHERE project = $2` opcional. Salida en texto plano para hooks/humanos; `--json` para el wrapper MCP.
- **Reindex:** truncar + reingesta completa (esto es lo que llama el Context Dump Ritual del subproyecto D).
- **Status:** conteo de filas/chunks por proyecto, hora de la última ingesta, conectividad de la BD y de Ollama.

## Componente del instalador (`bin/components/rag.sh`, id `rag`)

Manejado por flags de entorno (el wizard los pondrá al frente más adelante):

- `RAG_ROOT` — carpeta raíz de destino (obligatoria; el componente se niega a adivinarla).
- `VAULT_MODE=create|import|connect` — create: copia `templates/vault/`; import: adopta una carpeta existente en `VAULT_SRC` (copia la config de forma no destructiva, nunca sobrescribe notas); connect: `git clone VAULT_REMOTE` dentro de `V.A.U.L.T/`.
- `RAG_MODE=create|import|connect` — create: copia `templates/rag/`, `docker compose up -d`, aplica `schema.sql`, `ollama pull bge-m3`, `npm install`; import: igual que create y luego restaura `RAG_DUMP` vía `psql < dump`; connect: copia las plantillas pero escribe `PG_URL` desde `RAG_REMOTE_URL` en `.env`, se salta Docker por completo.
- Registra el MCP: `claude mcp add -s user rag -- node <root>/R.A.G/mcp-server.mjs` (idempotente, mismo patrón que figma/magic).
- Añadido a `ALL_COMPONENTS` después de `dev-skills`; se salta con una advertencia cuando `RAG_ROOT` no está definida (así `--all` sigue funcionando de forma no interactiva).
- `uninstall.sh`: `docker compose down` (el volumen SE DEJA en su sitio — los datos sobreviven a la desinstalación), `claude mcp remove rag`; las carpetas del vault y de R.A.G nunca se eliminan.

## Wrapper MCP

`mcp-server.mjs` (stdio, `@modelcontextprotocol/sdk`): dos herramientas —
- `rag_query { query: string, project?: string, topk?: number }` → invoca `rag.mjs query --json`, devuelve los chunks encontrados con source/heading/score.
- `rag_status {}` → salida de `rag.mjs status`.
Sin acceso directo a la BD en el wrapper; la CLI es la única implementación.

## Convenciones del vault

- Solo notas (markdown). Una carpeta por proyecto bajo `Projects/`; tags anidados `#<project>/<subtopic>`.
- La plantilla `graph.json` distribuye grupos de color asociados a `path:Projects/<name>` con un slot de paleta documentado por proyecto y subcolores por tag; el usuario extiende por proyecto.
- Nomenclatura `Journal/YYYY-MM-DD.md` para los logs diarios.

## Verificación

1. `bash install.sh --only rag --config-dir /tmp/cm-test` con `RAG_ROOT=/tmp/cm-root VAULT_MODE=create RAG_MODE=create` → carpetas creadas, compose up, healthcheck en verde, esquema aplicado, bge-m3 descargado.
2. Sembrar 3 notas de prueba en español en el vault → `node rag.mjs ingest` → `status` muestra chunks > 0.
3. `node rag.mjs query "<pregunta en español>"` devuelve el chunk correcto.
4. La herramienta MCP `rag_query` responde dentro de una sesión de Claude Code.
5. `bash uninstall.sh --dry-run` muestra compose-down + mcp-remove, nunca la eliminación de una carpeta del vault/RAG.

## Fuera de alcance

- UI del wizard interactivo (sub-spec del instalador; este componente expone los flags que lo impulsarán).
- Ingesta no-markdown — parsers de MarkItDown / opendataloader-pdf / Whisper (subproyecto C; `rag.mjs ingest` acepta cualquier ruta con archivos `.md`, así que los parsers de C simplemente emiten markdown a un directorio de staging).
- Hook de SessionStart que consulta el RAG (subproyecto D).
