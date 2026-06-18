'use client'

import { useState } from 'react'
import {
  Brain, Send, Loader2, CheckCircle, XCircle, Zap,
  Sparkles, RefreshCw, ChevronDown, ChevronUp, Clock
} from 'lucide-react'

type TestType = 'chat' | 'lesson_plan' | 'scheme' | 'presentation' | 'exam' | 'career'

interface TestResult {
  testType:  TestType
  provider:  string
  model:     string
  latencyMs: number
  success:   boolean
  output:    string
  error?:    string
  tokens?:   number
}

const TESTS: { id: TestType; label: string; icon: string; desc: string }[] = [
  { id: 'chat',         label: 'Hope AI Chat',      icon: '💬', desc: 'Basic chat with the AI assistant'           },
  { id: 'lesson_plan',  label: 'Lesson Plan',        icon: '📖', desc: 'Generate a CBC Math lesson plan'            },
  { id: 'scheme',       label: 'Scheme of Work',     icon: '📋', desc: 'Generate a 4-week scheme of work'           },
  { id: 'exam',         label: 'Exam Generation',    icon: '📝', desc: 'Generate a 10-question exam'                },
  { id: 'career',       label: 'Career Pathways',    icon: '🎯', desc: 'Generate career guidance for a student'     },
  { id: 'presentation', label: 'PowerPoint Content', icon: '🎨', desc: 'Generate presentation slide content'        },
]

