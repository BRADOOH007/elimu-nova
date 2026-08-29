"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LessonCompletionCelebration } from "@/components/ui/lesson-completion-celebration"
import { getCurriculum } from "@/lib/curricula"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Sparkles, Send, Loader2, AlertCircle, Mic, Zap, Trophy, Flame, Star, BookOpen, Copy, Check, Lightbulb, Target, HelpCircle, Brain, Code2, Compass, Volume2
} from "lucide-react"

const CodingTab = dynamic(() => import('@/app/student/coding/page'), { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })
const CareerTab = dynamic(() => import('@/app/student/career/page'), { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })

interface TutorTask { subject: string; topic: string; mode: 'teach' | 'practice' | 'quiz' | 'revise'; objective: string; estimatedMinutes: number; difficulty: 'easy' | 'medium' | 'hard'; context?: any }
interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date }
interface StudentStats { xp: number; streak: number; masteryScore: number; totalQuestions: number; correctAnswers: number }

const QUICK_ACTIONS = [
  { label: 'Explain this topic', icon: Lightbulb, prompt: 'Can you explain {topic} in simple terms?' },
  { label: 'Show an example', icon: Target, prompt: 'Can you give me a worked example for {topic}?' },
  { label: 'Practice question', icon: HelpCircle, prompt: 'Give me a practice question on {topic}' },
  { label: 'Test my knowledge', icon: Trophy, prompt: 'Quiz me on {topic} with 3 questions' },
]

