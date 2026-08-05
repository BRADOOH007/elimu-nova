'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  BookOpen, Brain, CheckCircle, Loader2, RefreshCw, Play, Target, X,
  Compass, Repeat, GitBranch, ArrowRight, Sparkles, Trophy, Flame, Clock, Star
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { CurriculumBrowser } from '@/components/student/curriculum-browser'
import { Recommendations } from '@/components/student/recommendations'

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

export default function LearnPage() {
  const { toast } = useToast()

  // Core study state
  const [studySubject, setStudySubject] = useState('Mathematics')
  const [studyTopic,   setStudyTopic]   = useState('')
  const [studyGrade,   setStudyGrade]   = useState('Grade 4')
  const [studying,     setStudying]     = useState(false)
  const [lessonMd,     setLessonMd]     = useState('')
  const [studyStrands, setStudyStrands] = useState<{id:string;name:string}[]>([])

  // Active recall
  const [activeLesson, setActiveLesson] = useState<ActiveLessonData | null>(null)
  const [studyPhase, setStudyPhase] = useState<'preview' | 'learn' | 'recall' | 'done'>('preview')
  const [recallAnswers, setRecallAnswers] = useState<(string | number)[]>([])
  const [recallSubmitted, setRecallSubmitted] = useState(false)
  const [recallScore, setRecallScore] = useState(0)

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

  // Streak (mock — replace with real data)
  const [streak, setStreak] = useState(3)
  const [todayLessons, setTodayLessons] = useState(2)

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
    setRecallAnswers([]); setRecallSubmitted(false); setRecallScore(0)
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

  // ── Active Recall Handlers ────────────────────────────────
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
        if (idx === (q.options?.findIndex(o => o === q.answer) ?? -1)) correct++
      } else if (typeof userAns === 'string' && userAns.trim().toLowerCase().includes(q.answer.trim().toLowerCase())) correct++
    })
    const score = activeLesson.recall.length > 0 ? Math.round((correct / activeLesson.recall.length) * 100) : 0
    setRecallScore(score); setRecallSubmitted(true)
    scheduleReview(activeLesson, score)
    setTodayLessons(p => p + 1)
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
    let correct = 0
    quizQuestions.forEach((q, i) => {
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (quizAnswers[i] !== undefined && Number(quizAnswers[i]) === q.correct_answer) correct++
      }
    })
    const score = quizQuestions.length > 0 ? Math.round((correct / quizQuestions.length) * 100) : 0
    setQuizScore(score); setQuizSubmitted(true)
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
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-24">

      {/* ── Greeting + Streak Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Learning Journey</h1>
          <p className="text-slate-500 text-sm mt-0.5">Study a topic, take a quiz, beat your streak</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{streak} day streak</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <Target className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-700">{todayLessons} today</span>
          </div>
        </div>
      </div>

      {/* ── Due Reviews ── */}
      {dueReviews.length > 0 && (
        <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Repeat className="h-5 w-5 text-orange-600" />
              <p className="font-semibold text-orange-800">{dueReviews.length} topic{dueReviews.length > 1 ? 's' : ''} due for review</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {dueReviews.slice(0, 3).map((r, i) => (
                <Button key={i} size="sm" variant="outline" onClick={() => resumeTopicLesson(r.subject, r.topic)}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs">
                  <Repeat className="h-3 w-3 mr-1" />{r.topic} ({r.score}%)
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Learning Path Progress ── */}
      {pathData && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">{studySubject} — {studyGrade}</span>
              </div>
              <span className="text-xs font-semibold text-blue-600">{pathData.completedCount}/{pathData.totalCount} topics</span>
            </div>
            <Progress value={pathData.percentComplete || 0} className="h-2.5" />
            {pathData.resumeTopic && pathData.resumeTopic.topicName !== studyTopic && (
              <div className="mt-3 flex items-center justify-between bg-white rounded-xl p-3 border border-blue-100">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Continue: {pathData.resumeTopic.topicName}</p>
                </div>
                <Button size="sm" onClick={() => resumeTopicLesson(studySubject, pathData.resumeTopic.topicName)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"><Play className="h-3.5 w-3.5 mr-1" />Resume</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Curriculum Browser ── */}
      {!activeLesson && !studying && !quickQuizOpen && (
        <div>
          <CurriculumBrowser onSelectTopic={handleExploreTopic} />
          <Recommendations onStudy={handleExploreTopic} />
        </div>
      )}

      {/* ── Loading ── */}
      {studying && (
        <Card><CardContent className="p-8 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-slate-600">Creating your personalized lesson...</p>
        </CardContent></Card>
      )}

      {/* ── Markdown Fallback Lesson ── */}
      {!studying && lessonMd && !activeLesson && (
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-extrabold">{studyTopic} — {studySubject}</CardTitle>
              <button onClick={() => setLessonMd('')} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="max-h-[500px] overflow-y-auto"><MarkdownRenderer content={lessonMd} /></div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => { setLessonMd(''); setActiveLesson(null) }} variant="outline" className="flex-1">Pick Another Topic</Button>
              <Button onClick={startQuickQuiz} disabled={quizLoading} className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
                {quizLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}Quick Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active Recall 3-Phase ── */}
      {activeLesson && !studying && (
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-200 uppercase tracking-wider mb-1">Phase {studyPhase === 'preview' ? '1' : studyPhase === 'learn' ? '2' : studyPhase === 'recall' ? '3' : '✓'}/3</p>
                <CardTitle className="text-lg font-extrabold">{activeLesson.topic} — {activeLesson.subject}</CardTitle>
              </div>
              <button onClick={() => { setActiveLesson(null); setStudyPhase('preview') }} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-1 mt-3">
              {['preview','learn','recall'].map(p => (
                <button key={p} onClick={() => setStudyPhase(p as any)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${studyPhase === p ? 'bg-white text-teal-700' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}>
                  {p === 'preview' ? 'Preview' : p === 'learn' ? 'Learn' : 'Recall'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Phase 1: Preview */}
            {studyPhase === 'preview' && (
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">{activeLesson.preview.whatYoullLearn}</p>
                </div>
                <div className="space-y-2">
                  {activeLesson.preview.concepts.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                      <span className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">{i + 1}</span>
                      <span className="text-sm text-slate-700">{c}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setStudyPhase('learn')} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold">Start Learning</Button>
              </div>
            )}

            {/* Phase 2: Learn */}
            {studyPhase === 'learn' && (
              <div className="space-y-5">
                <div className="max-h-[450px] overflow-y-auto"><MarkdownRenderer content={activeLesson.content} /></div>
                <Button onClick={() => { setStudyPhase('recall'); setRecallAnswers(new Array(activeLesson.recall.length).fill(undefined)) }}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"><Brain className="w-4 h-4 mr-2" />I'm Ready — Test Me!</Button>
              </div>
            )}

            {/* Phase 3: Recall */}
            {studyPhase === 'recall' && (
              <div className="space-y-4">
                {activeLesson.recall.map((q, i) => (
                  <div key={i} className="border rounded-xl p-4 space-y-3">
                    <p className="font-semibold text-slate-800 text-sm">{i + 1}. {q.question}</p>
                    {q.type === 'mcq' && q.options ? (
                      <div className="space-y-1.5">
                        {q.options.map((opt, j) => {
                          const sel = recallAnswers[i] === j; const correct = recallSubmitted && j === q.options!.findIndex(o => o === q.answer)
                          const wrong = recallSubmitted && sel && !correct
                          return (
                            <button key={j} disabled={recallSubmitted} onClick={() => handleRecallChange(i, j)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left text-sm ${correct ? 'bg-green-100 border-green-400' : wrong ? 'bg-red-100 border-red-400' : sel ? 'bg-blue-100 border-blue-400' : 'border-slate-200 hover:border-blue-300'}`}>
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${correct ? 'bg-green-500 text-white' : wrong ? 'bg-red-500 text-white' : sel ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65+j)}</span>
                              {opt}{correct && <CheckCircle className="ml-auto h-4 w-4 text-green-600" />}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <input type="text" disabled={recallSubmitted} value={typeof recallAnswers[i] === 'string' ? recallAnswers[i] as string : ''}
                        onChange={e => handleRecallChange(i, e.target.value)} placeholder="Type your answer..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50" />
                    )}
                    {recallSubmitted && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                        <span className="font-bold text-blue-800">Answer: </span><span className="text-blue-700">{q.answer}</span>
                        <p className="text-blue-600 text-xs mt-1">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}

                {!recallSubmitted ? (
                  <Button onClick={submitRecall} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"><CheckCircle className="w-4 h-4 mr-2" />Submit Answers</Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-indigo-700">{recallScore}%</p>
                      <p className="text-sm text-indigo-600">{recallScore >= 80 ? 'Excellent! You\'ve mastered this.' : recallScore >= 50 ? 'Good progress! Review and try again.' : 'Keep going! Practice makes perfect.'}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={() => { setStudyPhase('learn'); setRecallSubmitted(false) }} variant="outline" className="flex-1">Review</Button>
                      <Button onClick={startQuickQuiz} disabled={quizLoading} className="flex-1 bg-indigo-500 text-white">
                        {quizLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}Quick Quiz
                      </Button>
                      <Button onClick={completeAndAdvance} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold"><ArrowRight className="h-4 w-4 mr-2" />Complete &amp; Continue</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Quick Quiz Overlay ── */}
      {quickQuizOpen && quizQuestions.length > 0 && (
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-200 uppercase tracking-wider">Quick Quiz — {studySubject}</p>
                <CardTitle className="text-lg font-extrabold">{studyTopic}</CardTitle>
              </div>
              <button onClick={() => setQuickQuizOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!quizSubmitted ? (
              <>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Question {quizQIndex + 1} of {quizQuestions.length}</span>
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
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm ${quizAnswers[quizQIndex] === j ? 'bg-blue-100 border-blue-400 text-blue-800' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${quizAnswers[quizQIndex] === j ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + j)}</span>{opt}
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
                    <Button onClick={submitQuiz} className="flex-1 bg-green-500 text-white"><CheckCircle className="h-4 w-4 mr-2" />Submit Quiz</Button>
                  )}
                </div>
                <Progress value={((quizQIndex + 1) / quizQuestions.length) * 100} className="h-1.5" />
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold text-indigo-700">{quizScore}%</p>
                  <p className="text-sm text-indigo-600">{quizScore >= 80 ? 'Great job!' : quizScore >= 50 ? 'Good effort!' : 'Keep practicing!'}</p>
                </div>
                <Button onClick={() => { setQuickQuizOpen(false); setQuizQuestions([]) }} className="w-full">Done</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Empty State ── */}
      {!studying && !activeLesson && !lessonMd && !quickQuizOpen && !pathLoading && (
        <div className="text-center py-12 space-y-4">
          <BookOpen className="h-16 w-16 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-semibold">Pick a topic above to start learning</p>
          <p className="text-slate-400 text-sm">Your AI lesson will appear here with active recall questions</p>
        </div>
      )}

      {/* ── Notes ── */}
      <Card>
        <CardHeader className="cursor-pointer select-none" onClick={() => setNotesOpen(!notesOpen)}>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">📝 My Notes</span>
            <span className="text-slate-400 text-sm">{notesOpen ? '▼' : '▶'}</span>
          </CardTitle>
        </CardHeader>
        {notesOpen && (
          <CardContent className="space-y-3">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Type your notes here..." rows={4} className="resize-none" />
            <Button onClick={saveNote} disabled={!notes.trim()} size="sm" className="bg-amber-500 hover:bg-amber-600">Save Note</Button>
            {savedNotes.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {savedNotes.map(n => (
                  <div key={n.id} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400">{n.topic}</p>
                    <p className="text-sm text-slate-700">{n.text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
