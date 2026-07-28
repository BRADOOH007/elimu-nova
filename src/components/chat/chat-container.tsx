'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, Loader2, Brain, Volume2, Mic, Square, StopCircle } from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { useToast } from '@/hooks/use-toast'

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface ChatContainerProps {
  onSend: (message: string, history: ChatMessage[]) => Promise<string>
  quickPrompts?: string[]
  placeholder?: string
  headerTitle?: string
  headerSubtitle?: string
  className?: string
  initialMessages?: ChatMessage[]
  icon?: 'bot' | 'brain'
  height?: string
}

function storageKey(title: string) {
  return `elimu_chat_${title.replace(/\s+/g, '_')}`
}

export default function ChatContainer({
  onSend,
  quickPrompts = [],
  placeholder = 'Ask anything…',
  headerTitle = 'AI Assistant',
  headerSubtitle = 'Your intelligent learning companion',
  className = '',
  initialMessages,
  icon = 'bot',
  height,
}: ChatContainerProps) {
  const { toast } = useToast()
  const key = storageKey(headerTitle)

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(key)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        } catch (e) { console.warn('[Chat] Failed to parse session messages:', e) }
      }
    }
    return initialMessages || [{
      id: '0',
      role: 'ai',
      content: `Hello! I'm your ${headerTitle}. How can I help you today?`,
      timestamp: new Date(),
    }]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => { synthRef.current = window.speechSynthesis }, [])

  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(messages)) } catch (e) { console.warn('[Chat] Failed to save messages:', e) }
  }, [messages, key])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const speak = (id: string, text: string) => {
    if (!synthRef.current) return
    if (speakingId === id) { synthRef.current.cancel(); setSpeakingId(null); return }
    synthRef.current.cancel()
    const plain = text.replace(/<[^>]*>/g, '').replace(/[#*_\[\]`>|~-]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!plain) return
    const utterance = new SpeechSynthesisUtterance(plain)
    utterance.rate = 0.95; utterance.pitch = 1.05
    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)
    setSpeakingId(id)
    synthRef.current.speak(utterance)
  }

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast({ variant:'destructive', title:'Voice not supported', description:'Try Chrome or Edge on desktop.' })
      return
    }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en'
    let finalTranscript = ''
    recognition.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalTranscript += t + ' '
        else interim += t
      }
      setInput(finalTranscript + interim)
    }
    recognition.onerror = (e: any) => { console.warn('Voice input error:', e.error); setListening(false) }
    recognition.onend = () => { setListening(false); if (finalTranscript.trim()) setInput(finalTranscript.trim()) }
    recognitionRef.current = recognition
    try { recognition.start(); setListening(true) } catch (e) { console.warn('Voice start failed:', e); setListening(false) }
  }

  const IconComp = icon === 'brain' ? Brain : Bot

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)
    try {
      const response = await onSend(text, updated)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: new Date() }])
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'Sorry, I had a connection issue. Please try again.', timestamp: new Date() }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, onSend])

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg ${className}`}
      style={height ? { height } : undefined}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600 shrink-0">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <IconComp className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">{headerTitle}</p>
          <p className="text-blue-100 text-xs truncate">{headerSubtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <IconComp className="h-4 w-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl shadow-sm overflow-hidden ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm px-4 py-3'
                  : 'bg-white border border-gray-200 rounded-bl-sm'
              }`}>
                {msg.role === 'user'
                  ? <p className="text-sm leading-relaxed">{msg.content}</p>
                  : <div className="px-4 py-3"><MarkdownRenderer content={msg.content} /></div>
                }
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1.5">
                {msg.role === 'ai' && (
                  <button
                    onClick={() => speak(msg.id, msg.content)}
                    className={`p-0.5 rounded transition-colors ${speakingId === msg.id ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                    title={speakingId === msg.id ? 'Stop' : 'Listen'}
                  >
                    {speakingId === msg.id ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </button>
                )}
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <IconComp className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
                <span className="text-xs text-gray-400 ml-2">Thinking…</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {quickPrompts.length > 0 && (
        <div className="flex gap-2 px-4 py-2 bg-white border-t border-gray-100 overflow-x-auto shrink-0">
          {quickPrompts.map(p => (
            <button key={p} onClick={() => { setInput(p); inputRef.current?.focus() }}
              className="text-xs whitespace-nowrap px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 transition-colors font-medium shrink-0">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-end gap-2 border border-gray-300 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={1}
            placeholder={placeholder}
            className="flex-1 resize-none border-0 focus:outline-none bg-transparent text-sm p-0 min-h-[24px] max-h-32 leading-relaxed placeholder:text-gray-400"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <button
            onClick={startVoiceInput}
            disabled={loading}
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              listening
                ? 'bg-red-500 text-white shadow-sm animate-pulse'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={listening ? 'Stop recording' : 'Voice input'}
          >
            {listening ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0 transition-all hover:shadow-md hover:from-blue-500 hover:to-purple-500 active:scale-95"
          >
            {loading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">Enter to send · Shift+Enter for new line · Click mic for voice</p>
      </div>
    </div>
  )
}
