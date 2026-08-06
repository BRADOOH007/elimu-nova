"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LessonCompletionCelebration } from "@/components/ui/lesson-completion-celebration"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Sparkles, Send, Loader2, AlertCircle, Target, Zap, Trophy, Flame, Star, BookOpen, RefreshCw, User, Copy, Check
} from "lucide-react"

interface TutorTask {
  subject: string; topic: string; mode: 'teach' | 'practice' | 'quiz' | 'revise'
  objective: string; estimatedMinutes: number; difficulty: 'easy' | 'medium' | 'hard'; context?: any
}

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date }

interface StudentStats { xp: number; streak: number; masteryScore: number; totalQuestions: number; correctAnswers: number }

export default function AITutorPage() {
  const { data: session } = useSession()
  const [currentTask, setCurrentTask] = useState<TutorTask | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTask, setIsLoadingTask] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StudentStats>({ xp: 0, streak: 0, masteryScore: 0, totalQuestions: 0, correctAnswers: 0 })
  const [showCelebration, setShowCelebration] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const name = session?.user?.name?.split(' ')[0] || 'Student'
  const subject = currentTask?.subject || 'CBC'

  const loadCurrentTask = async () => {
    setIsLoadingTask(true)
    try {
      const res = await fetch('/api/student/ai-tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'resume' }) })
      if (res.ok) {
        const data = await res.json()
        setCurrentTask(data.task)
        setStats(data.stats || { xp: 0, streak: 0, masteryScore: 0, totalQuestions: 0, correctAnswers: 0 })
        if (data.messages) setMessages(data.messages)
      }
    } catch { setError('Could not load tutor session') }
    finally { setIsLoadingTask(false) }
  }

  useEffect(() => {
    loadCurrentTask()
    const interval = setInterval(loadCurrentTask, 300000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: inputMessage, timestamp: new Date() }
    setMessages(p => [...p, userMsg])
    setInputMessage("")
    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          context: 'student_tutor',
          studentName: name,
          subject,
          topic: currentTask?.topic || '',
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMessages(p => [...p, { role: 'assistant', content: data.response || 'Sorry, I had trouble processing that.', timestamp: new Date() }])
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: 'Sorry, something went wrong. Try again?', timestamp: new Date() }])
    } finally { setIsLoading(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const copyMessage = async (content: string, idx: number) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(idx); setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoadingTask) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-purple-500" /></div>

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      {showCelebration && (
        <LessonCompletionCelebration show={showCelebration} lessonTitle={currentTask ? `${currentTask.subject}: ${currentTask.topic}` : undefined} xpEarned={stats.xp} onClose={() => setShowCelebration(false)} onNext={() => { setShowCelebration(false); loadCurrentTask() }} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-extrabold flex items-center gap-2"><Sparkles className="h-5 w-5" />Hope AI Workspace</h1>
            <p className="text-purple-200 text-sm">Personalized CBC Tutoring for {name}{currentTask ? ` · ${currentTask.subject}: ${currentTask.topic}` : ''}</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-sm"><Zap className="h-4 w-4 inline mr-1 text-amber-300" />{stats.xp} XP</div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-sm"><Flame className="h-4 w-4 inline mr-1 text-orange-300" />{stats.streak}</div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-sm"><Star className="h-4 w-4 inline mr-1 text-yellow-300" />{stats.masteryScore}%</div>
          </div>
        </div>
      </div>

      {/* Active task + progress */}
      {currentTask && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 border-0 px-3 py-1">{currentTask.mode.toUpperCase()}</Badge>
              <span className="font-bold text-slate-800">{currentTask.subject}: {currentTask.topic}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-slate-200">{currentTask.difficulty}</Badge>
              <span className="text-xs text-slate-400">~{currentTask.estimatedMinutes}m</span>
            </div>
          </div>
          {stats.totalQuestions > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span>{stats.correctAnswers}/{stats.totalQuestions}</span></div>
              <Progress value={(stats.correctAnswers / Math.max(1, stats.totalQuestions)) * 100} className="h-2" />
            </div>
          )}
        </div>
      )}

      {/* Chat window */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' ? (
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 ring-2 ring-purple-100">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none text-slate-800 text-sm shadow-xs">
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-code:bg-slate-200 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-800 prose-pre:text-slate-100">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60">
                        <button onClick={() => copyMessage(msg.content, idx)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                          {copiedId === idx ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl rounded-tr-none text-sm max-w-lg">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-purple-500" /></div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips */}
        <div className="px-4 pt-2 pb-0 flex gap-2 overflow-x-auto border-t border-slate-100">
          {['Explain this in simple terms', 'Give me a practice question', 'Show a real-world example', 'Break it down step by step'].map(chip => (
            <button key={chip} onClick={() => { setInputMessage(chip); sendMessage() }}
              className="shrink-0 text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full px-3 py-1.5 transition-colors">{chip}</button>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-4">
          {error && <div className="mb-3 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="flex gap-2">
            <textarea value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Ask Hope about ${currentTask?.topic || 'anything'}...`} rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[42px] max-h-32"
              disabled={isLoading} />
            <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
