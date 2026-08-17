'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAITutor } from '@/components/ai-tutor-provider'
import { GEDLessonView } from '@/components/senior-student/ged-lesson-view'
import {
  GraduationCap, Laptop, Brain, TrendingUp, Calculator, BookOpen, FlaskConical, Globe,
  ChevronDown, ChevronRight, CheckCircle2, Circle, Loader2, ArrowLeft, MessageSquare, Play,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const SUBJECT_META: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  'Mathematical Reasoning': { icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Reasoning Through Language Arts': { icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Science': { icon: FlaskConical, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  'Social Studies': { icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50' },
}

const COURSE_ICONS: Record<string, LucideIcon> = {
  ADULT_COMPUTER_LITERACY: Laptop,
  ADULT_AI_LITERACY: Brain,
  ADULT_FINANCIAL_LITERACY: TrendingUp,
  ADULT_WORKPLACE_READINESS: GraduationCap,
  ADULT_ESL: BookOpen,
}

interface Lesson { id: string; title: string; objectives: string[]; duration: number | null }
interface Substrand { id: string; name: string; description: string | null; learningOutcomes: string[]; lessons: Lesson[] }
interface Strand { id: string; name: string; description: string | null; substrands: Substrand[] }
interface Subject { subject: string; description: string | null; curriculumId: string | null; strands: Strand[] }
interface Course {
  id: string; title: string; description: string | null; type: string; difficulty: string;
  duration: string | null; objectives: string[]; lessonCount: number;
  enrolled: boolean; progress: number; status: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null))

function LearnContent() {
  const params = useSearchParams()
  const tab = params.get('tab') === 'courses' ? 'courses' : 'ged'
  const selectedSubject = params.get('subject')
  const { openAITutor } = useAITutor()

  const { data, mutate } = useSWR<{ subjects: Subject[]; courses: Course[] }>(
    '/api/senior-student/learn',
    fetcher,
  )

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [activeLesson, setActiveLesson] = useState<{ id: string; title: string } | null>(null)

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }))

  const completeLesson = async (subject: string, lessonId: string) => {
    setBusy(lessonId)
    await fetch('/api/senior-student/complete-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, lessonId }),
    })
    setBusy(null)
  }

  const enroll = async (courseId: string) => {
    setBusy(courseId)
    await fetch('/api/senior-student/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    })
    await mutate()
    setBusy(null)
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  // ── COURSES TAB ──
  if (tab === 'courses') {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/senior-student/dashboard" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Essential Skills Courses</h1>
        </div>
        <p className="text-sm text-slate-500">
          Build practical skills that complement your GED subjects — computer literacy, AI literacy and more.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.courses.map((c) => {
            const Icon = COURSE_ICONS[c.type] ?? Laptop
            return (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{c.title}</h3>
                      <p className="text-xs text-slate-500">{c.lessonCount} lessons · {c.duration ?? 'self-paced'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{c.description}</p>
                  <ul className="space-y-1 mb-4">
                    {(c.objectives ?? []).slice(0, 3).map((o) => (
                      <li key={o} className="text-xs text-slate-500 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {o}
                      </li>
                    ))}
                  </ul>
                  {c.enrolled ? (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{c.status === 'COMPLETED' ? 'Completed' : 'In progress'}</span>
                        <span className="font-semibold">{c.progress}%</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => enroll(c.id)}
                      disabled={busy === c.id}
                    >
                      {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                      Enroll
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // ── GED SUBJECT DETAIL (when a subject is selected) ──
  if (selectedSubject) {
    const subject = data.subjects.find((s) => s.subject === selectedSubject)
    const meta = SUBJECT_META[selectedSubject] ?? { icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-50' }
    const Icon = meta.icon
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        <Link href="/senior-student/learn" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> All subjects
        </Link>
        <div className={`flex items-center gap-3 rounded-2xl p-5 ${meta.bg}`}>
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Icon className={`h-6 w-6 ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800">{subject?.subject}</h1>
            <p className="text-sm text-slate-500">{subject?.description}</p>
          </div>
          <button
            onClick={() => openAITutor(undefined, selectedSubject, undefined, 'ged-hiset', 'senior_tutor')}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-full px-3 py-2 transition-colors"
          >
            <MessageSquare className="h-4 w-4" /> Chat with Hope
          </button>
        </div>

        {activeLesson && (
          <GEDLessonView
            subject={selectedSubject}
            topic={activeLesson.title}
            onClose={() => setActiveLesson(null)}
            onComplete={async () => {
              await completeLesson(selectedSubject, activeLesson.id)
              setActiveLesson(null)
            }}
          />
        )}

        {!activeLesson && (!subject || subject.strands.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center text-sm text-slate-500">
              Curriculum content is being prepared. Check back soon.
            </CardContent>
          </Card>
        ) : (
          subject.strands.map((strand) => (
            <Card key={strand.id} className="border-0 shadow-sm overflow-hidden">
              <button
                onClick={() => toggle(strand.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{strand.name}</h3>
                  {strand.description && <p className="text-xs text-slate-500 mt-0.5">{strand.description}</p>}
                </div>
                {expanded[strand.id] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
              </button>
              {expanded[strand.id] && (
                <div className="border-t border-slate-100">
                  {strand.substrands.map((ss) => (
                    <div key={ss.id} className="border-b border-slate-50 last:border-0">
                      <button
                        onClick={() => toggle(ss.id)}
                        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-slate-700">{ss.name}</span>
                        {expanded[ss.id] ? <ChevronDown className="h-4 w-4 text-slate-300" /> : <ChevronRight className="h-4 w-4 text-slate-300" />}
                      </button>
                      {expanded[ss.id] && (
                        <div className="px-5 pb-3 space-y-2">
                          {ss.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700">{lesson.title}</p>
                                {lesson.duration != null && <p className="text-[11px] text-slate-400">{lesson.duration} min</p>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => setActiveLesson({ id: lesson.id, title: lesson.title })}
                                >
                                  <Play className="h-4 w-4 mr-1" /> Start
                                </Button>
                                <button
                                  onClick={() => openAITutor(undefined, selectedSubject, lesson.title, 'ged-hiset', 'senior_tutor')}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                                  title="Ask Hope AI about this lesson"
                                >
                                  <MessageSquare className="h-4 w-4" /> Ask Hope
                                </button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => completeLesson(selectedSubject, lesson.id)}
                                  disabled={busy === lesson.id}
                                >
                                  {busy === lesson.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                  <span className="ml-1.5">Complete</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        ))}
      </div>
    )
  }
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-teal-600" /> GED Subjects
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          The four subjects of the US General Education Diploma. Complete lessons in each to reach GED-ready mastery.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.subjects.map((s) => {
          const meta = SUBJECT_META[s.subject] ?? { icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-50' }
          const Icon = meta.icon
          const lessonCount = s.strands.reduce((n, st) => n + st.substrands.reduce((n2, ss) => n2 + ss.lessons.length, 0), 0)
          return (
            <Link key={s.subject} href={`/senior-student/learn?subject=${encodeURIComponent(s.subject)}`}>
              <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow h-full ${meta.bg}`}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                    <Icon className={`h-6 w-6 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{s.subject}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{lessonCount} lessons</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{s.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 mt-2">
                      Start learning <ArrowLeft className="h-3 w-3 rotate-180" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <LearnContent />
    </Suspense>
  )
}
