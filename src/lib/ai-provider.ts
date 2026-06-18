/**
 * ElimuNova AI Provider — shared across EduGenius and TutorBot.
 *
 * Waterfall:
 *   1. Cerebras      — gpt-oss-120b   (2,000 tok/sec — FASTEST)
 *   2. DeepSeek      — deepseek-chat  (best quality free — SMARTEST)
 *   2b. DeepSeek-R1  — deepseek-reasoner (for reasoning tasks)
 *   3. Gemini Flash  — gemini-2.5-flash  (free, CBC-aware)
 *   4. Groq          — llama-3.1-8b      (free, ultra-fast)
 *   5. OpenRouter    — gpt-4o-mini       (paid fallback)
 *   6. OpenAI        — gpt-4o-mini       (last resort)
 */

import Cerebras from '@cerebras/cerebras_cloud_sdk'

export type AIProvider = 'cerebras' | 'deepseek' | 'gemini' | 'groq' | 'openrouter' | 'openai'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICallOptions {
  messages:         AIMessage[]
  maxTokens?:       number
  temperature?:     number
  useReasoner?:     boolean   // true = DeepSeek-R1 for complex reasoning
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
    cerebrasModel   = process.env.CEREBRAS_MODEL   || 'gpt-oss-120b',
    deepseekModel   = useReasoner ? 'deepseek-reasoner' : (process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
    geminiModel     = process.env.GEMINI_MODEL     || 'gemini-2.5-flash',
    groqModel       = process.env.GROQ_MODEL       || 'llama-3.3-70b',
    openrouterModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    openaiModel     = process.env.OPENAI_MODEL     || 'gpt-4o-mini',
  } = opts

  const CEREBRAS_KEY   = process.env.CEREBRAS_API_KEY
  const DEEPSEEK_KEY   = process.env.DEEPSEEK_API_KEY
  const GEMINI_KEY     = process.env.GEMINI_API_KEY
  const GROQ_KEY       = process.env.GROQ_API_KEY
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
  const OPENAI_KEY     = process.env.OPENAI_API_KEY

  if (!CEREBRAS_KEY && !DEEPSEEK_KEY && !GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY && !OPENAI_KEY) {
    throw new Error('No AI keys configured. Add CEREBRAS_API_KEY, DEEPSEEK_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY')
  }

  const errors: string[] = []
  const start = Date.now()

  // 1. Cerebras — fastest (skip for reasoning tasks, DeepSeek-R1 is better)
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
        reasoning_effort: 'medium',
      })
      const content = (res as any).choices?.[0]?.message?.content || ''
      if (content) return { content, provider: 'cerebras', model: cerebrasModel, tokensUsed: (res as any).usage?.total_tokens, latencyMs: Date.now() - start }
    } catch (e: any) { errors.push(`Cerebras: ${e.message}`); console.warn('[AI] Cerebras:', e.message) }
  }

  // 2. DeepSeek — best quality free (V3 for chat, R1 for reasoning)
  if (DEEPSEEK_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(DEEPSEEK_URL, DEEPSEEK_KEY, deepseekModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'deepseek', model: deepseekModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) { errors.push(`DeepSeek: ${e.message}`); console.warn('[AI] DeepSeek:', e.message) }
  }

  // 3. Gemini 2.5 Flash — free, CBC-aware
  if (GEMINI_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(GEMINI_URL, GEMINI_KEY, geminiModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'gemini', model: geminiModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) { errors.push(`Gemini: ${e.message}`); console.warn('[AI] Gemini:', e.message) }
  }

  // 4. Groq — free, ultra-fast
  if (GROQ_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(GROQ_URL, GROQ_KEY, groqModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'groq', model: groqModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) { errors.push(`Groq: ${e.message}`); console.warn('[AI] Groq:', e.message) }
  }

  // 5. OpenRouter / OpenAI
  if (OPENROUTER_KEY) {
    const isOR = OPENROUTER_KEY.startsWith('sk-or-')
    const url = isOR ? OPENROUTER_URL : OPENAI_URL
    const model = isOR ? openrouterModel : openaiModel
    try {
      const { content, tokensUsed } = await callHTTP(url, OPENROUTER_KEY, model, messages, maxTokens, temperature)
      if (content) return { content, provider: isOR ? 'openrouter' : 'openai', model, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) { errors.push(`OpenRouter: ${e.message}`); console.warn('[AI] OpenRouter:', e.message) }
  }

  // 6. OpenAI direct
  if (OPENAI_KEY && OPENAI_KEY !== OPENROUTER_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(OPENAI_URL, OPENAI_KEY, openaiModel, messages, maxTokens, temperature)
      if (content) return { content, provider: 'openai', model: openaiModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) { errors.push(`OpenAI: ${e.message}`) }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

/** Convenience: returns just the content string */
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

/**
 * Reasoning call — uses DeepSeek-R1 for complex tasks.
 * Best for: exam analysis, career guidance, CBC rubric generation.
 */
export async function getAIReasoning(
  systemPrompt: string,
  userMessage: string,
  opts?: Partial<AICallOptions>,
): Promise<string> {
  return getAIResponse(systemPrompt, userMessage, { ...opts, useReasoner: true })
}
