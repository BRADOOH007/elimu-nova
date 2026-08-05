const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const statements = [
  `CREATE EXTENSION IF NOT EXISTS vector`,
  `CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id TEXT NOT NULL REFERENCES document_library(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`,
  `CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON document_chunks(document_id)`,
]

async function main() {
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch (e) {
      if (e.message?.includes('already exists') || e.message?.includes('already enabled')) continue
      console.warn(`Statement failed: ${e.message.slice(0, 100)}`)
    }
  }
  console.log('pgvector migration complete')
  await prisma.$disconnect()
}
main()
