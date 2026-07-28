'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Send, Globe } from 'lucide-react'

interface Message {
  role: 'user' | 'ai'
  text: string
  language: 'en' | 'sw'
}

const VOICE_LANGUAGES = [
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪', voiceHint: 'sw-KE' },
  { code: 'en', label: 'English', flag: '🇬🇧', voiceHint: 'en-US' },
] as const

export function VoiceAITutor({ subject, topic, studentId }: { subject?: string; topic?: string; studentId?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Karibu! Mimi ni mwalimu wako wa AI. Ninaweza kukusaidia kwa masomo yako kwa Kiswahili au Kiingereza. Una swali gani leo?', language: 'sw' },
  ])
  const [input, setInput] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState<'en' | 'sw'>('sw')
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [recognitionSupported, setRecognitionSupported] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef(window.speechSynthesis)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setVoiceSupported('speechSynthesis' in window)
    setRecognitionSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = useCallback((text: string, lang: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'sw' ? 'sw-KE' : 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1.1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionSupported) return
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'sw' ? 'sw-KE' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [language, recognitionSupported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return
    const userMsg: Message = { role: 'user', text: input.trim(), language }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const langHint = language === 'sw'
        ? 'Jibu kwa Kiswahili. Kuwa msaada, rafiki, na mwalimu mzuri.'
        : 'Answer in English. Be helpful, friendly, and a great teacher.'
      const subjectHint = subject ? `Subject: ${subject}.` : ''
      const topicHint = topic ? `Topic: ${topic}.` : ''

      const res = await fetch('/api/ai/voice-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), subject, topic, language }),
      })
      const data = await res.json()

      const aiMsg: Message = { role: 'ai', text: data.response || 'Samahani, jaribu tena.', language }
      setMessages(prev => [...prev, aiMsg])
      speak(aiMsg.text, language)
    } catch {
      const aiMsg: Message = { role: 'ai', text: 'Samahani, kuna tatizo la mtandao. Tafadhali jaribu tena.', language }
      setMessages(prev => [...prev, aiMsg])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, language, subject, topic, speak])

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'sw' : 'en'
    setLanguage(newLang)
    stopSpeaking()
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50/50 to-white rounded-2xl border border-blue-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Voice AI Tutor</p>
            <p className="text-[10px] text-slate-400">{language === 'sw' ? 'Kiswahili' : 'English'} mode</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {VOICE_LANGUAGES.map(lang => (
            <button key={lang.code} onClick={toggleLanguage} className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${language === lang.code ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {lang.flag} {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white border border-slate-200 shadow-sm rounded-bl-md'}`}>
              <p>{msg.text}</p>
              {msg.role === 'ai' && (
                <button onClick={() => speak(msg.text, msg.language)} className="mt-1.5 text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> Soma tena
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-blue-100 bg-white rounded-b-2xl">
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <button onClick={stopSpeaking} className="p-2.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="Stop speaking">
              <VolumeX className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => messages.length > 0 && speak(messages[messages.length - 1].text, messages[messages.length - 1].language)}
              className={`p-2.5 rounded-xl transition-colors ${voiceSupported ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
              disabled={!voiceSupported} title="Read aloud">
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          {isListening ? (
            <button onClick={stopListening} className="p-2.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors animate-pulse" title="Listening...">
              <MicOff className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={startListening} className={`p-2.5 rounded-xl transition-colors ${recognitionSupported ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
              disabled={!recognitionSupported} title="Voice input">
              <Mic className="h-4 w-4" />
            </button>
          )}
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={language === 'sw' ? "Andika swali lako..." : "Type your question..."}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          <button onClick={sendMessage} disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl transition-all ${input.trim() && !isLoading ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
