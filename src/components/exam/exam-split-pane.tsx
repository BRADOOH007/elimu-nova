'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface Question {
  id: number | string
  text: string
  type: 'multiple_choice' | 'short_answer' | 'true_false'
  options?: string[]
  marks: number
  section?: 'A' | 'B'
}

interface ExamSplitPaneProps {
  title: string
  description?: string
  questions: Question[]
  timeLimit: number
  onSubmit: (answers: Record<string, string>, timeSpent: number) => void
  isSubmitting: boolean
  startedAt: string | null
  dueDate?: string
  subject?: string
  grade?: string
}

export default function ExamSplitPane({
  title, description, questions, timeLimit, onSubmit, isSubmitting,
  startedAt, dueDate, subject, grade,
}: ExamSplitPaneProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(() => {
    // Resume from the server-side start time so refresh/reload can't reset the clock
    if (!startedAt) return timeLimit * 60
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    return Math.max(0, timeLimit * 60 - elapsed)
  })
  const [showPreview, setShowPreview] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasSubmittedRef = useRef(false)
  const answerPanelRef = useRef<HTMLDivElement>(null)
  const answersRef = useRef<Record<string, string>>({})

  const sectionA = questions.filter(q => q.section !== 'B')
  const sectionB = questions.filter(q => q.section === 'B')

  useEffect(() => {
    const saved = sessionStorage.getItem(`exam_split_${title}_answers`)
    if (saved) setAnswers(JSON.parse(saved))
  }, [title])

  const startTime = startedAt ? new Date(startedAt).getTime() : Date.now()

  useEffect(() => {
    if (timeRemaining === null) {
      setTimeRemaining(timeLimit * 60)
      return
    }
    if (timeRemaining <= 0) {
      handleSubmit()
      return
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timeRemaining])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleAnswer = (qId: number | string, value: string) => {
    const updated = { ...answers, [String(qId)]: value }
    setAnswers(updated)
    answersRef.current = updated
    sessionStorage.setItem(`exam_split_${title}_answers`, JSON.stringify(updated))
  }

  const handleSubmit = () => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    const finalAnswers = answersRef.current
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    onSubmit(finalAnswers, timeSpent)
    sessionStorage.removeItem(`exam_split_${title}_answers`)
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0)
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[500px]">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-[400px]">{title}</h2>
          {subject && <Badge variant="outline" className="text-xs">{subject}</Badge>}
          {grade && <Badge variant="outline" className="text-xs">{grade}</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {answeredCount}/{questions.length} answered
          </span>
          <div className={`flex items-center gap-1.5 font-mono text-base font-bold ${
            timeRemaining !== null && timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'
          }`}>
            <Clock className="w-4 h-4" />
            {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden sm:flex"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="ml-1">{showPreview ? 'Hide' : 'Show'} Preview</span>
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Exam content */}
        {showPreview && (
          <div className="w-1/2 overflow-y-auto border-r border-slate-200 p-4 space-y-4 bg-gray-50/30 hidden sm:block">
            {sectionA.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">Section A: Multiple Choice (MCQ)</h3>
                  <p className="text-xs text-gray-500 mb-4">Choose the correct answer for each question.</p>
                  {sectionA.map((q, i) => (
                    <div key={q.id} className="mb-4 pb-4 border-b border-slate-100 last:border-0">
                      <p className="text-sm font-medium text-gray-800">
                        {i + 1}. {q.text}
                        <span className="text-xs text-gray-400 ml-2">({q.marks || 1} mark{q.marks !== 1 ? 's' : ''})</span>
                      </p>
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className={`text-sm px-3 py-1.5 rounded ${
                              answers[String(q.id)] === String(oi) ? 'bg-blue-100 text-blue-800' : 'text-gray-600'
                            }`}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'true_false' && (
                        <div className="mt-2 flex gap-3">
                          {['True', 'False'].map(v => {
                            const letter = v.charAt(0).toUpperCase()
                            return (
                              <span key={v} className={`text-sm px-4 py-1 rounded ${
                                answers[String(q.id)] === letter ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-500'
                              }`}>{v}</span>
                            )
                          })}
                        </div>
                      )}
                      {q.type === 'short_answer' && answers[String(q.id)] && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 italic">
                          Answer: {answers[String(q.id)]}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {sectionB.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3">Section B: Structured Questions</h3>
                  <p className="text-xs text-gray-500 mb-4">Write your answers in the space provided on the right panel.</p>
                  {sectionB.map((q, i) => (
                    <div key={q.id} className="mb-4 pb-4 border-b border-slate-100 last:border-0">
                      <p className="text-sm font-medium text-gray-800">
                        {sectionA.length + i + 1}. {q.text}
                        <span className="text-xs text-gray-400 ml-2">({q.marks || 1} mark{q.marks !== 1 ? 's' : ''})</span>
                      </p>
                      {answers[String(q.id)] && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 italic">
                          Answer: {answers[String(q.id)]}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Right: Answer sheet */}
        <div ref={answerPanelRef} className={`overflow-y-auto p-4 space-y-4 ${showPreview ? 'w-1/2' : 'w-full'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Answer Sheet</h3>
            <span className="text-sm text-gray-500">Total: {totalMarks} marks</span>
          </div>

          {sectionA.map((q, i) => (
            <Card key={q.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-800">
                    <span className="text-blue-600 font-bold">{i + 1}.</span> {q.text}
                  </p>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">{q.marks || 1} mk</Badge>
                </div>

                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const isSelected = answers[String(q.id)] === String(oi)
                      return (
                        <label
                          key={oi}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 bg-white'
                          }`}
                        >
                          <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-blue-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                          </div>
                          <span className="text-sm text-gray-700">{opt}</span>
                          <input type="radio" name={`ans_${q.id}`} value={String(oi)}
                            checked={isSelected}
                            onChange={() => handleAnswer(q.id, String(oi))}
                            className="hidden"
                          />
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="flex gap-3">
                    {['True', 'False'].map(val => {
                      const letter = val.charAt(0).toUpperCase()
                      const isSelected = answers[String(q.id)] === letter
                      return (
                        <button
                          key={val}
                          onClick={() => handleAnswer(q.id, letter)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                            isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          {val}
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <Textarea
                    value={answers[String(q.id)] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    placeholder="Write your answer here..."
                    rows={q.marks > 3 ? 5 : 3}
                    className="text-sm"
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {sectionB.map((q, i) => (
            <Card key={q.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-800">
                    <span className="text-green-600 font-bold">{sectionA.length + i + 1}.</span> {q.text}
                  </p>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">{q.marks || 1} mk</Badge>
                </div>
                <Textarea
                  value={answers[String(q.id)] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="Write your answer here..."
                  rows={q.marks > 3 ? 5 : 3}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-12 text-gray-500">No questions in this exam.</div>
          )}

          {questions.length > 0 && (
            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {questions.map((q, i) => (
                      <div
                        key={q.id}
                        className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          answers[String(q.id)]?.trim()
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                        title={`Q${i + 1}: ${answers[String(q.id)]?.trim() ? 'Answered' : 'Unanswered'}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-400 self-center">
                    {answeredCount}/{questions.length} answered
                  </span>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isSubmitting ? 'Submitting...' : `Submit Exam`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
