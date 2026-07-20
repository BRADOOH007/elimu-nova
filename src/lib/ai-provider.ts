/**
 * ElimuNova AI Provider — shared across EduGenius and TutorBot.
 *
 * Waterfall (tested live — Groq first, then fallbacks):
 *   1. Groq          — llama-3.3-70b-versatile (free, ultra-fast)  ⭐
 *   2. Cerebras      — gpt-oss-120b      (2,000 tok/sec — FASTEST)
 *   3. DeepSeek      — deepseek-chat     (best quality)
 *   3b. DeepSeek-R1  — deepseek-reasoner (for reasoning tasks)
 *   4. Gemini Flash  — gemini-2.0-flash  (free quota)
 *   5. OpenRouter    — gpt-4o-mini       (paid fallback)
 *   6. OpenAI direct — gpt-4o-mini       (last resort)
 *
 * Keys are read from process.env first, then fall back to the
 * system_settings DB table (configured via super-admin AI config page).
 */

import Cerebras from '@cerebras/cerebras_cloud_sdk'
import { prisma } from './prisma'

const DB_KEY_MAP: Record<string, string> = {
  CEREBRAS_API_KEY:   'ai_provider_cerebras_key',
  DEEPSEEK_API_KEY:   'ai_provider_deepseek_key',
  GEMINI_API_KEY:     'ai_provider_gemini_key',
  GROQ_API_KEY:       'ai_provider_groq_key',
  OPENROUTER_API_KEY: 'ai_provider_openrouter_key',
  OPENAI_API_KEY:     'ai_provider_openai_key',
}

let dbKeysCache: Record<string, string> | null = null
let dbKeysCacheTime = 0

async function getKey(envVar: string): Promise<string | undefined> {
  if (process.env[envVar]) return process.env[envVar]
  const dbKey = DB_KEY_MAP[envVar]
  if (!dbKey) return undefined
  if (dbKeysCache && Date.now() - dbKeysCacheTime < 60_000) return dbKeysCache[dbKey]
  try {
    const settings = await (prisma as any).systemSettings.findMany({
      where: { key: { in: Object.values(DB_KEY_MAP) } },
    })
    dbKeysCache = {}
    for (const s of settings) dbKeysCache[s.key] = s.value
    dbKeysCacheTime = Date.now()
    return dbKeysCache[dbKey]
  } catch { return undefined }
}

export type AIProvider = 'cerebras' | 'deepseek' | 'gemini' | 'groq' | 'openrouter' | 'openai'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICallOptions {
  messages:         AIMessage[]
  maxTokens?:       number
  temperature?:     number
  useReasoner?:     boolean
  cerebrasModel?:   string
  deepseekModel?:   string
  geminiModel?:     string
  groqModel?:       string
  openrouterModel?: string
  openaiModel?:     string
  taskType?:        string
}

export interface AICallResult {
  content:     string
  provider:    AIProvider
  model:       string
  tokensUsed?: number
  latencyMs?:  number
}

const DEEPSEEK_URL   = 'https://api.deepseek.com/chat/completions'
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const GROQ_URL       = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENAI_URL     = 'https://api.openai.com/v1/chat/completions'

