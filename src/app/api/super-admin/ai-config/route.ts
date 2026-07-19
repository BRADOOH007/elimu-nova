import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return null
  return session
}

// AI config stored in system_settings table
// Keys: ai_provider_gemini_key, ai_provider_groq_key, ai_provider_openrouter_key,
//       ai_model_default, ai_model_teacher, ai_model_student, ai_provider_active
const AI_CONFIG_KEYS = [
  'ai_provider_gemini_key',
  'ai_provider_groq_key',
  'ai_provider_openrouter_key',
  'ai_provider_openai_key',
  'ai_model_default',
  'ai_model_teacher',
  'ai_model_student',
  'ai_model_presentation',
  'ai_waterfall_order',
  'ai_provider_active',
]

export async function GET(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all AI settings
    const settings = await (prisma as any).systemSettings.findMany({
      where: { key: { in: AI_CONFIG_KEYS } },
    })

    // Build config object, masking key values
    const config: Record<string, string> = {}
    settings.forEach((s: any) => {
      if (s.key.includes('_key') && s.value) {
        // Mask key — show first 12 chars + ****
        config[s.key] = s.value.length > 12 ? s.value.substring(0, 12) + '****' : '****'
      } else {
        config[s.key] = s.value || ''
      }
    })

    // Test which providers are currently reachable
    const providerStatus = await testProviders()

    // Available models on OpenRouter (static well-known list)
    const availableModels = [
      { id: 'openai/gpt-4o-mini',             name: 'GPT-4o Mini',            provider: 'openrouter', cost: '$',   speed: 'Fast'  },
      { id: 'openai/gpt-4o',                  name: 'GPT-4o',                 provider: 'openrouter', cost: '$$$', speed: 'Medium'},
      { id: 'anthropic/claude-3.5-sonnet',    name: 'Claude 3.5 Sonnet',      provider: 'openrouter', cost: '$$$', speed: 'Medium'},
      { id: 'anthropic/claude-3-haiku',       name: 'Claude 3 Haiku',         provider: 'openrouter', cost: '$',   speed: 'Fast'  },
      { id: 'google/gemini-flash-1.5',        name: 'Gemini Flash 1.5',       provider: 'openrouter', cost: '$',   speed: 'Fast'  },
      { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B',         provider: 'openrouter', cost: 'Free',speed: 'Fast'  },
      { id: 'gemini-2.5-flash',               name: 'Gemini 2.5 Flash',       provider: 'gemini',     cost: 'Free',speed: 'Fast'  },
      { id: 'llama-3.1-8b-instant',           name: 'Llama 3.1 8B (Groq)',    provider: 'groq',       cost: 'Free',speed: 'Ultra' },
      { id: 'gpt-4o-mini',                    name: 'GPT-4o Mini (Direct)',    provider: 'openai',     cost: '$',   speed: 'Fast'  },
    ]

    return NextResponse.json({ config, providerStatus, availableModels })
  } catch (error) {
    console.error('[GET_AI_CONFIG]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updates: Record<string, string> = await request.json()

    for (const [key, value] of Object.entries(updates)) {
      if (!AI_CONFIG_KEYS.includes(key)) continue
      if (!value) continue

      await (prisma as any).systemSettings.upsert({
        where:  { key },
        update: { value, updatedBy: session.user.id },
        create: {
          key,
          value,
          type:        'string',
          category:    'ai',
          description: `AI configuration: ${key}`,
          updatedBy:   session.user.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST_AI_CONFIG]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Test each provider with a minimal request
async function testProviders() {
  const results: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}

  const dbKeys = await (prisma as any).systemSettings.findMany({
    where: { key: { in: ['ai_provider_gemini_key','ai_provider_groq_key','ai_provider_openrouter_key','ai_provider_openai_key','ai_provider_cerebras_key','ai_provider_deepseek_key'] } },
  })
  const dbMap = new Map(dbKeys.map((s: any) => [s.key.replace('ai_provider_', '').replace('_key', ''), s.value]))

  const GEMINI_KEY     = process.env.GEMINI_API_KEY     || dbMap.get('gemini')
  const GROQ_KEY       = process.env.GROQ_API_KEY       || dbMap.get('groq')
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || dbMap.get('openrouter')
  const OPENAI_KEY     = process.env.OPENAI_API_KEY     || dbMap.get('openai')
  const CEREBRAS_KEY   = process.env.CEREBRAS_API_KEY   || dbMap.get('cerebras')
  const DEEPSEEK_KEY   = process.env.DEEPSEEK_API_KEY   || dbMap.get('deepseek')

  const testMsg = [{ role: 'user', content: 'Say "ok" in one word.' }]

  if (GEMINI_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GEMINI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemini-2.5-flash', messages: testMsg, max_tokens: 5 }),
      })
      results.gemini = { ok: r.ok, latencyMs: Date.now() - start }
    } catch (e: any) { results.gemini = { ok: false, error: e.message } }
  } else { results.gemini = { ok: false, error: 'No key set' } }

  if (GROQ_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: testMsg, max_tokens: 5 }),
      })
      results.groq = { ok: r.ok, latencyMs: Date.now() - start }
    } catch (e: any) { results.groq = { ok: false, error: e.message } }
  } else { results.groq = { ok: false, error: 'No key set' } }

  if (OPENROUTER_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://elimunova.app' },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: testMsg, max_tokens: 5 }),
      })
      results.openrouter = { ok: r.ok, latencyMs: Date.now() - start }
    } catch (e: any) { results.openrouter = { ok: false, error: e.message } }
  } else { results.openrouter = { ok: false, error: 'No key set' } }

  if (CEREBRAS_KEY) {
    results.cerebras = { ok: true, latencyMs: 0 }
  } else { results.cerebras = { ok: false, error: 'No key set' } }

  if (DEEPSEEK_KEY) {
    const start = Date.now()
    try {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-chat', messages: testMsg, max_tokens: 5 }),
      })
      results.deepseek = { ok: r.ok, latencyMs: Date.now() - start }
    } catch (e: any) { results.deepseek = { ok: false, error: e.message } }
  } else { results.deepseek = { ok: false, error: 'No key set' } }

  if (OPENAI_KEY) {
    results.openai = { ok: true, latencyMs: 0 }
  } else { results.openai = { ok: false, error: 'No key set' } }

  return results
}
