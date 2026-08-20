/**
 * ElimuNova AI Provider — shared across EduGenius and TutorBot.
 *
 * Waterfall:
 *   1. Active provider (configurable via ai_provider_active in system_settings)
 *   2. Premium OpenAI — gpt-4o (best quality)
 *   3. Premium Gemini — gemini-1.5-pro
 *   4. Groq           — llama-3.3-70b-versatile
 *   5. Cerebras       — gemma-4-31b (2,000 tok/sec — FASTEST)
 *   6. DeepSeek       — deepseek-chat / deepseek-reasoner
 *   7. Gemini Flash   — gemini-2.0-flash (free quota)
 *   8. OpenRouter     — gpt-4o-mini (paid fallback)
 *   9. OpenAI direct  — gpt-4o-mini (last resort)
 *
 * Models per task type (configured via super-admin AI config page):
 *   ai_model_default, ai_model_teacher, ai_model_student, ai_model_presentation
 *
 * Keys are read from process.env first, then fall back to the
 * system_settings DB table (configured via super-admin AI config page).
 */

import Cerebras from '@cerebras/cerebras_cloud_sdk'
import { prisma, withRetry } from './prisma'
import { checkInput, logViolation, buildSafeSystemPrompt } from './ai-safety'
import { decryptPassword } from './password-encryption'

const DB_KEY_MAP: Record<string, string> = {
  CEREBRAS_API_KEY:      'ai_provider_cerebras_key',
  DEEPSEEK_API_KEY:      'ai_provider_deepseek_key',
  GEMINI_API_KEY:        'ai_provider_gemini_key',
  GROQ_API_KEY:          'ai_provider_groq_key',
  OPENROUTER_API_KEY:    'ai_provider_openrouter_key',
  OPENAI_API_KEY:        'ai_provider_openai_key',
  OPENAI_DALLE_API_KEY:  'ai_provider_dalle_key',
  STABILITY_API_KEY:     'ai_provider_stability_key',
}

let dbKeysCache: Record<string, string> | null = null
let dbKeysCacheTime = 0

/** Force the DB key cache to refresh on next AI call — call after saving new keys in admin UI */
export function invalidateAIKeyCache(): void {
  dbKeysCache = null
  dbKeysCacheTime = 0
}

const ALL_DB_KEYS = [
  ...Object.values(DB_KEY_MAP),
  'ai_premium_enabled',
  'ai_premium_openai_model',
  'ai_premium_gemini_model',
  'ai_provider_dalle_key',
  'ai_provider_stability_key',
  'ai_provider_active',
  'ai_model_default',
  'ai_model_teacher',
  'ai_model_student',
  'ai_model_presentation',
]

async function refreshDbCache(): Promise<void> {
  try {
    const settings = await withRetry(() =>
      (prisma as any).systemSettings.findMany({
        where: { key: { in: ALL_DB_KEYS } },
      })
    )
    dbKeysCache = {}
    for (const s of settings as Array<{ key: string; value: string }>) dbKeysCache[s.key] = decryptPassword(s.value) || s.value
    dbKeysCacheTime = Date.now()
  } catch { console.warn('[AI] DB cache refresh failed — using env vars only') }
}

export async function getKey(envVar: string): Promise<string | undefined> {
  // DB (system_settings, set via Super Admin → AI Config) is authoritative.
  const dbKey = DB_KEY_MAP[envVar]
  if (dbKey) {
    if (!dbKeysCache || Date.now() - dbKeysCacheTime >= 60_000) await refreshDbCache()
    const dbValue = dbKeysCache?.[dbKey]
    if (dbValue) {
      const dbParts = dbValue.split(',').map(s => s.trim()).filter(Boolean)
      if (dbParts.length) return dbParts[0]
    }
  }
  // Fallback to env var (local dev / deployment bootstrap).
  if (process.env[envVar]) {
    const val = process.env[envVar]
    const parts = val.split(',').map(s => s.trim()).filter(Boolean)
    return parts[0] || undefined
  }
  return undefined
}

