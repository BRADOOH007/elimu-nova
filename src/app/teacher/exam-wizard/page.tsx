'use client'


import { useToast } from '@/hooks/use-toast'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  FileText,
  BookOpen,
  Brain,
  Loader2,
  ArrowLeft,
  Save,
} from 'lucide-react'

const SUBJECTS = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE', 'IRE', 'Agriculture', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Business Studies', 'Computer Studies']
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']
const TYPES = ['CAT', 'Mid-Term', 'End-Term', 'Mock', 'Holiday', 'Opener']

interface Question {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  text: string
  points: number
  options?: string[]
  correctAnswer?: string
}

interface Step {
  id: number
  label: string
  icon: any
}

const STEPS: Step[] = [
  { id: 1, label: 'Details', icon: FileText },
  { id: 2, label: 'Questions', icon: BookOpen },
  { id: 3, label: 'Answer Key', icon: Brain },
  { id: 4, label: 'Timing', icon: Clock },
  { id: 5, label: 'Review', icon: Eye },
]

let questionCounter = 0
const createQuestion = (type: Question['type'] = 'multiple_choice'): Question => {
  questionCounter++
  return {
    id: `q_${questionCounter}_${Date.now()}`,
    type,
    text: '',
    points: 1,
    options: type === 'multiple_choice' ? ['', '', '', ''] : type === 'true_false' ? ['True', 'False'] : undefined,
    correctAnswer: '',
  }
}

