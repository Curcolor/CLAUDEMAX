CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS chunks (
  id           BIGSERIAL PRIMARY KEY,
  source       TEXT NOT NULL,
  proyecto     TEXT,
  heading      TEXT,
  content      TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  mtime        TIMESTAMPTZ,
  embedding    vector(1024)
);
CREATE UNIQUE INDEX IF NOT EXISTS chunks_source_hash ON chunks(source, content_hash);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks
  USING hnsw (embedding vector_cosine_ops);

-- Taxonomía (subproyecto F, Bloque 1): idempotente para bases ya creadas.
-- Migración: consolida la columna legada `project` (inglesa, de antes de la taxonomía) en
-- `proyecto` si una base existente todavía la tiene y no migró aún.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chunks' AND column_name='project')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chunks' AND column_name='proyecto') THEN
    ALTER TABLE chunks RENAME COLUMN project TO proyecto;
  END IF;
END $$;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS proyecto  TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS tags      TEXT[];
CREATE INDEX IF NOT EXISTS chunks_categoria_idx ON chunks(categoria);
CREATE INDEX IF NOT EXISTS chunks_proyecto_idx  ON chunks(proyecto);