/** Get all keys for a provider (comma-separated) — for key rotation */
export async function getAllKeys(envVar: string): Promise<string[]> {
  const dbKey = DB_KEY_MAP[envVar]
  if (dbKey) {
    if (!dbKeysCache || Date.now() - dbKeysCacheTime >= 60_000) await refreshDbCache()
    const dbValue = dbKeysCache?.[dbKey]
    if (dbValue) return dbValue.split(',').map(s => s.trim()).filter(Boolean)
  }
  const raw = process.env[envVar]
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

async function getSetting(key: string): Promise<string | undefined> {
  if (!dbKeysCache || Date.now() - dbKeysCacheTime >= 60_000) await refreshDbCache()
  const dbValue = dbKeysCache?.[key]
  if (dbValue !== undefined && dbValue !== '') return dbValue
  if (process.env[key]) return process.env[key]
  return undefined
}

export type AIProvider = 'cerebras' | 'deepseek' | 'gemini' | 'groq' | 'openrouter' | 'openai' | 'premium-openai' | 'premium-gemini'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICallOptions {
  messages:          AIMessage[]
  maxTokens?:        number
  temperature?:      number
  useReasoner?:      boolean
  usePremium?:       boolean
  cerebrasModel?:    string
  deepseekModel?:    string
  geminiModel?:      string
  groqModel?:        string
  openrouterModel?:  string
  openaiModel?:      string
  premiumOpenaiModel?: string
  premiumGeminiModel?: string
  taskType?:         string
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
import { fetchWithTimeout, TIMEOUTS } from './fetch-utils'

const GROQ_URL       = 'https://api.groq.com/openai/v1/chat/completions'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENAI_URL     = 'https://api.openai.com/v1/chat/completions'

async function callHTTP(
  url: string, apiKey: string, model: string,
  messages: AIMessage[], maxTokens = 2000, temperature = 0.7,
  allKeys?: string[],
): Promise<{ content: string; tokensUsed?: number }> {
  const keys = allKeys && allKeys.length > 0 ? allKeys : [apiKey]
  let lastError: string = ''
  for (const key of keys) {
    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://elimunova.app',
          'X-Title': 'ElimuNova AI',
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      }, TIMEOUTS.AI)
      if (!res.ok) {
        lastError = `${url} ${res.status}`
        continue // try next key
      }
      const data = await res.json()
      return {
        content: data?.choices?.[0]?.message?.content || '',
        tokensUsed: data?.usage?.total_tokens,
      }
    } catch (e: any) {
      lastError = e.message || 'Network error'
      continue // try next key
    }
  }
  throw new Error(`All keys failed for ${url}: ${lastError}`)
}

