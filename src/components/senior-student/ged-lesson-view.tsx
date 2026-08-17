'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Loader2, X, CheckCircle2, ArrowRight, Lightbulb, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface RecallItem {
  question: string
  type: string
  options?: string[]
  answer: string
  explanation: string
}

interface ActiveLesson {
  topic: string
  subject: string
  grade: string
  preview: { whatYoullLearn: string; concepts: string[] }
  content: string
  images: { sectionTitle: string; imagePrompt: string; imageUrl?: string }[]
  recall: RecallItem[]
  generatedAt: string
}

interface GEDLessonViewProps {
  subject: string
  topic: string
  onClose: () => void
  onComplete: () => void
}

export function GEDLessonView({ subject, topic, onClose, onComplete }: GEDLessonViewProps) {
  const [lesson, setLesson] = useState<ActiveLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let cancelled = false
    async function generate() {
      try {
        const r = await fetch('/api/ai/generate-active-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, topic, grade: 'Adult', curriculum: 'ged-hiset' }),
        })
        const d = await r.json()
        if (!cancelled) {
          if (r.ok) setLesson(d)
          else setError(d.error || 'Could not generate this lesson')
        }
      } catch {
        if (!cancelled) setError('Could not generate this lesson. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [subject, topic])

  const check = (i: number) => setChecked((p) => ({ ...p, [i]: true }))

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-16 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-teal-500 animate-pulse mb-3" />
            <p className="text-sm text-slate-600 font-medium">Generating your GED lesson on</p>
            <p className="text-base font-bold text-slate-800 mt-1">{topic}</p>
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> This usually takes a few seconds…
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-sm text-slate-600 mb-4">{error || 'No lesson content available.'}</p>
            <Button variant="outline" onClick={onClose}>Back to subject</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <X className="h-4 w-4" /> Close lesson
        </button>
        <span className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-100 rounded-full px-3 py-1">
          {subject}
        </span>
      </div>

      {/* Preview */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-600 to-emerald-700 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-emerald-200" />
            <span className="text-xs uppercase tracking-wider text-emerald-200 font-medium">Lesson</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight">{lesson.topic}</h1>
          <p className="text-emerald-100 text-sm mt-2">{lesson.preview?.whatYoullLearn}</p>
          {lesson.preview?.concepts?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {lesson.preview.concepts.map((c) => (
                <span key={c} className="bg-white/15 text-emerald-50 text-xs font-medium rounded-full px-3 py-1">
                  {c}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-800 prose-li:text-slate-600 prose-table:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Recall */}
      {lesson.recall?.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" /> Check your understanding
          </h2>
          {lesson.recall.map((q, i) => {
            const answered = checked[i]
            const selected = answers[i]
            const correctIdx = q.options?.findIndex((o) => o === q.answer) ?? -1
            const isCorrect = answered && selected === correctIdx
            return (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <p className="font-semibold text-slate-800 text-sm">{i + 1}. {q.question}</p>
                  <div className="space-y-2 mt-3">
                    {(q.options ?? []).map((opt, oi) => {
                      let cls = 'border-slate-200 bg-white text-slate-700'
                      if (answered) {
                        if (oi === correctIdx) cls = 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        else if (oi === selected) cls = 'border-rose-300 bg-rose-50 text-rose-800'
                        else cls = 'border-slate-200 bg-white text-slate-400'
                      }
                      return (
                        <button
                          key={oi}
                          disabled={answered}
                          onClick={() => setAnswers((p) => ({ ...p, [i]: oi }))}
                          className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors ${cls}`}
                        >
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {!answered ? (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => check(i)} disabled={selected === undefined}>
                      Check answer
                    </Button>
                  ) : (
                    <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                      {isCorrect ? <CheckCircle2 className="h-4 w-4 inline mr-1" /> : 'Not quite — '}
                      {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Button
        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
        onClick={onComplete}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" /> Mark lesson complete
      </Button>
    </div>
  )
}