export default function AITestPage() {
  const [running, setRunning]     = useState<TestType | null>(null)
  const [results, setResults]     = useState<Record<TestType, TestResult | null>>({} as any)
  const [expanded, setExpanded]   = useState<TestType | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [customResult, setCustomResult] = useState<{ output: string; provider: string; latencyMs: number } | null>(null)
  const [sendingCustom, setSendingCustom] = useState(false)

  const runTest = async (testType: TestType) => {
    setRunning(testType)
    const start = Date.now()

    try {
      let response: Response
      let result: TestResult

      switch (testType) {
        case 'chat': {
          response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'What is photosynthesis? Explain in 2 sentences.', context: 'teacher_assistant' }),
          })
          const data = await response.json()
          result = {
            testType, success: response.ok,
            provider: data.provider || 'unknown', model: data.model || 'unknown',
            latencyMs: Date.now() - start,
            output: data.response || data.error || 'No response',
            error: !response.ok ? data.error : undefined,
          }
          break
        }

        case 'lesson_plan': {
          response = await fetch('/api/ai/generate-lesson-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: 'Mathematics', grade: 'Grade 7', topic: 'Fractions',
              duration: 40, objectives: ['Understand fractions', 'Add and subtract fractions'],
            }),
          })
          const data = await response.json()
          result = {
            testType, success: response.ok && !!data.content,
            provider: data.metadata?.model || 'unknown', model: data.metadata?.model || 'unknown',
            latencyMs: Date.now() - start,
            output: data.content ? data.content.substring(0, 500) + '...' : data.error || 'No content',
            error: !response.ok ? data.error : undefined,
          }
          break
        }

        case 'scheme': {
          response = await fetch('/api/ai/generate-scheme-of-work', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: 'Science', grade: 'Grade 6',
              topics: ['Plants', 'Animals', 'Environment'], duration: 4,
            }),
          })
          const data = await response.json()
          result = {
            testType, success: response.ok && !!data.content,
            provider: 'waterfall', model: data.metadata?.model || 'unknown',
            latencyMs: Date.now() - start,
            output: data.content ? data.content.substring(0, 500) + '...' : data.error || 'No content',
            error: !response.ok ? data.error : undefined,
          }
          break
        }

        case 'exam': {
          response = await fetch('/api/ai/generate-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: 'English', grade: 'Grade 8', topic: 'Comprehension', questionCount: 5 }),
          })
          const data = await response.json()
          result = {
            testType, success: response.ok,
            provider: 'waterfall', model: 'auto',
            latencyMs: Date.now() - start,
            output: JSON.stringify(data).substring(0, 500) + '...',
            error: !response.ok ? data.error : undefined,
          }
          break
        }

        case 'career': {
          response = await fetch('/api/student/career', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grade: 'Grade 9', interests: 'Science, Technology', strengths: 'Problem solving' }),
          })
          const data = await response.json()
          result = {
            testType, success: response.ok && !!data.summary,
            provider: 'waterfall', model: 'auto',
            latencyMs: Date.now() - start,
            output: data.summary ? `${data.summary}\n\nTop careers: ${data.topCareers?.map((c: any) => c.title).join(', ')}` : data.error || 'No output',
            error: !response.ok ? data.error : undefined,
          }
          break
        }

        case 'presentation': {
          response = await fetch('/api/ai/generate-presentation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: 'History', grade: 'Grade 9', topic: 'The Scramble for Africa',
              slideCount: 4, duration: 45, objectives: ['Understand colonialism'], difficulty: 'medium',
            }),
          })
          const data = await response.json()
          result = {
            testType, success: response.ok && !!data.presentation,
            provider: 'waterfall', model: 'auto',
            latencyMs: Date.now() - start,
            output: data.presentation ? data.presentation.substring(0, 500) + '...' : data.error || 'No output',
            error: !response.ok ? data.error : undefined,
          }
          break
        }

        default:
          throw new Error('Unknown test type')
      }

      setResults(prev => ({ ...prev, [testType]: result }))
      setExpanded(testType)
    } catch (e: any) {
      setResults(prev => ({
        ...prev,
        [testType]: {
          testType, success: false,
          provider: 'error', model: 'error',
          latencyMs: Date.now() - start,
          output: '', error: e.message,
        },
      }))
    } finally {
      setRunning(null)
    }
  }

  const runAll = async () => {
    for (const test of TESTS) {
      await runTest(test.id)
      await new Promise(r => setTimeout(r, 500)) // small gap between tests
    }
  }

  const sendCustom = async () => {
    if (!customPrompt.trim()) return
    setSendingCustom(true)
    const start = Date.now()
    try {
      const res  = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: customPrompt, context: 'teacher_assistant' }),
      })
      const data = await res.json()
      setCustomResult({
        output:    data.response || data.error || 'No response',
        provider:  data.provider || 'unknown',
        latencyMs: Date.now() - start,
      })
    } finally { setSendingCustom(false) }
  }

  const passed = Object.values(results).filter(r => r?.success).length
  const failed = Object.values(results).filter(r => r && !r.success).length
  const total  = Object.values(results).filter(r => r).length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Test Suite</h1>
            <p className="text-slate-500 text-sm">Verify all AI features are working with the current provider waterfall</p>
          </div>
        </div>
        <button onClick={runAll} disabled={!!running}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:opacity-90 transition-all">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {running ? `Testing ${running}...` : 'Run All Tests'}
        </button>
      </div>

      {/* Summary */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{total}</p>
            <p className="text-xs text-slate-500">Tests Run</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{passed}</p>
            <p className="text-xs text-green-600">Passed</p>
          </div>
          <div className={`border rounded-2xl p-4 text-center ${failed > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-2xl font-bold ${failed > 0 ? 'text-red-700' : 'text-slate-400'}`}>{failed}</p>
            <p className={`text-xs ${failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>Failed</p>
          </div>
        </div>
      )}

      {/* Test cards */}
      <div className="space-y-3">
        {TESTS.map(test => {
          const result   = results[test.id]
          const isRunning = running === test.id
          const isExpanded = expanded === test.id

          return (
            <div key={test.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <span className="text-xl">{test.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{test.label}</p>
                  <p className="text-xs text-slate-400">{test.desc}</p>
                </div>

                {/* Status */}
                {result && (
                  <div className="flex items-center gap-2 shrink-0">
                    {result.success
                      ? <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full font-medium">
                          <CheckCircle className="h-3 w-3" /> Passed
                        </span>
                      : <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2.5 py-1 rounded-full font-medium">
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                    }
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" /> {(result.latencyMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}

                {/* Run button */}
                <button onClick={() => runTest(test.id)} disabled={!!running}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shrink-0">
                  {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {isRunning ? 'Running...' : result ? 'Re-run' : 'Run'}
                </button>

                {/* Expand */}
                {result && (
                  <button onClick={() => setExpanded(isExpanded ? null : test.id)}
                    className="text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {/* Expanded output */}
              {result && isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      Provider: {result.provider}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      Model: {result.model}
                    </span>
                    {result.tokens && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {result.tokens} tokens
                      </span>
                    )}
                  </div>
                  {result.error && (
                    <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-mono">
                      Error: {result.error}
                    </div>
                  )}
                  {result.output && (
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-white border border-slate-200 rounded-xl p-4 max-h-64 overflow-y-auto font-sans leading-relaxed">
                      {result.output}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Custom prompt tester */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <h2 className="font-semibold text-slate-800">Custom Prompt Test</h2>
          <span className="text-xs text-slate-400">Test any prompt directly against the AI waterfall</span>
        </div>
        <div className="flex gap-3">
          <input
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendCustom()}
            placeholder="Type any prompt and press Enter or click Send..."
            className="flex-1 h-11 px-4 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={sendCustom} disabled={sendingCustom || !customPrompt.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all">
            {sendingCustom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sendingCustom ? 'Sending...' : 'Send'}
          </button>
        </div>

        {customResult && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {customResult.provider}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {(customResult.latencyMs / 1000).toFixed(1)}s
              </span>
            </div>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-72 overflow-y-auto font-sans leading-relaxed">
              {customResult.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
