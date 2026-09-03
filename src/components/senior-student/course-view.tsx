'use client'

import { useState } from 'react'
import useSWR from 'swr'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Loader2, ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Lesson {
  id: string
  title: string
  description: string | null
  content: string | null
  duration: number | null
  completed: boolean
}

interface CourseData {
  course: { id: string; title: string; description: string | null; duration: string | null; objectives: string[] }
  enrollment: { progress: number; status: string } | null
  lessons: Lesson[]
}

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null))

export function CourseView({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { data, mutate } = useSWR<CourseData>(`/api/senior-student/course?courseId=${courseId}`, fetcher)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const enroll = async () => {
    setBusy('enroll')
    try {
      const res = await fetch('/api/senior-student/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      if (res.ok) {
        await mutate(
          (current) =>
            current ? { ...current, enrollment: { progress: 0, status: 'ACTIVE' } } : current,
          { revalidate: false }
        )
      } else {
        await mutate()
      }
    } finally {
      setBusy(null)
    }
  }

  const completeLesson = async (lessonId: string) => {
    setBusy(lessonId)
    try {
      const res = await fetch('/api/senior-student/course-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, lessonId }),
      })
      if (res.ok) {
        const { progress } = await res.json()
        await mutate(
          (current) =>
            current
              ? {
                  ...current,
                  lessons: current.lessons.map((l) =>
                    l.id === lessonId ? { ...l, completed: true } : l
                  ),
                  enrollment: current.enrollment
                    ? { ...current.enrollment, progress }
                    : current.enrollment,
                }
              : current,
          { revalidate: false }
        )
      } else {
        await mutate()
      }
    } finally {
      setBusy(null)
    }
  }

  const done = data.lessons.filter((l) => l.completed).length
  const progress = data.lessons.length > 0 ? Math.round((done / data.lessons.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> All courses
      </button>

      {/* Header */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-indigo-200" />
            <span className="text-xs uppercase tracking-wider text-indigo-200 font-medium">Course</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight">{data.course.title}</h1>
          <p className="text-indigo-100 text-sm mt-2">{data.course.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {data.course.objectives.map((o) => (
              <span key={o} className="bg-white/15 text-indigo-50 text-xs font-medium rounded-full px-3 py-1">{o}</span>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-indigo-100 mb-1">
              <span>{done} of {data.lessons.length} lessons complete</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!data.enrollment && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-slate-600 mb-3">Enroll in this course to track your progress.</p>
            <Button onClick={enroll} disabled={busy === 'enroll'}>
              {busy === 'enroll' ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Enroll in this course
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lessons */}
      <div className="space-y-3">
        {data.lessons.map((lesson, i) => (
          <Card key={lesson.id} className="border-0 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded((p) => ({ ...p, [lesson.id]: !p[lesson.id] }))}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${lesson.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{lesson.title}</p>
                {lesson.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{lesson.description}</p>}
              </div>
              {lesson.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Circle className="h-5 w-5 text-slate-300 shrink-0" />}
              {expanded[lesson.id] ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
            </button>
            {expanded[lesson.id] && (
              <div className="border-t border-slate-100 px-4 py-4">
                {lesson.content ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-800 prose-li:text-slate-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Lesson content is being prepared.</p>
                )}
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant={lesson.completed ? 'outline' : 'default'}
                    onClick={() => completeLesson(lesson.id)}
                    disabled={busy === lesson.id}
                  >
                    {busy === lesson.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : lesson.completed ? <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-500" /> : <Circle className="h-4 w-4 mr-1.5" />}
                    {lesson.completed ? 'Completed' : 'Mark complete'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
