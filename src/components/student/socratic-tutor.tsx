'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, HelpCircle, Lightbulb, Brain } from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface ChatMsg { role: 'user' | 'ai'; content: string }

interface SocraticTutorProps {
  subject?: string
  topic?: string
}

export function SocraticTutor({ subject = 'General', topic = 'General' }: SocraticTutorProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hints, setHints] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Initial greeting
  useEffect(() => {
    setMessages([{
      role: 'ai',
      content: `👋 I'm your Socratic Tutor for **${topic}** (${subject}).\n\nInstead of giving you answers directly, I'll guide you to discover them yourself through questions and hints.\n\n**What would you like to explore?** Ask me anything about ${topic}, and I'll guide you step by step.`,
    }])
  }, [subject, topic])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: ChatMsg = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    try {
      const r = await fetch('/api/ai/socratic-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          subject,
          topic,
          hints,
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      if (r.ok) {
        const d = await r.json()
        setMessages(prev => [...prev, { role: 'ai', content: d.response }])
        // Track hints given
        if (d.response.toLowerCase().includes('hint')) {
          setHints(prev => [...prev, d.response.slice(0, 100)])
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-4 w-4" /> Socratic Tutor
          <Badge className="bg-white/20 text-white text-[10px] ml-auto">Guided Learning</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-indigo-50 border border-indigo-200 rounded-bl-sm'
              }`}>
                <MarkdownRenderer content={m.content} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <Brain className="h-3.5 w-3.5 text-white animate-pulse" />
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border-t p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            rows={1}
            placeholder="Ask a question or share your thinking…"
            className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px] max-h-24"
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 h-9 w-9 p-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 text-center pb-2">I guide, you discover ✨</p>
      </CardContent>
    </Card>
  )
}
