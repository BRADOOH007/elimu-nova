'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, Loader2, ChevronRight, Bug, Lightbulb, Search } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type CodingTrackId = 'scratch' | 'web-dev' | 'ai-for-kids' | 'python'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AICodingTutorDrawerProps {
  trackId: CodingTrackId
  lessonId?: string
  activeCode?: string
  errorLogs?: string[]
}

const TRACK_LABEL: Record<CodingTrackId, string> = {
  scratch: 'Scratch Mentor',
  'web-dev': 'Web Dev Tutor',
  python: 'Python Tutor',
  'ai-for-kids': 'AI Coach',
}

const TRACK_GRAD: Record<CodingTrackId, string> = {
  scratch: 'from-blue-500 to-indigo-600',
  'web-dev': 'from-emerald-500 to-teal-600',
  python: 'from-cyan-500 to-sky-600',
  'ai-for-kids': 'from-purple-500 to-fuchsia-600',
}

const QUICK_ACTIONS = [
  { label: 'Explain my code', icon: Search, prompt: 'Explain my code' },
  { label: 'Find my bug', icon: Bug, prompt: 'Find my bug' },
  { label: 'Step-by-step hint', icon: Lightbulb, prompt: 'Give me a step-by-step hint' },
]

export function AICodingTutorDrawer({ trackId, lessonId, activeCode, errorLogs }: AICodingTutorDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const messagesRef = useRef<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Reset the conversation when switching lessons/tracks.
  const lessonKey = `${trackId}:${lessonId || ''}`
  useEffect(() => {
    setMessages([])
    messagesRef.current = []
    setInput('')
    setCollapsed(false)
  }, [lessonKey])

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || sending) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg }
    setMessages(p => [...p, userMsg])
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/ai/coding-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          trackId,
          lessonId,
          activeCode,
          errorLogs: Array.isArray(errorLogs) && errorLogs.length ? errorLogs.join('\n') : undefined,
          history: messagesRef.current.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || 'Sorry, I had trouble with that.' }])
    } catch {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I ran into an issue. Can you try again?' }])
    } finally { setSending(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Collapsed rail — a slim toggle button that re-opens the panel.
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        aria-label="Open AI Coding Tutor"
        className={`w-10 shrink-0 self-stretch rounded-2xl bg-gradient-to-b ${TRACK_GRAD[trackId]} text-white flex flex-col items-center justify-start gap-2 py-4 shadow-lg hover:opacity-90 transition-opacity`}
      >
        <Sparkles className="h-5 w-5 mt-2" />
        <ChevronRight className="h-4 w-4 animate-pulse" />
        <span className="writing-mode-vertical [writing-mode:vertical-rl] text-xs font-semibold tracking-wide px-1">AI Tutor</span>
      </button>
    )
  }

  return (
    <aside className="w-[340px] shrink-0 flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm min-h-0">
      {/* Header */}
      <div className={`bg-gradient-to-r ${TRACK_GRAD[trackId]} text-white px-4 py-3 flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">AI Coding Tutor</p>
            <p className="text-[11px] text-white/80 truncate">{TRACK_LABEL[trackId]}{lessonId ? ` · ${lessonId}` : ''}</p>
          </div>
        </div>
        <button onClick={() => setCollapsed(true)} aria-label="Collapse AI tutor" className={`w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors ${TRACK_GRAD[trackId] === 'from-purple-500 to-fuchsia-600' ? '' : ''}`}>
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-xs text-slate-400 px-2 py-6">
            <p className="font-semibold text-slate-600 mb-1">Need a hand{lessonId ? ` with "${lessonId}"` : ''}?</p>
            <p>Ask about your code, a bug, or how blocks work. I&apos;ll help you figure it out step by step.</p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] px-3 py-2 text-sm rounded-2xl ${m.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-code:bg-slate-200 prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-tl-none px-3 py-2 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick action chips */}
      <div className="px-3 pb-1 flex flex-wrap gap-1.5 shrink-0">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} onClick={() => sendMessage(a.prompt)}
            className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-3 py-1.5 transition-colors">
            <a.icon className="h-3 w-3" /> {a.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[42px] max-h-28"
          />
          <button onClick={() => sendMessage()} disabled={sending || !input.trim()}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-opacity bg-gradient-to-r ${TRACK_GRAD[trackId]} disabled:opacity-40`} aria-label="Send">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  )
}