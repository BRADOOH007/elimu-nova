'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Send, Mic, Volume2, Copy, RefreshCw, Check, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface HopeDrawerProps {
  open: boolean
  onClose: () => void
  studentName?: string
  currentSubject?: string
  currentTopic?: string
}

const QUICK_CHIPS = [
  { label: 'Explain simply', icon: '💡' },
  { label: 'Quiz me on this', icon: '📝' },
  { label: 'Real-world example', icon: '🎯' },
  { label: 'Step-by-step breakdown', icon: '🚀' },
]

export function HopeAITutorDrawer({ open, onClose, studentName, currentSubject, currentTopic }: HopeDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const { toast } = useToast()

  const name = studentName?.split(' ')[0] || 'Student'
  const subject = currentSubject || 'your studies'
  const topic = currentTopic || ''

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: `Hi ${name}! I'm Hope, your personal AI tutor. ${topic ? `Ready to tackle **${topic}** in ${subject}?` : `Ready to help you with ${subject} today?`} What would you like to focus on?`
      }])
    }
    if (open) inputRef.current?.focus()
    synthRef.current = typeof window !== 'undefined' ? window.speechSynthesis : null
  }, [open, messages.length])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(p => [...p, userMsg])
    setInput('')
    setSending(true)
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          studentName: name,
          subject,
          topic,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || 'Sorry, I had trouble processing that.' }
      setMessages(p => [...p, aiMsg])
    } catch {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I ran into an issue. Can you try again?' }])
    } finally {
      setSending(false)
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const speakMessage = (content: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const plain = content.replace(/[#*`\[\]>|~_-]/g, ' ').trim()
    const utterance = new SpeechSynthesisUtterance(plain)
    const voices = synthRef.current.getVoices()
    const female = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'))
    if (female) utterance.voice = female
    utterance.rate = 0.95
    synthRef.current.speak(utterance)
  }

  const regenerate = async (msgId: string) => {
    const idx = messages.findIndex(m => m.id === msgId)
    if (idx < 1) return
    setMessages(p => p.filter(m => m.id !== msgId))
    const prevUser = messages.filter(m => m.role === 'user').pop()
    if (prevUser) sendMessage(prevUser.content)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Hope AI Assistant</h2>
              {subject && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm inline-block mt-0.5">{subject}{topic ? ` · ${topic}` : ''}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-2xl rounded-tr-none p-3.5 text-sm'
                : 'bg-slate-100 text-slate-900 rounded-2xl rounded-tl-none p-3.5 text-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <>
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-code:bg-slate-200 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-800 prose-pre:text-slate-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.id !== 'greeting' && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60">
                        <button onClick={() => copyMessage(msg.content, msg.id)} className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600" title="Copy">
                          {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => speakMessage(msg.content)} className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600" title="Read aloud">
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => regenerate(msg.id)} className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600 ml-auto" title="Regenerate">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Chips */}
        <div className="px-4 pt-2 pb-0 flex gap-2 overflow-x-auto shrink-0">
          {QUICK_CHIPS.map(chip => (
            <button key={chip.label} onClick={() => sendMessage(`${chip.icon} ${chip.label}`)}
              className="shrink-0 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-3 py-1.5 transition-colors">
              {chip.icon} {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Hope anything..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px] max-h-32"
            />
            <button onClick={() => {}} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors shrink-0" title="Voice input">
              <Mic className="h-5 w-5" />
            </button>
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors shrink-0 disabled:opacity-40">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
