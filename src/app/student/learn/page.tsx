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
  ChevronDown, ChevronRight, ChevronLeft, Award, Star, Zap, Paperclip, Eye, Download,
  Compass, Trophy, MessagesSquare, Wand2, LayoutGrid, TrendingUp
} from 'lucide-react'
import ChatContainer from '@/components/chat/chat-container'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { ClientDate } from '@/components/ui/client-date'
import { CurriculumBrowser } from '@/components/student/curriculum-browser'
import { ProgressDashboard } from '@/components/student/progress-dashboard'
import { Recommendations } from '@/components/student/recommendations'
import { CareerAssessment } from '@/components/student/career-assessment'
import { Achievements } from '@/components/student/achievements'
import { AIWhiteboard } from '@/components/student/ai-whiteboard'
import { StudyGroups } from '@/components/student/study-groups'

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

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  Mathematics: ['Whole Numbers','Fractions','Decimals','Percentages','Measurement','Geometry','Algebra','Data Handling','Money','Time','Length, Area & Volume','Mass & Capacity','Position & Direction','Tables & Graphs','Number Patterns','Ratios & Proportions','Scale Drawing','Circles'],
  English: ['Listening & Speaking','Reading Comprehension','Grammar','Writing Composition','Vocabulary Development','Spelling','Punctuation','Poetry','Oral Narratives','Letter Writing','Creative Writing','Functional Writing'],
  Kiswahili: ['Kusikiliza na Kuzungumza','Sarufi','Msamiati','Ufahamu','Insha','Matumizi ya Lugha','Fasihi Simulizi','Ushairi'],
  Science: ['Living Things','Plants','Animals','Human Body','Energy','Light','Sound','Forces & Motion','Materials','Weather','Water','Soil','Food & Nutrition','Health Education','Simple Machines','Electricity'],
  'Social Studies': ['Our Country','Our Environment','Resources','Transport','Communication','Culture','Government','Citizenship','History of Kenya','Map Reading','Population','Trade'],
  Agriculture: ['Crop Farming','Animal Keeping','Soil Preparation','Planting','Harvesting','Farm Tools'],
  Physics: ['Forces','Motion','Energy','Waves','Light','Electricity','Magnetism','Heat Transfer','Fluids','Sound'],
  Chemistry: ['States of Matter','Mixtures','Atoms & Elements','Chemical Reactions','Acids & Bases','Water & Solutions','Periodic Table'],
  Biology: ['Cells','Classification','Nutrition','Respiration','Transport Systems','Reproduction','Ecology','Genetics','Human Health'],
  History: ['Early Man','Agriculture in Kenya','Trade','Colonial Administration','Struggle for Independence','Constitution & Governance'],
  Geography: ['Map Work','Weather & Climate','Vegetation','Soils','Mining','Forestry','Fishing','Tourism','Population','Urbanization'],
  'Computer Studies': ['Computer Basics','Operating Systems','Word Processing','Spreadsheets','Internet','Programming Concepts','Database','Networking','Data Security'],
  CRE: ['Creation','The Bible','Jesus Christ','The Early Church','Christian Values','Faith & Prayer','Community Service'],
  'Business Studies': ['Business & Its Environment','Office Practice','Entrepreneurship','Money & Banking','Trade','Consumer Protection','Financial Records'],
  'Coding': ['Algorithms','Scratch Programming','Python Basics','Web Development','HTML & CSS','JavaScript','Data Structures'],
  'Programming': ['Variables & Data Types','Conditionals','Loops','Functions','OOP','Algorithms'],
  'Web Development': ['HTML Structure','CSS Styling','JavaScript','Responsive Design','Frontend Frameworks'],
  'Python': ['Basics','Data Types','Control Flow','Functions','File I/O','Libraries'],
}