export default function ExamWizardPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [form, setForm] = useState({
    title: '',
    subject: '',
    grade: '',
    type: '',
    term: '',
    description: '',
  })

  const [questions, setQuestions] = useState<Question[]>([createQuestion()])
  const [isTimed, setIsTimed] = useState(false)
  const [timeLimit, setTimeLimit] = useState(60)
  const [startTime, setStartTime] = useState('')
  const [startDate, setStartDate] = useState('')

  const addQuestion = (type: Question['type'] = 'multiple_choice') => {
    setQuestions(prev => [...prev, createQuestion(type)])
  }

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const updateOption = (qId: string, optIdx: number, value: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId || !q.options) return q
      const opts = [...q.options]
      opts[optIdx] = value
      return { ...q, options: opts }
    }))
  }

  const addOption = (qId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q
      return { ...q, options: [...(q.options || []), ''] }
    }))
  }

  const removeOption = (qId: string, optIdx: number) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId || !q.options) return q
      const opts = q.options.filter((_, i) => i !== optIdx)
      return { ...q, options: opts, correctAnswer: q.correctAnswer === `${optIdx}` ? '' : q.correctAnswer }
    }))
  }

  const generateWithAI = async () => {
    if (!form.title.trim() || !form.subject || !form.grade) {
      toast({ variant:'destructive', title:'Fill in title, subject and grade first' }); return
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'exam_questions',
          title: form.title,
          subject: form.subject,
          grade: form.grade,
          description: form.description,
          duration: timeLimit,
          difficulty: 'intermediate',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.questions) {
          setQuestions(data.questions.map((q: any) => ({ ...createQuestion(q.type || 'multiple_choice'), ...q })))
        } else if (data.content) {
          toast({ title:'AI content generated', description:'Please review and adjust the questions.' })
        }
      } else {
        const err = await res.json()
        alert(`AI generation failed: ${err.error || 'Unknown error'}`)
      }
    } catch {
      toast({ variant:'destructive', title:'Failed to generate questions' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Build content as JSON
      const content = JSON.stringify(questions.map(q => ({
        id: q.id,
        type: q.type,
        text: q.text,
        points: q.points,
        options: q.options,
      })))

      // Build answer key
      const answerKey: Record<string, string> = {}
      questions.forEach(q => {
        if (q.correctAnswer) answerKey[q.id] = q.correctAnswer
      })

      const payload: any = {
        title: form.title,
        subject: form.subject,
        grade: form.grade,
        description: form.description,
        content,
        answerKey: JSON.stringify(answerKey),
        isTimed,
        timeLimit: isTimed ? timeLimit : null,
        startTime: startDate && startTime ? new Date(`${startDate}T${startTime}`).toISOString() : null,
        totalMarks: questions.reduce((sum, q) => sum + q.points, 0),
        metadata: { isExamBank: true, savedAt: new Date().toISOString(), term: form.term, type: form.type },
      }

      const res = await fetch('/api/exam-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/teacher/exam-bank')
      } else {
        const err = await res.json()
        alert(`Failed to save exam: ${err.error || 'Unknown error'}`)
      }
    } catch (e) {
      toast({ variant:'destructive', title:'Failed to save exam' })
    } finally {
      setSaving(false)
    }
  }

  const validateStep = useCallback((s: number): boolean => {
    switch (s) {
      case 1:
        return !!form.title && !!form.subject && !!form.grade
      case 2:
        return questions.length > 0 && questions.every(q => q.text.trim())
      case 3:
        return questions.every(q => {
          if (q.type === 'essay') return true
          return !!q.correctAnswer
        })
      default:
        return true
    }
  }, [form, questions])

  const nextStep = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 5))
    else toast({ variant:'destructive', title:'Please fill in all required fields' })
  }

  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const totalMarks = questions.reduce((sum, q) => sum + q.points, 0)

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exam Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mathematics Mid-Term Exam" />
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grade *</Label>
                <Select value={form.grade} onValueChange={v => setForm(f => ({ ...f, grade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={form.term} onValueChange={v => setForm(f => ({ ...f, term: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    {['Term 1', 'Term 2', 'Term 3'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description of the exam" rows={3} />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{questions.length} question{questions.length !== 1 ? 's' : ''} ({totalMarks} total marks)</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('multiple_choice')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> MCQ
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('true_false')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> T/F
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('short_answer')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Short
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion('essay')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Essay
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={generateWithAI} disabled={generating}>
                  {generating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Brain className="h-3.5 w-3.5 mr-1" />}
                  AI Generate
                </Button>
              </div>
            </div>

            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                    <span className="text-xs font-semibold text-slate-400 shrink-0">Q{idx + 1}</span>
                    <Select value={q.type} onValueChange={v => updateQuestion(q.id, { type: v as Question['type'], options: v === 'true_false' ? ['True', 'False'] : v === 'multiple_choice' ? ['', '', '', ''] : undefined, correctAnswer: '' })}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <input type="number" min={1} max={100} value={q.points}
                        onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                        className="w-16 h-7 text-xs border border-slate-200 rounded-lg text-center" />
                      <span className="text-xs text-slate-400">pts</span>
                    </div>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(q.id)} className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <textarea value={q.text}
                  onChange={e => updateQuestion(q.id, { text: e.target.value })}
                  placeholder={`Enter question ${idx + 1}...`}
                  className="w-full min-h-[60px] px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />

                {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                  <div className="space-y-1.5 pl-4">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct_${q.id}`} checked={q.correctAnswer === `${oi}`}
                          onChange={() => updateQuestion(q.id, { correctAnswer: `${oi}` })}
                          className="h-3.5 w-3.5 text-blue-600" />
                        <input value={opt}
                          onChange={e => updateOption(q.id, oi, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          className="flex-1 h-8 text-sm px-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={q.type === 'true_false'} />
                        {q.type === 'multiple_choice' && q.options.length > 2 && (
                          <button onClick={() => removeOption(q.id, oi)} className="p-0.5 text-red-300 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {q.type === 'multiple_choice' && (
                      <button onClick={() => addOption(q.id)} className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                        + Add option
                      </button>
                    )}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Correct Answer</Label>
                    <Input value={q.correctAnswer || ''}
                      onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })}
                      placeholder="Enter the correct answer"
                      className="h-8 text-sm" />
                  </div>
                )}

                {q.type === 'essay' && (
                  <p className="text-xs text-slate-400 italic">Essay questions are manually graded.</p>
                )}
              </div>
            ))}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Review and confirm the correct answers for each question.</p>
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-400">Q{idx + 1}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{q.type.replace('_', ' ')}</span>
                  <span className="text-xs text-slate-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-2">{q.text}</p>
                {q.type === 'multiple_choice' && q.options && (
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`ak_${q.id}`} checked={q.correctAnswer === `${oi}`}
                          onChange={() => updateQuestion(q.id, { correctAnswer: `${oi}` })}
                          className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-sm">{opt || `Option ${String.fromCharCode(65 + oi)}`}</span>
                        {q.correctAnswer === `${oi}` && <Check className="h-3.5 w-3.5 text-green-500" />}
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'true_false' && (
                  <div className="flex gap-4">
                    {['True', 'False'].map((val, vi) => (
                      <div key={val} className="flex items-center gap-2">
                        <input type="radio" name={`ak_${q.id}`} checked={q.correctAnswer === `${vi}`}
                          onChange={() => updateQuestion(q.id, { correctAnswer: `${vi}` })}
                          className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-sm">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'short_answer' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Correct Answer</Label>
                    <Input value={q.correctAnswer || ''}
                      onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })}
                      className="h-8 text-sm" />
                  </div>
                )}
                {q.type === 'essay' && (
                  <p className="text-xs text-slate-400 italic">Essay — graded manually, no answer key needed.</p>
                )}
              </div>
            ))}
          </div>
        )

      case 4:
        return (
          <div className="space-y-5 max-w-lg">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-slate-800">Timed Exam</p>
                <p className="text-sm text-slate-500">Set a time limit to make this a timed exam</p>
              </div>
              <div className="ml-auto">
                <Checkbox checked={isTimed} onCheckedChange={v => setIsTimed(!!v)} />
              </div>
            </div>
            {isTimed && (
              <>
                <div className="space-y-2">
                  <Label>Time Limit (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={480} value={timeLimit}
                      onChange={e => setTimeLimit(parseInt(e.target.value) || 60)}
                      className="w-24 h-10 text-center border border-slate-200 rounded-xl text-lg font-bold" />
                    <span className="text-sm text-slate-500">minutes</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-lg text-slate-800">{form.title || 'Untitled Exam'}</h3>
              <div className="flex flex-wrap gap-2">
                {form.subject && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{form.subject}</span>}
                {form.grade && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{form.grade}</span>}
                {form.type && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{form.type}</span>}
                {form.term && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{form.term}</span>}
              </div>
              {form.description && <p className="text-sm text-slate-500">{form.description}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{questions.length}</p>
                <p className="text-xs text-blue-600">Questions</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{totalMarks}</p>
                <p className="text-xs text-green-600">Total Marks</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{isTimed ? `${timeLimit}m` : 'No limit'}</p>
                <p className="text-xs text-purple-600">Time Limit</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-slate-700">Questions Preview</p>
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-start gap-3">
                  <span className="text-xs font-bold text-slate-400 mt-0.5 shrink-0">Q{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{q.text || <span className="italic text-slate-300">No question text</span>}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{q.type.replace('_', ' ')}</span>
                      <span className="text-xs text-slate-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-4 w-4 text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Exam</h1>
          <p className="text-slate-500 text-sm">Step-by-step exam creation wizard</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between mb-8 bg-white border border-slate-200 rounded-2xl p-2">
        {STEPS.map(s => (
          <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-medium ${step === s.id ? 'bg-blue-100 text-blue-700' : step > s.id ? 'text-green-600' : 'text-slate-400'}`}>
            <s.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[300px]">
        {getStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < 5 ? (
          <Button type="button" onClick={nextStep}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'Saving...' : 'Save Exam to Bank'}
          </Button>
        )}
      </div>
    </div>
  )
}
