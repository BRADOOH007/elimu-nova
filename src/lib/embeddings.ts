import OpenAI from 'openai'
import { getKey } from './ai-provider'

let client: OpenAI | null = null
let clientKey = ''

async function getClient(): Promise<OpenAI> {
  const key = ((await getKey('OPENAI_API_KEY')) || '').trim()
  if (!key) throw new Error('OPENAI_API_KEY is required for embeddings (set via Super Admin → AI Config)')
  if (!client || clientKey !== key) {
    client = new OpenAI({ apiKey: key })
    clientKey = key
  }
  return client
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = await getClient()
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  })
  return res.data[0].embedding
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = await getClient()
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
