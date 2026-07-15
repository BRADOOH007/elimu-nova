"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft, User, Mail, Phone, School, BookOpen, BarChart3, Clock, TrendingUp, Award, Calendar, CheckCircle, AlertTriangle } from "lucide-react"

interface ChildDetail {
  id: string; name: string; email: string; phone?: string
  class?: { id: string; name: string; grade: string; subject: string } | null
  analytics?: {
    totalStudyTime: number; averageGrade: number | null
    completedAssignments: number; pendingAssignments: number
    overdueAssignments: number; streakDays: number
    lastActiveDate: string | null
  }
  progress?: Array<{
    subject: string; masteryScore: number; status: string
    lastPracticedAt: string | null; commonMistakes?: any
  }>
  assignments?: Array<{
    id: string; title: string; dueDate: string; status: string; grade: number | null
  }>
}

export default function ParentChildDetailPage() {
  const router = useRouter()
  const params = useParams()
  const childId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const [child, setChild] = useState<ChildDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!childId) return
    const load = async () => {
      try {
        const [detailRes, progressRes] = await Promise.all([
          fetch(`/api/parent/children/${childId}`),
          fetch(`/api/parent/progress?studentId=${childId}`)
        ])
        if (detailRes.ok) setChild((await detailRes.json()).child || (await detailRes.json()).student)
        if (progressRes.ok) {
          const p = await progressRes.json()
          setChild(prev => prev ? { ...prev, ...p } : p)
        }
      } catch (e) {
        setError('Failed to load child details')
      } finally { setLoading(false) }
    }
    load()
  }, [childId])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (error || !child) return (
    <div className="max-w-6xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/parent/children')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error || 'Child not found'}</CardContent></Card>
    </div>
  )

  const a = child.analytics

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push('/parent/children')}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{child.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1 flex-wrap">
                <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1" />{child.email}</span>
                {child.phone && <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" />{child.phone}</span>}
                {child.class && <span className="flex items-center"><School className="w-3.5 h-3.5 mr-1" />{child.class.name} ({child.class.subject})</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {a && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow bg-gradient-to-br from-green-50 to-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{Math.round(a.totalStudyTime / 60)}h</p><p className="text-xs text-gray-600">Study Time</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-blue-50 to-indigo-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{a.averageGrade !== null ? `${Math.round(a.averageGrade)}%` : 'N/A'}</p><p className="text-xs text-gray-600">Avg Grade</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-amber-50 to-orange-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{a.streakDays}</p><p className="text-xs text-gray-600">Day Streak</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-purple-50 to-pink-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{a.completedAssignments}</p><p className="text-xs text-gray-600">Completed</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress"><BarChart3 className="w-4 h-4 mr-2" />Progress</TabsTrigger>
          <TabsTrigger value="assignments"><BookOpen className="w-4 h-4 mr-2" />Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          {child.progress && child.progress.length > 0 ? (
            <div className="space-y-3">
              {child.progress.map((p, i) => (
                <Card key={i} className="border-0 shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{p.subject}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline">{p.status}</Badge>
                          {p.lastPracticedAt && <span>Last: {new Date(p.lastPracticedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{p.masteryScore}%</p>
                        <p className="text-xs text-gray-500">Mastery</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${p.masteryScore}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-8 text-center text-gray-500">No progress data available</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          {child.assignments && child.assignments.length > 0 ? (
            <Card className="border-0 shadow">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {child.assignments.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell className="text-sm">{new Date(a.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant={a.status === 'Completed' ? 'default' : a.status === 'Overdue' ? 'destructive' : 'outline'}>{a.status}</Badge></TableCell>
                        <TableCell>{a.grade !== null ? `${Math.round(a.grade)}%` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-8 text-center text-gray-500">No assignments found</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
