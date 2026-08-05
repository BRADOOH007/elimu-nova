'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  BookOpen, Brain, ClipboardList, NotebookPen, CheckCircle, AlertCircle,
  Send, Loader2, RefreshCw, Play, Target, Clock, Upload, X, File,
  ChevronDown, ChevronRight, ChevronLeft, Award, Star, Zap, Paperclip, Eye, Download,
  Compass, MessagesSquare, Wand2, LayoutGrid, TrendingUp,
  Swords, PenTool, Repeat, GitBranch, HelpCircle, Flame, ArrowRight,
  GraduationCap, Users, Sparkles, Timer, BookMarked, Lightbulb,
} from 'lucide-react'
import ChatContainer from '@/components/chat/chat-container'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { ClientDate } from '@/components/ui/client-date'
import { CurriculumBrowser } from '@/components/student/curriculum-browser'
import { Recommendations } from '@/components/student/recommendations'
import { SpacedRepetitionWidget } from '@/components/student/spaced-repetition-widget'
import { CourseChallengeWidget } from '@/components/student/course-challenge-widget'
import { SocraticTutor } from '@/components/student/socratic-tutor'
import { WritingCoach } from '@/components/student/writing-coach'
import { AIWhiteboard } from '@/components/student/ai-whiteboard'
import { useSession } from 'next-auth/react'

