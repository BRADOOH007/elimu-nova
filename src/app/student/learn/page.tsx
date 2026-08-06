'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen, Brain, CheckCircle, Loader2, Play, Target, X,
  Compass, Repeat, GitBranch, ArrowRight, Sparkles, Trophy, Flame, Clock, Star, Zap, AlertCircle, MessageSquare
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { CurriculumBrowser } from '@/components/student/curriculum-browser'
import { Recommendations } from '@/components/student/recommendations'
import { FocusTimer } from '@/components/student/focus-timer'
import { AIStudyBuddy } from '@/components/student/ai-study-buddy'
import { HopeAITutorDrawer } from '@/components/ai-tutor-drawer'
import { useAITutor } from '@/components/ai-tutor-provider'
import { cleanAiJson } from '@/lib/ai-generation-utils'
import { getGameState, updateStreak, awardXP, persistGameState, getLevelName, getXpToNextLevel, XP_REWARDS } from '@/lib/gamification'
import { addMistake, getMistakeCount, markMistakeReviewed, getUnreviewedMistakes } from '@/lib/mistake-bank'
import { evaluateAnswer } from '@/lib/answer-evaluator'
import { trackQuizSubmission, trackPracticeAttempt } from '@/lib/telemetry'
import { useSession } from 'next-auth/react'

// Types & constants (keep from original)
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
  'Mathematics','English','Kiswahili','Science','Social Studies','CRE','Physics','Chemistry',
  'Biology','History','Geography','Agriculture','Business Studies','Computer Studies'
]

