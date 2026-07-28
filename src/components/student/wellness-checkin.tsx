'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Heart, Sparkles, CheckCircle, Brain } from 'lucide-react'

interface Question {
  key: string
  question: string
  min: number
  max: number
}

const EMOJI_MAP: Record<number, string> = { 1: '😢', 2: '😕', 3: '😐', 4: '😊', 5: '😁' }
const LABEL_MAP: Record<string, Record<number, string>> = {
  mood: { 1: 'Very Low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' },
  energy: { 1: 'Exhausted', 2: 'Tired', 3: 'Okay', 4: 'Energetic', 5: 'Full of Energy' },
  stress: { 1: 'Relaxed', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Extreme' },
  sleep: { 1: 'Very Poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent' },
  social: { 1: 'Very Isolated', 2: 'Isolated', 3: 'Okay', 4: 'Connected', 5: 'Very Connected' },
  openness: { 1: 'Not at all', 2: 'A little', 3: 'Somewhat', 4: 'Open', 5: 'Very Open' },
}

export function WellnessCheckIn() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [concerns, setConcerns] = useState('')
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; flags: string[]; aiInsight: string } | null>(null)

  useEffect(() => {
    fetch('/api/wellness/checkin')
      .then(r => r.json())
      .then(d => setQuestions(d.questions))
      .finally(() => setLoading(false))
  }, [])

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/wellness/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, concerns, studentId: '' }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ score: 0, flags: ['ERROR'], aiInsight: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const q = questions[step]

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>

  if (result) {
    const isGood = result.flags.length === 0
    return (
      <Card className="max-w-lg mx-auto border-green-100">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className={`h-8 w-8 ${isGood ? 'text-green-600' : 'text-amber-500'}`} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{isGood ? 'You are doing great! 💪' : 'Thank you for sharing ❤️'}</h3>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${isGood ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            Wellbeing Score: {result.score}%
          </div>
          {result.flags.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
              Flags: {result.flags.join(', ')}
            </div>
          )}
          <p className="text-sm text-slate-600 leading-relaxed">{result.aiInsight}</p>
          <Button onClick={() => { setResult(null); setStep(0); setAnswers({}); setConcerns('') }} variant="outline" className="mt-2">
            <Heart className="h-4 w-4 mr-1" /> Check in again later
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step >= questions.length) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 text-center">Anything else to share? 💬</h3>
          <Textarea value={concerns} onChange={e => setConcerns(e.target.value)} placeholder="Share anything on your mind (optional)..." rows={3} />
          <div className="flex gap-2">
            <Button onClick={() => setStep(questions.length - 1)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={submit} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Submit Check-In
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Weekly Check-In</CardTitle>
          </div>
          <span className="text-xs text-slate-400">{step + 1} / {questions.length + 1}</span>
        </div>
        <CardDescription>How are you doing? There are no wrong answers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center">
          <p className="text-3xl mb-2">{EMOJI_MAP[answers[q.key]] || '💙'}</p>
          <p className="text-sm font-medium text-slate-700">{q.question}</p>
          {answers[q.key] && <p className="text-xs text-blue-600 mt-1 font-medium">{LABEL_MAP[q.key]?.[answers[q.key]] || answers[q.key]}/5</p>}
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} onClick={() => { setAnswers(prev => ({ ...prev, [q.key]: v })); setTimeout(() => setStep(step + 1), 300) }}
              className={`w-12 h-12 rounded-xl text-lg font-bold transition-all ${answers[q.key] === v ? 'bg-blue-600 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex justify-between">
          <Button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} variant="ghost" size="sm">← Back</Button>
          <Button onClick={() => setStep(step + 1)} variant="ghost" size="sm">Skip →</Button>
        </div>
      </CardContent>
    </Card>
  )
}