interface Assignment {
  id: string; title: string; description: string; content: string
  dueDate: string; status: string; subject: string; grade: number | null
  teacher: { firstName: string; lastName: string }
  submissions?: Array<{ grade: number | null; feedback: string | null; submittedAt: string }>
  videoUrl?: string | null; videoProvider?: string | null
}
interface QuizQ {
  question: string; type: string; level?: string; levelNumber?: number
  options?: string[]; correct_answer?: number; model_answer?: string
  explanation: string; cognitive_skill?: string
}
interface ActiveLessonData {
  topic: string; subject: string; grade: string
  preview: { whatYoullLearn: string; concepts: string[] }
  content: string
  recall: { question: string; type: 'mcq' | 'short' | 'fill'; options?: string[]; answer: string; explanation: string }[]
  generatedAt: string
}
interface ReviewEntry {
  topic: string; subject: string; grade: string
  lastStudied: string; score: number; interval: number; nextReview: string
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
  const { data: session } = useSession()
  const { toast } = useToast()
  const [tab, setTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      const t = p.get('tab')
      if (t === 'quiz' || t === 'study' || t === 'assignments' || t === 'tutor' || t === 'whiteboard' || t === 'challenge' || t === 'writing' || t === 'reviews') return t
    }
    return 'study'
  })

  // Study state
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
  const [tutorMode,      setTutorMode]      = useState<'chat' | 'socratic'>('chat')

  // Active recall state
  const [activeLesson, setActiveLesson] = useState<ActiveLessonData | null>(null)
  const [studyPhase, setStudyPhase] = useState<'preview' | 'learn' | 'recall' | 'done'>('preview')
  const [recallAnswers, setRecallAnswers] = useState<(string | number)[]>([])
  const [recallSubmitted, setRecallSubmitted] = useState(false)
  const [recallScore, setRecallScore] = useState(0)

  // Learning path state
  const [pathData, setPathData] = useState<{ topics: any[]; resumeTopic: any; completedCount: number; totalCount: number; percentComplete: number } | null>(null)
  const [pathLoading, setPathLoading] = useState(false)

  // Quiz state
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

  // Assignments state
  const [assignments,  setAssignments]  = useState<Assignment[]>([])
  const [loadingAssn,  setLoadingAssn]  = useState(true)
  const [selAssn,      setSelAssn]      = useState<Assignment | null>(null)
  const [submitText,   setSubmitText]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [attachments,  setAttachments]  = useState<Array<{url:string;name:string}>>([])
  const [uploading,    setUploading]    = useState(false)
  const [result,       setResult]       = useState<{grade?:number;feedback?:string}|null>(null)

  // Progress state
  const [progressData, setProgressData] = useState({ xp: 0, streak: 0, totalStudyTime: 0, completedAssignments: 0, accuracy: 0, totalQuestions: 0 })
  const [displayName, setDisplayName] = useState('')

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
            totalStudyTime: a.totalStudyTime || 0,
            completedAssignments: a.completedAssignments || 0,
            accuracy: totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0,
            totalQuestions: totalQ,
          })
        }
      })
      .catch(() => {})
    if (session?.user?.name) setDisplayName(session.user.name)
  }, [session?.user?.name])

  const handleExploreTopic = (subject: string, topic: string, learningOutcomes?: string[]) => {
    setStudySubject(subject)
    setStudyTopic(topic)
    setTab('study')
    generateLesson(subject, topic, learningOutcomes)
  }

  const fetchLearningPath = useCallback(async (subject = studySubject, grade = studyGrade) => {
    setPathLoading(true)
    try {
      const r = await fetch(`/api/student/learning-path?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
      if (r.ok) {
        const d = await r.json()
        setPathData({
          topics: d.topics || [],
          resumeTopic: d.resumeTopic || null,
          completedCount: d.completedCount || 0,
          totalCount: d.totalCount || 0,
          percentComplete: d.percentComplete || 0,
        })
      }
    } catch { /* ignore */ } finally { setPathLoading(false) }
  }, [studySubject, studyGrade])

  useEffect(() => { fetchLearningPath() }, [studySubject, studyGrade, fetchLearningPath])

  const pathTopicFor = useCallback((topic: string) => {
    if (!pathData) return undefined
    return pathData.topics.find((t: any) => t.topicName.toLowerCase() === topic.toLowerCase())
  }, [pathData])

  const markTopicStarted = useCallback(async (subject: string, topic: string, content: string) => {
    const t = pathTopicFor(topic)
    try {
      await fetch('/api/student/learning-path', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', grade: studyGrade, subject, strandName: t?.strandName || subject, topicName: topic, order: t?.order ?? 0, content }),
      })
    } catch { /* ignore */ }
  }, [pathTopicFor, studyGrade])

  const completeAndAdvance = async () => {
    const subject = studySubject
    const topic = studyTopic
    if (!topic) return
    const t = pathTopicFor(topic)
    try {
      await fetch('/api/student/learning-path', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', grade: studyGrade, subject, strandName: t?.strandName || subject, topicName: topic, order: t?.order ?? 0 }),
      })
    } catch { /* ignore */ }
    const topics = pathData?.topics || []
    const idx = topics.findIndex((x: any) => x.topicName.toLowerCase() === topic.toLowerCase())
    const next = topics.slice(idx + 1).find((x: any) => x.status === 'NOT_STARTED' || x.status === 'IN_PROGRESS')
      || topics.find((x: any) => x.status === 'NOT_STARTED' || x.status === 'IN_PROGRESS')
      || null
    if (next) {
      toast({ title: 'Topic completed!', description: `Next: ${next.topicName} - starting automatically` })
      await new Promise(res => setTimeout(res, 1200))
      setStudyTopic(next.topicName)
      generateLesson(subject, next.topicName)
      await fetchLearningPath(subject, studyGrade)
    } else {
      toast({ title: 'Subject path complete!', description: 'All topics done. Amazing work!' })
      await fetchLearningPath(subject, studyGrade)
    }
  }

  const resumeTopicLesson = (subject: string, topic: string, content?: string) => {
    setStudySubject(subject)
    setStudyTopic(topic)
    setTab('study')
    if (content) {
      setLessonMd(content)
      setStudying(false)
      handleStartTeaching(content)
    } else {
      generateLesson(subject, topic)
    }
  }

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

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.student?.class) {
          const cls = d.student.class
          const gradeMatch = cls.match(/^(Grade\s+\d+|Form\s+\d+)/i)
          if (gradeMatch) { setQuizGrade(gradeMatch[1]); setStudyGrade(gradeMatch[1]) }
        }
      })
      .catch(() => {})
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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('tab') !== tab) { p.set('tab', tab); const url = `${window.location.pathname}?${p.toString()}`; window.history.replaceState({}, '', url) }
  }, [tab])

  useEffect(() => {
    try {
      const ctx = JSON.parse(sessionStorage.getItem('currentLessonContext') || '{}')
      if (ctx.title) { setStudyTopic(ctx.title); setStudySubject(ctx.subject || 'Mathematics'); setTab('study'); sessionStorage.removeItem('currentLessonContext'); generateLesson(ctx.subject || 'Mathematics', ctx.title) }
    } catch { /* ignore */ }
  }, [])

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

  useEffect(() => {
    if (!sessionActive || !sessionStart) return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart.getTime()) / 1000)), 1000)
    return () => clearInterval(id)
  }, [sessionActive, sessionStart])

  const handleStartSession = async () => {
    setSessionActive(true); setSessionStart(new Date()); setElapsed(0); setCompleted(false)
    toast({ title: 'Study session started!' })
  }

  const handleEndSession = async () => {
    if (!sessionStart) return
    setCompleting(true)
    const endTime = new Date()
    const durationSec = Math.floor((endTime.getTime() - sessionStart.getTime()) / 1000)
    const durationMin = Math.max(1, Math.round(durationSec / 60))
    const allNotes = savedNotes.map(n => `[${n.topic}]\n${n.text}`).join('\n\n---\n\n')
    try {
      const r = await fetch('/api/student/study-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: studySubject, topic: studyTopic, duration: durationMin, startTime: sessionStart.toISOString(), endTime: endTime.toISOString(), notes: allNotes || undefined })
      })
      if (r.ok) { setCompleted(true); setSessionActive(false); toast({ title: 'Session saved!', description: `Studied for ${durationMin} min` }) }
    } catch { /* ignore */ } finally { setCompleting(false) }
  }

  const handleStartTeaching = async (contentOverride?: string) => {
    const content = contentOverride || lessonMd
    if (!content) return
    setTeachingLoading(true); setTeachingChat([])
    try {
      const r = await fetch('/api/ai/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ context: 'student_tutor', autoTeach: true, lessonContent: content, subject: studySubject, topic: studyTopic, message: `Teach me "${studyTopic}" interactively. Explain the key concepts step by step, ask me questions to check understanding, give examples, and adapt based on my responses. Let me know when you're ready and ask me the first question.` })
      })
      const d = await r.json()
      if (r.ok && d.response) setTeachingChat([{ role:'ai', content: d.response }])
    } catch { /* ignore */ } finally { setTeachingLoading(false) }
  }

  const sendTeachingMsg = async () => {
    const text = teachingInput.trim()
    if (!text || teachingLoading) return
    setTeachingInput('')
    const userMsg: ChatMsg = { role:'user', content: text }
    const updated = [...teachingChat, userMsg]
    setTeachingChat(updated); setTeachingLoading(true)
    try {
      const r = await fetch('/api/ai/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ context: 'student_tutor', autoTeach: true, lessonContent: lessonMd, subject: studySubject, topic: studyTopic, message: text, messages: updated.map(m => ({ role: m.role, content: m.content })) })
      })
      const d = await r.json()
      if (r.ok && d.response) setTeachingChat(prev => [...prev, { role:'ai', content: d.response }])
    } catch { /* ignore */ } finally { setTeachingLoading(false) }
  }

  const fmtElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const generateLesson = async (subjectArg?: string, topicArg?: string, _outcomes?: string[]) => {
    const subject = subjectArg || studySubject
    const topic = topicArg || studyTopic
    if (!topic.trim()) { toast({ variant:'destructive', title:'Enter a topic first' }); return }
    setStudying(true); setActiveLesson(null); setStudyPhase('preview'); setRecallAnswers([])
    setRecallSubmitted(false); setRecallScore(0)
    try {
      const r = await fetch('/api/ai/generate-active-lesson', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ subject, topic, grade: studyGrade })
      })
      const d = await r.json()
      if (r.ok) {
        setActiveLesson(d)
        setLessonMd(d.content || '')
        markTopicStarted(subject, topic, d.content || '')
        await fetchLearningPath(subject, studyGrade)
      } else {
        // Fallback to old markdown generation
        const fb = await fetch('/api/ai/generate-lesson-content', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ lesson:{ title:topic, subject, grade:studyGrade }, studentLevel:'intermediate', learningStyle:'visual' })
        })
        if (fb.ok) {
          const fbData = await fb.json()
          setLessonMd(fbData.content || '')
          setActiveLesson(null)
          markTopicStarted(subject, topic, fbData.content || '')
          await fetchLearningPath(subject, studyGrade)
          toast({ title:'Lesson generated', description:'Studying in classic mode' })
        } else {
          throw new Error(d.error || 'Could not generate lesson')
        }
      }
    } catch(e:any) { toast({ variant:'destructive', title:'Could not generate lesson', description:e.message }) }
    finally { setStudying(false) }
  }

  const handleRecallChange = (i: number, val: string | number) => {
    setRecallAnswers(prev => { const next = [...prev]; next[i] = val; return next })
  }

  const submitRecall = () => {
    if (!activeLesson) return
    let correct = 0
    activeLesson.recall.forEach((q, i) => {
      const userAns = recallAnswers[i]
      if (q.type === 'mcq' && userAns !== undefined) {
        const idx = typeof userAns === 'number' ? userAns : parseInt(userAns as string)
        const correctOpt = q.options?.findIndex(o => o === q.answer)
        if (idx === correctOpt) correct++
      } else if (typeof userAns === 'string') {
        const norm = userAns.trim().toLowerCase()
        const answerNorm = q.answer.trim().toLowerCase()
        if (norm && (norm === answerNorm || norm.includes(answerNorm) || answerNorm.includes(norm))) correct++
      }
    })
    const score = activeLesson.recall.length > 0 ? Math.round((correct / activeLesson.recall.length) * 100) : 0
    setRecallScore(score); setRecallSubmitted(true)
    scheduleReview(activeLesson, score)
  }

  const scheduleReview = (lesson: ActiveLessonData, score: number) => {
    try {
      const raw = localStorage.getItem('elimunova_reviews')
      const reviews: ReviewEntry[] = raw ? JSON.parse(raw) : []
      const existing = reviews.findIndex(r => r.topic === lesson.topic && r.subject === lesson.subject)
      const interval = score >= 80 ? 7 : score >= 50 ? 3 : 1
      const nextReview = new Date()
      nextReview.setDate(nextReview.getDate() + interval)
      const entry: ReviewEntry = { topic: lesson.topic, subject: lesson.subject, grade: lesson.grade, lastStudied: new Date().toISOString(), score, interval, nextReview: nextReview.toISOString() }
      if (existing >= 0) reviews[existing] = entry
      else reviews.push(entry)
      localStorage.setItem('elimunova_reviews', JSON.stringify(reviews))
    } catch { /* non-critical */ }
  }

  const getDueReviews = (): ReviewEntry[] => {
    try {
      const raw = localStorage.getItem('elimunova_reviews')
      const reviews: ReviewEntry[] = raw ? JSON.parse(raw) : []
      const now = new Date()
      return reviews.filter(r => new Date(r.nextReview) <= now).sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
    } catch { return [] }
  }

  const saveNote = () => {
    if (!notes.trim()) return
    setSavedNotes(p => [{ id:Date.now().toString(), text:notes, topic:studyTopic||studySubject }, ...p])
    setNotes('')
    toast({ title:'Note saved!' })
  }

  const downloadNotes = () => {
    const text = savedNotes.map(n => `[${n.topic}]\n${n.text}`).join('\n\n---\n\n')
    const blob = new Blob([text], { type:'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='my_notes.txt'; a.click()
    URL.revokeObjectURL(url)
  }

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
      setTimeLeft(qs.length * 90)
      toast({ title:`${qs.length} questions ready!` })
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
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: quizSubject, grade: quizGrade, questions: openEnded })
        })
        if (r.ok) {
          const data = await r.json()
          openCorrect = data.results?.filter((res: any) => res.isCorrect).length || 0
          const fb: Record<number,{isCorrect:boolean;feedback:string}> = {}
          data.results?.forEach((res: any) => { fb[res.questionId] = { isCorrect: res.isCorrect, feedback: res.feedback } })
          setOpenFeedback(fb)
        }
      } catch { /* fallback */ }
    }
    const totalQuestions = mcqCount + openTotal
    const totalCorrect = mcqCorrect + openCorrect
    const pct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    setScore(pct); setSubmitted(true)
    try {
      fetch('/api/student/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: quizSubject, topic: quizTopic, totalQuestions, correctAnswers: totalCorrect, masteryScore: pct }) }).catch(() => {})
      fetch('/api/student/mastery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: quizSubject, unitName: quizTopic, correctDelta: totalCorrect, totalDelta: totalQuestions, scoreDelta: pct }) }).catch(() => {})
    } catch { /* non-blocking */ }
  }, [questions, answers, quizSubject, quizGrade, quizTopic])

  const fmtTime = (s:number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`

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
      toast({ title:'Submitted successfully!' })
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
    GRADED:'bg-emerald-100 text-emerald-700 border-emerald-300', OVERDUE:'bg-red-100 text-red-700 border-red-300',
    SUBMITTED:'bg-blue-100 text-blue-700 border-blue-300', PENDING:'bg-amber-100 text-amber-700 border-amber-300'
  }[s] || 'bg-slate-100 text-slate-600')

  const tabConfig = [
    { value: 'study', label: 'Study', icon: BookOpen, active: 'data-[state=active]:bg-blue-600' },
    { value: 'quiz', label: 'Quiz', icon: Target, active: 'data-[state=active]:bg-indigo-600' },
    { value: 'assignments', label: 'Assignments', icon: ClipboardList, active: 'data-[state=active]:bg-emerald-600' },
    { value: 'tutor', label: 'AI Tutor', icon: Brain, active: 'data-[state=active]:bg-purple-600' },
    { value: 'whiteboard', label: 'Whiteboard', icon: Wand2, active: 'data-[state=active]:bg-cyan-600' },
    { value: 'challenge', label: 'Challenge', icon: Swords, active: 'data-[state=active]:bg-orange-600' },
    { value: 'reviews', label: 'Reviews', icon: Repeat, active: 'data-[state=active]:bg-rose-600' },
    { value: 'writing', label: 'Writing', icon: PenTool, active: 'data-[state=active]:bg-pink-600' },
  ]

  const pendAssn = assignments.filter(a => a.status === 'PENDING' || a.status === 'OVERDUE')

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-full overflow-x-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1)_0%,transparent_50%)]" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Learning Hub</h1>
                <p className="text-slate-300 text-sm mt-1">Welcome back{displayName ? `, ${displayName.split(' ')[0]}` : ''}. Ready to learn today?</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 px-3 py-2 bg-white/10 backdrop-blur rounded-xl">
                  <div className="text-center"><p className="text-amber-400 text-lg font-bold">{progressData.xp.toLocaleString()}</p><p className="text-white/60 text-[10px]">XP</p></div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center"><p className="text-orange-400 text-lg font-bold flex items-center gap-1"><Flame className="h-4 w-4" />{progressData.streak}</p><p className="text-white/60 text-[10px]">Day Streak</p></div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <button onClick={() => setTab('study')}
                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl text-white transition-all hover:-translate-y-0.5">
                <BookOpen className="h-5 w-5 text-blue-400 shrink-0" />
                <div className="text-left"><p className="text-sm font-bold">Study</p><p className="text-[10px] text-slate-400">AI-powered lessons</p></div>
              </button>
              <button onClick={() => setTab('quiz')}
                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl text-white transition-all hover:-translate-y-0.5">
                <Target className="h-5 w-5 text-violet-400 shrink-0" />
                <div className="text-left"><p className="text-sm font-bold">Quiz</p><p className="text-[10px] text-slate-400">Test your knowledge</p></div>
              </button>
              <button onClick={() => setTab('tutor')}
                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl text-white transition-all hover:-translate-y-0.5">
                <Brain className="h-5 w-5 text-pink-400 shrink-0" />
                <div className="text-left"><p className="text-sm font-bold">AI Tutor</p><p className="text-[10px] text-slate-400">Ask anything</p></div>
              </button>
              <button onClick={() => setTab('assignments')}
                className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl text-white transition-all hover:-translate-y-0.5">
                <ClipboardList className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="text-left"><p className="text-sm font-bold">Assignments</p><p className="text-[10px] text-slate-400">{pendAssn.length} pending</p></div>
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Accuracy', value: `${progressData.accuracy}%`, icon: Target, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: 'Questions', value: progressData.totalQuestions.toLocaleString(), icon: MessagesSquare, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-700' },
            { label: 'Study Time', value: `${Math.round(progressData.totalStudyTime / 60)}h`, icon: Clock, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', text: 'text-violet-700' },
            { label: 'Complete', value: progressData.completedAssignments.toString(), icon: CheckCircle, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full flex flex-nowrap overflow-x-auto gap-1 p-1.5 bg-slate-100/80 rounded-2xl scrollbar-none">
            {tabConfig.map(t => {
              const Icon = t.icon
              return (
                <TabsTrigger key={t.value} value={t.value}
                  className={`shrink-0 whitespace-nowrap data-[state=active]:text-white rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 gap-1.5 ${t.value === 'assignments' && pendAssn.length > 0 ? 'pr-2' : ''} ${t.active}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {t.value === 'assignments' && pendAssn.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 leading-tight">{pendAssn.length}</span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>


          {/* STUDY TAB */}
          <TabsContent value="study" className="mt-6 space-y-6">
            {/* Resume card */}
            {pathData && !pathLoading && pathData.resumeTopic && pathData.resumeTopic.topicName !== studyTopic && (
              <Card className="border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                        <RefreshCw className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-900">Continue where you left off</p>
                        <p className="text-xs text-emerald-700 truncate">{pathData.resumeTopic.topicName} &middot; {pathData.completedCount}/{pathData.totalCount} topics done ({pathData.percentComplete}%)</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => resumeTopicLesson(studySubject, pathData.resumeTopic.topicName, pathData.resumeTopic.lastContent || undefined)}
                      className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 text-white border-0 shrink-0">
                      <Play className="h-3.5 w-3.5 mr-1.5" />Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning path progress */}
            {pathData && !pathLoading && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-blue-500" /> Learning Path: {studySubject}
                  </p>
                  <span className="text-xs text-slate-500">{pathData.completedCount}/{pathData.totalCount} topics</span>
                </div>
                <Progress value={pathData.percentComplete || 0} className="h-2" />
              </div>
            )}

            {/* Curriculum Browser */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-200">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="h-5 w-5 text-teal-600" />
                <p className="text-sm font-semibold text-teal-800">Browse the Curriculum</p>
              </div>
              <CurriculumBrowser onSelectTopic={handleExploreTopic} />
              <Recommendations onStudy={handleExploreTopic} />
            </div>

            {/* Subject / Topic selector */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  Generate AI Study Lesson
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Subject</label>
                    <select value={studySubject} onChange={e => setStudySubject(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Grade</label>
                    <select value={studyGrade} onChange={e => setStudyGrade(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                      {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Topic <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Input value={studyTopic} onChange={e => setStudyTopic(e.target.value)}
                        placeholder="e.g. Fractions" list="study-topics"
                        onKeyDown={e => e.key === 'Enter' && generateLesson()}
                        className="h-10 text-sm rounded-xl" />
                      <datalist id="study-topics">{studyStrands.map(s => <option key={s.id} value={s.name} />)}</datalist>
                    </div>
                  </div>
                </div>
                <Button onClick={() => generateLesson()} disabled={studying || !studyTopic.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all h-10">
                  {studying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Lesson</>}
                </Button>
              </CardContent>
            </Card>

            {/* Loading / generated content */}
            {studying && <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /><span className="ml-3 text-slate-500">Generating your lesson...</span></div>}

            {/* Fallback: classic markdown lesson (when JSON generation fails) */}
            {!studying && lessonMd && !activeLesson && (
              <Card className="border-0 shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white font-extrabold">{studyTopic} - {studySubject}</CardTitle>
                    <button onClick={() => setLessonMd('')} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="h-4 w-4 text-white" /></button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-h-[500px] overflow-y-auto"><MarkdownRenderer content={lessonMd} /></div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => setLessonMd('')} variant="outline" className="flex-1">Close</Button>
                    <Button onClick={() => { completeAndAdvance(); setLessonMd('') }} className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 text-white">Complete &amp; Continue</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active recall lesson */}
            {activeLesson && !studying && (
              <div className="space-y-6">
                {/* Phase tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {(['preview','learn','recall'] as const).map(phase => (
                    <button key={phase} onClick={() => setStudyPhase(phase)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        studyPhase === phase
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'}`}>
                      {phase === 'preview' ? 'Preview' : phase === 'learn' ? 'Learn' : 'Recall'}
                    </button>
                  ))}
                </div>

                {studyPhase === 'preview' && activeLesson.preview && (
                  <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-blue-600"><Lightbulb className="h-5 w-5" /><h3 className="text-lg font-bold">What You'll Learn</h3></div>
                      <p className="text-slate-600">{activeLesson.preview.whatYoullLearn}</p>
                      <div className="flex flex-wrap gap-2">
                        {activeLesson.preview.concepts.map((c, i) => (
                          <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">{c}</span>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => setStudyPhase('learn')} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">Start Learning</Button>
                        {!sessionActive && !completed && <Button variant="outline" onClick={handleStartSession}><Timer className="h-4 w-4 mr-1.5" />Start Timer</Button>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {studyPhase === 'learn' && (
                  <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-6">
                      <div className="prose prose-sm max-w-none"><MarkdownRenderer content={activeLesson.content} /></div>
                      <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                        <Button onClick={() => setStudyPhase('recall')} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">Test Your Knowledge</Button>
                        <Button variant="outline" onClick={() => handleStartTeaching()} disabled={teachingLoading} className="gap-1.5">
                          {teachingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                          Interactive Tutor
                        </Button>
                      </div>
                      {teachingChat.length > 0 && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-3 max-h-64 overflow-y-auto">
                          {teachingChat.map((m, i) => (
                            <div key={i} className={`text-sm ${m.role === 'ai' ? 'text-indigo-800' : 'text-slate-700 font-semibold'}`}>
                              <MarkdownRenderer content={m.content} />
                            </div>
                          ))}
                          <div className="flex gap-2 pt-2 border-t border-indigo-200">
                            <Input value={teachingInput} onChange={e => setTeachingInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && sendTeachingMsg()}
                              placeholder="Ask a question..." className="h-9 text-sm" />
                            <Button size="sm" onClick={sendTeachingMsg} disabled={teachingLoading} className="shrink-0"><Send className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {studyPhase === 'recall' && (
                  <div className="space-y-4">
                    {!recallSubmitted ? (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Brain className="h-5 w-5 text-violet-500" />Active Recall</h3>
                          <span className="text-sm text-slate-500">{activeLesson.recall.length} questions</span>
                        </div>
                        {activeLesson.recall.map((q, i) => (
                          <Card key={i} className="shadow-sm border-slate-200">
                            <CardContent className="p-4 space-y-3">
                              <p className="text-sm font-semibold text-slate-800">{i + 1}. {q.question}</p>
                              {q.type === 'mcq' && q.options ? (
                                <div className="space-y-2">
                                  {q.options.map((opt, oi) => (
                                    <label key={oi} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-violet-300 ${recallAnswers[i] === oi ? 'border-violet-400 bg-violet-50' : 'border-slate-200'}`}>
                                      <input type="radio" name={`recall-${i}`} checked={recallAnswers[i] === oi} onChange={() => handleRecallChange(i, oi)} className="text-violet-600" />
                                      <span className="text-sm text-slate-700">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <Textarea value={(recallAnswers[i] as string) || ''} onChange={e => handleRecallChange(i, e.target.value)}
                                  placeholder="Type your answer..." rows={2} className="resize-none text-sm" />
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        <Button onClick={submitRecall} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md">Submit Answers</Button>
                      </>
                    ) : (
                      <Card className="shadow-sm border-slate-200">
                        <CardContent className="p-6 text-center space-y-4">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${recallScore >= 70 ? 'bg-emerald-100' : recallScore >= 40 ? 'bg-amber-100' : 'bg-red-100'}`}>
                            <span className={`text-3xl font-bold ${recallScore >= 70 ? 'text-emerald-600' : recallScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{recallScore}%</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">Recall Complete!</h3>
                          <p className="text-slate-600">{recallScore >= 70 ? 'Great job! You have a strong understanding.' : 'Keep practising to improve your understanding.'}</p>
                          <div className="space-y-2 text-left">
                            {activeLesson.recall.map((q, i) => {
                              const isCorrect = q.type === 'mcq' ? recallAnswers[i] === q.options?.findIndex(o => o === q.answer) : (recallAnswers[i] as string || '').trim().toLowerCase() === q.answer.trim().toLowerCase()
                              return (
                                <div key={i} className={`p-3 rounded-xl text-sm border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                  <p className="font-semibold text-slate-800">{i + 1}. {q.question}</p>
                                  {!isCorrect && <p className="text-red-600 mt-1">Correct answer: {q.answer}</p>}
                                  <p className="text-slate-500 text-xs mt-1">{q.explanation}</p>
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex gap-2 justify-center pt-2">
                            <Button variant="outline" onClick={() => { setStudyPhase('learn'); setRecallSubmitted(false); setRecallAnswers([]) }}>Review Again</Button>
                            <Button onClick={completeAndAdvance} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">Complete & Next Topic</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Session + notes bar */}
            {sessionActive && (
              <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-600"><Timer className="h-4 w-4 text-blue-500" /><span className="font-mono font-semibold text-slate-800">{fmtElapsed(elapsed)}</span></div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setNotesOpen(!notesOpen)}>
                    <BookMarked className="h-3.5 w-3.5 mr-1.5" />Notes ({savedNotes.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadNotes} disabled={savedNotes.length === 0}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />Export
                  </Button>
                  <Button size="sm" onClick={handleEndSession} disabled={completing} className="bg-gradient-to-r from-red-500 to-rose-500 text-white">
                    {completing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <X className="h-3.5 w-3.5 mr-1.5" />}
                    End Session
                  </Button>
                </div>
              </div>
            )}
            {notesOpen && (
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Take a note..." className="h-9 text-sm" onKeyDown={e => e.key === 'Enter' && saveNote()} />
                    <Button size="sm" onClick={saveNote} disabled={!notes.trim()}>Save</Button>
                  </div>
                  {savedNotes.map(n => (
                    <div key={n.id} className="p-3 bg-slate-50 rounded-xl text-sm border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">{n.topic}</p>
                      <p className="text-slate-700">{n.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {completed && (
              <Card className="border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-emerald-800">Session completed!</p>
                  <p className="text-sm text-emerald-600">Your study time has been recorded.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* QUIZ TAB */}
          <TabsContent value="quiz" className="mt-6 space-y-6">
            {questions.length === 0 ? (
              <>
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      Generate Quiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                      {[
                        { value: 'blooms' as const, label: 'Bloom\'s Taxonomy', desc: 'Progressive difficulty' },
                        { value: 'checkpoint' as const, label: 'Checkpoint', desc: 'Topic understanding check' },
                      ].map(qt => (
                        <button key={qt.value} onClick={() => setQuizType(qt.value)}
                          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${quizType === qt.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {qt.label}
                          <p className="font-normal text-[10px] text-slate-400">{qt.desc}</p>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">Subject</label>
                        <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">Grade</label>
                        <select value={quizGrade} onChange={e => setQuizGrade(e.target.value)}
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                          {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4'].map(g => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">Topic <span className="text-red-400">*</span></label>
                        <Input value={quizTopic} onChange={e => setQuizTopic(e.target.value)}
                          placeholder="e.g. Fractions" list="quiz-topics" className="h-10 text-sm rounded-xl" />
                        <datalist id="quiz-topics">{quizStrands.map(s => <option key={s.id} value={s.name} />)}</datalist>
                      </div>
                    </div>
                    <Button onClick={generateQuiz} disabled={genQuiz || !quizTopic.trim()}
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md h-10">
                      {genQuiz ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Quiz</>}
                    </Button>
                  </CardContent>
                </Card>
                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800">
                  <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
                  <p>Choose a subject, grade, and topic above to generate an AI-powered quiz with Bloom's Taxonomy or checkpoint questions.</p>
                </div>
              </>
            ) : !submitted ? (
              /* Active quiz */
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{quizTopic} Quiz</h2>
                    <p className="text-sm text-slate-500">Question {qIndex + 1} of {questions.length}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}><Timer className="h-3.5 w-3.5 mr-1" />{fmtTime(timeLeft)}</Badge>
                    <Button size="sm" onClick={handleSubmitQuiz} disabled={submitted} variant="outline">Submit All</Button>
                  </div>
                </div>
                <Progress value={((qIndex + 1) / questions.length) * 100} className="h-1.5" />
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-2">
                        {questions[qIndex].type?.replace('_', ' ')} &middot; {questions[qIndex].level || questions[qIndex].cognitive_skill || 'Remember'}
                      </p>
                      <p className="text-base font-semibold text-slate-800">{questions[qIndex].question}</p>
                    </div>
                    {(questions[qIndex].type === 'multiple_choice' || questions[qIndex].type === 'true_false') && questions[qIndex].options ? (
                      <div className="space-y-2">
                        {questions[qIndex].options!.map((opt, oi) => (
                          <label key={oi}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-indigo-300 ${answers[qIndex] === oi ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-slate-200'}`}>
                            <input type="radio" name={`quiz-${qIndex}`} checked={answers[qIndex] === oi}
                              onChange={() => setAnswers(prev => ({ ...prev, [qIndex]: oi }))} className="text-indigo-600 w-4 h-4" />
                            <span className="text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Textarea value={(answers[qIndex] as string) || ''} onChange={e => setAnswers(prev => ({ ...prev, [qIndex]: e.target.value }))}
                        placeholder="Type your answer..." rows={4} className="resize-none text-sm" />
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => setQIndex(i => Math.max(0, i - 1))} disabled={qIndex === 0}><ChevronLeft className="h-4 w-4 mr-1" />Prev</Button>
                      {qIndex < questions.length - 1 ? (
                        <Button onClick={() => setQIndex(i => i + 1)} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex-1">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                      ) : (
                        <Button onClick={handleSubmitQuiz} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white flex-1">Submit All</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Results */
              <div className="space-y-6">
                <Card className="shadow-sm border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-8 text-center text-white">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'} bg-opacity-90`}>
                      <span className="text-3xl font-bold">{score}%</span>
                    </div>
                    <h2 className="text-xl font-bold">{score >= 70 ? 'Well done!' : score >= 40 ? 'Keep going!' : 'More practice needed'}</h2>
                    <p className="text-slate-300 text-sm mt-1">{questions.length} questions answered</p>
                  </div>
                  <CardContent className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                    {questions.map((q, i) => {
                      const isCorrect = q.type === 'multiple_choice' || q.type === 'true_false' ? Number(answers[i]) === q.correct_answer : openFeedback[i]?.isCorrect
                      return (
                        <div key={i} className={`p-4 rounded-xl border ${isCorrect === undefined ? 'bg-slate-50 border-slate-200' : isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-sm font-semibold text-slate-800 mb-2">{i + 1}. {q.question}</p>
                          {q.type !== 'multiple_choice' && q.type !== 'true_false' && (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500">Your answer: {answers[i] || '(empty)'}</p>
                              <p className="text-xs text-slate-500">Model: {q.model_answer || 'N/A'}</p>
                            </div>
                          )}
                          {openFeedback[i] && <p className="text-xs text-slate-600 mt-1">{openFeedback[i].feedback}</p>}
                          <p className="text-xs text-slate-400 mt-1">{q.explanation}</p>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
                <Button onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false) }} variant="outline" className="w-full">New Quiz</Button>
              </div>
            )}
          </TabsContent>

          {/* ASSIGNMENTS TAB */}
          <TabsContent value="assignments" className="mt-6 space-y-6">
            {selAssn ? (
              <div className="space-y-6">
                <button onClick={() => { setSelAssn(null); setResult(null); setSubmitText(''); setAttachments([]) }}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline font-medium">
                  <ChevronLeft className="h-4 w-4" />Back to list
                </button>
                <Card className="shadow-sm border-slate-200 overflow-hidden">
                  <CardHeader className="pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{selAssn.title}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">{selAssn.subject} &middot; Due {formatDate(selAssn.dueDate)}</p>
                      </div>
                      <Badge className={statusColor(selAssn.status)}>{selAssn.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {/* Video */}
                    {selAssn.videoUrl && (
                      <div className="rounded-xl overflow-hidden bg-slate-900 shadow-lg">
                        {selAssn.videoProvider === 'youtube' || selAssn.videoProvider === 'vimeo' ? (
                          <iframe src={selAssn.videoUrl} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        ) : (
                          <video src={selAssn.videoUrl} controls className="w-full aspect-video" preload="metadata" />
                        )}
                      </div>
                    )}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">{selAssn.description}</div>
                    {selAssn.content && (
                      <div className="max-h-80 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <MarkdownRenderer content={selAssn.content.replace(/## Answer Key[\s\S]*/i, '').replace(/ANSWER KEY[\s\S]*/i, '')} />
                      </div>
                    )}
                    {selAssn.submissions && selAssn.submissions.length > 0 && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <p className="font-semibold text-emerald-800 text-sm mb-1">Previously submitted</p>
                        {selAssn.submissions[0].grade != null && <p className="text-emerald-700 text-sm">Grade: {Math.round(selAssn.submissions[0].grade)}%</p>}
                        {selAssn.submissions[0].feedback && <p className="text-emerald-700 text-sm mt-1">{selAssn.submissions[0].feedback}</p>}
                      </div>
                    )}
                    {(selAssn.status === 'PENDING' || selAssn.status === 'OVERDUE') && !result && (
                      <div className="space-y-4">
                        <label className="text-sm font-semibold text-slate-700 block">Your Answer</label>
                        <Textarea value={submitText} onChange={e => setSubmitText(e.target.value)} placeholder="Type your answer here..." rows={5} className="resize-none" />
                        <label className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt" />
                          {uploading ? <><Loader2 className="h-4 w-4 text-blue-500 animate-spin" /><span className="text-sm text-blue-600">Uploading...</span></> : <><Paperclip className="h-4 w-4 text-slate-400" /><span className="text-sm text-slate-500">Attach files (images, PDF, Word)</span></>}
                        </label>
                        {attachments.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 border rounded-xl text-sm">
                            <File className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="flex-1 truncate text-blue-600">{a.name}</span>
                            <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}><X className="h-4 w-4 text-slate-400 hover:text-red-500" /></button>
                          </div>
                        ))}
                        <Button onClick={handleSubmit} disabled={submitting || uploading || (!submitText.trim() && attachments.length === 0)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg text-white h-11">
                          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : <><Upload className="h-4 w-4 mr-2" />Submit for AI Grading</>}
                        </Button>
                      </div>
                    )}
                    {result && (
                      <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-600" /><span className="font-semibold text-emerald-800">Submitted!</span></div>
                        {result.grade != null && <p className="text-emerald-700 font-bold text-2xl">{Math.round(result.grade)}%</p>}
                        {result.feedback && <MarkdownRenderer content={result.feedback} className="text-sm text-emerald-700" />}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                {loadingAssn ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                ) : assignments.length === 0 ? (
                  <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-12 text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mx-auto">
                        <ClipboardList className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-700 font-semibold text-lg">No assignments yet</p>
                      <p className="text-slate-500 text-sm">Your teacher will post assignments here</p>
                    </CardContent>
                  </Card>
                ) : (
                  assignments.map(a => (
                    <div key={a.id} onClick={() => { setSelAssn(a); setResult(null); setSubmitText(''); setAttachments([]) }}
                      className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800 truncate group-hover:text-blue-700">{a.title}</p>
                          {a.videoUrl && <Badge variant="outline" className="text-violet-600 border-violet-300 bg-violet-50 text-[10px]"><Play className="h-2.5 w-2.5 fill-violet-500 mr-0.5" />Video</Badge>}
                        </div>
                        <p className="text-xs text-slate-400">{a.subject} &middot; Due {formatDate(a.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        {a.grade != null && <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{Math.round(a.grade)}%</span>}
                        <Badge className={statusColor(a.status)}>{a.status}</Badge>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* AI TUTOR TAB */}
          <TabsContent value="tutor" className="mt-6">
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <Button size="sm" variant={tutorMode === 'chat' ? 'default' : 'outline'}
                  className={tutorMode === 'chat' ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm' : ''}
                  onClick={() => setTutorMode('chat')}>
                  <Brain className="h-3.5 w-3.5 mr-1.5" /> AI Tutor
                </Button>
                <Button size="sm" variant={tutorMode === 'socratic' ? 'default' : 'outline'}
                  className={tutorMode === 'socratic' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm' : ''}
                  onClick={() => setTutorMode('socratic')}>
                  <HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Socratic Tutor
                </Button>
              </div>
            </div>
            {tutorMode === 'chat' ? (
              <div className="h-[65vh] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <ChatContainer onSend={handleAITutorChat} headerTitle="AI Tutor" headerSubtitle="Ask anything - Get instant explanations"
                  quickPrompts={['Explain simply', 'Practice questions', 'Key formulas', 'Quiz me!', 'Summarise topic']}
                  placeholder="Ask anything - explain, practice, quiz me..." icon="brain" />
              </div>
            ) : (
              <div className="h-[65vh] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <SocraticTutor subject={studySubject} topic={studyTopic || 'General'} />
              </div>
            )}
          </TabsContent>

          {/* WHITEBOARD TAB */}
          <TabsContent value="whiteboard" className="mt-6">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
              <div className="h-[70vh]"><AIWhiteboard /></div>
            </div>
          </TabsContent>

          {/* CHALLENGE TAB */}
          <TabsContent value="challenge" className="mt-6 space-y-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                  <Swords className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Course Challenge</h2>
                  <p className="text-sm text-slate-600">Comprehensive end-of-unit test. Score 70% or higher to earn mastery credit.</p>
                </div>
              </div>
            </div>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Subject</label>
                    <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Unit/Topic <span className="text-red-400">*</span></label>
                    <Input value={quizTopic} onChange={e => setQuizTopic(e.target.value)}
                      placeholder="e.g. Fractions" list="challenge-topics" className="h-10 text-sm rounded-xl" />
                    <datalist id="challenge-topics">{quizStrands.map(s => <option key={s.id} value={s.name} />)}</datalist>
                  </div>
                </div>
              </CardContent>
            </Card>
            {quizTopic.trim() && (
              <CourseChallengeWidget subject={quizSubject} unitName={quizTopic} grade={quizGrade}
                onComplete={(score, passed) => {
                  if (passed) toast({ title: 'Challenge passed!', description: `Score: ${score}% - Mastery credit earned!` })
                  else toast({ title: `Score: ${score}%`, description: 'You need 70% to pass. Keep practising!' })
                }} />
            )}
          </TabsContent>

          {/* REVIEWS TAB */}
          <TabsContent value="reviews" className="mt-6 space-y-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-sm">
                  <Repeat className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Spaced Repetition</h2>
                  <p className="text-sm text-slate-600">Review topics at optimal intervals to strengthen long-term retention.</p>
                </div>
              </div>
            </div>
            <SpacedRepetitionWidget subject={studySubject}
              onStartReview={(topic) => { setStudyTopic(topic); setTab('study'); toast({ title: `Review: ${topic}` }) }} />
            {getDueReviews().length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Due for Review</h3>
                {getDueReviews().map((r, i) => (
                  <Card key={i} className="border-orange-200 bg-white shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{r.topic}</p>
                        <p className="text-xs text-slate-500">{r.subject} &middot; {r.grade} &middot; Last score: {r.score}%</p>
                      </div>
                      <Button size="sm" onClick={() => { setStudySubject(r.subject); setStudyTopic(r.topic); setStudyGrade(r.grade); generateLesson(r.subject, r.topic); setTab('study') }}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                        <Repeat className="h-3.5 w-3.5 mr-1.5" />Review
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* WRITING TAB */}
          <TabsContent value="writing" className="mt-6 space-y-6">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-sm">
                  <PenTool className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Writing Coach</h2>
                  <p className="text-sm text-slate-600">Get instant AI feedback on your writing. Improve grammar, structure, and content.</p>
                </div>
              </div>
            </div>
            <WritingCoach subject={studySubject} topic={studyTopic || 'General Writing'} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
