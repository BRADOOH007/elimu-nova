'use client'

import { useEffect, useState } from 'react'
import {
  Brain, CheckCircle, XCircle, RefreshCw, Save, Loader2,
  Zap, Eye, EyeOff, AlertTriangle, Sparkles, Settings,
  ChevronDown, ChevronUp, Info
} from 'lucide-react'

interface ProviderStatus { ok: boolean; latencyMs?: number; error?: string }
interface ModelOption { id: string; name: string; provider: string; cost: string; speed: string }

interface AIConfig {
  config:          Record<string, string>
  providerStatus:  Record<string, ProviderStatus>
  availableModels: ModelOption[]
}

const PROVIDERS = [
  {
    id:       'cerebras',
    label:    'Cerebras',
    keyField: 'ai_provider_cerebras_key',
    badge:    'Primary — 2,000 tokens/sec',
    desc:     'llama3.1-8b — world\'s fastest inference. Free tier. Used as primary for all real-time tasks.',
    envVar:   'CEREBRAS_API_KEY',
    docsUrl:  'https://cloud.cerebras.ai',
    color:    'indigo',
  },
  {
    id:       'deepseek',
    label:    'DeepSeek',
    keyField: 'ai_provider_deepseek_key',
    badge:    'Best Quality Free',
    desc:     'deepseek-chat V3 for content + deepseek-reasoner R1 for complex reasoning. Beats GPT-4o on most tasks.',
    envVar:   'DEEPSEEK_API_KEY',
    docsUrl:  'https://platform.deepseek.com',
    color:    'cyan',
  },
  {
    id:       'gemini',
    label:    'Google Gemini',
    keyField: 'ai_provider_gemini_key',
    badge:    'Backup — Free 1,000 RPD',
    desc:     'Gemini 2.5 Flash. Free tier, fast, great for Kenyan CBC curriculum. Recommended as backup.',
    envVar:   'GEMINI_API_KEY',
    docsUrl:  'https://aistudio.google.com/app/apikey',
    color:    'blue',
  },
  {
    id:       'groq',
    label:    'Groq',
    keyField: 'ai_provider_groq_key',
    badge:    'Fallback — Ultra Fast Free',
    desc:     'Llama 3.1 8B via Groq. Fastest open-model inference, free tier, good fallback.',
    envVar:   'GROQ_API_KEY',
    docsUrl:  'https://console.groq.com/keys',
    color:    'orange',
  },
  {
    id:       'openrouter',
    label:    'OpenRouter',
    keyField: 'ai_provider_openrouter_key',
    badge:    'Shared with TutorBot',
    desc:     'Access to GPT-4o, Claude, Gemini and 100+ models through one key. Same key used by TutorBot offline.',
    envVar:   'OPENROUTER_API_KEY',
    docsUrl:  'https://openrouter.ai/keys',
    color:    'purple',
  },
  {
    id:       'openai',
    label:    'OpenAI Direct',
    keyField: 'ai_provider_openai_key',
    badge:    'Premium',
    desc:     'Direct OpenAI API. Use for highest quality when all other providers are unavailable.',
    envVar:   'OPENAI_API_KEY',
    docsUrl:  'https://platform.openai.com/api-keys',
    color:    'green',
  },
]

const MODEL_ASSIGNMENTS = [
  { key: 'ai_model_default',      label: 'Default (all features)',     desc: 'Fallback model used when no specific model is set' },
  { key: 'ai_model_student',      label: 'Student AI Tutor',           desc: 'Used for student tutoring sessions — should be fast and cheap' },
  { key: 'ai_model_teacher',      label: 'Teacher Tools',              desc: 'Lesson plans, schemes, rubrics — quality matters more than speed' },
  { key: 'ai_model_presentation', label: 'PowerPoint / Presentations', desc: 'Structured output heavy task — use a capable model' },
]

