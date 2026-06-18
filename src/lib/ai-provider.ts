/**
 * ElimuNova AI Provider — shared across EduGenius and TutorBot.
 *
 * Waterfall priority:
 *   1. Cerebras         — gpt-oss-120b, 2,000 tokens/sec, free tier (FASTEST)
 *   2. Gemini 2.5 Flash — free tier, 1,000 RPD, CBC curriculum-aware
 *   3. Groq llama       — free tier, ultra-fast open models
 *   4. OpenRouter       — sk-or-v1-... multi-model fallback
 *   5. OpenAI direct    — last resort
 *
 * All keys from environment variables — never hardcoded.
 * Model selection configurable by super admin via /api/super-admin/ai-config.
 */

import Cerebras from '@cerebras/cerebras_cloud_sdk'

export type AIProvider = 'cerebras' | 'gemini' | 'groq' | 'openrouter' | 'openai'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICallOptions {
  messages:          AIMessage[]
  maxTokens?:        number
  temperature?:      number
  cerebrasModel?:    string
  geminiModel?:      string
  groqModel?:        string
  openrouterModel?:  string
  openaiModel?:      string
  taskType?:         string
  schoolId?:         string
}

export interface AICallResult {
  content:     string
  provider:    AIProvider
  model:       string
  tokensUsed?: number
  latencyMs?:  number
}

/* ── URLs ── */
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const GROQ_URL       = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENAI_URL     = 'https://api.openai.com/v1/chat/completions'

/* ── Generic HTTP provider call ── */
async function callHTTP(
  url: string, apiKey: string, model: string,
  messages: AIMessage[], maxTokens = 2000, temperature = 0.7,
): Promise<{ content: string; tokensUsed?: number }> {
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://elimunova.app',
      'X-Title':       'ElimuNova AI',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`${url} → ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json()
  return {
    content:    data?.choices?.[0]?.message?.content || '',
    tokensUsed: data?.usage?.total_tokens,
  }
}

/**
 * Main AI call — tries each provider in waterfall order.
 */
export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const {
    messages,
    maxTokens        = 2000,
    temperature      = 0.7,
    cerebrasModel    = process.env.CEREBRAS_MODEL    || 'gpt-oss-120b',
    geminiModel      = process.env.GEMINI_MODEL      || 'gemini-2.5-flash',
    groqModel        = process.env.GROQ_MODEL        || 'llama-3.1-8b-instant',
    openrouterModel  = process.env.OPENROUTER_MODEL  || 'openai/gpt-4o-mini',
    openaiModel      = process.env.OPENAI_MODEL      || 'gpt-4o-mini',
  } = opts

  const CEREBRAS_KEY   = process.env.CEREBRAS_API_KEY
  const GEMINI_KEY     = process.env.GEMINI_API_KEY
  const GROQ_KEY       = process.env.GROQ_API_KEY
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
  const OPENAI_KEY     = process.env.OPENAI_API_KEY

  if (!CEREBRAS_KEY && !GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY && !OPENAI_KEY) {
    throw new Error('No AI keys configured. Set at least CEREBRAS_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY')
  }

  const errors: string[] = []
  const start = Date.now()

  // ── 1. Cerebras (fastest — 2,000+ tokens/sec) ───────────────────────────
  if (CEREBRAS_KEY) {
    try {
      const client = new Cerebras({ apiKey: CEREBRAS_KEY })
      const completion = await (client.chat.completions.create as any)({
        model:                 cerebrasModel,
        messages:              messages as any,
        max_completion_tokens: maxTokens,
        temperature,
        top_p:                 1,
        stream:                false,
        reasoning_effort:      'medium',
      })
      const content = (completion as any).choices?.[0]?.message?.content || ''
      if (content) {
        return {
          content,
          provider:  'cerebras',
          model:     cerebrasModel,
          tokensUsed: (completion as any).usage?.total_tokens,
          latencyMs: Date.now() - start,
        }
      }
    } catch (e: any) {
      errors.push(`Cerebras: ${e.message}`)
      console.warn('[AI] Cerebras failed, trying next:', e.message)
    }
  }

  // ── 2. Gemini 2.5 Flash (free, CBC-aware) ────────────────────────────────
  if (GEMINI_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(GEMINI_URL, GEMINI_KEY, geminiModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'gemini', model: geminiModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      errors.push(`Gemini: ${e.message}`)
      console.warn('[AI] Gemini failed, trying next:', e.message)
    }
  }

  // ── 3. Groq (free, fast open models) ─────────────────────────────────────
  if (GROQ_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(GROQ_URL, GROQ_KEY, groqModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'groq', model: groqModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      errors.push(`Groq: ${e.message}`)
      console.warn('[AI] Groq failed, trying next:', e.message)
    }
  }

  // ── 4. OpenRouter (multi-model fallback) ─────────────────────────────────
  if (OPENROUTER_KEY) {
    const isOpenRouter = OPENROUTER_KEY.startsWith('sk-or-')
    const url   = isOpenRouter ? OPENROUTER_URL : OPENAI_URL
    const model = isOpenRouter ? openrouterModel : openaiModel
    try {
      const { content, tokensUsed } = await callHTTP(url, OPENROUTER_KEY, model, messages, maxTokens, temperature)
      if (content) return { content, provider: isOpenRouter ? 'openrouter' : 'openai', model, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      errors.push(`OpenRouter: ${e.message}`)
      console.warn('[AI] OpenRouter failed, trying next:', e.message)
    }
  }

  // ── 5. OpenAI direct ─────────────────────────────────────────────────────
  if (OPENAI_KEY && OPENAI_KEY !== OPENROUTER_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(OPENAI_URL, OPENAI_KEY, openaiModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'openai', model: openaiModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      errors.push(`OpenAI: ${e.message}`)
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

/**
 * Convenience: returns just the string response.
 */
export async function getAIResponse(
  systemPrompt: string,
  userMessage:  string,
  opts?:        Partial<AICallOptions>,
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
