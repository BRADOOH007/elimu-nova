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
        // Decrypt then mask each comma-separated key individually — show first
        // 12 chars + **** per key (never show the encrypted blob or full keys)
        const plain = decryptPassword(s.value) || s.value
        config[s.key] = splitKeys(plain).map(maskKey).join(',')
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
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B',      provider: 'openrouter', cost: 'Free',speed: 'Medium'},
      { id: 'gemini-3.6-flash',               name: 'Gemini 3.6 Flash (Gemini API)',  provider: 'gemini', cost: 'Free', speed: 'Fast'  },
      { id: 'gemini-3.6-flash-lite',          name: 'Gemini 3.6 Flash Lite (Gemini API)', provider: 'gemini', cost: 'Free', speed: 'Fast'  },
      { id: 'openai/gpt-oss-120b',            name: 'GPT-OSS 120B (Groq)',    provider: 'groq',       cost: 'Free',speed: 'Ultra' },
      { id: 'openai/gpt-oss-20b',             name: 'GPT-OSS 20B (Groq)',     provider: 'groq',       cost: 'Free',speed: 'Ultra' },
      { id: 'qwen/qwen3.8-27b',               name: 'Qwen 3.8 27B (Groq)',    provider: 'groq',       cost: 'Free',speed: 'Ultra' },
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
    const updates: Record<string, unknown> = await req.json()

    // Split the payload into key-field updates and their "__drop" companions.
    // "<field>__drop" holds comma-separated indexes of stored keys to remove;
    // the matching "<field>" value holds newly typed keys to append. Presence of
    // a "__drop" companion (even empty) selects MERGE mode: stored keys are kept,
    // dropped indexes removed, new keys appended. Without it, a non-empty
    // <field> value fully replaces what is stored (legacy behaviour).
    const drops:     Record<string, number[]> = {}
    const dropSeen:  Record<string, boolean>  = {}
    const values:    Record<string, string>   = {}
    for (const [rawKey, rawValue] of Object.entries(updates)) {
      const v = typeof rawValue === 'string' ? rawValue.trim() : ''
      if (rawKey.endsWith('__drop')) {
        const parent = rawKey.slice(0, -'__drop'.length)
        if (!AI_CONFIG_KEYS.includes(parent)) continue
        dropSeen[parent] = true
        drops[parent] = v ? v.split(',').map(s => parseInt(s, 10)).filter(n => Number.isInteger(n) && n >= 0) : []
        continue
      }
      if (!AI_CONFIG_KEYS.includes(rawKey)) continue
      values[rawKey] = v
    }

    const fieldKeys = new Set([...Object.keys(values), ...Object.keys(drops)])
    for (const key of fieldKeys) {
      let value    = values[key] || ''
      const wantsMerge = !!dropSeen[key]

      // Skip masked values — if the value ends with '****', the user didn't change it.
      // Saving a masked value would corrupt the stored key.
      if (value.endsWith('****')) value = ''
      if (!value && !wantsMerge) continue

      let toSave = value

      if (wantsMerge) {
        // Merge mode: remove dropped indexes from the stored keys, append new ones.
        const kept = (await readStoredKeys(key)).filter((_, i) => !(drops[key] || []).includes(i))
        toSave = [...kept, ...splitKeys(value)].join(',')
      }

      if (!toSave) {
        // Every key was removed — delete the setting entirely.
        await (prisma as any).systemSettings.deleteMany({ where: { key } })
        continue
      }

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

// Split a stored key value into its individual keys (rotation list format).
function splitKeys(raw: string): string[] {
  return String(raw || '').split(',').map(k => k.trim()).filter(Boolean)
}

// Mask a single key for display: first 12 chars + **** (never the full secret).
function maskKey(key: string): string {
  return key.length > 12 ? key.substring(0, 12) + '****' : '****'
}

// Read + decrypt a stored key setting into its individual keys.
async function readStoredKeys(key: string): Promise<string[]> {
  const row = await (prisma as any).systemSettings.findUnique({ where: { key } })
  if (!row?.value) return []
  const plain = decryptPassword(row.value) || row.value
  return splitKeys(plain)
}

// Test each provider with a minimal request
async function testProviders() {
  const results: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}

  const dbKeys = await (prisma as any).systemSettings.findMany({
    where: { key: { in: ['ai_provider_gemini_key','ai_provider_groq_key','ai_provider_openrouter_key','ai_provider_openai_key','ai_provider_cerebras_key','ai_provider_deepseek_key','ai_provider_dalle_key','ai_provider_stability_key'] } },
  })
  const dbMap = new Map(dbKeys.map((s: any) => [s.key.replace('ai_provider_', '').replace('_key', ''), decryptPassword(s.value) || s.value]))

  // DB (system_settings) is authoritative for the app's actual AI calls, so test
  // the DB key first and only fall back to env (matching getKey() in ai-provider).
  const GEMINI_KEY     = String(dbMap.get('gemini')     || process.env.GEMINI_API_KEY || '')
  const GROQ_KEY       = String(dbMap.get('groq')       || process.env.GROQ_API_KEY || '')
  const OPENROUTER_KEY = String(dbMap.get('openrouter') || process.env.OPENROUTER_API_KEY || '')
  const OPENAI_KEY     = String(dbMap.get('openai')     || process.env.OPENAI_API_KEY || '')
  const CEREBRAS_KEY   = String(dbMap.get('cerebras')   || process.env.CEREBRAS_API_KEY || '')
  const DEEPSEEK_KEY   = String(dbMap.get('deepseek')   || process.env.DEEPSEEK_API_KEY || '')
  const DALLE_KEY      = String(dbMap.get('dalle')      || process.env.OPENAI_DALLE_API_KEY || '')
  const STABILITY_KEY  = String(dbMap.get('stability')  || process.env.STABILITY_API_KEY || '')

  // Helper: get first valid key from comma-separated list
  const firstKey = (val?: string): string => {
    if (!val) return ''
    const parts = val.split(',').map((s: string) => s.trim()).filter(Boolean)
    return parts[0] || ''
  }

  const testMsg = [{ role: 'user', content: 'Say "ok" in one word.' }]
  // Use the model the app actually calls (GROQ_MODEL / default). llama-3.3-70b-versatile
  // is no longer available on Groq — default to a current, working model.
  const groqTestModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
  // Gemini rotates model names aggressively — default to the current stable
  // model, then fall back to the previous stable one. Avoid deprecated names
  // (gemini-2.0/2.5-flash no longer exist) so a valid key never falsely fails.
  const geminiTestModels = [process.env.GEMINI_MODEL || 'gemini-3.6-flash', 'gemini-3.6-flash-lite']

  if (GEMINI_KEY) {
    const start = Date.now()
    let lastText = ''
    try {
      for (const model of geminiTestModels) {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${firstKey(GEMINI_KEY)}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: testMsg, max_tokens: 5 }),
        })
        if (r.ok) { results.gemini = { ok: true, latencyMs: Date.now() - start }; break }
        lastText = (await r.text()).slice(0, 200)
        results.gemini = { ok: false, latencyMs: Date.now() - start, error: lastText }
      }
    } catch (e: any) { results.gemini = { ok: false, error: e.message } }
  } else { results.gemini = { ok: false, error: 'No key set' } }

  if (GROQ_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firstKey(GROQ_KEY)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: groqTestModel, messages: testMsg, max_tokens: 5 }),
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
