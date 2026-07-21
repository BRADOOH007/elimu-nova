'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen, Brain, ClipboardList, NotebookPen, CheckCircle, AlertCircle,
  Send, Loader2, RefreshCw, Play, Target, Clock, Upload, X, File,
  ChevronLeft, ChevronRight, Award, Star, Zap, Paperclip, Eye, Download
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { ClientDate } from '@/components/ui/client-date'

// ── Types ─────────────────────────────────────────────────────────────────
interface Assignment {
  id: string; title: string; description: string; content: string
  dueDate: string; status: string; subject: string; grade: number | null
  teacher: { firstName: string; lastName: string }
  submissions?: Array<{ grade: number | null; feedback: string | null; submittedAt: string }>
}
interface QuizQ {
  question: string; type: string; level?: string; levelNumber?: number
  options?: string[]; correct_answer?: number; model_answer?: string
  explanation: string; cognitive_skill?: string
}
interface ChatMsg { role: 'user' | 'ai'; content: string }

const SUBJECTS = [
  'Mathematics','English','Kiswahili','Science','Social Studies',
  'CRE','Physics','Chemistry','Biology','History','Geography',
  'Agriculture','Business Studies','Computer Studies',
  'Coding','Programming','Web Development','Python'
]

export default function LearnPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState('study')

  // ── STUDY state ──────────────────────────────────────────────────────
  const [studySubject, setStudySubject] = useState('Mathematics')
  const [studyTopic,   setStudyTopic]   = useState('')
  const [studying,     setStudying]     = useState(false)
  const [lessonMd,     setLessonMd]     = useState('')
  const [notes,        setNotes]        = useState('')
  const [savedNotes,   setSavedNotes]   = useState<Array<{id:string;text:string;topic:string}>>([])

  // ── QUIZ state ───────────────────────────────────────────────────────
  const [quizSubject,   setQuizSubject]   = useState('Mathematics')
  const [quizTopic,     setQuizTopic]     = useState('')
  const [quizGrade,     setQuizGrade]     = useState('Grade 4')
  const [quizType,      setQuizType]      = useState<'checkpoint'|'blooms'>('blooms')
  const [genQuiz,       setGenQuiz]       = useState(false)
  const [questions,     setQuestions]     = useState<QuizQ[]>([])
  const [qIndex,        setQIndex]        = useState(0)
  const [answers,       setAnswers]       = useState<Record<number,string|number>>({})
  const [showAns,       setShowAns]       = useState<Record<number,boolean>>({})
  const [submitted,     setSubmitted]     = useState(false)
  const [score,         setScore]         = useState(0)
  const [timeLeft,      setTimeLeft]      = useState(0)
  const timerRef = useRef<NodeJS.Timeout>(null)

  // ── ASSIGNMENTS state ────────────────────────────────────────────────
  const [assignments,  setAssignments]  = useState<Assignment[]>([])
  const [loadingAssn,  setLoadingAssn]  = useState(true)
  const [selAssn,      setSelAssn]      = useState<Assignment | null>(null)
  const [submitText,   setSubmitText]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [attachments,  setAttachments]  = useState<Array<{url:string;name:string}>>([])
  const [uploading,    setUploading]    = useState(false)
  const [result,       setResult]       = useState<{grade?:number;feedback?:string}|null>(null)

  // ── AI TUTOR state ───────────────────────────────────────────────────
  const [chat,        setChat]        = useState<ChatMsg[]>([
    { role:'ai', content:"Hi! I'm your AI tutor. Ask me anything — I can explain concepts, help with homework, generate practice questions, or guide you through any topic. What would you like to learn?" }
  ])
  const [chatInput,   setChatInput]   = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchAssignments() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [chat])

  // ── Timer for quiz ───────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      return () => clearTimeout(timerRef.current!)
    }
    if (timeLeft === 0 && questions.length > 0 && !submitted) handleSubmitQuiz()
  }, [timeLeft, submitted, questions.length])

  const fetchAssignments = async () => {
    setLoadingAssn(true)
    try {
      const r = await fetch('/api/student/assignments?includeCompleted=true')
      if (r.ok) { const d = await r.json(); setAssignments(d.assignments || []) }
    } finally { setLoadingAssn(false) }
  }

  // ── STUDY: generate lesson ───────────────────────────────────────────
  const generateLesson = async () => {
    if (!studyTopic.trim()) { toast({ variant:'destructive', title:'Enter a topic first' }); return }
    setStudying(true); setLessonMd('')
    try {
      const r = await fetch('/api/ai/generate-lesson-content', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ lesson:{ title:studyTopic, subject:studySubject }, studentLevel:'intermediate', learningStyle:'visual' })
      })
      const d = await r.json()
      if (r.ok) setLessonMd(d.content || '')
      else throw new Error(d.error)
    } catch(e:any) { toast({ variant:'destructive', title:'Could not generate lesson', description:e.message }) }
    finally { setStudying(false) }
  }

  const saveNote = () => {
    if (!notes.trim()) return
    setSavedNotes(p => [{ id:Date.now().toString(), text:notes, topic:studyTopic||studySubject }, ...p])
    setNotes('')
    toast({ title:'📝 Note saved!' })
  }

  const downloadNotes = () => {
    const text = savedNotes.map(n => `[${n.topic}]\n${n.text}`).join('\n\n---\n\n')
    const blob = new Blob([text], { type:'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='my_notes.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── QUIZ: generate ───────────────────────────────────────────────────
  const generateQuiz = async () => {
    if (!quizTopic.trim()) { toast({ variant:'destructive', title:'Enter a topic first' }); return }
    setGenQuiz(true); setQuestions([]); setAnswers({}); setSubmitted(false); setShowAns({}); setQIndex(0)
    try {
      const endpoint = quizType === 'blooms' ? '/api/ai/bloom-quiz' : '/api/ai/checkpoint-quiz'
      const r = await fetch(endpoint, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ subject:quizSubject, grade:quizGrade, topic:quizTopic })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      const qs = d.questions || []
      setQuestions(qs)
      setTimeLeft(qs.length * 90) // 90s per question
      toast({ title:`✅ ${qs.length} questions ready!` })
    } catch(e:any) { toast({ variant:'destructive', title:'Quiz generation failed', description:e.message }) }
    finally { setGenQuiz(false) }
  }

  const handleSubmitQuiz = useCallback(() => {
    clearTimeout(timerRef.current!)
    let correct = 0
    questions.forEach((q, i) => {
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (answers[i] !== undefined && Number(answers[i]) === q.correct_answer) correct++
      }
    })
    const mcqs = questions.filter(q => q.type === 'multiple_choice' || q.type === 'true_false').length
    setScore(mcqs > 0 ? Math.round((correct / mcqs) * 100) : 0)
    setSubmitted(true)
  }, [questions, answers])

  const fmtTime = (s:number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

  // ── ASSIGNMENT: submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selAssn || (!submitText.trim() && attachments.length === 0)) return
    setSubmitting(true); setResult(null)
    try {
      const r = await fetch(`/api/assignments/${selAssn.id}/submit`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ content: submitText||'(See attached)', attachments: attachments.map(a=>a.url) })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setResult({ grade: d.submission?.grade, feedback: d.submission?.feedback })
      await fetchAssignments()
      toast({ title:'✅ Submitted successfully!' })
    } catch(e:any) { setResult({ feedback: e.message }); toast({ variant:'destructive', title:'Submit failed' }) }
    finally { setSubmitting(false) }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData(); fd.append('file', file)
        const r = await fetch('/api/student/upload', { method:'POST', body:fd })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        setAttachments(p => [...p, { url:d.url, name:d.name }])
      }
    } catch(e:any) { toast({ variant:'destructive', title:'Upload failed', description:e.message }) }
    finally { setUploading(false); e.target.value='' }
  }

  // ── AI TUTOR: send ───────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim(); setChatInput('')
    setChat(p => [...p, { role:'user', content:msg }])
    setChatLoading(true)
    try {
      const r = await fetch('/api/ai/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message:msg, context:'student_tutor' })
      })
      const d = await r.json()
      setChat(p => [...p, { role:'ai', content: d.response || 'Sorry, I could not respond right now.' }])
    } catch { setChat(p => [...p, { role:'ai', content:"I'm having a brief issue. Please try again!" }]) }
    finally { setChatLoading(false) }
  }

  const statusColor = (s:string) => ({
    GRADED:'bg-green-100 text-green-800', OVERDUE:'bg-red-100 text-red-800',
    SUBMITTED:'bg-blue-100 text-blue-800', PENDING:'bg-yellow-100 text-yellow-800'
  }[s] || 'bg-gray-100 text-gray-700')

  // ── UI ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Learning Hub</h1>
        <p className="text-slate-500 text-sm">Study · Quiz · Assignments · AI Tutor</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full overflow-x-auto flex">
          <TabsTrigger value="study" className="shrink-0"><BookOpen className="w-4 h-4 mr-1.5"/>Study</TabsTrigger>
          <TabsTrigger value="quiz" className="shrink-0"><Target className="w-4 h-4 mr-1.5"/>Quiz</TabsTrigger>
          <TabsTrigger value="assignments" className="shrink-0"><ClipboardList className="w-4 h-4 mr-1.5"/>
            Assignments{assignments.filter(a=>a.status==='PENDING'||a.status==='OVERDUE').length > 0 &&
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">
                {assignments.filter(a=>a.status==='PENDING'||a.status==='OVERDUE').length}
              </span>}
          </TabsTrigger>
          <TabsTrigger value="tutor" className="shrink-0"><Brain className="w-4 h-4 mr-1.5"/>AI Tutor</TabsTrigger>
        </TabsList>

        {/* ── STUDY TAB ───────────────────────────────────────────── */}
        <TabsContent value="study" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-600"/>Generate Study Lesson</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Subject</label>
                  <select value={studySubject} onChange={e=>setStudySubject(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Topic *</label>
                  <input value={studyTopic} onChange={e=>setStudyTopic(e.target.value)}
                    placeholder="e.g. Fractions" onKeyDown={e=>e.key==='Enter'&&generateLesson()}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>
              <Button onClick={generateLesson} disabled={studying||!studyTopic.trim()} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                {studying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Generating…</> : <><Play className="h-4 w-4 mr-2"/>Study This Topic</>}
              </Button>
            </CardContent>
          </Card>

          {lessonMd && (
            <Card className="border-0 shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">AI Lesson</p>
                    <CardTitle className="text-lg text-white font-extrabold">
                      {studyTopic} — {studySubject}
                    </CardTitle>
                  </div>
                  <button
                    onClick={() => setLessonMd('')}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-h-[600px] overflow-y-auto pr-1">
                  <MarkdownRenderer content={lessonMd} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><NotebookPen className="h-4 w-4 text-amber-600"/>My Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="Type your notes here..." rows={4} className="resize-none"/>
              <div className="flex gap-2">
                <Button onClick={saveNote} disabled={!notes.trim()} size="sm" className="bg-amber-500 hover:bg-amber-600">
                  <NotebookPen className="h-3.5 w-3.5 mr-1.5"/>Save Note
                </Button>
                {savedNotes.length > 0 && (
                  <Button onClick={downloadNotes} variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1.5"/>Download All
                  </Button>
                )}
              </div>
              {savedNotes.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedNotes.map(n=>(
                    <div key={n.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-amber-700 mb-1">{n.topic}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── QUIZ TAB ────────────────────────────────────────────── */}
        <TabsContent value="quiz" className="space-y-4 mt-4">
          {genQuiz && questions.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-purple-400" />
                    </span>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-semibold text-slate-700">Generating your quiz…</p>
                    <p className="text-xs text-slate-400">Creating {quizType === 'blooms' ? '6 Bloom\'s taxonomy' : '5 checkpoint'} questions for {quizSubject} — {quizTopic}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-2 w-8 rounded-full bg-purple-200 animate-pulse`} style={{ animationDelay: `${i*0.15}s` }} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-purple-600"/>Generate Quiz</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Subject</label>
                    <select value={quizSubject} onChange={e=>setQuizSubject(e.target.value)}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Grade</label>
                    <select value={quizGrade} onChange={e=>setQuizGrade(e.target.value)}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4'].map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Topic *</label>
                    <input value={quizTopic} onChange={e=>setQuizTopic(e.target.value)}
                      placeholder="e.g. Fractions"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['blooms','checkpoint'] as const).map(t=>(
                    <button key={t} onClick={()=>setQuizType(t)}
                      className={`flex-1 h-9 text-sm font-semibold rounded-lg border transition-all ${quizType===t?'bg-purple-600 text-white border-transparent':'border-slate-200 text-slate-600 hover:border-purple-300'}`}>
                      {t==='blooms'?'Bloom\'s (6 levels)':'Checkpoint (5 quick)'}
                    </button>
                  ))}
                </div>
                <Button onClick={generateQuiz} disabled={genQuiz||!quizTopic.trim()} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                  {genQuiz ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Generating…</> : <><Zap className="h-4 w-4 mr-2"/>Generate Quiz</>}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Timer + progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">Q{qIndex+1}/{questions.length}</span>
                  <Progress value={((qIndex+1)/questions.length)*100} className="w-32 h-2"/>
                </div>
                <div className="flex items-center gap-3">
                  {timeLeft > 0 && !submitted && (
                    <div className={`flex items-center gap-1 text-sm font-bold ${timeLeft<30?'text-red-600':'text-slate-600'}`}>
                      <Clock className="h-4 w-4"/>{fmtTime(timeLeft)}
                    </div>
                  )}
                  <button onClick={()=>{setQuestions([]);setAnswers({});setSubmitted(false)}}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5"/>New quiz
                  </button>
                </div>
              </div>

              {/* Score banner */}
              {submitted && (
                <div className={`rounded-2xl p-4 text-center ${score>=70?'bg-green-50 border border-green-200':score>=50?'bg-amber-50 border border-amber-200':'bg-red-50 border border-red-200'}`}>
                  <Award className={`h-8 w-8 mx-auto mb-2 ${score>=70?'text-green-600':score>=50?'text-amber-600':'text-red-600'}`}/>
                  <p className="text-2xl font-black text-slate-900">{score}%</p>
                  <p className="text-sm text-slate-600">{score>=80?'Excellent! 🎉':score>=60?'Good work! 👍':score>=40?'Keep practising! 💪':'Review this topic 📚'}</p>
                </div>
              )}

              {/* Current question */}
              {(() => {
                const q = questions[qIndex]
                const isAnswered = answers[qIndex] !== undefined
                const isCorrect = submitted && (q.type==='multiple_choice'||q.type==='true_false') && Number(answers[qIndex])===q.correct_answer
                return (
                  <Card className={submitted&&(q.type==='multiple_choice'||q.type==='true_false') ? (isCorrect?'border-green-300 bg-green-50/30':'border-red-300 bg-red-50/30') : ''}>
                    <CardContent className="pt-5 space-y-4">
                      {q.level && <Badge className="bg-purple-100 text-purple-800 text-xs">{q.level} — {q.cognitive_skill}</Badge>}
                      <p className="font-semibold text-slate-800 leading-relaxed">{q.question}</p>

                      {/* MCQ options */}
                      {(q.type==='multiple_choice'||q.type==='true_false') && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt,i)=>{
                            const sel = answers[qIndex]===i
                            const correct = submitted && i===q.correct_answer
                            const wrong   = submitted && sel && i!==q.correct_answer
                            return (
                              <button key={i} disabled={submitted}
                                onClick={()=>!submitted&&setAnswers(p=>({...p,[qIndex]:i}))}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm
                                  ${correct?'bg-green-100 border-green-400 text-green-800':
                                    wrong?'bg-red-100 border-red-400 text-red-800':
                                    sel?'bg-blue-100 border-blue-400 text-blue-800':
                                    'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                  ${correct?'bg-green-500 text-white':wrong?'bg-red-500 text-white':sel?'bg-blue-500 text-white':'bg-slate-100 text-slate-500'}`}>
                                  {String.fromCharCode(65+i)}
                                </span>
                                {opt}
                                {correct && <CheckCircle className="ml-auto h-4 w-4 text-green-600 shrink-0"/>}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Open-ended */}
                      {q.type!=='multiple_choice'&&q.type!=='true_false'&&(
                        <div className="space-y-2">
                          <Textarea disabled={submitted}
                            value={typeof answers[qIndex]==='string'?answers[qIndex] as string:''}
                            onChange={e=>!submitted&&setAnswers(p=>({...p,[qIndex]:e.target.value}))}
                            placeholder="Write your answer here..." rows={3} className="resize-none"/>
                          {submitted && (
                            <div>
                              <button onClick={()=>setShowAns(p=>({...p,[qIndex]:!p[qIndex]}))}
                                className="text-xs text-blue-600 hover:underline">
                                {showAns[qIndex]?'Hide':'Show'} model answer
                              </button>
                              {showAns[qIndex] && (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                                  {q.model_answer}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {submitted && q.explanation && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                          <span className="font-bold">Explanation: </span>{q.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={()=>setQIndex(i=>Math.max(0,i-1))} disabled={qIndex===0} size="sm">
                  <ChevronLeft className="h-4 w-4"/>Prev
                </Button>
                {qIndex<questions.length-1 ? (
                  <Button onClick={()=>setQIndex(i=>i+1)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Next<ChevronRight className="h-4 w-4"/>
                  </Button>
                ) : !submitted ? (
                  <Button onClick={handleSubmitQuiz} size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1.5"/>Submit Quiz
                  </Button>
                ) : (
                  <span className="text-sm text-slate-500">Quiz complete!</span>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── ASSIGNMENTS TAB ──────────────────────────────────── */}
        <TabsContent value="assignments" className="space-y-4 mt-4">
          {selAssn ? (
            <div className="space-y-4">
              <button onClick={()=>{setSelAssn(null);setResult(null);setSubmitText('');setAttachments([])}}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                <ChevronLeft className="h-4 w-4"/>Back to list
              </button>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{selAssn.title}</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">{selAssn.subject} · Due <ClientDate date={selAssn.dueDate} /></p>
                    </div>
                    <Badge className={statusColor(selAssn.status)}>{selAssn.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                    {selAssn.description}
                  </div>
                  {selAssn.content && (
                    <div className="max-h-64 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <MarkdownRenderer content={selAssn.content} />
                    </div>
                  )}

                  {/* Previous submission */}
                  {selAssn.submissions && selAssn.submissions.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
                      <p className="font-semibold text-green-800 mb-1">Previously submitted</p>
                      {selAssn.submissions[0].grade!=null && <p className="text-green-700">Grade: {Math.round(selAssn.submissions[0].grade)}%</p>}
                      {selAssn.submissions[0].feedback && <p className="text-green-700 mt-1">{selAssn.submissions[0].feedback}</p>}
                    </div>
                  )}

                  {/* Submit form */}
                  {(selAssn.status==='PENDING'||selAssn.status==='OVERDUE') && !result && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-600">Your answer</p>
                      <Textarea value={submitText} onChange={e=>setSubmitText(e.target.value)}
                        placeholder="Type your answer here..." rows={5} className="resize-none"/>
                      <label className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading?'border-blue-300 bg-blue-50':'border-slate-200 hover:border-blue-300'}`}>
                        <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading}
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"/>
                        {uploading ? <><Loader2 className="h-4 w-4 text-blue-500 animate-spin"/><span className="text-sm text-blue-600">Uploading…</span></> :
                                     <><Paperclip className="h-4 w-4 text-slate-400"/><span className="text-sm text-slate-500">Attach files (images, PDF, Word)</span></>}
                      </label>
                      {attachments.length > 0 && attachments.map((a,i)=>(
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 border rounded-lg text-sm">
                          <File className="h-4 w-4 text-blue-500 shrink-0"/>
                          <span className="flex-1 truncate text-blue-600">{a.name}</span>
                          <button onClick={()=>setAttachments(p=>p.filter((_,j)=>j!==i))}><X className="h-4 w-4 text-slate-400 hover:text-red-500"/></button>
                        </div>
                      ))}
                      <Button onClick={handleSubmit} disabled={submitting||uploading||(!submitText.trim()&&attachments.length===0)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90">
                        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Submitting…</> : <><Upload className="h-4 w-4 mr-2"/>Submit for AI Grading</>}
                      </Button>
                    </div>
                  )}

                  {/* Result */}
                  {result && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600"/><span className="font-semibold text-green-800">Submitted!</span></div>
                      {result.grade != null && <p className="text-green-700 font-bold text-lg">{Math.round(result.grade)}%</p>}
                      {result.feedback && <MarkdownRenderer content={result.feedback} className="text-sm text-green-700" />}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-3">
              {loadingAssn ? (
                <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500"/></div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-16">
                  <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3"/>
                  <p className="text-slate-500 font-medium">No assignments yet</p>
                  <p className="text-slate-400 text-sm">Your teacher will post assignments here</p>
                </div>
              ) : (
                assignments.map(a=>(
                  <div key={a.id} onClick={()=>{setSelAssn(a);setResult(null);setSubmitText('');setAttachments([])}}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate group-hover:text-blue-700">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.subject} · Due <ClientDate date={a.dueDate} /></p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {a.grade!=null && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{Math.round(a.grade)}%</span>}
                      <Badge className={`text-xs ${statusColor(a.status)}`}>{a.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500"/>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* ── AI TUTOR TAB ─────────────────────────────────────── */}
        <TabsContent value="tutor" className="mt-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">AI Tutor</p>
                <p className="text-blue-100 text-xs">Ask anything · Get instant explanations</p>
              </div>
            </div>

            {/* Messages — fixed height, internal scroll only */}
            <div className="flex flex-col" style={{ height: '60vh' }}>
              <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4 min-h-0">
                {chat.map((m, i) => (
                  <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl shadow-sm overflow-hidden ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm px-4 py-3'
                          : 'bg-white border border-slate-200 rounded-bl-sm'
                      }`}>
                        {m.role === 'user'
                          ? <p className="text-sm leading-relaxed">{m.content}</p>
                          : <div className="px-4 py-3"><MarkdownRenderer content={m.content} /></div>
                        }
                      </div>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                        <span className="text-xs text-slate-400 ml-2">AI is thinking…</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick prompts */}
              <div className="flex gap-2 px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto flex-shrink-0">
                {['Explain simply', 'Practice questions', 'Key formulas', 'Quiz me!', 'Summarise topic'].map(p => (
                  <button key={p} onClick={() => setChatInput(p)}
                    className="text-xs whitespace-nowrap px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 transition-colors font-medium flex-shrink-0">
                    {p}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
                <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-4 py-2">
                  <Textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    rows={1}
                    placeholder="Ask anything — explain, practice, quiz me…"
                    className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm p-0 min-h-[24px] max-h-28"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                  />
                  <Button
                    onClick={sendChat}
                    disabled={!chatInput.trim() || chatLoading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl h-9 w-9 p-0 shrink-0 disabled:opacity-40"
                  >
                    {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
