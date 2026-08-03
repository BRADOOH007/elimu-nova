'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import {
  Swords, Trophy, Clock, CheckCircle, X, ChevronRight, ChevronLeft,
  Loader2, Award, Target, Zap
} from 'lucide-react'

interface ChallengeQuestion {
  question: string
  type: string
  options?: string[]
  correct_answer?: number
  model_answer?: string
  explanation: string
}

interface CourseChallengeWidgetProps {
  subject: string
  unitName: string
  grade?: string
  onComplete?: (score: number, passed: boolean) => void
}

export function CourseChallengeWidget({ subject, unitName, grade, onComplete }: CourseChallengeWidgetProps) {
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'results'>('intro')
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [challengeId, setChallengeId] = useState<string | null>(null)

  useEffect(() => {
    if (phase === 'quiz' && timeLeft > 0 && !submitted) {
      const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000)
      return () => clearTimeout(t)
    }
    if (timeLeft === 0 && questions.length > 0 && !submitted && phase === 'quiz') {
      handleSubmit()
    }
  }, [timeLeft, submitted, phase, questions.length])

  const startChallenge = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/student/course-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, unitName, grade }),
      })
      if (!r.ok) throw new Error('Failed to generate challenge')
      const d = await r.json()
      setQuestions(d.questions)
      setChallengeId(d.challengeId)
      setTimeLeft(d.questions.length * 120) // 2 min per question
      setPhase('quiz')
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const handleSubmit = useCallback(async () => {
    setSubmitted(true)
    let correct = 0
    const total = questions.length

    questions.forEach((q, i) => {
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (answers[i] !== undefined && Number(answers[i]) === q.correct_answer) correct++
      }
    })

    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    setScore(pct)

    // Submit to API
    if (challengeId) {
      try {
        await fetch('/api/student/course-challenge', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId,
            correctAnswers: correct,
            totalQuestions: total,
            timeTakenMins: Math.round(((questions.length * 120) - timeLeft) / 60),
            answers,
          }),
        })
      } catch { /* non-blocking */ }
    }

    setPhase('results')
    onComplete?.(pct, pct >= 70)
  }, [questions, answers, challengeId, timeLeft, onComplete])

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // Intro phase
  if (phase === 'intro') {
    return (
      <Card className="overflow-hidden border-2 border-amber-200">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Swords className="h-5 w-5" /> Course Challenge
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{unitName}</h3>
            <p className="text-sm text-gray-500">{subject} · Comprehensive Test</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-3">
              <Target className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-sm font-bold">10 Questions</p>
              <p className="text-[10px] text-gray-400">Mixed types</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-sm font-bold">20 Minutes</p>
              <p className="text-[10px] text-gray-400">Timed</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <Award className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <p className="text-sm font-bold">70% to Pass</p>
              <p className="text-[10px] text-gray-400">Earn mastery</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Covers all major concepts in this unit. Score 70% or higher to earn mastery credit.</p>
          <Button onClick={startChallenge} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Challenge…</> : <><Zap className="h-4 w-4 mr-2" /> Start Challenge</>}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Quiz phase
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[qIndex]
    return (
      <Card className="overflow-hidden border-2 border-amber-200">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              <span className="text-sm font-bold">Challenge — Q{qIndex + 1}/{questions.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={((qIndex + 1) / questions.length) * 100} className="w-20 h-1.5 bg-white/30" />
              <span className={`text-sm font-mono font-bold ${timeLeft < 60 ? 'text-red-200' : ''}`}>{fmtTime(timeLeft)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div>
            <Badge className="bg-amber-100 text-amber-700 text-xs mb-2">{q.type.replace('_', ' ')}</Badge>
            <p className="font-semibold text-slate-800 leading-relaxed">{q.question}</p>
          </div>

          {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const sel = answers[qIndex] === i
                const correct = submitted && i === q.correct_answer
                const wrong = submitted && sel && i !== q.correct_answer
                return (
                  <button key={i} disabled={submitted}
                    onClick={() => !submitted && setAnswers(p => ({ ...p, [qIndex]: i }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm
                      ${correct ? 'bg-green-100 border-green-400 text-green-800' :
                        wrong ? 'bg-red-100 border-red-400 text-red-800' :
                        sel ? 'bg-amber-100 border-amber-400 text-amber-800' :
                        'border-slate-200 hover:border-amber-300 hover:bg-amber-50'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${correct ? 'bg-green-500 text-white' : wrong ? 'bg-red-500 text-white' : sel ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {q.type !== 'multiple_choice' && q.type !== 'true_false' && (
            <Textarea
              disabled={submitted}
              value={typeof answers[qIndex] === 'string' ? answers[qIndex] as string : ''}
              onChange={e => !submitted && setAnswers(p => ({ ...p, [qIndex]: e.target.value }))}
              placeholder="Write your answer here..." rows={3} className="resize-none"
            />
          )}

          {submitted && q.explanation && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              <span className="font-bold">Explanation: </span>{q.explanation}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setQIndex(i => Math.max(0, i - 1))} disabled={qIndex === 0}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            {qIndex < questions.length - 1 ? (
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setQIndex(i => i + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : !submitted ? (
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSubmit}>
                <CheckCircle className="h-4 w-4 mr-1" /> Submit Challenge
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Results phase
  return (
    <Card className={`overflow-hidden border-2 ${score >= 70 ? 'border-green-300' : 'border-red-200'}`}>
      <CardHeader className={`py-6 ${score >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
        <div className="text-center">
          <Trophy className="h-12 w-12 mx-auto mb-2" />
          <p className="text-4xl font-black">{score}%</p>
          <p className="text-sm mt-1">{score >= 70 ? '🎉 Challenge Passed!' : '📚 Keep Practising'}</p>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-center space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-lg font-bold text-slate-900">{questions.length}</p>
            <p className="text-[10px] text-gray-400">Total Questions</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-lg font-bold text-green-600">{Math.round(score / 100 * questions.length)}</p>
            <p className="text-[10px] text-gray-400">Correct</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-lg font-bold text-amber-600">{fmtTime((questions.length * 120) - timeLeft)}</p>
            <p className="text-[10px] text-gray-400">Time Taken</p>
          </div>
        </div>
        {score >= 70 && (
          <Badge className="bg-green-100 text-green-700 text-sm px-4 py-1">
            ★ Mastery Credit Earned
          </Badge>
        )}
        <Button onClick={() => { setPhase('intro'); setQuestions([]); setAnswers({}); setSubmitted(false) }}
          variant="outline" className="w-full">
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}
