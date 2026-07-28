"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
          {typeof plan.content === 'object' && plan.content !== null ? (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="objectives">Objectives</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
              </TabsList>
              {['overview', 'objectives', 'activities', 'assessment', 'materials'].map(tab => (
                <TabsContent key={tab} value={tab}>
                  <div className="prose max-w-none">
                    <MarkdownRenderer content={
                      typeof plan.content === 'string' ? plan.content :
                      plan.content?.[tab] || plan.content?.[tab === 'materials' ? 'materials' : tab] ||
                      (tab === 'overview' ? (plan.content?.description || plan.content?.overview || plan.content?.content || JSON.stringify(plan.content, null, 2)) : '')
                    } />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="prose max-w-none">
              <MarkdownRenderer content={typeof plan.content === 'string' ? plan.content : JSON.stringify(plan.content, null, 2)} />
            </div>
          )}
        </CardContent>
      </Card>

      <ImageBankDisplay contextType="lesson_plan" contextId={id} />

      {typeof plan.content === 'object' && plan.content !== null && (
        <ImageBankDisplay contextType="lesson_plan" contextId={id} compact />
      )}
    </div>
  )
}