async function callHTTP(
  url: string, apiKey: string, model: string,
  messages: AIMessage[], maxTokens = 2000, temperature = 0.7,
): Promise<{ content: string; tokensUsed?: number }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://elimunova.app',
      'X-Title': 'ElimuNova AI',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`${url} ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json()
  return {
    content: data?.choices?.[0]?.message?.content || '',
    tokensUsed: data?.usage?.total_tokens,
  }
}

export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const {
    messages,
    maxTokens       = 2000,
    temperature     = 0.7,
    useReasoner     = false,
    cerebrasModel   = process.env.CEREBRAS_MODEL   || 'gemma-4-31b',
    deepseekModel   = useReasoner ? 'deepseek-reasoner' : (process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
    geminiModel     = process.env.GEMINI_MODEL     || 'gemini-2.0-flash',
    groqModel       = process.env.GROQ_MODEL       || 'llama-3.3-70b-versatile',
    openrouterModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    openaiModel     = process.env.OPENAI_MODEL     || 'gpt-4o-mini',
  } = opts

  const [CEREBRAS_KEY, DEEPSEEK_KEY, GEMINI_KEY, GROQ_KEY, OPENROUTER_KEY, OPENAI_KEY] = await Promise.all([
    getKey('CEREBRAS_API_KEY'),
    getKey('DEEPSEEK_API_KEY'),
    getKey('GEMINI_API_KEY'),
    getKey('GROQ_API_KEY'),
    getKey('OPENROUTER_API_KEY'),
    getKey('OPENAI_API_KEY'),
  ])

  if (!CEREBRAS_KEY && !DEEPSEEK_KEY && !GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY && !OPENAI_KEY) {
    throw new Error('No AI keys configured. Add keys via super-admin AI config page or set env vars.')
  }

  const errors: string[] = []
  const start = Date.now()

  const hasNonTextContent = messages.some(m => typeof m.content !== 'string')
  if (hasNonTextContent) {
    console.warn('[AI] Some messages have non-text content — may fail on non-vision models')
  }

  // 1. Groq — free, ultra-fast (first priority)
  if (GROQ_KEY && !useReasoner) {
    try {
      const { content, tokensUsed } = await callHTTP(GROQ_URL, GROQ_KEY, groqModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'groq', model: groqModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] Groq rejected image input — skipping')
      else { errors.push(`Groq: ${e.message}`); console.warn('[AI] Groq:', e.message) }
    }
  }

  // 2. Cerebras — fastest (skip for reasoning tasks)
  if (CEREBRAS_KEY && !useReasoner) {
    try {
      const client = new Cerebras({ apiKey: CEREBRAS_KEY })
      const res = await (client.chat.completions.create as any)({
        model: cerebrasModel,
        messages: messages as any,
        max_completion_tokens: maxTokens,
        temperature,
        top_p: 1,
        stream: false,
      })
      const content = (res as any).choices?.[0]?.message?.content || ''
      if (content) return { content, provider: 'cerebras', model: cerebrasModel, tokensUsed: (res as any).usage?.total_tokens, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] Cerebras rejected image input — skipping')
      else { errors.push(`Cerebras: ${e.message}`); console.warn('[AI] Cerebras:', e.message) }
    }
  }

  // 3. DeepSeek — best quality (V3 for chat, R1 for reasoning)
  if (DEEPSEEK_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(DEEPSEEK_URL, DEEPSEEK_KEY, deepseekModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'deepseek', model: deepseekModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] DeepSeek rejected image input — skipping')
      else { errors.push(`DeepSeek: ${e.message}`); console.warn('[AI] DeepSeek:', e.message) }
    }
  }

  // 4. Gemini Flash — free quota
  if (GEMINI_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(GEMINI_URL, GEMINI_KEY, geminiModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'gemini', model: geminiModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] Gemini rejected image input — skipping')
      else { errors.push(`Gemini: ${e.message}`); console.warn('[AI] Gemini:', e.message) }
    }
  }

  // 5. OpenRouter (or direct OpenAI via same key)
  // Also try OPENAI_KEY if it starts with 'sk-or-' (OpenRouter key stored in OPENAI_API_KEY)
  const effectiveORKey = OPENROUTER_KEY || (OPENAI_KEY?.startsWith('sk-or-') ? OPENAI_KEY : undefined)
  if (effectiveORKey) {
    const isOR  = effectiveORKey.startsWith('sk-or-')
    const url   = isOR ? OPENROUTER_URL : OPENAI_URL
    const model = isOR ? openrouterModel : openaiModel
    try {
      const { content, tokensUsed } = await callHTTP(url, effectiveORKey, model, messages, maxTokens, temperature)
      if (content) return { content, provider: isOR ? 'openrouter' : 'openai', model, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] OpenRouter/OpenAI rejected image input — skipping')
      else { errors.push(`OpenRouter: ${e.message}`); console.warn('[AI] OpenRouter:', e.message) }
    }
  }

  // 6. OpenAI direct (only if a different, non-OpenRouter key remains)
  if (OPENAI_KEY && !OPENAI_KEY.startsWith('sk-or-') && OPENAI_KEY !== OPENROUTER_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(OPENAI_URL, OPENAI_KEY, openaiModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'openai', model: openaiModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] OpenAI rejected image input — skipping')
      else { errors.push(`OpenAI: ${e.message}`) }
    }
  }

  if (errors.length === 0) {
    throw new Error('All AI providers skipped — likely a non-text image input that no provider accepts')
  }
  throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

export async function getAIResponse(
  systemPrompt: string,
  userMessage: string,
  opts?: Partial<AICallOptions>,
): Promise<string> {
  const result = await callAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  },
    ],
    ...opts,
  })
  return result.content
}

export async function getAIReasoning(
  systemPrompt: string,
  userMessage: string,
  opts?: Partial<AICallOptions>,
): Promise<string> {
  return getAIResponse(systemPrompt, userMessage, { ...opts, useReasoner: true })
}
