"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, BookOpen, Calendar, GraduationCap, FileText, Edit, Trash2, Share2, Download } from "lucide-react"
import { PrintExportButton } from '@/components/print-export-button'
import { confirmToast } from '@/lib/confirm-toast'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { useToast } from "@/hooks/use-toast"
import ImageBankDisplay from '@/components/ai/image-bank-display'

interface LessonPlanDetail {
  id: string; title: string; subject: string; grade: string
  content: any; isShared: boolean
  createdAt: string; updatedAt: string
  schemeOfWork?: { id: string; title: string } | null
}

export default function TeacherLessonPlanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const [plan, setPlan] = useState<LessonPlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!id) return
    fetch(`/api/lesson-plans/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => { setPlan(data); setLoading(false) })
      .catch(() => { setError('Lesson plan not found'); setLoading(false) })
  }, [id])

  const handleDelete = async () => {
    if (!(await confirmToast({ title: 'Delete this lesson plan?' }))) return
    try {
      const res = await fetch(`/api/lesson-plans/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Deleted' }); router.push('/teacher/lesson-plans') }
      else toast({ title: 'Failed to delete', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (error || !plan) return (
    <div className="max-w-4xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/teacher/lesson-plans')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error}</CardContent></Card>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/teacher/lesson-plans')}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-2">
          <PrintExportButton exportUrl="/api/export/lesson-plan" exportBody={{ lessonPlanId: id }} label="Export PDF" />
          <Button variant="outline" onClick={() => router.push(`/teacher/lesson-plans/edit/${id}`)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{plan.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-2 flex-wrap">
                <Badge variant="outline"><GraduationCap className="w-3 h-3 mr-1" />{plan.grade}</Badge>
                <Badge variant="outline"><BookOpen className="w-3 h-3 mr-1" />{plan.subject}</Badge>
                {plan.schemeOfWork && <Badge variant="outline">{plan.schemeOfWork.title}</Badge>}
                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />Created {new Date(plan.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge>{plan.isShared ? 'Shared' : 'Private'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow">
        <CardContent className="p-6">
          <LessonContentRenderer content={plan.content} />
        </CardContent>
      </Card>

      <ImageBankDisplay contextType="lesson_plan" contextId={id} />
    </div>
  )
}

// ── Robust renderer for any lesson plan content shape ──────────
function LessonContentRenderer({ content }: { content: any }) {
  let c: any = content
  if (typeof c === 'string') {
    try { c = JSON.parse(c) } catch { c = { generatedContent: content } }
  }
  if (!c || typeof c !== 'object') return <p className="text-sm text-slate-500">No content available.</p>

  // Term plan shape: { weeks: [...] }
  if (c.weeks && Array.isArray(c.weeks)) {
    return (
      <div className="space-y-4">
        {c.weeks.map((week: any, wi: number) => (
          <div key={wi} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-800 text-white px-4 py-2 text-sm font-semibold">
              Week {week.weekNumber || wi + 1}{week.theme ? ` — ${week.theme}` : ''} ({week.lessons?.length || 0} lessons)
            </div>
            <div className="divide-y divide-slate-100">
              {(week.lessons || []).map((lesson: any, li: number) => (
                <div key={li} className="p-4">
                  <p className="font-semibold text-sm mb-1">Lesson {lesson.lessonNumber || li + 1}: {lesson.topic || 'Lesson'}</p>
                  {lesson.specificLearningOutcomes && <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Outcome:</span> {lesson.specificLearningOutcomes}</p>}
                  {lesson.introduction?.activity && <p className="text-xs text-slate-500 mb-1"><span className="font-medium">Intro:</span> {lesson.introduction.activity}</p>}
                  {lesson.mainActivity?.activity && <p className="text-xs text-slate-500 mb-1"><span className="font-medium">Main:</span> {lesson.mainActivity.activity}</p>}
                  {lesson.assessment && <p className="text-xs text-slate-500 mb-1"><span className="font-medium">Assessment:</span> {lesson.assessment}</p>}
                  {lesson.homework && <p className="text-xs text-slate-500"><span className="font-medium">Homework:</span> {lesson.homework}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Plain markdown string
  if (c.generatedContent && typeof c.generatedContent === 'string') {
    return <MarkdownRenderer content={c.generatedContent} />
  }

  // Legacy flat content: content/contentStr/description
  if (c.content && typeof c.content === 'string' && !c.specificLearningOutcomes && !c.strand) {
    return <MarkdownRenderer content={c.content} />
  }
  if (c.description) return <MarkdownRenderer content={c.description} />

  // KICD 11-section structure
  const hasKICD = c.strand || c.subStrand || c.specificLearningOutcomes || c.organisationOfLearning || c.lessonHeader
  if (hasKICD) {
    const header = c.lessonHeader || {}
    const slos: string[] = Array.isArray(c.specificLearningOutcomes) ? c.specificLearningOutcomes : (c.specificLearningOutcomes ? [c.specificLearningOutcomes] : [])
    const kips: string[] = c.keyInquiryQuestions || []
    const comps: string[] = c.coreCompetencies || []
    const values: string[] = c.values || []
    const pcis: string[] = c.pcis || []
    const resources: string[] = c.learningResources || []
    const org = c.organisationOfLearning

    const Step = ({ label, s }: { label: string; s?: any }) => s ? (
      <div className="mb-3">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">{label} ({s.duration || ''} min)</p>
        <div className="text-sm text-slate-700">
          <p className="mb-0.5"><span className="font-medium">Teacher:</span> {s.teacherActivity}</p>
          <p><span className="font-medium">Learner:</span> {s.learnerActivity}</p>
        </div>
      </div>
    ) : null

    const Section = ({ label, children }: { label: string; children: ReactNode }) => (
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        {children}
      </div>
    )

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4">
          <p className="font-bold text-base">{c.title || 'Lesson Plan'}</p>
          <div className="flex flex-wrap gap-3 text-xs mt-1 text-blue-100">
            {header.learningArea && <span>Subject: {header.learningArea}</span>}
            {header.grade && <span>Grade: {header.grade}</span>}
            {header.term && <span>Term: {header.term}</span>}
            {header.week && <span>Week: {header.week}</span>}
            {header.lesson && <span>Lesson: {header.lesson}</span>}
            {(header.duration || c.duration) && <span>Duration: {header.duration || c.duration} min</span>}
            {header.date && <span>Date: {header.date}</span>}
          </div>
        </div>

        {(c.strand || c.subStrand) && (
          <Section label="Strand / Sub-Strand">
            <p className="text-sm">{c.strand}{c.strand && c.subStrand ? ' → ' : ''}{c.subStrand}</p>
          </Section>
        )}

        {slos.length > 0 && (
          <Section label="Specific Learning Outcomes">
            <ol className="list-decimal list-inside text-sm space-y-0.5">
              {slos.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </Section>
        )}

        {kips.length > 0 && (
          <Section label="Key Inquiry Questions">
            <ul className="list-disc list-inside text-sm space-y-0.5">
              {kips.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </Section>
        )}

        {(comps.length > 0 || values.length > 0 || pcis.length > 0) && (
          <Section label="Competencies / Values / PCIs">
            <div className="flex flex-wrap gap-1.5">
              {comps.map((x, i) => <span key={`c${i}`} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{x}</span>)}
              {values.map((x, i) => <span key={`v${i}`} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{x}</span>)}
              {pcis.map((x, i) => <span key={`p${i}`} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{x}</span>)}
            </div>
          </Section>
        )}

        {org && (
          <Section label="Organisation of Learning">
            <Step label="Introduction" s={org.introduction} />
            <Step label="Step 1" s={org.step1} />
            <Step label="Step 2" s={org.step2} />
            <Step label="Step 3" s={org.step3} />
            <Step label="Conclusion" s={org.conclusion} />
          </Section>
        )}

        {!org && (c.introduction || c.mainActivity || c.conclusion) && (
          <Section label="Lesson Development">
            {c.introduction && <Step label="Introduction" s={{ duration: c.introduction.duration, teacherActivity: c.introduction.teacherActions || c.introduction.activity, learnerActivity: c.introduction.studentActions }} />}
            {c.mainActivity && <Step label="Main Activity" s={{ duration: c.mainActivity.duration, teacherActivity: c.mainActivity.teacherActions || c.mainActivity.activity, learnerActivity: c.mainActivity.studentActions }} />}
            {c.practiceActivity && <Step label="Practice" s={{ duration: c.practiceActivity.duration, teacherActivity: c.practiceActivity.activity, learnerActivity: '' }} />}
            {c.conclusion && <Step label="Conclusion" s={{ duration: c.conclusion.duration, teacherActivity: c.conclusion.teacherActions || c.conclusion.activity, learnerActivity: c.conclusion.studentActions }} />}
          </Section>
        )}

        {resources.length > 0 && (
          <Section label="Learning Resources">
            <ul className="list-disc list-inside text-sm space-y-0.5">
              {resources.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </Section>
        )}

        {c.assessment && (
          <Section label="Assessment">
            <p className="text-sm">{c.assessment}</p>
          </Section>
        )}

        {(c.extendedActivities || c.homework) && (
          <Section label="Extended Activities / Homework">
            <p className="text-sm">{c.extendedActivities || c.homework}</p>
          </Section>
        )}

        {(c.reflection || c.teacherReflection) && (
          <Section label="Teacher Reflection">
            <p className="text-sm italic text-slate-500">{c.reflection || c.teacherReflection}</p>
          </Section>
        )}

        {!hasKICD && Object.keys(c).length === 0 && (
          <p className="text-sm text-slate-500">No content available.</p>
        )}
      </div>
    )
  }

  // Unknown object — show JSON
  return <pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify(c, null, 2)}</pre>
}
