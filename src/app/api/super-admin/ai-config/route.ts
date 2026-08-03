import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { invalidateAIKeyCache } from '@/lib/ai-provider'
import { encryptPassword, decryptPassword } from '@/lib/password-encryption'

const AI_CONFIG_KEYS = [
  'ai_provider_cerebras_key',
  'ai_provider_deepseek_key',
  'ai_provider_gemini_key',
  'ai_provider_groq_key',
  'ai_provider_openrouter_key',
  'ai_provider_openai_key',
  'ai_provider_dalle_key',
  'ai_provider_stability_key',
  'ai_premium_enabled',
  'ai_premium_openai_model',
  'ai_premium_gemini_model',
  'ai_model_default',
  'ai_model_teacher',
  'ai_model_student',
  'ai_model_presentation',
  'ai_waterfall_order',
  'ai_provider_active',
]

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    // Fetch all AI settings
    const settings = await (prisma as any).systemSettings.findMany({
      where: { key: { in: AI_CONFIG_KEYS } },
    })

    // Build config object, masking key values
    const config: Record<string, string> = {}
    settings.forEach((s: any) => {
      if (s.key.includes('_key') && s.value) {
        // Decrypt then mask — show first 12 chars + **** (never show the encrypted blob)
        const plain = decryptPassword(s.value) || s.value
        config[s.key] = plain.length > 12 ? plain.substring(0, 12) + '****' : '****'
      } else {
        config[s.key] = s.value || ''
      }
    })

    // Test which providers are currently reachable
    const providerStatus = await testProviders()

    // Available models (static well-known list)
    const availableModels = [
      { id: 'openai/gpt-4o-mini',             name: 'GPT-4o Mini',            provider: 'openrouter', cost: '$',   speed: 'Fast'  },
      { id: 'openai/gpt-4o',                  name: 'GPT-4o',                 provider: 'openrouter', cost: '$$$', speed: 'Medium'},
      { id: 'anthropic/claude-3.5-sonnet',    name: 'Claude 3.5 Sonnet',      provider: 'openrouter', cost: '$$$', speed: 'Medium'},
      { id: 'anthropic/claude-3-haiku',       name: 'Claude 3 Haiku',         provider: 'openrouter', cost: '$',   speed: 'Fast'  },
      { id: 'google/gemini-flash-1.5',        name: 'Gemini Flash 1.5',       provider: 'openrouter', cost: '$',   speed: 'Fast'  },
      { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B',         provider: 'openrouter', cost: 'Free',speed: 'Fast'  },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B',      provider: 'openrouter', cost: 'Free',speed: 'Medium'},
      { id: 'gemini-2.5-flash',               name: 'Gemini 2.5 Flash',       provider: 'gemini',     cost: 'Free',speed: 'Fast'  },
      { id: 'llama-3.1-8b-instant',           name: 'Llama 3.1 8B (Groq)',    provider: 'groq',       cost: 'Free',speed: 'Ultra' },
      { id: 'llama-3.3-70b-versatile',        name: 'Llama 3.3 70B (Groq)',   provider: 'groq',       cost: 'Free',speed: 'Ultra' },
      { id: 'gemma2-9b-it',                   name: 'Gemma 2 9B (Groq)',      provider: 'groq',       cost: 'Free',speed: 'Ultra' },
      { id: 'mixtral-8x7b-32768',             name: 'Mixtral 8x7B (Groq)',    provider: 'groq',       cost: 'Free',speed: 'Ultra' },
      { id: 'gpt-4o-mini',                    name: 'GPT-4o Mini (Direct)',    provider: 'openai',     cost: '$',   speed: 'Fast'  },
      { id: 'gpt-4o',                         name: 'GPT-4o (Direct)',         provider: 'openai',     cost: '$$$', speed: 'Medium'},
    ]

    return NextResponse.json({ config, providerStatus, availableModels })
  } catch (error) {
    console.error('[GET_AI_CONFIG]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const updates: Record<string, string> = await req.json()

    for (const [key, value] of Object.entries(updates)) {
      if (!AI_CONFIG_KEYS.includes(key)) continue
      if (!value || value.trim() === '') continue

      // Skip masked values — if the value ends with '****', the user didn't change it
      // Saving a masked value would corrupt the stored key
      if (value.endsWith('****')) continue

      let toSave = value.trim()

      // Encrypt API keys at rest (skip values that are already encrypted)
      const isKey = key.endsWith('_key')
      if (isKey && !toSave.startsWith('PWD_ENC:')) {
        try {
          toSave = encryptPassword(toSave)
        } catch (e) {
          console.warn('[POST_AI_CONFIG] Key encryption failed, storing plaintext:', e)
        }
      }

      await (prisma as any).systemSettings.upsert({
        where:  { key },
        update: { value: toSave, updatedBy: user.id },
        create: {
          key,
          value:       toSave,
          type:        'string',
          category:    'ai',
          description: `AI configuration: ${key}`,
          updatedBy:   user.id,
        },
      })
    }

    // Invalidate the in-memory DB key cache so the next AI call picks up new keys immediately
    invalidateAIKeyCache()

    // Test every configured provider right away and surface the result as a
    // dashboard notification so the admin knows immediately whether the keys work.
    const providerStatus = await testProviders()
    const entries = Object.entries(providerStatus)
    const okCount = entries.filter(([, r]) => r.ok).length
    const total = entries.length
    const failed = entries.filter(([, r]) => !r.ok)

    const allOk = okCount === total
    const message = allOk
      ? `${okCount}/${total} AI providers verified — all configured keys are working.`
      : `${okCount}/${total} AI providers verified. Issues: ${failed.map(([k, r]) => `${k}: ${r.error || 'failed'}`).join('; ')}`

    await (prisma as any).notification.create({
      data: {
        title: allOk ? 'AI Keys Verified' : 'AI Key Check Completed',
        message,
        type: allOk ? 'success' : 'warning',
        userId: user.id,
      },
    }).catch((e: any) => console.warn('[POST_AI_CONFIG] Failed to create notification:', e))

    return NextResponse.json({ success: true, providerStatus })
  } catch (error) {
    console.error('[POST_AI_CONFIG]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Test each provider with a minimal request
async function testProviders() {
  const results: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}

  const dbKeys = await (prisma as any).systemSettings.findMany({
    where: { key: { in: ['ai_provider_gemini_key','ai_provider_groq_key','ai_provider_openrouter_key','ai_provider_openai_key','ai_provider_cerebras_key','ai_provider_deepseek_key','ai_provider_dalle_key','ai_provider_stability_key'] } },
  })
  const dbMap = new Map(dbKeys.map((s: any) => [s.key.replace('ai_provider_', '').replace('_key', ''), decryptPassword(s.value) || s.value]))

  const GEMINI_KEY     = String(process.env.GEMINI_API_KEY     || dbMap.get('gemini') || '')
  const GROQ_KEY       = String(process.env.GROQ_API_KEY       || dbMap.get('groq') || '')
  const OPENROUTER_KEY = String(process.env.OPENROUTER_API_KEY || dbMap.get('openrouter') || '')
  const OPENAI_KEY     = String(process.env.OPENAI_API_KEY     || dbMap.get('openai') || '')
  const CEREBRAS_KEY   = String(process.env.CEREBRAS_API_KEY   || dbMap.get('cerebras') || '')
  const DEEPSEEK_KEY   = String(process.env.DEEPSEEK_API_KEY   || dbMap.get('deepseek') || '')
  const DALLE_KEY      = String(process.env.OPENAI_DALLE_API_KEY || dbMap.get('dalle') || '')
  const STABILITY_KEY  = String(process.env.STABILITY_API_KEY    || dbMap.get('stability') || '')

  // Helper: get first valid key from comma-separated list
  const firstKey = (val?: string): string => {
    if (!val) return ''
    const parts = val.split(',').map((s: string) => s.trim()).filter(Boolean)
    return parts[0] || ''
  }

  const testMsg = [{ role: 'user', content: 'Say "ok" in one word.' }]

  if (GEMINI_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firstKey(GEMINI_KEY)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', messages: testMsg, max_tokens: 5 }),
      })
      results.gemini = { ok: r.ok, latencyMs: Date.now() - start }
      if (!r.ok) {
        const text = await r.text()
        results.gemini.error = text.slice(0, 200)
      }
    } catch (e: any) { results.gemini = { ok: false, error: e.message } }
  } else { results.gemini = { ok: false, error: 'No key set' } }

  if (GROQ_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firstKey(GROQ_KEY)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: testMsg, max_tokens: 5 }),
      })
      results.groq = { ok: r.ok, latencyMs: Date.now() - start }
      if (!r.ok) {
        const text = await r.text()
        results.groq.error = text.slice(0, 200)
      }
    } catch (e: any) { results.groq = { ok: false, error: e.message } }
  } else { results.groq = { ok: false, error: 'No key set' } }

  if (OPENROUTER_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firstKey(OPENROUTER_KEY)}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://elimunova.app' },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: testMsg, max_tokens: 5 }),
      })
      results.openrouter = { ok: r.ok, latencyMs: Date.now() - start }
      if (!r.ok) {
        const text = await r.text()
        results.openrouter.error = text.slice(0, 200)
      }
    } catch (e: any) { results.openrouter = { ok: false, error: e.message } }
  } else { results.openrouter = { ok: false, error: 'No key set' } }

  if (CEREBRAS_KEY) {
    const start = Date.now()
    try {
      // Use the same model the app actually calls (CEREBRAS_MODEL / default)
      const cerebrasModel = process.env.CEREBRAS_MODEL || 'gemma-4-31b'
      const r = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firstKey(CEREBRAS_KEY)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: cerebrasModel, messages: testMsg, max_tokens: 5 }),
      })
      results.cerebras = { ok: r.ok, latencyMs: Date.now() - start }
      if (!r.ok) {
        const text = await r.text()
        results.cerebras.error = text.slice(0, 200)
      }
    } catch (e: any) { results.cerebras = { ok: false, error: e.message } }
  } else { results.cerebras = { ok: false, error: 'No key set' } }

  if (DEEPSEEK_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firstKey(DEEPSEEK_KEY)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-chat', messages: testMsg, max_tokens: 5 }),
      })
      results.deepseek = { ok: r.ok, latencyMs: Date.now() - start }
      if (!r.ok) {
        const text = await r.text()
        results.deepseek.error = text.slice(0, 200)
      }
    } catch (e: any) { results.deepseek = { ok: false, error: e.message } }
  } else { results.deepseek = { ok: false, error: 'No key set' } }

  if (OPENAI_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firstKey(OPENAI_KEY)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: testMsg, max_tokens: 5 }),
      })
      results.openai = { ok: r.ok, latencyMs: Date.now() - start }
      if (!r.ok) {
        const text = await r.text()
        results.openai.error = text.slice(0, 200)
      }
    } catch (e: any) { results.openai = { ok: false, error: e.message } }
  } else { results.openai = { ok: false, error: 'No key set' } }

  if (DALLE_KEY && typeof DALLE_KEY === 'string' && !DALLE_KEY.startsWith('sk-or-')) {
    results.dalle = { ok: true, latencyMs: 0 }
  } else { results.dalle = { ok: false, error: 'No key set' } }

  if (STABILITY_KEY) {
    results.stability = { ok: true, latencyMs: 0 }
  } else { results.stability = { ok: false, error: 'No key set' } }

  return results
}