export default function AITutorPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('workspace')
  const [currentTask, setCurrentTask] = useState<TutorTask | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTask, setIsLoadingTask] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StudentStats>({ xp: 0, streak: 0, masteryScore: 0, totalQuestions: 0, correctAnswers: 0 })
  const [showCelebration, setShowCelebration] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const name = session?.user?.name?.split(' ')[0] || 'Student'

  const [curriculum, setCurriculum] = useState('')
  const [country, setCountry] = useState('')

  useEffect(() => {
    fetch('/api/user-preferences').then(r => r.json()).then(d => {
      setCurriculum(d.curriculum || '')
      setCountry(d.country || '')
    }).catch(() => {})
  }, [])

  const curriculumLabel = curriculum
    ? (getCurriculum(curriculum)?.name?.split(' (')[0] || curriculum)
    : 'Personalized'

  const loadCurrentTask = async () => {
    setIsLoadingTask(true)
    try {
      const res = await fetch('/api/student/ai-tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'resume' }) })
      if (res.ok) { const data = await res.json(); setCurrentTask(data.task); setStats(data.stats || { xp: 0, streak: 0, masteryScore: 0, totalQuestions: 0, correctAnswers: 0 }); if (data.messages) setMessages(data.messages) }
    } catch { setError('Could not load tutor session') }
    finally { setIsLoadingTask(false) }
  }

  useEffect(() => { loadCurrentTask(); const i = setInterval(loadCurrentTask, 300000); return () => clearInterval(i) }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || inputMessage
    if (!msg.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(p => [...p, userMsg])
    setInputMessage("")
    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: messages.map(m => ({ role: m.role, content: m.content })), context: 'student_tutor', studentName: name, subject: currentTask?.subject || curriculumLabel, topic: currentTask?.topic || '', curriculum, country, messages: messages.map(m => ({ role: m.role, content: m.content })) }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMessages(p => [...p, { role: 'assistant', content: data.response || 'Sorry, I had trouble with that.', timestamp: new Date() }])
    } catch { setMessages(p => [...p, { role: 'assistant', content: 'Sorry, something went wrong. Try again?', timestamp: new Date() }]) }
    finally { setIsLoading(false); inputRef.current?.focus() }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
  const copyMessage = async (content: string, idx: number) => { await navigator.clipboard.writeText(content); setCopiedId(idx); setTimeout(() => setCopiedId(null), 2000) }

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    if (recognitionRef.current) { recognitionRef.current.stop(); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('')
      setInputMessage(transcript)
      if (event.results[0]?.isFinal) { recognition.stop(); setIsListening(false); setTimeout(() => sendMessage(transcript), 500) }
    }
    recognition.onerror = () => { setIsListening(false); recognitionRef.current = null }
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null }
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const speakMessage = (content: string) => {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const plain = content.replace(/[#*`\[\]>|~_-]/g, ' ').trim()
    const utterance = new SpeechSynthesisUtterance(plain)
    const voices = synth.getVoices()
    const female = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'))
    if (female) utterance.voice = female
    utterance.rate = 0.95
    synth.speak(utterance)
  }

  const topic = currentTask?.topic || 'this topic'

  if (isLoadingTask) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-purple-500" /></div>

  const chatContent = (
    <>
      {showCelebration && <LessonCompletionCelebration show={showCelebration} lessonTitle={currentTask ? `${currentTask.subject}: ${currentTask.topic}` : undefined} xpEarned={stats.xp} onClose={() => setShowCelebration(false)} onNext={() => { setShowCelebration(false); loadCurrentTask() }} />}

      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-extrabold flex items-center gap-2"><Sparkles className="h-5 w-5" />Hope AI Workspace</h1>
            <p className="text-purple-200 text-sm">Personalized {curriculumLabel} Tutoring for {name}{currentTask ? ` · ${currentTask.subject}: ${currentTask.topic}` : ''}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-sm"><Zap className="h-4 w-4 inline mr-1 text-amber-300" />{stats.xp} XP</div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-sm"><Flame className="h-4 w-4 inline mr-1 text-orange-300" />{stats.streak}</div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-sm"><Star className="h-4 w-4 inline mr-1 text-yellow-300" />{stats.masteryScore}%</div>
          </div>
        </div>
      </div>

      {currentTask && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2"><Badge className="bg-purple-100 text-purple-700 border-0 px-3 py-1">{currentTask.mode.toUpperCase()}</Badge><span className="font-bold text-slate-800">{currentTask.subject}: {currentTask.topic}</span></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className="border-slate-200">{currentTask.difficulty}</Badge><span className="text-xs text-slate-400">~{currentTask.estimatedMinutes}m</span></div>
          </div>
          {stats.totalQuestions > 0 && <div><div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span>{stats.correctAnswers}/{stats.totalQuestions}</span></div><Progress value={(stats.correctAnswers / Math.max(1, stats.totalQuestions)) * 100} className="h-2" /></div>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chat */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[580px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' ? (
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 ring-2 ring-purple-100"><Sparkles className="h-4 w-4 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none text-slate-800 text-sm shadow-xs">
                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-code:bg-slate-200 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-800 prose-pre:text-slate-100"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60">
                          <button onClick={() => copyMessage(msg.content, idx)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">{copiedId === idx ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}</button>
                          <button onClick={() => speakMessage(msg.content)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" title="Read aloud"><Volume2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl rounded-tr-none text-sm max-w-lg"><p className="whitespace-pre-wrap">{msg.content}</p></div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-purple-500" /></div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-3"><div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips */}
          <div className="px-4 pt-2 pb-0 flex gap-2 overflow-x-auto border-t border-slate-100">
            {['Explain simply', 'Practice question', 'Real-world example', 'Step by step'].map(chip => (
              <button key={chip} onClick={() => sendMessage(chip)} className="shrink-0 text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full px-3 py-1.5 transition-colors">{chip}</button>
            ))}
          </div>

          {/* Input bar */}
          <div className="border-t border-slate-200 p-3">
            {error && <div className="mb-2 p-2.5 bg-red-50 rounded-xl flex items-center gap-2 text-red-700 text-xs"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
            <div className="flex items-end gap-2">
              <textarea ref={inputRef} value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={`Ask Hope about ${topic}...`} rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[42px] max-h-32"
                disabled={isLoading} />
              <button onClick={startVoiceInput}
                className={`p-2.5 rounded-xl transition-colors shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-slate-600'}`} title="Voice input">
                <Mic className="h-5 w-5" />
              </button>
              <button onClick={() => sendMessage()} disabled={isLoading || !inputMessage.trim()}
                className="bg-purple-600 text-white p-2.5 rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center shrink-0 disabled:opacity-40">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions sidebar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Quick Actions</p>
          {QUICK_ACTIONS.map((action) => (
            <button key={action.label} onClick={() => sendMessage(action.prompt.replace('{topic}', topic))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium transition-all hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 bg-white">
              <action.icon className="h-4 w-4 text-purple-500 shrink-0" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 rounded-xl gap-1">
          <TabsTrigger value="workspace" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-4 py-2"><Brain className="h-4 w-4 mr-1.5" />AI Workspace</TabsTrigger>
          <TabsTrigger value="coding" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-lg px-4 py-2"><Code2 className="h-4 w-4 mr-1.5" />Coding Lab</TabsTrigger>
          <TabsTrigger value="career" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg px-4 py-2"><Compass className="h-4 w-4 mr-1.5" />Career Path</TabsTrigger>
        </TabsList>
        <TabsContent value="workspace" className="mt-4 space-y-4">{chatContent}</TabsContent>
        <TabsContent value="coding" className="mt-4"><CodingTab /></TabsContent>
        <TabsContent value="career" className="mt-4"><CareerTab /></TabsContent>
      </Tabs>
    </div>
  )
}
