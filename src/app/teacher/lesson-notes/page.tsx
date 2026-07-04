'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Clipboard, Download, FileText, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface LessonPlanSummary {
  id: string
  title: string
  subject: string
  grade: string
  createdAt: string
}

interface NotesData {
  title?: string
  subject?: string
  grade?: string
  noteType?: string
  sections?: Array<{
    heading: string
    content: string
    keyPoints?: string[]
    examples?: string[]
    formulas?: string[]
    definitions?: Record<string, string>
  }>
  summary?: string
  studyTips?: string[]
  importantPoints?: string[]
  nextSteps?: string
  rawResponse?: string
}

const noteTypes = [
  { value: 'summary', label: 'Summary Notes' },
  { value: 'detailed', label: 'Detailed Notes' },
  { value: 'study-guide', label: 'Study Guide' },
  { value: 'quick-reference', label: 'Quick Reference' },
  { value: 'interactive', label: 'Interactive Notes' }
]

export default function TeacherLessonNotesPage() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlanSummary[]>([])
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState('')
  const [noteType, setNoteType] = useState('detailed')
  const [notes, setNotes] = useState<NotesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchLessonPlans = async () => {
      try {
        const response = await fetch('/api/lesson-plans')
        const data = await response.json()
        if (response.ok) {
          setLessonPlans(data.lessonPlans || [])
          if (data.lessonPlans?.[0]) setSelectedLessonPlanId(data.lessonPlans[0].id)
        } else {
          setMessage(data.error || 'Failed to load lesson plans')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLessonPlans()
  }, [])

  const selectedLessonPlan = useMemo(
    () => lessonPlans.find(plan => plan.id === selectedLessonPlanId),
    [lessonPlans, selectedLessonPlanId]
  )

  const generateNotes = async () => {
    if (!selectedLessonPlanId) return

    setGenerating(true)
    setMessage('')
    setNotes(null)
    try {
      const lessonPlanResponse = await fetch(`/api/lesson-plans/${selectedLessonPlanId}`)
      const lessonPlan = await lessonPlanResponse.json()

      if (!lessonPlanResponse.ok) {
        setMessage(lessonPlan.error || 'Could not load lesson plan details')
        return
      }

      const response = await fetch('/api/ai/generate-lesson-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonPlan, noteType })
      })
      const data = await response.json()

      if (response.ok) {
        setNotes(data.notes)
        setMessage('Lesson notes generated.')
      } else {
        setMessage(data.error || 'Could not generate lesson notes')
      }
    } finally {
      setGenerating(false)
    }
  }

  const notesText = useMemo(() => {
    if (!notes) return ''
    if (notes.rawResponse) return notes.rawResponse

    const chunks = [
      notes.title,
      notes.summary,
      ...(notes.sections || []).flatMap(section => [
        `\n${section.heading}`,
        section.content,
        ...(section.keyPoints || []).map(point => `- ${point}`)
      ]),
      notes.studyTips?.length ? `\nStudy tips\n${notes.studyTips.map(tip => `- ${tip}`).join('\n')}` : '',
      notes.importantPoints?.length ? `\nImportant points\n${notes.importantPoints.map(point => `- ${point}`).join('\n')}` : '',
      notes.nextSteps ? `\nNext steps\n${notes.nextSteps}` : ''
    ]

    return chunks.filter(Boolean).join('\n')
  }, [notes])

  const copyNotes = async () => {
    if (!notesText) return
    await navigator.clipboard.writeText(notesText)
    setMessage('Notes copied to clipboard.')
  }

  const downloadNotes = () => {
    if (!notesText) return
    const blob = new Blob([notesText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(notes?.title || 'lesson-notes').replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold edugenius-text-gradient-blue">Lesson Notes</h1>
        <p className="text-gray-600 mt-1">Generate student-ready notes from your saved lesson plans.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Notes
          </CardTitle>
          <CardDescription>Choose a lesson plan and the note format you need for class.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
          <Select value={selectedLessonPlanId} onValueChange={setSelectedLessonPlanId} disabled={loading || !lessonPlans.length}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Loading lesson plans...' : 'Select lesson plan'} />
            </SelectTrigger>
            <SelectContent>
              {lessonPlans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.title} - {plan.subject} {plan.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={noteType} onValueChange={setNoteType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noteTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button onClick={generateNotes} disabled={!selectedLessonPlanId || generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Generate
          </Button>
        </CardContent>
      </Card>

      {selectedLessonPlan && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{selectedLessonPlan.subject}</Badge>
          <Badge variant="secondary">{selectedLessonPlan.grade}</Badge>
          <Badge variant="secondary">{selectedLessonPlan.title}</Badge>
        </div>
      )}

      {message && <p className="text-sm text-gray-600">{message}</p>}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Generated Notes
              </CardTitle>
              <CardDescription>Review, copy, or download the notes before sharing with students.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyNotes} disabled={!notesText}>
                <Clipboard className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={downloadNotes} disabled={!notesText}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {generating ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : notes ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">{notes.title || 'Lesson Notes'}</h2>
                {notes.summary && <p className="mt-2 text-gray-700">{notes.summary}</p>}
              </div>
              {(notes.sections || []).map((section, index) => (
                <div key={`${section.heading}-${index}`} className="rounded-lg border bg-white p-4">
                  <h3 className="font-semibold text-gray-900">{section.heading}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{section.content}</p>
                  {!!section.keyPoints?.length && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {section.keyPoints.map(point => <li key={point}>{point}</li>)}
                    </ul>
                  )}
                </div>
              ))}
              {notes.rawResponse && <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{notes.rawResponse}</pre>}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              Generate notes from a lesson plan to see them here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
