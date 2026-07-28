"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, BookOpen, Calendar, GraduationCap, FileText, Edit, Trash2, Target, Clock, ListChecks, BookMarked } from "lucide-react"
import { PrintExportButton } from '@/components/print-export-button'
import { confirmToast } from '@/lib/confirm-toast'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { useToast } from "@/hooks/use-toast"
import ImageBankDisplay from '@/components/ai/image-bank-display'

interface SchemeDetail {
  id: string; title: string; subject: string; grade: string
  term?: string; duration?: number; objectives?: string
  content: any; isShared: boolean
  createdAt: string; updatedAt: string
  lessonPlans: Array<{ id: string; title: string; createdAt: string }>
  _count: { lessonPlans: number }
}

interface Topic {
  title: string; description?: string; weekNumber: number; lessonNumber: number
  objectives: string[]; activities: string[]; resources: string[]
  assessment?: string; duration: number
}

export default function TeacherSchemeOfWorkDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const [scheme, setScheme] = useState<SchemeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!id) return
    fetch(`/api/schemes-of-work/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => { setScheme(data); setLoading(false) })
      .catch(() => { setError('Scheme of work not found'); setLoading(false) })
  }, [id])

  const handleDelete = async () => {
    if (!(await confirmToast({ title: 'Delete this scheme of work?' }))) return
    try {
      const res = await fetch(`/api/schemes-of-work/${id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Deleted' }); router.push('/teacher/schemes-of-work') }
      else toast({ title: 'Failed to delete', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
  }

  const content = scheme?.content
  const topics: Topic[] = Array.isArray(content) ? content : content?.topics || content?.weeks || content?.lessons || []

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (error || !scheme) return (
    <div className="max-w-6xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/teacher/schemes-of-work')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error}</CardContent></Card>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/teacher/schemes-of-work')}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-2">
          <PrintExportButton exportUrl="/api/export/scheme-of-work" exportBody={{ schemeOfWorkId: id }} label="Export PDF" />
          <Button variant="outline" onClick={() => router.push(`/teacher/schemes-of-work/edit/${id}`)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{scheme.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-2 flex-wrap">
                <Badge variant="outline"><GraduationCap className="w-3 h-3 mr-1" />{scheme.grade}</Badge>
                <Badge variant="outline"><BookOpen className="w-3 h-3 mr-1" />{scheme.subject}</Badge>
                {scheme.term && <Badge variant="outline">Term {scheme.term}</Badge>}
                {scheme.duration && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{scheme.duration} weeks</Badge>}
                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />Created {new Date(scheme.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center"><FileText className="w-3 h-3 mr-1" />{scheme._count.lessonPlans} lesson plans</span>
              </div>
            </div>
            <Badge>{scheme.isShared ? 'Shared' : 'Private'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics"><ListChecks className="w-4 h-4 mr-2" />Topics ({topics.length})</TabsTrigger>
          <TabsTrigger value="lessonplans"><BookMarked className="w-4 h-4 mr-2" />Lesson Plans ({scheme.lessonPlans.length})</TabsTrigger>
          {scheme.objectives && <TabsTrigger value="objectives"><Target className="w-4 h-4 mr-2" />Objectives</TabsTrigger>}
        </TabsList>

        <TabsContent value="topics">
          <Card className="border-0 shadow">
            <CardContent className="p-0">
              {topics.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No topics defined</div>
              ) : (
                <div className="divide-y">
                  {topics.map((t, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Week {t.weekNumber} — {t.title}</h3>
                          <p className="text-sm text-gray-500">Lesson {t.lessonNumber} · {t.duration}min</p>
                        </div>
                        <Badge variant="outline">Week {t.weekNumber}</Badge>
                      </div>
                      {t.objectives?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 font-medium">Objectives:</p>
                          <ul className="list-disc list-inside text-sm text-gray-700">
                            {t.objectives.map((o, oi) => <li key={oi}>{o}</li>)}
                          </ul>
                        </div>
                      )}
                      {t.activities?.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500 font-medium">Activities:</p>
                          <p className="text-sm text-gray-700">{t.activities.join(', ')}</p>
                        </div>
                      )}
                      {t.assessment && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Assessment:</span> {t.assessment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessonplans">
          <Card className="border-0 shadow">
            <CardContent className="p-0">
              {scheme.lessonPlans.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No lesson plans generated yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheme.lessonPlans.map(lp => (
                      <TableRow key={lp.id}>
                        <TableCell className="font-medium">{lp.title}</TableCell>
                        <TableCell className="text-sm">{new Date(lp.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => router.push(`/teacher/lesson-plans/${lp.id}`)}>
                            <FileText className="w-4 h-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {scheme.objectives && (
          <TabsContent value="objectives">
            <Card className="border-0 shadow">
              <CardContent className="p-6">
                <MarkdownRenderer content={scheme.objectives} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <ImageBankDisplay contextType="scheme_of_work" contextId={id} />
    </div>
  )
}
