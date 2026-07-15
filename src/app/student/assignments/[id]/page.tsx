"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Calendar, User2, FileText, Clock, CheckCircle, XCircle, Brain } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface Question {
  id: number
  text: string
  type: "multiple_choice" | "short_answer" | "true_false"
  options?: string[]
  marks: number
}

interface ExamContent {
  questions: Question[]
}

interface AssignmentDetail {
  id: string
  title: string
  description: string
  content?: string | null
  subject?: string | null
  dueDate: string
  status: string
  isTimed?: boolean
  timeLimit?: number | null
  answerKey?: string | null
  teacher: { id: string; name: string; email: string }
  lessonPlan?: { id: string; title: string; subject: string; grade: string } | null
  mySubmission?: {
    id: string
    grade?: number
    feedback?: string
    questionScores?: Record<string, { correct: boolean; studentAnswer: string; correctAnswer: string; marks: number }>
    needsRevision?: boolean
    revisionNotes?: string
    isAiGraded?: boolean
  } | null
}

interface SubmissionResult {
  id: string
  grade?: number
  feedback?: string
  questionScores?: Record<string, { correct: boolean; studentAnswer: string; correctAnswer: string; marks: number }>
  needsRevision?: boolean
  revisionNotes?: string
  isAiGraded?: boolean
}

function parseExamContent(raw: string | null | undefined): ExamContent {
  if (!raw) return { questions: [] }
  try {
    const parsed = JSON.parse(raw)
    if (parsed.questions && Array.isArray(parsed.questions)) return parsed
    if (Array.isArray(parsed)) return { questions: parsed }
    return { questions: [] }
  } catch {
    return { questions: [] }
  }
}

function parseAnswerKey(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    return {}
  } catch {
    return {}
  }
}