function LearnPageContent() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const { openAITutor } = useAITutor()
  const searchParams = useSearchParams()

  // Core study state — initialized from URL params if present
  const [studySubject, setStudySubject] = useState(() => {
    const s = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('subject') : null
    return s || 'Mathematics'
  })
  const [studyTopic,   setStudyTopic]   = useState('')
  const [studyGrade,   setStudyGrade]   = useState(() => {
    const g = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('grade') : null
    return g || 'Grade 4'
  })
  const [studying,     setStudying]     = useState(false)
  const [lessonMd,     setLessonMd]     = useState('')
  const [studyStrands, setStudyStrands] = useState<{id:string;name:string}[]>([])

  // Active recall
  const [activeLesson, setActiveLesson] = useState<ActiveLessonData | null>(null)
  const [studyPhase, setStudyPhase] = useState<'preview' | 'learn' | 'recall' | 'done'>('preview')
  const [recallAnswers, setRecallAnswers] = useState<(string | number)[]>([])
  const [recallSubmitted, setRecallSubmitted] = useState(false)
  const [recallScore, setRecallScore] = useState(0)
  const [recallChecked, setRecallChecked] = useState<Record<number, boolean | null>>({})
  const [recallHints, setRecallHints] = useState<Record<number, boolean>>({})

  // Learning path
  const [pathData, setPathData] = useState<{ topics: any[]; resumeTopic: any; completedCount: number; totalCount: number; percentComplete: number } | null>(null)
  const [pathLoading, setPathLoading] = useState(false)

  // Quick quiz (post-lesson)
  const [quickQuizOpen, setQuickQuizOpen] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQ[]>([])
  const [quizQIndex, setQuizQIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number,string|number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizShowAns, setQuizShowAns] = useState<Record<number,boolean>>({})
  const [quizLoading, setQuizLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>(null)

  // Notes
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState<Array<{id:string;text:string;topic:string}>>([])
  const [notesOpen, setNotesOpen] = useState(false)

  // ── Gamification State (XP, Levels, Streak) ─────────────────
  const [gameState, setGameState] = useState(() => updateStreak(getGameState()))
  const [showXpGain, setShowXpGain] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false })
  const todayStr = new Date().toISOString().split('T')[0]

  // Daily challenge
  const [dailyTopic, setDailyTopic] = useState('')
  const [dailySubject, setDailySubject] = useState('')
  const [dailyDone, setDailyDone] = useState(!!localStorage.getItem(`daily_done_${todayStr}`))

  // Mistake review
  const [mistakeMode, setMistakeMode] = useState(false)
  const [mistakeIdx, setMistakeIdx] = useState(0)

  const flashXp = (amount: number) => {
    setShowXpGain({ amount, visible: true })
    setTimeout(() => setShowXpGain({ amount: 0, visible: false }), 2000)
  }

  // Sync state when URL params change (e.g., clicking subject cards in dashboard)
  useEffect(() => {
    const subj = searchParams.get('subject')
    const grd = searchParams.get('grade')
    if (subj) setStudySubject(subj)
    if (grd) setStudyGrade(grd)
  }, [searchParams])

  // Hope AI drawer state
  const [showHopeDrawer, setShowHopeDrawer] = useState(false)
  const [hopeContext, setHopeContext] = useState('')

  const addXp = (amount: number) => {
    setGameState(prev => { const gs = awardXP(prev, amount); persistGameState(gs); return gs })
    flashXp(amount)
  }

  const levelName = getLevelName(gameState.level)
  const xpProgress = getXpToNextLevel(gameState.xp)
  const unreviewedMistakes = getUnreviewedMistakes()

  // ── Learning Path ──────────────────────────────────────────
  const fetchLearningPath = async (subj?: string, grade?: string) => {
    setPathLoading(true)
    try {
      const s = subj || studySubject
      const g = grade || studyGrade
      const res = await fetch(`/api/student/learning-path?grade=${encodeURIComponent(g)}&subject=${encodeURIComponent(s)}`)
      if (res.ok) setPathData(await res.json())
    } catch { /* ignore */ }
    finally { setPathLoading(false) }
  }

  useEffect(() => { fetchLearningPath() }, [studySubject, studyGrade])

  // ── Lesson Generation ─────────────────────────────────────
  const generateLesson = async (subjectArg?: string, topicArg?: string) => {
    const subject = subjectArg || studySubject
    const topic = topicArg || studyTopic
    if (!topic.trim()) { toast({ variant:'destructive', title:'Enter a topic first' }); return }
    setStudying(true); setActiveLesson(null); setStudyPhase('preview')
    setRecallAnswers([]); setRecallSubmitted(false); setRecallScore(0); setRecallChecked({}); setRecallHints({})
    try {
      const r = await fetch('/api/ai/generate-active-lesson', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ subject, topic, grade: studyGrade })
      })
      const d = await r.json()
      if (r.ok) { setActiveLesson(d); setLessonMd(d.content || ''); markTopicStarted(subject, topic) }
      else {
        const fb = await fetch('/api/ai/generate-lesson-content', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ lesson:{ title:topic, subject, grade:studyGrade }, studentLevel:'intermediate', learningStyle:'visual' })
        })
        if (fb.ok) { const fbData = await fb.json(); setLessonMd(fbData.content || ''); setActiveLesson(null) }
        else throw new Error(d.error || 'Could not generate lesson')
      }
      await fetchLearningPath(subject, studyGrade)
    } catch(e:any) { toast({ variant:'destructive', title:'Could not generate lesson', description:e.message }) }
    finally { setStudying(false) }
  }

  const markTopicStarted = async (subject: string, topic: string) => {
    try { await fetch('/api/student/progress', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subject, topic, type:'TOPIC_STARTED' }) }) } catch {}
  }

  const handleExploreTopic = (subject: string, topic: string) => {
    setStudySubject(subject); setStudyTopic(topic); generateLesson(subject, topic)
  }

  const startDailyChallenge = () => {
    if (!dailyTopic) return
    setStudySubject(dailySubject)
    setStudyTopic(dailyTopic)
    localStorage.setItem(`daily_done_${todayStr}`, '1')
    setDailyDone(true)
    addXp(XP_REWARDS.dailyChallenge)
    generateLesson(dailySubject, dailyTopic)
  }

  // ── Active Recall Handlers ────────────────────────────────
  const handleRecallChange = (i: number, val: string | number) => {
    setRecallAnswers(prev => { const next = [...prev]; next[i] = val; return next })
    setRecallChecked(prev => ({ ...prev, [i]: null }))
  }

  const checkSingleAnswer = (i: number) => {
    if (!activeLesson) return
    const q = activeLesson.recall[i]
    const userAns = recallAnswers[i]
    if (userAns === undefined) return
    let isCorrect = false
    if (q.type === 'mcq' && typeof userAns === 'number') {
      const correctIdx = q.options?.findIndex(o => o === q.answer) ?? -1
      isCorrect = userAns === correctIdx
    } else {
      isCorrect = evaluateAnswer(userAns, q.answer, q.type)
    }
    setRecallChecked(prev => ({ ...prev, [i]: isCorrect }))
    if (isCorrect) addXp(5)
    else addMistake(q.question, String(userAns), q.answer, activeLesson.topic, activeLesson.subject)
    trackPracticeAttempt({ userId: session?.user?.id || '', topicId: activeLesson.topic, subject: activeLesson.subject, isCorrect })
  }

  const submitRecall = () => {
    if (!activeLesson) return
    const correctCount = activeLesson.recall.filter((q, i) => {
      const userAns = recallAnswers[i]
      if (q.type === 'mcq' && userAns !== undefined) {
        const idx = typeof userAns === 'number' ? userAns : parseInt(userAns as string)
        const correctOptIdx = q.options?.findIndex(o => o === q.answer) ?? -1
        if (idx !== correctOptIdx) { addMistake(q.question, q.options?.[idx] || String(userAns), q.answer, activeLesson.topic, activeLesson.subject); return false }
        return true
      }
      if (typeof userAns === 'string') {
        const isCorrect = evaluateAnswer(userAns, q.answer, q.type)
        if (!isCorrect) addMistake(q.question, userAns, q.answer, activeLesson.topic, activeLesson.subject)
        return isCorrect
      }
      return false
    }).length
    const score = activeLesson.recall.length > 0 ? Math.round((correctCount / activeLesson.recall.length) * 100) : 0
    setRecallScore(score); setRecallSubmitted(true)
    scheduleReview(activeLesson, score)
    addXp(XP_REWARDS.lessonComplete + (correctCount * 5))
  }

  const scheduleReview = (lesson: ActiveLessonData, score: number) => {
    try {
      const raw = localStorage.getItem('elimunova_reviews')
      const reviews: ReviewEntry[] = raw ? JSON.parse(raw) : []
      const existing = reviews.findIndex(r => r.topic === lesson.topic && r.subject === lesson.subject)
      const interval = score >= 80 ? 7 : score >= 50 ? 3 : 1
      const nextReview = new Date(); nextReview.setDate(nextReview.getDate() + interval)
      const entry: ReviewEntry = { topic: lesson.topic, subject: lesson.subject, grade: lesson.grade, lastStudied: new Date().toISOString(), score, interval, nextReview: nextReview.toISOString() }
      if (existing >= 0) reviews[existing] = entry; else reviews.push(entry)
      localStorage.setItem('elimunova_reviews', JSON.stringify(reviews))
    } catch {}
  }

  const completeAndAdvance = async () => {
    if (pathData?.topics) {
      const currentIdx = pathData.topics.findIndex((t: any) => t.topicName === studyTopic)
      if (currentIdx >= 0 && currentIdx < pathData.topics.length - 1) {
        const next = pathData.topics[currentIdx + 1]
        setStudyTopic(next.topicName); generateLesson(studySubject, next.topicName)
      }
    }
    setActiveLesson(null); setStudyPhase('preview')
    try { await fetch('/api/student/progress', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subject: studySubject, topic: studyTopic, type:'TOPIC_COMPLETED' }) }) } catch {}
    await fetchLearningPath()
  }

  // ── Quick Quiz ────────────────────────────────────────────
  const startQuickQuiz = async () => {
    setQuizLoading(true); setQuizQuestions([]); setQuizQIndex(0); setQuizAnswers({}); setQuizSubmitted(false); setQuizScore(0)
    try {
      const res = await fetch('/api/ai/checkpoint-quiz', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ subject: studySubject, topic: studyTopic, grade: studyGrade, count: 4 })
      })
      if (res.ok) { const data = await res.json(); setQuizQuestions(data.questions || data); setQuickQuizOpen(true) }
      else toast({ variant:'destructive', title:'Could not load quiz' })
    } catch { toast({ variant:'destructive', title:'Could not load quiz' }) }
    finally { setQuizLoading(false) }
  }

  const submitQuiz = () => {
    const correctCount = quizQuestions.filter((q, i) => {
      const ans = quizAnswers[i]
      const correctAns = q.correct_answer
      if (ans === undefined || ans === null) return false
      const isCorrect = evaluateAnswer(ans, correctAns, q.type)
      if (!isCorrect && q.options && correctAns !== undefined) {
        addMistake(q.question, q.options[Number(ans)] || String(ans), q.options[correctAns] || String(correctAns), studyTopic, studySubject)
      }
      return isCorrect
    }).length
    const score = quizQuestions.length > 0 ? Math.round((correctCount / quizQuestions.length) * 100) : 0
    setQuizScore(score); setQuizSubmitted(true)
    addXp(XP_REWARDS.quizCorrect * Math.max(1, correctCount))
    trackQuizSubmission({ userId: session?.user?.id || '', subject: studySubject, topic: studyTopic, scorePercent: score, correctCount, totalQuestions: quizQuestions.length })
  }

  // ── Spaced Repetition ─────────────────────────────────────
  const getDueReviews = (): ReviewEntry[] => {
    try {
      const raw = localStorage.getItem('elimunova_reviews')
      const reviews: ReviewEntry[] = raw ? JSON.parse(raw) : []
      return reviews.filter(r => new Date(r.nextReview) <= new Date()).sort((a,b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
    } catch { return [] }
  }

  const resumeTopicLesson = (subj: string, topic: string) => {
    setStudySubject(subj); setStudyTopic(topic); generateLesson(subj, topic)
  }

  const dueReviews = getDueReviews()

  const saveNote = () => {
    if (!notes.trim()) return
    setSavedNotes(p => [{ id:Date.now().toString(), text:notes, topic:studyTopic||studySubject }, ...p])
    setNotes(''); toast({ title:'Note saved!' })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">

      {/* ═══ HERO ═══ */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-400/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-200">Learning Studio</p>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Your Learning Journey</h1>
              <p className="mt-1 text-sm text-indigo-100/90">Study a topic, take a quiz, beat your streak</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="gap-1.5 border border-white/20 bg-white/15 px-3 py-1.5 text-white backdrop-blur">
                <Flame className="h-4 w-4 text-amber-300" />
                {gameState.streak}d streak
              </Badge>
              <Badge className="gap-1.5 border border-white/20 bg-white/15 px-3 py-1.5 text-white backdrop-blur">
                <Zap className="h-4 w-4 text-yellow-300" />
                Lv.{gameState.level}
              </Badge>
              {getMistakeCount().unreviewed > 0 && (
                <button
                  onClick={() => { setMistakeMode(true); setMistakeIdx(0) }}
                  className="flex items-center gap-1.5 rounded-full border border-red-300/40 bg-red-500/25 px-3 py-1.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-red-500/35"
                >
                  <AlertCircle className="h-4 w-4 text-red-200" />
                  {getMistakeCount().unreviewed}
                </button>
              )}
              <button
                onClick={() => openAITutor(undefined, studySubject, studyTopic || undefined)}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/25"
              >
                <MessageSquare className="h-4 w-4 text-white" />
                Ask Hope
              </button>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-bold">{levelName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
                <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                {gameState.xp} XP
              </div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 transition-all duration-500"
                style={{ width: `${xpProgress.progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-indigo-100/80">
              <span>{levelName}</span>
              <span>Next: {getLevelName(gameState.level + 1)}</span>
            </div>
          </div>

          {/* XP Gain Toast */}
          {showXpGain.visible && (
            <div className="mt-3 inline-flex animate-bounce items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-sm font-bold shadow-lg">
              <Zap className="h-4 w-4" />+{showXpGain.amount} XP!
            </div>
          )}
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">

          {/* ── LEFT: Study Area ── */}
          <div className="min-w-0 space-y-6">

            {/* Focus Timer (during learn phase) */}
            {activeLesson && studyPhase === 'learn' && <FocusTimer onComplete={(m) => addXp(10)} />}

            {/* Loading */}
            {studying && (
              <Card className="overflow-hidden border-0 shadow-xl">
                <CardContent className="space-y-3 p-10 text-center">
                  <div className="relative mx-auto h-16 w-16">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-60" />
                    <Loader2 className="relative mx-auto h-16 w-16 animate-spin text-indigo-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Creating your personalized lesson...</p>
                  <p className="text-xs text-slate-400">Our AI is building your {studySubject} lesson</p>
                </CardContent>
              </Card>
            )}

            {/* ── Active Recall 3-Phase ── */}
            {activeLesson && !studying && (
              <Card className="overflow-hidden border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 pb-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs uppercase tracking-wider text-teal-200">Phase {studyPhase === 'preview' ? '1' : studyPhase === 'learn' ? '2' : studyPhase === 'recall' ? '3' : '✓'}/3</p>
                      <CardTitle className="truncate text-lg font-extrabold">{activeLesson.topic} — {activeLesson.subject}</CardTitle>
                    </div>
                    <button onClick={() => { setActiveLesson(null); setStudyPhase('preview') }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-3 flex gap-1">
                    {['preview','learn','recall'].map(p => (
                      <button key={p} onClick={() => setStudyPhase(p as any)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${studyPhase === p ? 'bg-white text-teal-700' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}>
                        {p === 'preview' ? 'Preview' : p === 'learn' ? 'Learn' : 'Recall'}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  {/* Phase 1: Preview */}
                  {studyPhase === 'preview' && (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm text-amber-800">{activeLesson.preview.whatYoullLearn}</p>
                      </div>
                      <div className="space-y-2">
                        {activeLesson.preview.concepts.map((c, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">{i + 1}</span>
                            <span className="text-sm text-slate-700">{c}</span>
                          </div>
                        ))}
                      </div>
                      <Button onClick={() => setStudyPhase('learn')} className="w-full bg-teal-500 font-semibold text-white hover:bg-teal-600">Start Learning</Button>
                    </div>
                  )}

                  {/* Phase 2: Learn */}
                  {studyPhase === 'learn' && (
                    <div className="space-y-5">
                      <div className="max-h-[450px] overflow-y-auto"><MarkdownRenderer content={activeLesson.content} /></div>
                      <Button onClick={() => { setStudyPhase('recall'); setRecallAnswers(new Array(activeLesson.recall.length).fill(undefined)) }}
                        className="w-full bg-indigo-500 font-semibold text-white hover:bg-indigo-600"><Brain className="mr-2 h-4 w-4" />I'm Ready — Test Me!</Button>
                    </div>
                  )}

                  {/* Phase 3: Recall */}
                  {studyPhase === 'recall' && (
                    <div className="space-y-4">
                      {activeLesson.recall.map((q, i) => (
                        <div key={i} className="space-y-3 rounded-xl border p-4">
                          <p className="text-sm font-semibold text-slate-800">{i + 1}. {q.question}</p>
                          {q.type === 'mcq' && q.options ? (
                            <div className="space-y-1.5">
                              {q.options.map((opt, j) => {
                                const sel = recallAnswers[i] === j; const correct = recallSubmitted && j === q.options!.findIndex(o => o === q.answer)
                                const wrong = recallSubmitted && sel && !correct
                                return (
                                  <button key={j} disabled={recallSubmitted} onClick={() => handleRecallChange(i, j)}
                                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm ${correct ? 'border-green-400 bg-green-100' : wrong ? 'border-red-400 bg-red-100' : sel ? 'border-blue-400 bg-blue-100' : 'border-slate-200 hover:border-blue-300'}`}>
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${correct ? 'bg-green-500 text-white' : wrong ? 'bg-red-500 text-white' : sel ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65+j)}</span>
                                    {opt}{correct && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                                  </button>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input type="text"
                                  disabled={recallSubmitted || recallChecked[i] === true}
                                  value={typeof recallAnswers[i] === 'string' ? recallAnswers[i] as string : ''}
                                  onChange={e => handleRecallChange(i, e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') checkSingleAnswer(i) }}
                                  placeholder="Type your answer..."
                                  className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                                    recallChecked[i] === true ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold' :
                                    recallChecked[i] === false ? 'border-rose-500 bg-rose-50 text-rose-900' :
                                    'border-slate-200 focus:ring-blue-500'}`} />
                                <Button size="sm" onClick={() => checkSingleAnswer(i)} disabled={recallChecked[i] === true || recallSubmitted}
                                  className="shrink-0 bg-indigo-500 text-xs text-white hover:bg-indigo-600">Check</Button>
                              </div>
                              {recallChecked[i] === true && <p className="text-xs font-semibold text-emerald-600">✓ Correct! +5 XP</p>}
                              {recallChecked[i] === false && (
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-rose-600">✗ Try again</p>
                                  <button onClick={() => setRecallHints(prev => ({ ...prev, [i]: !prev[i] }))} className="text-xs text-amber-600 hover:underline">
                                    💡 {recallHints[i] ? 'Hide hint' : 'View hint'}
                                  </button>
                                  {recallHints[i] && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">{q.explanation}</p>}
                                </div>
                              )}
                            </div>
                          )}
                          {recallSubmitted && (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
                              <span className="font-bold text-blue-800">Answer: </span><span className="text-blue-700">{q.answer}</span>
                              <p className="mt-1 text-xs text-blue-600">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}

                      {!recallSubmitted ? (
                        <Button onClick={submitRecall} className="w-full bg-indigo-500 font-semibold text-white hover:bg-indigo-600"><CheckCircle className="mr-2 h-4 w-4" />Submit Answers</Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4 text-center">
                            <p className="text-3xl font-extrabold text-indigo-700">{recallScore}%</p>
                            <p className="text-sm text-indigo-600">{recallScore >= 80 ? 'Excellent! You\'ve mastered this.' : recallScore >= 50 ? 'Good progress! Review and try again.' : 'Keep going! Practice makes perfect.'}</p>
                          </div>
                          {recallScore < 80 && (
                            <Button onClick={() => { setShowHopeDrawer(true); setHopeContext(`I scored ${recallScore}% on ${studyTopic}. Can you help me understand where I went wrong?`) }}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white hover:from-purple-700 hover:to-indigo-700">
                              <Sparkles className="mr-2 h-4 w-4" />Ask Hope AI Tutor
                            </Button>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => { setStudyPhase('learn'); setRecallSubmitted(false) }} variant="outline" className="flex-1">Review</Button>
                            <Button onClick={startQuickQuiz} disabled={quizLoading} className="flex-1 bg-indigo-500 text-white">
                              {quizLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}Quick Quiz
                            </Button>
                            <Button onClick={completeAndAdvance} className="w-full bg-teal-500 font-semibold text-white hover:bg-teal-600"><ArrowRight className="mr-2 h-4 w-4" />Complete & Continue</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Markdown Fallback Lesson ── */}
            {!studying && lessonMd && !activeLesson && (
              <Card className="overflow-hidden border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 pb-4 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="truncate text-lg font-extrabold">{studyTopic} — {studySubject}</CardTitle>
                    <button onClick={() => setLessonMd('')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"><X className="h-4 w-4" /></button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <div className="max-h-[500px] overflow-y-auto"><MarkdownRenderer content={lessonMd} /></div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => { setLessonMd(''); setActiveLesson(null) }} variant="outline" className="flex-1">Pick Another Topic</Button>
                    <Button onClick={() => { setShowHopeDrawer(true); setHopeContext(`I'm studying ${studyTopic} in ${studySubject}. Help me understand this better.`) }} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      <Sparkles className="mr-2 h-4 w-4" />Ask Hope
                    </Button>
                    <Button onClick={startQuickQuiz} disabled={quizLoading} className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
                      {quizLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Quick Quiz ── */}
            {quickQuizOpen && quizQuestions.length > 0 && (
              <Card className="overflow-hidden border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-violet-600 pb-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-indigo-200">Quick Quiz — {studySubject}</p>
                      <CardTitle className="truncate text-lg font-extrabold">{studyTopic}</CardTitle>
                    </div>
                    <button onClick={() => setQuickQuizOpen(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"><X className="h-4 w-4" /></button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5 sm:p-6">
                  {!quizSubmitted ? (
                    <>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-indigo-400" />Question {quizQIndex + 1} of {quizQuestions.length}</span>
                      </div>
                      {quizQuestions[quizQIndex] && (() => {
                        const q = quizQuestions[quizQIndex]
                        return (
                          <div className="space-y-4">
                            <p className="font-semibold text-slate-800">{quizQIndex + 1}. {q.question}</p>
                            {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                              <div className="space-y-2">
                                {q.options.map((opt, j) => (
                                  <button key={j} onClick={() => setQuizAnswers(p => ({...p, [quizQIndex]: j}))}
                                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${quizAnswers[quizQIndex] === j ? 'border-blue-400 bg-blue-100 text-blue-800' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${quizAnswers[quizQIndex] === j ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + j)}</span>{opt}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                      <div className="flex gap-2">
                        <Button variant="outline" disabled={quizQIndex === 0} onClick={() => setQuizQIndex(i => i - 1)} className="flex-1">Previous</Button>
                        {quizQIndex < quizQuestions.length - 1 ? (
                          <Button onClick={() => setQuizQIndex(i => i + 1)} className="flex-1 bg-indigo-500 text-white">Next</Button>
                        ) : (
                          <Button onClick={submitQuiz} className="flex-1 bg-green-500 text-white"><CheckCircle className="mr-2 h-4 w-4" />Submit Quiz</Button>
                        )}
                      </div>
                      <Progress value={((quizQIndex + 1) / quizQuestions.length) * 100} className="h-1.5" />
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4 text-center">
                        <p className="text-3xl font-extrabold text-indigo-700">{quizScore}%</p>
                        <p className="text-sm text-indigo-600">{quizScore >= 80 ? 'Great job!' : quizScore >= 50 ? 'Good effort!' : 'Keep practicing!'}</p>
                      </div>
                      {quizScore < 80 && (
                        <Button onClick={() => openAITutor('Can you help me understand where I went wrong on this topic?', studySubject, studyTopic)}
                          className="w-full bg-indigo-500 font-semibold text-white hover:bg-indigo-600">
                          <MessageSquare className="mr-2 h-4 w-4" />Chat with AI Tutor
                        </Button>
                      )}
                      <Button onClick={() => { setQuickQuizOpen(false); setQuizQuestions([]) }} className="w-full">Done</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Curriculum Browser + Recommendations (idle) ── */}
            {!activeLesson && !studying && !quickQuizOpen && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                    <Compass className="h-4 w-4 text-indigo-600" />
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">Explore the Curriculum</h2>
                </div>
                <CurriculumBrowser onSelectTopic={handleExploreTopic} />
                <Recommendations onStudy={handleExploreTopic} />
              </div>
            )}

            {/* ── Empty State ── */}
            {!studying && !activeLesson && !lessonMd && !quickQuizOpen && !pathLoading && (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-violet-50/60 py-12 text-center">
                <BookOpen className="mx-auto h-16 w-16 text-indigo-300" />
                <p className="mt-3 font-semibold text-slate-600">Pick a topic above to start learning</p>
                <p className="mt-1 text-sm text-slate-400">Your AI lesson will appear here with active recall questions</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="space-y-6 lg:sticky lg:top-4">

            {/* Daily Challenge */}
            {!dailyDone && dailyTopic && (
              <button onClick={startDailyChallenge} className="group w-full rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-amber-900">Daily Challenge</p>
                    <p className="truncate text-xs text-amber-700">{dailySubject}: {dailyTopic}</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-600">+{XP_REWARDS.dailyChallenge} XP</span>
                  </div>
                </div>
              </button>
            )}

            {/* Learning Path Progress */}
            {pathData && (
              <Card className="rounded-2xl border border-indigo-200 shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100"><GitBranch className="h-4 w-4 text-indigo-600" /></span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-indigo-900">{studySubject} — {studyGrade}</p>
                        <p className="text-[11px] text-indigo-500">{pathData.completedCount}/{pathData.totalCount} topics</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">{Math.round(pathData.percentComplete || 0)}%</span>
                  </div>
                  <Progress value={pathData.percentComplete || 0} className="h-2" />
                  {pathData.resumeTopic && pathData.resumeTopic.topicName !== studyTopic && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-indigo-800">Continue: {pathData.resumeTopic.topicName}</p>
                      </div>
                      <Button size="sm" onClick={() => resumeTopicLesson(studySubject, pathData.resumeTopic.topicName)}
                        className="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"><Play className="mr-1 h-3.5 w-3.5" />Resume</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Due Reviews */}
            {dueReviews.length > 0 && (
              <Card className="rounded-2xl border border-orange-200 shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100"><Repeat className="h-4 w-4 text-orange-600" /></span>
                    <div>
                      <p className="text-sm font-bold text-orange-900">Spaced Repetition</p>
                      <p className="text-[11px] text-orange-600">{dueReviews.length} topic{dueReviews.length > 1 ? 's' : ''} due today</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dueReviews.slice(0, 3).map((r, i) => (
                      <Button key={i} size="sm" variant="outline" onClick={() => resumeTopicLesson(r.subject, r.topic)}
                        className="rounded-full border-orange-300 text-xs text-orange-700 hover:bg-orange-100">
                        <Repeat className="mr-1 h-3 w-3" />{r.topic} ({r.score}%)
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mistake Review */}
            {mistakeMode && unreviewedMistakes.length > 0 && (
              <Card className="rounded-2xl border-2 border-red-200 shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100"><AlertCircle className="h-4 w-4 text-red-600" /></span>
                      <p className="text-sm font-bold text-red-800">Mistake Review <span className="font-semibold text-red-500">({mistakeIdx + 1}/{unreviewedMistakes.length})</span></p>
                    </div>
                    <button onClick={() => setMistakeMode(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500 transition-colors hover:bg-red-200"><X className="h-4 w-4" /></button>
                  </div>
                  {(() => {
                    const m = unreviewedMistakes[mistakeIdx]
                    if (!m) return null
                    return (
                      <div className="space-y-3 rounded-xl border border-red-100 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-800">{m.question}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-red-700">Your answer: {m.yourAnswer}</span>
                          <span className="rounded-lg border border-green-100 bg-green-50 px-2.5 py-1 text-green-700">Correct: {m.correctAnswer}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { markMistakeReviewed(m.id); setMistakeIdx(i => Math.min(i + 1, unreviewedMistakes.length - 1)) }} className="text-xs">Got it</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setMistakeIdx(i => Math.min(i + 1, unreviewedMistakes.length - 1)) }} className="text-xs">Skip</Button>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="cursor-pointer select-none py-4" onClick={() => setNotesOpen(!notesOpen)}>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">📝 My Notes</span>
                  <span className="text-sm text-slate-400">{notesOpen ? '▼' : '▶'}</span>
                </CardTitle>
              </CardHeader>
              {notesOpen && (
                <CardContent className="space-y-3">
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Type your notes here..." rows={4} className="resize-none" />
                  <Button onClick={saveNote} disabled={!notes.trim()} size="sm" className="bg-amber-500 hover:bg-amber-600">Save Note</Button>
                  {savedNotes.length > 0 && (
                    <div className="max-h-40 space-y-2 overflow-y-auto">
                      {savedNotes.map(n => (
                        <div key={n.id} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">{n.topic}</p>
                          <p className="text-sm text-slate-700">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </aside>
        </div>

        {/* AI Study Buddy — always visible at bottom */}
        <div className="mt-6">
          <AIStudyBuddy
            currentSubject={studySubject}
            currentTopic={studyTopic}
            onStartStudy={(s, t) => { setStudySubject(s); setStudyTopic(t); generateLesson(s, t) }}
          />
        </div>

        {/* Hope AI Tutor Drawer */}
        <HopeAITutorDrawer
          open={showHopeDrawer}
          onClose={() => setShowHopeDrawer(false)}
          studentName={""}
          currentSubject={studySubject}
          currentTopic={studyTopic}
        />
      </main>
    </div>
  )
}

// ── Wrapper: Suspense because LearnPageContent uses useSearchParams() ──
export default function LearnPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="h-9 w-56 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>}>
      <LearnPageContent />
    </Suspense>
  )
}
