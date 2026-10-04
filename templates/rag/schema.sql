CREATE EXTENSION IF NOT EXISTS vector;

-- Una fila por nota: metadatos y estado de vigencia (spec §3.1 y §3.4).
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

-- Trozos embebidos; coleccion/autoridad/proyecto desnormalizados para la consulta caliente.
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

-- Migración idempotente desde el schema anterior (taxonomía de seis categorías). Se detecta
-- por la columna `categoria`; tras migrar hay que ejecutar `rag.mjs reindex` (status lo avisa
-- mientras `documentos` esté vacía y `chunks` no).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chunks' AND column_name = 'categoria') THEN
    ALTER TABLE chunks DROP COLUMN IF EXISTS categoria;
    ALTER TABLE chunks DROP COLUMN IF EXISTS project;
    ALTER TABLE chunks DROP COLUMN IF EXISTS content_hash;
    ALTER TABLE chunks DROP COLUMN IF EXISTS mtime;
    ALTER TABLE chunks DROP COLUMN IF EXISTS tags;
    DROP INDEX IF EXISTS chunks_source_hash;
    DROP INDEX IF EXISTS chunks_categoria_idx;
    ALTER TABLE chunks ADD COLUMN IF NOT EXISTS coleccion TEXT NOT NULL DEFAULT 'otros';
    ALTER TABLE chunks ADD COLUMN IF NOT EXISTS autoridad TEXT NOT NULL DEFAULT 'referencia';
    ALTER TABLE chunks ADD COLUMN IF NOT EXISTS orden INT NOT NULL DEFAULT 0;
    UPDATE chunks SET embedding = array_fill(0.0, ARRAY[1024])::vector WHERE embedding IS NULL;
    ALTER TABLE chunks ALTER COLUMN embedding SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS chunks_source_idx    ON chunks(source);
CREATE INDEX IF NOT EXISTS chunks_coleccion_idx ON chunks(coleccion);
CREATE INDEX IF NOT EXISTS chunks_proyecto_idx  ON chunks(proyecto);