export default function StudentAssignmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workContent, setWorkContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)

  // Exam state
  const [questions, setQuestions] = useState<Question[]>([])
  const [answerKey, setAnswerKey] = useState<Record<string, string>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [examStarted, setExamStarted] = useState(false)
  const [examSubmitted, setExamSubmitted] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasSubmittedRef = useRef(false)

  const isTimedExam = assignment?.isTimed === true && questions.length > 0

  // Prevent navigation away during exam
  useEffect(() => {
    if (!examStarted || examSubmitted) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [examStarted, examSubmitted])

  // Timer countdown
  useEffect(() => {
    if (!examStarted || examSubmitted || timeRemaining === null) return
    if (timeRemaining <= 0) {
      handleSubmitExam()
      return
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [examStarted, examSubmitted, timeRemaining])

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/assignments/${assignmentId}`)
      if (!res.ok) throw new Error("Failed to load assignment")
      const data = await res.json()
      const a = data.assignment
      setAssignment(a)

      const parsed = parseExamContent(a.content)
      const key = parseAnswerKey(a.answerKey)
      setQuestions(parsed.questions)
      setAnswerKey(key)

      if (a.isTimed && parsed.questions.length > 0) {
        const saved = sessionStorage.getItem(`exam_${assignmentId}_answers`)
        const savedStarted = sessionStorage.getItem(`exam_${assignmentId}_started`)
        if (saved) setAnswers(JSON.parse(saved))
        if (savedStarted) setStartedAt(savedStarted)
      }

      // Check if already submitted
      if (a.mySubmission) {
        setSubmissionResult({
          id: a.mySubmission.id,
          grade: a.mySubmission.grade,
          feedback: a.mySubmission.feedback,
          questionScores: a.mySubmission.questionScores,
          needsRevision: a.mySubmission.needsRevision,
          revisionNotes: a.mySubmission.revisionNotes,
          isAiGraded: a.mySubmission.isAiGraded,
        })
        setExamSubmitted(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => { fetchAssignment() }, [fetchAssignment])

  const startExam = () => {
    const now = new Date().toISOString()
    setStartedAt(now)
    setExamStarted(true)
    const limit = assignment?.timeLimit || 60
    setTimeRemaining(limit * 60)
    sessionStorage.setItem(`exam_${assignmentId}_started`, now)
  }

  const handleAnswer = (questionId: number, answer: string) => {
    const updated = { ...answers, [String(questionId)]: answer }
    setAnswers(updated)
    sessionStorage.setItem(`exam_${assignmentId}_answers`, JSON.stringify(updated))
  }

  const handleSubmitExam = async () => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    setExamSubmitted(true)
    setIsSubmitting(true)

    const timeSpent = startedAt
      ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
      : 0

    // Build answer key comparison results
    const qs: Record<string, { correct: boolean; studentAnswer: string; correctAnswer: string; marks: number }> = {}
    let score = 0
    let totalMarks = 0
    for (const q of questions) {
      totalMarks += q.marks || 1
      const studentAns = answers[String(q.id)] || ''
      const correctAns = answerKey[String(q.id)] || ''
      const correct = studentAns.toLowerCase().trim() === correctAns.toLowerCase().trim()
      if (correct) score += q.marks || 1
      qs[String(q.id)] = { correct, studentAnswer: studentAns, correctAnswer: correctAns, marks: q.marks || 1 }
    }

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify({ answers, questions }),
          attachments: [],
          startedAt,
          timeSpent: String(timeSpent),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')

      const sub = data.submission
      setSubmissionResult({
        id: sub.id,
        grade: sub.grade ?? score,
        feedback: sub.feedback || `You scored ${score}/${totalMarks}`,
        questionScores: sub.questionScores || qs,
        needsRevision: sub.needsRevision ?? score < totalMarks,
        revisionNotes: sub.revisionNotes,
        isAiGraded: sub.isAiGraded ?? true,
      })
      setSubmitMessage(`Exam submitted! Score: ${score}/${totalMarks}`)
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
      sessionStorage.removeItem(`exam_${assignmentId}_answers`)
      sessionStorage.removeItem(`exam_${assignmentId}_started`)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleRevisionChat = () => {
    const wrongQuestions = questions.filter(q => {
      const s = submissionResult?.questionScores?.[String(q.id)]
      return s && !s.correct
    })
    const context = encodeURIComponent(JSON.stringify({
      topic: assignment?.title || '',
      subject: assignment?.subject || '',
      grade: assignment?.lessonPlan?.grade || '',
      wrongQuestions: wrongQuestions.map(q => ({
        text: q.text,
        options: q.options,
        correctAnswer: answerKey[String(q.id)] || '',
        studentAnswer: answers[String(q.id)] || '',
      })),
    }))
    window.open(`/student/ai-tutor?examRevision=${context}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">{error || "Assignment not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Exam submitted — show results ──
  if (examSubmitted && submissionResult) {
    const qs = submissionResult.questionScores || {}
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0)
    const score = questions.reduce((sum, q) => {
      const s = qs[String(q.id)]
      return sum + (s?.correct ? (s.marks || q.marks || 1) : 0)
    }, 0)

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Button variant="outline" onClick={() => router.push('/student/assignments')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to assignments
        </Button>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              {submissionResult.grade !== undefined && submissionResult.grade >= 50 ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-amber-500" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{assignment.title} — Results</h1>
            <div className="text-5xl font-bold text-blue-600">{Math.round((score / totalMarks) * 100)}%</div>
            <p className="text-lg text-gray-600">{score} / {totalMarks} marks</p>
            {submissionResult.feedback && (
              <div className="p-4 bg-white rounded-lg border border-slate-200 text-left text-sm text-gray-700">
                <MarkdownRenderer content={submissionResult.feedback} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-question breakdown */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Question Breakdown
            </h2>
            {questions.map((q, i) => {
              const s = qs[String(q.id)]
              const isCorrect = s?.correct
              const studentAns = s?.studentAnswer || answers[String(q.id)] || '(not answered)'
              const correctAns = s?.correctAnswer || answerKey[String(q.id)] || ''
              return (
                <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Question {i + 1}</p>
                      <p className="text-sm text-gray-600 mt-1">{q.text}</p>
                      {q.options && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt, oi) => {
                            const optLetter = opt.charAt(0)
                            const isSelected = studentAns === optLetter
                            const isAns = correctAns === optLetter
                            return (
                              <div key={oi} className={`text-sm px-3 py-1 rounded ${
                                isAns && isSelected ? 'bg-green-200 text-green-800' :
                                isAns ? 'bg-green-100 text-green-700' :
                                isSelected && !isCorrect ? 'bg-red-200 text-red-800' :
                                'bg-gray-50 text-gray-600'
                              }`}>
                                {opt}
                                {isAns && <CheckCircle className="w-3 h-3 inline ml-1 text-green-600" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {!isCorrect && (
                        <p className="text-xs text-red-600 mt-2">
                          Your answer: {studentAns} | Correct: {correctAns}
                        </p>
                      )}
                    </div>
                    <Badge variant={isCorrect ? 'default' : 'destructive'} className="shrink-0 ml-2">
                      {isCorrect ? `+${s?.marks || q.marks || 1}` : '0'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* AI Revision */}
        {submissionResult.needsRevision && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Need help with the ones you missed?</h2>
              <p className="text-gray-600 text-sm">Let the AI tutor revise the questions you got wrong with you.</p>
              <Button onClick={handleRevisionChat} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <Brain className="w-4 h-4 mr-2" /> Start AI Revision
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ── Exam mode — timed exam in progress ──
  if (isTimedExam && examStarted && !examSubmitted) {
    const q = questions[currentQuestion]
    if (!q) {
      return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }
    const allAnswered = questions.every(qq => answers[String(qq.id)]?.trim())

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Timer bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 -mx-6 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            {assignment.title}
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeRemaining !== null && timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
            <Clock className="w-5 h-5" />
            {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestion(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                i === currentQuestion ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-600 text-white' :
                answers[String(questions[i].id)]?.trim() ? 'bg-green-500 text-white' :
                'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current question */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <Badge variant="outline" className="text-sm">Question {currentQuestion + 1} of {questions.length}</Badge>
              <Badge>{q.marks || 1} mark{(q.marks || 1) > 1 ? 's' : ''}</Badge>
            </div>

            <p className="text-lg font-medium text-gray-800">{q.text}</p>

            {q.type === 'multiple_choice' && q.options && (
              <div className="space-y-3">
                {q.options.map((opt, oi) => {
                  const optLetter = opt.charAt(0)
                  const isSelected = answers[String(q.id)] === optLetter
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm text-gray-700">{opt}</span>
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={optLetter}
                        checked={isSelected}
                        onChange={() => handleAnswer(q.id, optLetter)}
                        className="hidden"
                      />
                    </label>
                  )
                })}
              </div>
            )}

            {q.type === 'true_false' && (
              <div className="flex gap-4">
                {['True', 'False'].map(val => {
                  const letter = val.charAt(0).toUpperCase()
                  const isSelected = answers[String(q.id)] === letter
                  return (
                    <button
                      key={val}
                      onClick={() => handleAnswer(q.id, letter)}
                      className={`flex-1 py-4 rounded-xl text-lg font-bold transition-all ${
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
                placeholder="Type your answer here..."
                rows={4}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            {Object.keys(answers).length} of {questions.length} answered
          </span>
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isSubmitting ? 'Submitting...' : allAnswered ? 'Submit All' : `Submit (${questions.length - Object.keys(answers).length} unanswered)`}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ── Exam intro / regular assignment ──
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to assignments
      </Button>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{assignment.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-2 flex-wrap">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                <span className="flex items-center"><User2 className="w-4 h-4 mr-1"/>{assignment.teacher.name}</span>
                {assignment.subject && <Badge variant="outline">{assignment.subject}</Badge>}
                {assignment.lessonPlan && (
                  <Badge variant="outline">From: {assignment.lessonPlan.title}</Badge>
                )}
                {assignment.isTimed && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                    <Clock className="w-3 h-3 mr-1" /> Timed: {assignment.timeLimit} min
                  </Badge>
                )}
              </div>
            </div>
            <Badge>{assignment.status}</Badge>
          </div>

          <p className="text-gray-700">{assignment.description}</p>

          {/* Exam intro screen */}
          {isTimedExam && !examStarted && (
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-4 text-center">
              <Clock className="w-12 h-12 text-amber-600 mx-auto" />
              <h2 className="text-xl font-bold text-amber-800">Timed Exam</h2>
              <div className="text-sm text-amber-700 space-y-2">
                <p>This exam has {questions.length} questions and a time limit of <strong>{assignment.timeLimit} minutes</strong>.</p>
                <p>Once you start, you cannot pause or navigate away. The exam will auto-submit when the timer runs out.</p>
                <p>Make sure you have a stable internet connection before starting.</p>
              </div>
              <Button onClick={startExam} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-lg px-12 py-6">
                <Clock className="w-5 h-5 mr-2" /> Start Exam
              </Button>
            </div>
          )}

          {/* Regular assignment content */}
          {!isTimedExam && assignment.content && (
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center mb-3 text-gray-700 font-semibold">
                <FileText className="w-4 h-4 mr-2 text-blue-600"/> Assignment Content
              </div>
              <MarkdownRenderer content={assignment.content} />
            </div>
          )}

          {/* Regular assignment workspace */}
          {!isTimedExam && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Your Workspace</h2>
              <Textarea
                value={workContent}
                onChange={(e) => setWorkContent(e.target.value)}
                placeholder="Type your answer here..."
                rows={10}
              />
              <div className="flex items-center gap-3">
                <Button onClick={async () => {
                  if (!assignmentId || !workContent.trim()) return
                  setIsSubmitting(true)
                  setSubmitMessage(null)
                  try {
                    const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ content: workContent, attachments: [] })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to submit')
                    setSubmitMessage('Submitted and auto-graded successfully!')
                    const refreshed = await fetch(`/api/assignments/${assignmentId}`)
                    if (refreshed.ok) {
                      const d = await refreshed.json()
                      setAssignment(d.assignment)
                    }
                  } catch (e) {
                    setSubmitMessage(e instanceof Error ? e.message : 'Submission failed')
                  } finally {
                    setIsSubmitting(false)
                  }
                }} disabled={isSubmitting || !workContent.trim()} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                  {isSubmitting ? 'Submitting...' : 'Submit for AI Check'}
                </Button>
                {submitMessage && <span className="text-sm text-gray-600">{submitMessage}</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
