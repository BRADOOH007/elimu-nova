import { prisma } from '@/lib/prisma'
import { generateEmbedding, vectorToString } from '@/lib/embeddings'

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100

export interface DocumentChunk {
  id: string
  content: string
  chunkIndex: number
  metadata: Record<string, any>
  similarity?: number
}

export function chunkText(text: string, metadata: Record<string, any> = {}): Array<{ content: string; metadata: Record<string, any> }> {
  const chunks: Array<{ content: string; metadata: Record<string, any> }> = []

  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  let current = ''
  let index = 0

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if ((current + '\n\n' + trimmed).length < CHUNK_SIZE) {
      current = current ? current + '\n\n' + trimmed : trimmed
    } else {
      if (current.trim()) {
        chunks.push({ content: current.trim(), metadata: { ...metadata, chunkIndex: index++ } })
      }
      current = trimmed
      if (current.length > CHUNK_SIZE) {
        while (current.length > 0) {
          const slice = current.slice(0, CHUNK_SIZE)
          chunks.push({ content: slice.trim(), metadata: { ...metadata, chunkIndex: index++ } })
          current = current.slice(CHUNK_SIZE - CHUNK_OVERLAP)
        }
        current = ''
      }
    }
  }

  if (current.trim()) {
    chunks.push({ content: current.trim(), metadata: { ...metadata, chunkIndex: index++ } })
  }

  return chunks
}

export async function ingestDocument(
  documentId: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<number> {
  const chunks = chunkText(content, { documentId, ...metadata })

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content)
      await prisma.$executeRawUnsafe(
        `INSERT INTO document_chunks (document_id, chunk_index, content, embedding, metadata, token_count)
         VALUES ($1, $2, $3, $4::vector, $5::jsonb, $6)
         ON CONFLICT (id) DO NOTHING`,
        documentId,
        chunk.metadata.chunkIndex,
        chunk.content,
        vectorToString(embedding),
        JSON.stringify(chunk.metadata),
        Math.ceil(chunk.content.length / 4),
      )
    } catch (e) {
      console.warn(`[RAG] Failed to embed chunk ${chunk.metadata.chunkIndex} for document ${documentId}:`, e)
    }
  }

  return chunks.length
}

export async function searchSimilarChunks(
  query: string,
  options: {
    grade?: string
    subject?: string
    documentType?: string
    limit?: number
  } = {}
): Promise<DocumentChunk[]> {
  const { grade, subject, documentType, limit = 5 } = options
  const embedding = await generateEmbedding(query)

  let whereClause = ''
  const params: any[] = [vectorToString(embedding), limit]

  if (grade || subject || documentType) {
    const conditions: string[] = []

    if (grade) {
      conditions.push(`dl.grade = $${params.length + 1}`)
      params.push(grade)
    }
    if (subject) {
      conditions.push(`dl.subject = $${params.length + 1}`)
      params.push(subject)
    }
    if (documentType) {
      conditions.push(`dl.document_type = $${params.length + 1}`)
      params.push(documentType)
    }

    whereClause = 'WHERE ' + conditions.join(' AND ')
  }

  const sql = `
    SELECT
      dc.id, dc.content, dc.chunk_index, dc.metadata,
      1 - (dc.embedding <=> $1::vector) AS similarity
    FROM document_chunks dc
    JOIN document_library dl ON dc.document_id = dl.id
    ${whereClause}
    ORDER BY dc.embedding <=> $1::vector
    LIMIT $2
  `

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params)

    return (rows || []).map((row: any, i: number) => ({
      id: row.id,
      content: row.content,
      chunkIndex: row.chunk_index,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
      similarity: row.similarity,
    }))
  } catch (e) {
    console.warn('[RAG] Vector search not available — pgvector may not be enabled:', e)
    return []
  }
}

export async function retrieveRelevantContext(
  query: string,
  grade: string,
  subject: string,
  documentType: 'scheme_of_work' | 'lesson_plan',
  maxChunks: number = 5
): Promise<string> {
  const chunks = await searchSimilarChunks(query, {
    grade,
    subject,
    documentType,
    limit: Math.min(maxChunks, 2),
  })

  if (chunks.length === 0) return ''

  const lines: string[] = []
  lines.push('## RETRIEVED REFERENCE DOCUMENTS')
  lines.push('These are real teacher documents that closely match your generation. Follow their structure, terminology, formatting, and instructional style.')
  lines.push('')

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const sim = chunk.similarity ? Math.round(chunk.similarity * 100) : 0
    lines.push(`### Reference ${i + 1} (${sim}% match)`)
    lines.push('```')
    lines.push(chunk.content.slice(0, 1000))
    lines.push('```')
    lines.push('')
  }

  return lines.join('\n')
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `DELETE FROM document_chunks WHERE document_id = $1`,
    documentId,
  )
}

export async function getDocumentChunkCount(): Promise<number> {
  try {
    const result = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS count FROM document_chunks`)
    return result?.[0]?.count || 0
  } catch {
    return 0
  }
}
