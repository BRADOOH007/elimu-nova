'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Target, CheckCircle, XCircle, Lightbulb, ArrowRight, RefreshCw, Trophy, Clock, BarChart3, BookOpen } from 'lucide-react'

interface QuizQuestion {
  question: string
  options?: string[]
  correct_answer?: number
  correct?: number
  answer?: number
  explanation?: string
  type?: string
}

interface StudentQuizProps {
  subject: string
  grade: string
  topic: string
  onClose?: () => void
}

const XP_PER_CORRECT = 20
const QUIZ_BONUS = 30

export function StudentQuiz({ subject, grade, topic, onClose }: StudentQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const answersRef = useRef<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [reviewMode, setReviewMode] = useState(false)
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({})

  const startQuiz = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/checkpoint-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, grade, count: 10 })
      })
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || data)
        setAnswers({})
        answersRef.current = {}
        setQIndex(0)
        setSubmitted(false)
        setScore(0)
        setReviewMode(false)
        setShowExplanation({})
      }
    } catch {}
    finally { setLoading(false) }
  }, [subject, topic, grade])

  const selectAnswer = (optIdx: number) => {
    const next = { ...answersRef.current, [qIndex]: optIdx }
    answersRef.current = next
    setAnswers(next)
  }

  const submitQuiz = () => {
    let correct = 0
    questions.forEach((q, i) => {
      const userAns = answersRef.current[i]
      const correctAns = q.correct_answer ?? (q as any).correct ?? (q as any).answer
      if (userAns !== undefined && userAns !== null && Number(userAns) === Number(correctAns)) correct++
    })
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
    setScore(pct)
    setSubmitted(true)

    try {
      const state = JSON.parse(localStorage.getItem('elimunova_gamification') || '{}')
      state.xp = (state.xp || 0) + correct * XP_PER_CORRECT + QUIZ_BONUS
      state.quizzesTaken = (state.quizzesTaken || 0) + 1
      localStorage.setItem('elimunova_gamification', JSON.stringify(state))
    } catch {}
  }

  const getCorrectAnswer = (q: QuizQuestion) => {
    const ans = q.correct_answer ?? (q as any).correct ?? (q as any).answer
    return Number(ans)
  }

  if (questions.length === 0 && !loading) {
    return (
      <Card className="border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/60">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg mb-4">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">{topic}</h3>
          <p className="text-sm text-slate-500 mb-1">{subject} · {grade}</p>
          <p className="text-xs text-slate-400 mb-6 max-w-xs">10 multiple-choice questions. Test your knowledge and earn XP!</p>
          <Button onClick={startQuiz} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-8">
            <Target className="mr-2 h-5 w-5" /> Start Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
          <p className="text-sm text-slate-500 font-medium">Generating your quiz...</p>
          <p className="text-xs text-slate-400 mt-1">AI is crafting {grade}-level questions for {topic}</p>
        </CardContent>
      </Card>
    )
  }

  const q = questions[qIndex]
  if (!q) return null

  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 pb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-amber-200">{subject} · {grade}</p>
            <CardTitle className="truncate text-lg font-extrabold">{topic}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {submitted && <Badge className="bg-white/20 text-white border-0">{score}%</Badge>}
            {onClose && (
              <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        {!submitted ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <Clock className="h-4 w-4 text-amber-400" />Question {qIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-slate-400">{Math.round(((qIndex + 1) / questions.length) * 100)}% complete</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300" style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }} />
            </div>

            <div className="space-y-4">
              <p className="font-semibold text-slate-800 text-base leading-relaxed">
                <span className="text-amber-600 font-bold mr-2">{qIndex + 1}.</span>{q.question}
              </p>
              {(q.type === 'multiple_choice' || q.type === 'true_false' || !q.type) && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, j) => (
                    <button key={j} onClick={() => selectAnswer(j)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                        answers[qIndex] === j
                          ? 'border-amber-400 bg-amber-100 text-amber-900 shadow-sm'
                          : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                      }`}>
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        answers[qIndex] === j ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>{String.fromCharCode(65 + j)}</span>
                      <span className="leading-relaxed">{opt}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" disabled={qIndex === 0} onClick={() => setQIndex(i => i - 1)} className="flex-1">Previous</Button>
              {qIndex < questions.length - 1 ? (
                <Button onClick={() => setQIndex(i => i + 1)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submitQuiz} disabled={Object.keys(answers).length < questions.length} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                  <CheckCircle className="mr-2 h-4 w-4" />Submit Quiz
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {/* Score Card */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg mb-3">
                {score >= 80 ? <Trophy className="h-8 w-8 text-white" /> : score >= 50 ? <Target className="h-8 w-8 text-white" /> : <BookOpen className="h-8 w-8 text-white" />}
              </div>
              <p className="text-4xl font-extrabold text-amber-700">{score}%</p>
              <p className="text-sm font-medium text-amber-600 mt-1">
                {score >= 80 ? 'Excellent! You really know this topic.' : score >= 50 ? 'Good effort! A bit more practice and you will master it.' : 'Keep going! Every attempt builds your knowledge.'}
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-amber-500" />{questions.filter((_, i) => Number(answers[i]) === getCorrectAnswer(questions[i])).length}/{questions.length} correct</span>
                <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-500" />+{Object.values(answers).filter((ans, i) => Number(ans) === getCorrectAnswer(questions[i])).length * XP_PER_CORRECT + QUIZ_BONUS} XP earned</span>
              </div>
            </div>

            {/* Review Mode */}
            {reviewMode ? (
              <div className="space-y-4">
                {questions.map((q, i) => {
                  const userAns = answers[i]
                  const correctAns = getCorrectAnswer(q)
                  const isCorrect = userAns !== undefined && Number(userAns) === Number(correctAns)
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
                      <div className="flex items-start gap-2 mb-2">
                        {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{i + 1}. {q.question}</p>
                          {q.options && (
                            <div className="mt-2 space-y-1">
                              {q.options.map((opt, j) => (
                                <span key={j} className={`inline-block mr-2 mb-1 px-2 py-1 rounded text-xs font-medium ${
                                  j === correctAns ? 'bg-green-100 text-green-700 border border-green-300' :
                                  j === userAns && !isCorrect ? 'bg-red-100 text-red-700 border border-red-300' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {String.fromCharCode(65 + j)}. {opt}
                                </span>
                              ))}
                            </div>
                          )}
                          {!isCorrect && q.explanation && (
                            <button onClick={() => setShowExplanation(prev => ({ ...prev, [i]: !prev[i] }))} className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium">
                              <Lightbulb className="h-3.5 w-3.5" />
                              {showExplanation[i] ? 'Hide explanation' : 'Show explanation'}
                            </button>
                          )}
                          {!isCorrect && q.explanation && showExplanation[i] && (
                            <p className="mt-2 text-xs text-slate-600 bg-white rounded-lg p-3 border border-amber-200">{q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            <div className="flex gap-2">
              {!reviewMode && (
                <Button onClick={() => setReviewMode(true)} variant="outline" className="flex-1">
                  <Lightbulb className="mr-2 h-4 w-4" /> Review Answers
                </Button>
              )}
              {reviewMode && (
                <Button onClick={() => setReviewMode(false)} variant="outline" className="flex-1">
                  <BarChart3 className="mr-2 h-4 w-4" /> Back to Score
                </Button>
              )}
              <Button onClick={() => { setQuestions([]); startQuiz() }} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white">
                <RefreshCw className="mr-2 h-4 w-4" /> Retry Quiz
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
