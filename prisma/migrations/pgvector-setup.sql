-- Enable pgvector extension for semantic search (Neon PostgreSQL)
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks table with embeddings for RAG retrieval
CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  document_id TEXT NOT NULL REFERENCES document_library(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER DEFAULT 0,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
  ON document_chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Index for document lookup
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON document_chunks(document_id);