export default function AIConfigPage() {
  const [data, setData]       = useState<AIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [edits, setEdits]     = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string | null>('gemini')

  const load = async (withTest = false) => {
    if (withTest) setTesting(true); else setLoading(true)
    try {
      const res  = await fetch('/api/super-admin/ai-config')
      const json = await res.json()
      setData(json)
    } finally { setLoading(false); setTesting(false) }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (Object.keys(edits).length === 0) return
    setSaving(true)
    try {
      await fetch('/api/super-admin/ai-config', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(edits),
      })
      setSaved(true)
      setEdits({})
      setTimeout(() => setSaved(false), 3000)
      await load()
    } finally { setSaving(false) }
  }

  const set = (key: string, val: string) => {
    setEdits(p => ({ ...p, [key]: val }))
    setSaved(false)
  }

  const statusDot = (s?: ProviderStatus) => {
    if (!s) return <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
    if (s.ok) return <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
    return <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
  }

  const colorMap: Record<string, string> = {
    indigo: 'border-indigo-200 bg-indigo-50/50',
    cyan:   'border-cyan-200 bg-cyan-50/50',
    blue:   'border-blue-200 bg-blue-50/50',
    orange: 'border-orange-200 bg-orange-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
    green:  'border-green-200 bg-green-50/50',
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Model Management</h1>
            <p className="text-slate-500 text-sm">Configure providers, API keys and model assignments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(true)} disabled={testing}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test All'}
          </button>
          <button onClick={save} disabled={saving || Object.keys(edits).length === 0}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-60 ${saved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : `Save Changes${Object.keys(edits).length > 0 ? ` (${Object.keys(edits).length})` : ''}`}
          </button>
        </div>
      </div>

      {/* Waterfall info */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>AI Waterfall:</strong> ElimuNova tries providers in order — Gemini → Groq → OpenRouter → OpenAI.
          If one fails, it automatically moves to the next. Both EduGenius and TutorBot share the same keys and waterfall.
          <span className="block mt-1 text-blue-600">Configure your keys below. Values are stored securely in the database.</span>
        </div>
      </div>

      {/* Provider cards */}
      <div className="space-y-3">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" /> AI Providers
        </h2>

        {PROVIDERS.map(p => {
          const status = data?.providerStatus?.[p.id]
          const isOpen = expanded === p.id
          const currentVal = edits[p.keyField] !== undefined ? edits[p.keyField] : (data?.config?.[p.keyField] || '')
          const showKey = showKeys[p.keyField]

          return (
            <div key={p.id} className={`border rounded-2xl overflow-hidden ${colorMap[p.color]}`}>
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/40 transition-colors"
                onClick={() => setExpanded(isOpen ? null : p.id)}
              >
                <div className="flex items-center gap-2 shrink-0">
                  {statusDot(status)}
                  {status?.ok
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <XCircle className="h-4 w-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{p.label}</span>
                    <span className="text-[11px] font-medium bg-white/70 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {p.badge}
                    </span>
                    {status?.ok && status.latencyMs && (
                      <span className="text-[11px] text-green-600 font-medium">{status.latencyMs}ms</span>
                    )}
                    {status && !status.ok && (
                      <span className="text-[11px] text-red-600">{status.error || 'Offline'}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{p.desc}</p>
                </div>
                {currentVal ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-white/60 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      API Key <span className="text-slate-400 font-normal normal-case">(env: {p.envVar})</span>
                    </label>
                    <a href={p.docsUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline">Get key →</a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={currentVal}
                      onChange={e => set(p.keyField, e.target.value)}
                      placeholder={`Paste your ${p.label} API key`}
                      className="w-full h-10 px-3 pr-10 border border-slate-200 rounded-xl text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys(k => ({ ...k, [p.keyField]: !k[p.keyField] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Key is stored encrypted in the database. Set in .env as <code className="bg-slate-100 px-1 rounded">{p.envVar}</code> for environment-level override.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Model assignments */}
      <div className="space-y-3">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" /> Model Assignments
        </h2>
        <p className="text-xs text-slate-400">
          Assign specific models to different task types. Leave blank to use the default waterfall.
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {MODEL_ASSIGNMENTS.map((m, i) => {
            const currentVal = edits[m.key] !== undefined ? edits[m.key] : (data?.config?.[m.key] || '')
            return (
              <div key={m.key} className={`px-5 py-4 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{m.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                  </div>
                  <select
                    value={currentVal}
                    onChange={e => set(m.key, e.target.value)}
                    className="h-9 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-52"
                  >
                    <option value="">Auto (use waterfall)</option>
                    {data?.availableModels?.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.cost} · {model.speed})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Available models reference */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-500" /> Available Models
        </h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Model</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Provider</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Cost</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.availableModels?.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{m.id}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs capitalize text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{m.provider}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold ${m.cost === 'Free' ? 'text-green-600' : m.cost.length === 1 ? 'text-amber-600' : 'text-red-600'}`}>
                      {m.cost}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-slate-600">{m.speed}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
