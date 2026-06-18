/**
 * ElimuNova AI Provider — shared across EduGenius and TutorBot.
 *
 * Waterfall priority (same as TutorBot's ai-fallback.ts):
 *   1. Gemini 2.5 Flash   — primary, free tier, fast, Kenyan curriculum-aware
 *   2. Groq llama-3.1-8b  — backup, ultra-fast inference
 *   3. OpenRouter          — sk-or-v1-... fallback
 *   4. OpenAI direct       — last resort
 *
 * All keys come from environment variables — NO hardcoded keys.
 * Model selection is stored in the database (AIModelConfig) so super admin
 * can update the active model without a redeploy.
 */

export type AIProvider = 'gemini' | 'groq' | 'openrouter' | 'openai'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICallOptions {
  messages:       AIMessage[]
  maxTokens?:     number
  temperature?:   number
  // Per-task model overrides (used when super admin sets specific models)
  geminiModel?:      string
  groqModel?:        string
  openrouterModel?:  string
  openaiModel?:      string
  // Task context for logging
  taskType?:      string
  schoolId?:      string
}

export interface AICallResult {
  content:       string
  provider:      AIProvider
  model:         string
  tokensUsed?:   number
  latencyMs?:    number
}

const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const GROQ_URL       = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENAI_URL     = 'https://api.openai.com/v1/chat/completions'

async function callProvider(
  url:      string,
  apiKey:   string,
  model:    string,
  messages: AIMessage[],
  maxTokens = 2000,
  temperature = 0.7,
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
    throw new Error(`${url} returned ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const content    = data?.choices?.[0]?.message?.content || ''
  const tokensUsed = data?.usage?.total_tokens
  return { content, tokensUsed }
}

/**
 * Main entry point — tries each provider in order until one succeeds.
 */
export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const {
    messages,
    maxTokens     = 2000,
    temperature   = 0.7,
    geminiModel      = process.env.GEMINI_MODEL      || 'gemini-2.5-flash',
    groqModel        = process.env.GROQ_MODEL        || 'llama-3.1-8b-instant',
    openrouterModel  = process.env.OPENROUTER_MODEL  || 'openai/gpt-4o-mini',
    openaiModel      = process.env.OPENAI_MODEL      || 'gpt-4o-mini',
  } = opts

  const GEMINI_KEY     = process.env.GEMINI_API_KEY
  const GROQ_KEY       = process.env.GROQ_API_KEY
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
  const OPENAI_KEY     = process.env.OPENAI_API_KEY

  if (!GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY && !OPENAI_KEY) {
    throw new Error('No AI keys configured. Set at least one of: GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY')
  }

  const errors: string[] = []
  const startTime = Date.now()

  // ── 1. Gemini 2.5 Flash ─────────────────────────────────────────────────
  if (GEMINI_KEY) {
    try {
      const { content, tokensUsed } = await callProvider(GEMINI_URL, GEMINI_KEY, geminiModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'gemini', model: geminiModel, tokensUsed, latencyMs: Date.now() - startTime }
    } catch (e: any) {
      errors.push(`Gemini: ${e.message}`)
      console.warn('[AI] Gemini failed, trying next:', e.message)
    }
  }

  // ── 2. Groq llama ────────────────────────────────────────────────────────
  if (GROQ_KEY) {
    try {
      const { content, tokensUsed } = await callProvider(GROQ_URL, GROQ_KEY, groqModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'groq', model: groqModel, tokensUsed, latencyMs: Date.now() - startTime }
    } catch (e: any) {
      errors.push(`Groq: ${e.message}`)
      console.warn('[AI] Groq failed, trying next:', e.message)
    }
  }

  // ── 3. OpenRouter ────────────────────────────────────────────────────────
  if (OPENROUTER_KEY) {
    const isOpenRouter = OPENROUTER_KEY.startsWith('sk-or-')
    const url   = isOpenRouter ? OPENROUTER_URL : OPENAI_URL
    const model = isOpenRouter ? openrouterModel : openaiModel
    try {
      const { content, tokensUsed } = await callProvider(url, OPENROUTER_KEY, model, messages, maxTokens, temperature)
      if (content) return { content, provider: isOpenRouter ? 'openrouter' : 'openai', model, tokensUsed, latencyMs: Date.now() - startTime }
    } catch (e: any) {
      errors.push(`OpenRouter: ${e.message}`)
      console.warn('[AI] OpenRouter failed, trying next:', e.message)
    }
  }

  // ── 4. OpenAI direct ─────────────────────────────────────────────────────
  if (OPENAI_KEY && OPENAI_KEY !== OPENROUTER_KEY) {
    try {
      const { content, tokensUsed } = await callProvider(OPENAI_URL, OPENAI_KEY, openaiModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'openai', model: openaiModel, tokensUsed, latencyMs: Date.now() - startTime }
    } catch (e: any) {
      errors.push(`OpenAI: ${e.message}`)
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

/**
 * Convenience wrapper — returns just the content string.
 */
export async function getAIResponse(
  systemPrompt: string,
  userMessage: string,
  opts?: Partial<AICallOptions>
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