export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const {
    messages,
    maxTokens            = 2000,
    temperature          = 0.7,
    useReasoner          = false,
    usePremium           = true,
    cerebrasModel        = process.env.CEREBRAS_MODEL        || 'gemma-4-31b',
    deepseekModel        = useReasoner ? 'deepseek-reasoner' : (process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
    geminiModel          = process.env.GEMINI_MODEL          || 'gemini-2.0-flash',
    groqModel            = process.env.GROQ_MODEL            || 'llama-3.3-70b-versatile',
    openrouterModel      = process.env.OPENROUTER_MODEL      || 'openai/gpt-4o-mini',
    openaiModel          = process.env.OPENAI_MODEL          || 'gpt-4o-mini',
    premiumOpenaiModel   = process.env.PREMIUM_OPENAI_MODEL  || 'gpt-4o',
    premiumGeminiModel   = process.env.PREMIUM_GEMINI_MODEL  || 'gemini-2.0-flash',
  } = opts

  const [CEREBRAS_KEY, DEEPSEEK_KEY, GEMINI_KEY, GROQ_KEY, OPENROUTER_KEY, OPENAI_KEY] = await Promise.all([
    getKey('CEREBRAS_API_KEY'),
    getKey('DEEPSEEK_API_KEY'),
    getKey('GEMINI_API_KEY'),
    getKey('GROQ_API_KEY'),
    getKey('OPENROUTER_API_KEY'),
    getKey('OPENAI_API_KEY'),
  ])

  // Get all keys for rotation (comma-separated)
  const [ALL_GROQ_KEYS, ALL_GEMINI_KEYS, ALL_OPENROUTER_KEYS, ALL_OPENAI_KEYS, ALL_DEEPSEEK_KEYS] = await Promise.all([
    getAllKeys('GROQ_API_KEY'),
    getAllKeys('GEMINI_API_KEY'),
    getAllKeys('OPENROUTER_API_KEY'),
    getAllKeys('OPENAI_API_KEY'),
    getAllKeys('DEEPSEEK_API_KEY'),
  ])

  if (!CEREBRAS_KEY && !DEEPSEEK_KEY && !GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY && !OPENAI_KEY) {
    throw new Error('No AI keys configured. Add keys via super-admin AI config page or set env vars.')
  }

  // Resolve admin-configured settings from DB
  const resolvedPremium = usePremium && (await getSetting('ai_premium_enabled')) !== 'false'
  const resolvedPremiumOpenai = await getSetting('ai_premium_openai_model') || premiumOpenaiModel
  const resolvedPremiumGemini = await getSetting('ai_premium_gemini_model') || premiumGeminiModel
  const activeProvider = await getSetting('ai_provider_active')
  const taskModels: Record<string, string> = {
    default:       await getSetting('ai_model_default') || '',
    teacher:       await getSetting('ai_model_teacher') || '',
    student:       await getSetting('ai_model_student') || '',
    presentation:  await getSetting('ai_model_presentation') || '',
  }
  const taskModel = opts.taskType ? taskModels[opts.taskType] || taskModels.default : taskModels.default
  const effectiveGroqModel   = taskModel || groqModel
  const effectiveCerebrasModel = taskModel || cerebrasModel
  const effectiveDeepseekModel = useReasoner ? 'deepseek-reasoner' : (taskModel || deepseekModel)
  const effectiveGeminiModel   = taskModel || geminiModel
  const effectiveOpenrouterModel = taskModel || openrouterModel
  const effectiveOpenaiModel     = taskModel || openaiModel

  const errors: string[] = []
  const start = Date.now()

  const userMessage = messages.find(m => m.role === 'user')?.content || ''
  const inputCheck = checkInput(userMessage)
  if (!inputCheck.passed) {
    logViolation({
      userId: 'unknown', userRole: 'unknown',
      input: userMessage, reason: inputCheck.reason || 'Non-educational content',
      category: inputCheck.category || 'non_educational', route: 'callAI',
    })
    return {
      content: "I'm designed to help with educational topics. Please ask me something related to teaching, learning, or your school subjects.",
      provider: 'groq' as AIProvider,
      model: 'safety-filter',
    }
  }

  const safeMessages = messages.map(m =>
    m.role === 'system' ? { ...m, content: buildSafeSystemPrompt(m.content) } : m
  )

  const hasNonTextContent = safeMessages.some(m => typeof m.content !== 'string')
  if (hasNonTextContent) {
    console.warn('[AI] Some messages have non-text content — may fail on non-vision models')
  }

  // 0. Active provider (if configured) — tried first
  if (activeProvider && !useReasoner) {
    const providerConfig: Record<string, { key: string | undefined; url: string; model: string }> = {
      groq:       { key: GROQ_KEY, url: GROQ_URL, model: effectiveGroqModel },
      cerebras:   { key: CEREBRAS_KEY, url: '', model: effectiveCerebrasModel },
      deepseek:   { key: DEEPSEEK_KEY, url: DEEPSEEK_URL, model: effectiveDeepseekModel },
      gemini:     { key: GEMINI_KEY, url: GEMINI_URL, model: effectiveGeminiModel },
      openrouter: { key: OPENROUTER_KEY, url: OPENROUTER_URL, model: effectiveOpenrouterModel },
      openai:     { key: OPENAI_KEY, url: OPENAI_URL, model: effectiveOpenaiModel },
    }
    const cfg = providerConfig[activeProvider]
    if (cfg?.key) {
      try {
        if (activeProvider === 'cerebras') {
          const client = new Cerebras({ apiKey: cfg.key })
          const res = await (client.chat.completions.create as any)({
            model: cfg.model, messages: safeMessages as any,
            max_completion_tokens: maxTokens, temperature, top_p: 1, stream: false,
          })
          const content = (res as any).choices?.[0]?.message?.content || ''
          if (content) return { content, provider: activeProvider as AIProvider, model: cfg.model, tokensUsed: (res as any).usage?.total_tokens, latencyMs: Date.now() - start }
        } else {
          const { content, tokensUsed } = await callHTTP(cfg.url, cfg.key, cfg.model, safeMessages, maxTokens, temperature)
          if (content) return { content, provider: activeProvider as AIProvider, model: cfg.model, tokensUsed, latencyMs: Date.now() - start }
        }
      } catch (e: any) {
        errors.push(`Active provider ${activeProvider}: ${e.message}`); console.warn('[AI] Active provider:', e.message)
      }
    }
  }

  // 1. Premium OpenAI (GPT-4o) — best quality (skip if key is OpenRouter)
  if (OPENAI_KEY && !OPENAI_KEY.startsWith('sk-or-') && resolvedPremium) {
    try {
      const { content, tokensUsed } = await callHTTP(OPENAI_URL, OPENAI_KEY, resolvedPremiumOpenai, safeMessages, maxTokens, temperature, ALL_OPENAI_KEYS)
      if (content) return { content, provider: 'premium-openai', model: resolvedPremiumOpenai, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      errors.push(`Premium OpenAI: ${e.message}`); console.warn('[AI] Premium OpenAI:', e.message)
    }
  }

  // 2. Premium Gemini Pro — second priority
  if (GEMINI_KEY && resolvedPremium) {
    try {
      const { content, tokensUsed } = await callHTTP(GEMINI_URL, GEMINI_KEY, resolvedPremiumGemini, safeMessages, maxTokens, temperature, ALL_GEMINI_KEYS)
      if (content) return { content, provider: 'premium-gemini', model: resolvedPremiumGemini, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      errors.push(`Premium Gemini: ${e.message}`); console.warn('[AI] Premium Gemini:', e.message)
    }
  }

  // 3. Groq — free, ultra-fast
  if (GROQ_KEY && !useReasoner) {
    try {
      const { content, tokensUsed } = await callHTTP(GROQ_URL, GROQ_KEY, effectiveGroqModel, safeMessages, maxTokens, temperature, ALL_GROQ_KEYS)
      if (content) return { content, provider: 'groq', model: effectiveGroqModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] Groq rejected image input — skipping')
      else { errors.push(`Groq: ${e.message}`); console.warn('[AI] Groq:', e.message) }
    }
  }

  // 4. Cerebras — fastest (skip for reasoning tasks)
  if (CEREBRAS_KEY && !useReasoner) {
    try {
      const client = new Cerebras({ apiKey: CEREBRAS_KEY })
      const res = await (client.chat.completions.create as any)({
        model: effectiveCerebrasModel,
        messages: safeMessages as any,
        max_completion_tokens: maxTokens,
        temperature,
        top_p: 1,
        stream: false,
      })
      const content = (res as any).choices?.[0]?.message?.content || ''
      if (content) return { content, provider: 'cerebras', model: effectiveCerebrasModel, tokensUsed: (res as any).usage?.total_tokens, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] Cerebras rejected image input — skipping')
      else { errors.push(`Cerebras: ${e.message}`); console.warn('[AI] Cerebras:', e.message) }
    }
  }

  // 5. DeepSeek — best quality (V3 for chat, R1 for reasoning)
  if (DEEPSEEK_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(DEEPSEEK_URL, DEEPSEEK_KEY, effectiveDeepseekModel, safeMessages, maxTokens, temperature, ALL_DEEPSEEK_KEYS)
      if (content) return { content, provider: 'deepseek', model: effectiveDeepseekModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] DeepSeek rejected image input — skipping')
      else { errors.push(`DeepSeek: ${e.message}`); console.warn('[AI] DeepSeek:', e.message) }
    }
  }

  // 6. Gemini Flash — free quota
  if (GEMINI_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(GEMINI_URL, GEMINI_KEY, effectiveGeminiModel, safeMessages, maxTokens, temperature, ALL_GEMINI_KEYS)
      if (content) return { content, provider: 'gemini', model: effectiveGeminiModel, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] Gemini rejected image input — skipping')
      else { errors.push(`Gemini: ${e.message}`); console.warn('[AI] Gemini:', e.message) }
    }
  }

  // 7. OpenRouter (or direct OpenAI via same key)
  // Also try OPENAI_KEY if it starts with 'sk-or-' (OpenRouter key stored in OPENAI_API_KEY)
  const effectiveORKey = OPENROUTER_KEY || (OPENAI_KEY?.startsWith('sk-or-') ? OPENAI_KEY : undefined)
  if (effectiveORKey) {
    const isOR  = effectiveORKey.startsWith('sk-or-')
    const url   = isOR ? OPENROUTER_URL : OPENAI_URL
    const model = isOR ? effectiveOpenrouterModel : effectiveOpenaiModel
    const allORKeys = isOR ? ALL_OPENROUTER_KEYS : ALL_OPENAI_KEYS
    try {
      const { content, tokensUsed } = await callHTTP(url, effectiveORKey, model, safeMessages, maxTokens, temperature, allORKeys)
      if (content) return { content, provider: isOR ? 'openrouter' : 'openai', model, tokensUsed, latencyMs: Date.now() - start }
    } catch (e: any) {
      const isImageError = e.message?.includes?.('image')
      if (isImageError) console.warn('[AI] OpenRouter/OpenAI rejected image input — skipping')
      else { errors.push(`OpenRouter: ${e.message}`); console.warn('[AI] OpenRouter:', e.message) }
    }
  }

  // 8. OpenAI direct (only if a different, non-OpenRouter key remains)
  if (OPENAI_KEY && !OPENAI_KEY.startsWith('sk-or-') && OPENAI_KEY !== OPENROUTER_KEY) {
    try {
      const { content, tokensUsed } = await callHTTP(OPENAI_URL, OPENAI_KEY, effectiveOpenaiModel, safeMessages, maxTokens, temperature, ALL_OPENAI_KEYS)
      if (content) return { content, provider: 'openai', model: effectiveOpenaiModel, tokensUsed, latencyMs: Date.now() - start }
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
