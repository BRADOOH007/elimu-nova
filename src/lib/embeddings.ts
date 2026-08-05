import OpenAI from 'openai'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const key = process.env.OPENAI_API_KEY || ''
    if (!key) throw new Error('OPENAI_API_KEY is required for embeddings')
    client = new OpenAI({ apiKey: key })
  }
  return client
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getClient()
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  })
  return res.data[0].embedding
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getClient()
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float',
  })
  return res.data.map(d => d.embedding)
}

export function vectorToString(vector: number[]): string {
  return `[${vector.join(',')}]`
}

export function stringToVector(str: string): number[] {
  return JSON.parse(str) as number[]
}
