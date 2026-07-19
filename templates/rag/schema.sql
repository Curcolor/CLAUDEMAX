CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS chunks (
  id           BIGSERIAL PRIMARY KEY,
  source       TEXT NOT NULL,
  project      TEXT,
  heading      TEXT,
  content      TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  mtime        TIMESTAMPTZ,
  embedding    vector(1024)
);
CREATE UNIQUE INDEX IF NOT EXISTS chunks_source_hash ON chunks(source, content_hash);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks
  USING hnsw (embedding vector_cosine_ops);