export default function LearnPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      const t = p.get('tab')
      if (t === 'quiz' || t === 'study' || t === 'assignments' || t === 'tutor' || t === 'explore' || t === 'progress' || t === 'achievements' || t === 'career' || t === 'whiteboard' || t === 'groups') return t
    }
    return 'explore'
  })

  // ── STUDY state ──────────────────────────────────────────────────────
  const [studySubject, setStudySubject] = useState('Mathematics')
  const [studyTopic,   setStudyTopic]   = useState('')
  const [studyGrade,   setStudyGrade]   = useState('Grade 4')
  const [studying,     setStudying]     = useState(false)
  const [lessonMd,     setLessonMd]     = useState('')
  const [notes,        setNotes]        = useState('')
  const [savedNotes,   setSavedNotes]   = useState<Array<{id:string;text:string;topic:string}>>([])
  const [notesOpen,    setNotesOpen]    = useState(false)
  const [studyStrands, setStudyStrands] = useState<{id:string;name:string}[]>([])
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionStart,  setSessionStart]  = useState<Date | null>(null)
  const [elapsed,       setElapsed]       = useState(0)
  const [completing,    setCompleting]    = useState(false)
  const [completed,     setCompleted]     = useState(false)
  const [teachingChat,   setTeachingChat]   = useState<ChatMsg[]>([])
  const [teachingInput,  setTeachingInput]  = useState('')
  const [teachingLoading,setTeachingLoading]= useState(false)

  // ── QUIZ state ───────────────────────────────────────────────────────
  const [quizSubject,   setQuizSubject]   = useState('Mathematics')
  const [quizTopic,     setQuizTopic]     = useState('')
  const [quizGrade,     setQuizGrade]     = useState('Grade 4')
  const [quizType,      setQuizType]      = useState<'checkpoint'|'blooms'>('blooms')
  const [quizStrands,   setQuizStrands]   = useState<{id:string;name:string}[]>([])
  const [genQuiz,       setGenQuiz]       = useState(false)
  const [questions,     setQuestions]     = useState<QuizQ[]>([])
  const [qIndex,        setQIndex]        = useState(0)
  const [answers,       setAnswers]       = useState<Record<number,string|number>>({})
  const [showAns,       setShowAns]       = useState<Record<number,boolean>>({})
  const [submitted,     setSubmitted]     = useState(false)
  const [score,         setScore]         = useState(0)
  const [timeLeft,      setTimeLeft]      = useState(0)
  const [openFeedback,  setOpenFeedback]  = useState<Record<number,{isCorrect:boolean;feedback:string}>>({})
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

  // ── Shared progress state for achievements ────────────────────────────
  const [progressData, setProgressData] = useState({ xp: 0, streak: 0, masteryScore: 0, totalStudyTime: 0, completedAssignments: 0, accuracy: 0, totalQuestions: 0 })

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          const p = d.progress || {}
          const a = d.analytics || {}
          const totalQ = p.totalQuestions || 0
          const correct = p.correctAnswers || 0
          setProgressData({
            xp: p.xp || 0,
            streak: p.streak || a.streakDays || 0,
            masteryScore: p.masteryScore || 0,
            totalStudyTime: a.totalStudyTime || 0,
            completedAssignments: a.completedAssignments || 0,
            accuracy: totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0,
            totalQuestions: totalQ,
          })
        }
      })
      .catch(() => {})
  }, [])

  // ── Callback from CurriculumBrowser to start studying a topic ──────────
  const handleExploreTopic = (subject: string, topic: string) => {
    setStudySubject(subject)
    setStudyTopic(topic)
    setTab('study')
  }

  // Fetch topic strands for study
  useEffect(() => {
    if (!studySubject) { setStudyStrands([]); return }
    const fallback = TOPIC_SUGGESTIONS[studySubject] || []
    fetch(`/api/curriculum/strands?grade=${encodeURIComponent(studyGrade)}&subject=${encodeURIComponent(studySubject)}`)
      .then(r => r.ok ? r.json() : { strands: [] })
      .then(d => {
        const db = (d.strands || []).map((s: any) => ({ id: s.id, name: s.name }))
        const all = [...db]
        fallback.forEach(t => { if (!all.some(a => a.name.toLowerCase() === t.toLowerCase())) all.push({ id: `fb-${t}`, name: t }) })
        setStudyStrands(all)
      })
      .catch(() => setStudyStrands(fallback.map(t => ({ id: `fb-${t}`, name: t }))))
  }, [studySubject, studyGrade])

  // Fetch topic strands for quiz
  useEffect(() => {
    if (!quizSubject || !quizGrade) { setQuizStrands([]); return }
    const fallback = TOPIC_SUGGESTIONS[quizSubject] || []
    fetch(`/api/curriculum/strands?grade=${encodeURIComponent(quizGrade)}&subject=${encodeURIComponent(quizSubject)}`)
      .then(r => r.ok ? r.json() : { strands: [] })
      .then(d => {
        const db = (d.strands || []).map((s: any) => ({ id: s.id, name: s.name }))
        const all = [...db]
        fallback.forEach(t => { if (!all.some(a => a.name.toLowerCase() === t.toLowerCase())) all.push({ id: `fb-${t}`, name: t }) })
        setQuizStrands(all)
      })
      .catch(() => setQuizStrands(fallback.map(t => ({ id: `fb-${t}`, name: t }))))
  }, [quizSubject, quizGrade])

  useEffect(() => { fetchAssignments() }, [])

  // Fetch student's actual grade from their class on mount
  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.student?.class) {
          const cls = d.student.class
          const gradeMatch = cls.match(/^(Grade\s+\d+|Form\s+\d+)/i)
          if (gradeMatch) {
            setQuizGrade(gradeMatch[1])
            setStudyGrade(gradeMatch[1])
          }
        }
      })
      .catch(e => console.error('Failed to fetch grade:', e))
  }, [])

  const handleAITutorChat = async (message: string, history: ChatMsg[]) => {
    const r = await fetch('/api/ai/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message, context:'student_tutor', messages: history })
    })
    if (!r.ok) throw new Error('API error')
    const d = await r.json()
    return d.response || 'Sorry, I could not respond right now.'
  }

  // Sync tab to URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('tab') !== tab) {
      p.set('tab', tab)
      const url = `${window.location.pathname}?${p.toString()}`
      window.history.replaceState({}, '', url)
    }
  }, [tab])

  // Restore "Start Learning" context from curriculum accordion
  useEffect(() => {
    try {
      const ctx = JSON.parse(sessionStorage.getItem('currentLessonContext') || '{}')
      if (ctx.title) {
        setStudyTopic(ctx.title)
        setStudySubject(ctx.subject || 'Mathematics')
        sessionStorage.removeItem('currentLessonContext')
      }
    } catch (e) { console.error('Failed to restore context:', e) }
  }, [])

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

  // ── Timer for study session ──────────────────────────────────────────
  useEffect(() => {
    if (!sessionActive || !sessionStart) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart.getTime()) / 1000)), 1000)
    return () => clearInterval(id)
  }, [sessionActive, sessionStart])

  const handleStartSession = async () => {
    setSessionActive(true)
    setSessionStart(new Date())
    setElapsed(0)
    setCompleted(false)
    toast({ title: '📖 Study session started!' })
  }

  const handleEndSession = async () => {
    if (!sessionStart) return
    setCompleting(true)
    const endTime = new Date()
    const durationSec = Math.floor((endTime.getTime() - sessionStart.getTime()) / 1000)
    const durationMin = Math.max(1, Math.round(durationSec / 60))
    try {
      const r = await fetch('/api/student/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: studySubject,
          topic: studyTopic,
          duration: durationMin,
          startTime: sessionStart.toISOString(),
          endTime: endTime.toISOString(),
        })
      })
      if (r.ok) {
        setCompleted(true)
        setSessionActive(false)
        toast({ title: '✅ Session saved!', description: `Studied for ${durationMin} min` })
      }
    } catch (e) { console.warn('[StudentLearn] handleCompleteSession error:', e) } finally { setCompleting(false) }
  }

  const handleStartTeaching = async () => {
    if (!lessonMd) return
    setTeachingLoading(true)
    setTeachingChat([])
    try {
      const r = await fetch('/api/ai/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          context: 'student_tutor',
          autoTeach: true,
          lessonContent: lessonMd,
          subject: studySubject,
          topic: studyTopic,
          message: `Teach me "${studyTopic}" interactively. Explain the key concepts step by step, ask me questions to check understanding, give examples, and adapt based on my responses. Don't lecture — have a conversation with me. Let me know when you're ready and ask me the first question.`
        })
      })
      const d = await r.json()
      if (r.ok && d.response) {
        setTeachingChat([{ role:'ai', content: d.response }])
      }
    } catch (e) { console.warn('[StudentLearn] handleStartTeaching error:', e) } finally { setTeachingLoading(false) }
  }

  const sendTeachingMsg = async () => {
    const text = teachingInput.trim()
    if (!text || teachingLoading) return
    setTeachingInput('')
    const userMsg: ChatMsg = { role:'user', content: text }
    const updated = [...teachingChat, userMsg]
    setTeachingChat(updated)
    setTeachingLoading(true)
    try {
      const r = await fetch('/api/ai/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          context: 'student_tutor',
          autoTeach: true,
          lessonContent: lessonMd,
          subject: studySubject,
          topic: studyTopic,
          message: text,
          messages: updated.map(m => ({ role: m.role, content: m.content }))
        })
      })
      const d = await r.json()
      if (r.ok && d.response) {
        setTeachingChat(prev => [...prev, { role:'ai', content: d.response }])
      }
    } catch (e) { console.warn('[StudentLearn] sendTeachingMsg error:', e) } finally { setTeachingLoading(false) }
  }

  const fmtElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ── STUDY: generate notes + start teaching ─────────────────────────
  const generateLesson = async () => {
    if (!studyTopic.trim()) { toast({ variant:'destructive', title:'Enter a topic first' }); return }
    setStudying(true); setLessonMd('')
    try {
      const r = await fetch('/api/ai/generate-lesson-content', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ lesson:{ title:studyTopic, subject:studySubject, grade:studyGrade }, studentLevel:'intermediate', learningStyle:'visual' })
      })
      const d = await r.json()
      if (r.ok) {
        setLessonMd(d.content || '')
        // Auto-start interactive teaching after notes are ready
        setTimeout(() => handleStartTeaching(), 300)
      }
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

  const handleSubmitQuiz = useCallback(async () => {
    clearTimeout(timerRef.current!)
    let mcqCorrect = 0
    const mcqCount = questions.filter(q => q.type === 'multiple_choice' || q.type === 'true_false').length
    const openEnded: { id: number; question: string; studentAnswer: string; correctAnswer?: string }[] = []

    questions.forEach((q, i) => {
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (answers[i] !== undefined && Number(answers[i]) === q.correct_answer) mcqCorrect++
      } else {
        const ans = answers[i]
        if (ans !== undefined && typeof ans === 'string' && ans.trim()) {
          openEnded.push({ id: i, question: q.question, studentAnswer: ans, correctAnswer: q.model_answer })
        }
      }
    })

    let openCorrect = 0
    let openTotal = openEnded.length
    if (openEnded.length > 0) {
      try {
        const r = await fetch('/api/ai/grade-short-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: quizSubject, grade: quizGrade, questions: openEnded })
        })
        if (r.ok) {
          const data = await r.json()
          openCorrect = data.results?.filter((res: any) => res.isCorrect).length || 0
          const fb: Record<number,{isCorrect:boolean;feedback:string}> = {}
          data.results?.forEach((res: any) => {
            fb[res.questionId] = { isCorrect: res.isCorrect, feedback: res.feedback }
            setShowAns(prev => ({ ...prev, [res.questionId]: true }))
          })
          setOpenFeedback(fb)
        }
      } catch { /* fallback: count none correct */ }
    }

    const totalQuestions = mcqCount + openTotal
    const totalCorrect = mcqCorrect + openCorrect
    setScore(totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0)
    setSubmitted(true)
  }, [questions, answers, quizSubject, quizGrade])

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
        <TabsList className="w-full overflow-x-auto flex gap-1 px-2 bg-slate-100/80 p-1.5 rounded-2xl">
          <TabsTrigger value="explore" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><LayoutGrid className="w-4 h-4 mr-1.5"/>Explore</TabsTrigger>
          <TabsTrigger value="study" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><BookOpen className="w-4 h-4 mr-1.5"/>Study</TabsTrigger>
          <TabsTrigger value="quiz" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><Target className="w-4 h-4 mr-1.5"/>Quiz</TabsTrigger>
          <TabsTrigger value="assignments" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><ClipboardList className="w-4 h-4 mr-1.5"/>
            Assignments{assignments.filter(a=>a.status==='PENDING'||a.status==='OVERDUE').length > 0 &&
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 whitespace-nowrap">
                {assignments.filter(a=>a.status==='PENDING'||a.status==='OVERDUE').length}
              </span>}
          </TabsTrigger>
          <TabsTrigger value="tutor" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><Brain className="w-4 h-4 mr-1.5"/>AI Tutor</TabsTrigger>
          <TabsTrigger value="progress" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><TrendingUp className="w-4 h-4 mr-1.5"/>Progress</TabsTrigger>
          <TabsTrigger value="achievements" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><Trophy className="w-4 h-4 mr-1.5"/>Badges</TabsTrigger>
          <TabsTrigger value="career" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><Compass className="w-4 h-4 mr-1.5"/>Career</TabsTrigger>
          <TabsTrigger value="whiteboard" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><Wand2 className="w-4 h-4 mr-1.5"/>Whiteboard</TabsTrigger>
          <TabsTrigger value="groups" className="shrink-0 whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200"><MessagesSquare className="w-4 h-4 mr-1.5"/>Groups</TabsTrigger>
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
                    placeholder="e.g. Fractions" list="study-topics"
                    onKeyDown={e=>e.key==='Enter'&&generateLesson()}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <datalist id="study-topics">
                    {studyStrands.map(s=><option key={s.id} value={s.name}/>)}
                  </datalist>
                </div>
              </div>
              <Button onClick={generateLesson} disabled={studying||!studyTopic.trim()} className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300">
                {studying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Generating…</> : <><Play className="h-4 w-4 mr-2"/>Study This Topic</>}
              </Button>
            </CardContent>
          </Card>

          {lessonMd && (
            <Card className="border-0 shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">AI Lesson</p>
                    <CardTitle className="text-lg text-white font-extrabold">
                      {studyTopic} — {studySubject}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {sessionActive && (
                      <span className="text-sm font-mono bg-white/20 rounded-lg px-3 py-1">
                        {fmtElapsed(elapsed)}
                      </span>
                    )}
                    {completed && (
                      <span className="text-sm bg-green-500/30 text-green-100 rounded-lg px-3 py-1 font-semibold">Completed</span>
                    )}
                    <button
                      onClick={() => { setLessonMd(''); setSessionActive(false); setSessionStart(null); setCompleted(false); setTeachingChat([]) }}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                  {!sessionActive && !completed && (
                    <Button size="sm" onClick={handleStartSession} className="bg-green-500 hover:bg-green-600 text-white border-0">
                      <Play className="h-3.5 w-3.5 mr-1.5" />Start Studying
                    </Button>
                  )}
                  {sessionActive && (
                    <Button size="sm" onClick={handleEndSession} disabled={completing} className="bg-red-500 hover:bg-red-600 text-white border-0">
                      {completing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                      End Session
                    </Button>
                  )}
                  {completed && (
                    <Button size="sm" onClick={() => { setLessonMd(''); setSessionStart(null); setCompleted(false); setTeachingChat([]) }} variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Study Again
                    </Button>
                  )}

                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-h-[600px] overflow-y-auto pr-1">
                  <MarkdownRenderer content={lessonMd} />
                </div>

                {lessonMd && (
                  <div className="mt-6 border-t pt-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                      <Brain className="h-4 w-4" /> Practice Questions
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                      {teachingChat.length === 0 && !teachingLoading && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 py-4">
                          <Loader2 className="h-4 w-4 animate-spin" /> Starting interactive practice…
                        </div>
                      )}
                      {teachingChat.map((m, i) => (
                        <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {m.role === 'ai' && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                              <Brain className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            m.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-gray-100 border border-gray-200 rounded-bl-sm'
                          }`}>
                            <MarkdownRenderer content={m.content} />
                          </div>
                        </div>
                      ))}
                      {teachingLoading && (
                        <div className="flex items-end gap-2 justify-start">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                            <Brain className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                              <span className="text-xs text-gray-400 ml-2">Teaching…</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <textarea
                        value={teachingInput}
                        onChange={e => setTeachingInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTeachingMsg() } }}
                        rows={1}
                        placeholder="Ask a question, say 'explain more' or 'give an example'…"
                        className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[38px] max-h-24"
                      />
                      <button
                        onClick={sendTeachingMsg}
                        disabled={teachingLoading || !teachingInput.trim()}
                        className="h-9 w-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center disabled:opacity-40 shrink-0 hover:opacity-90 transition-opacity"
                      >
                        <Send className="h-4 w-4 text-white" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">Enter to send · Shift+Enter for new line</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes — collapsible */}
          <Card>
            <CardHeader className="cursor-pointer select-none" onClick={() => setNotesOpen(!notesOpen)}>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><NotebookPen className="h-4 w-4 text-amber-600"/>My Notes</span>
                {notesOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </CardTitle>
            </CardHeader>
            {notesOpen && <CardContent className="space-y-3">
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
            </CardContent>}
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
                      placeholder="e.g. Fractions" list="quiz-topics"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    <datalist id="quiz-topics">
                      {quizStrands.map(s=><option key={s.id} value={s.name}/>)}
                    </datalist>
                  </div>
                </div>
                <div className="flex gap-2">
              {(['blooms','checkpoint'] as const).map(t=>(
                <button key={t} onClick={()=>setQuizType(t)}
                  className={`flex-1 h-9 text-sm font-semibold rounded-xl border transition-all ${quizType===t?'bg-indigo-600 text-white border-transparent shadow-md':'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                  {t==='blooms'?'Bloom\'s (6 levels)':'Checkpoint (5 quick)'}
                </button>
              ))}
                </div>
                <Button onClick={generateQuiz} disabled={genQuiz||!quizTopic.trim()} className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300">
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
                            <div className="space-y-2">
                              {openFeedback[qIndex] && (
                                <div className={`p-3 rounded-xl text-sm ${openFeedback[qIndex].isCorrect ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                                  <div className="flex items-center gap-2 font-semibold mb-1">
                                    {openFeedback[qIndex].isCorrect ? <CheckCircle className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                                    {openFeedback[qIndex].isCorrect ? 'Correct!' : 'Not quite'}
                                  </div>
                                  <p className="text-xs">{openFeedback[qIndex].feedback}</p>
                                </div>
                              )}
                              <button onClick={()=>setShowAns(p=>({...p,[qIndex]:!p[qIndex]}))}
                                className="text-xs text-blue-600 hover:underline">
                                {showAns[qIndex]?'Hide':'Show'} model answer
                              </button>
                              {showAns[qIndex] && (
                                <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                                  <span className="font-bold">Model answer: </span>{q.model_answer}
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
                  <Button onClick={()=>setQIndex(i=>i+1)} size="sm" className="bg-teal-600 hover:bg-teal-700 hover:shadow-md transition-all">
                    Next<ChevronRight className="h-4 w-4"/>
                  </Button>
                ) : !submitted ? (
                  <Button onClick={handleSubmitQuiz} size="sm" className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-md transition-all">
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
                      <MarkdownRenderer content={selAssn.content.replace(/## Answer Key[\s\S]*/i, '').replace(/📝 ANSWER KEY[\s\S]*/i, '')} />
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
        <TabsContent value="tutor" forceMount className={`mt-4 h-[70vh] ${tab !== 'tutor' ? 'hidden' : ''}`}>
          <ChatContainer
            onSend={handleAITutorChat}
            headerTitle="AI Tutor"
            headerSubtitle="Ask anything · Get instant explanations"
            quickPrompts={['Explain simply', 'Practice questions', 'Key formulas', 'Quiz me!', 'Summarise topic']}
            placeholder="Ask anything — explain, practice, quiz me…"
            icon="brain"
          />
        </TabsContent>

        {/* ── EXPLORE TAB (Curriculum Browser) ─────────────────── */}
        <TabsContent value="explore" className="mt-4 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Explore the Curriculum</h2>
            <p className="text-sm text-slate-500">Browse CBC topics by grade and subject. Click <strong>Study</strong> to start learning.</p>
          </div>
          <CurriculumBrowser onSelectTopic={handleExploreTopic} />
          <Recommendations onStudy={handleExploreTopic} />
        </TabsContent>

        {/* ── PROGRESS TAB ──────────────────────────────────────── */}
        <TabsContent value="progress" className="mt-4">
          <ProgressDashboard />
        </TabsContent>

        {/* ── ACHIEVEMENTS TAB ──────────────────────────────────── */}
        <TabsContent value="achievements" className="mt-4">
          <Achievements
            xp={progressData.xp}
            streak={progressData.streak}
            masteryScore={progressData.masteryScore}
            totalStudyTime={progressData.totalStudyTime}
            completedAssignments={progressData.completedAssignments}
            accuracy={progressData.accuracy}
            totalQuestions={progressData.totalQuestions}
          />
        </TabsContent>

        {/* ── CAREER TAB ────────────────────────────────────────── */}
        <TabsContent value="career" className="mt-4">
          <CareerAssessment />
        </TabsContent>

        {/* ── WHITEBOARD TAB ────────────────────────────────────── */}
        <TabsContent value="whiteboard" className="mt-4">
          <AIWhiteboard />
        </TabsContent>

        {/* ── STUDY GROUPS TAB ──────────────────────────────────── */}
        <TabsContent value="groups" className="mt-4">
          <StudyGroups />
        </TabsContent>
      </Tabs>
    </div>
  )
}
