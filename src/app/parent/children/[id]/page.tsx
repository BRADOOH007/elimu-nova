"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, User, Mail, Phone, School, BookOpen, BarChart3, Clock, TrendingUp, Award, Flame, Zap, Calendar } from "lucide-react"

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
          fetch(`/api/parent/progress?studentId=${childId}`),
        ])
        if (detailRes.ok) setChild((await detailRes.json()).child || (await detailRes.json()).student)
        if (progressRes.ok) {
          const p = await progressRes.json()
          setChild(prev => prev ? { ...prev, ...p } : p)
        }
      } catch { setError("Failed to load child details") }
      finally { setLoading(false) }
    }
    load()
  }, [childId])

  if (loading) return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="h-10 w-24 bg-slate-200 rounded-lg" />
      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
            <div className="h-8 w-16 bg-slate-200 rounded mx-auto mb-1" />
            <div className="h-3 w-20 bg-slate-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )

  if (error || !child) return (
    <div className="max-w-6xl mx-auto p-6">
      <button onClick={() => router.push("/parent/children")} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Children
      </button>
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center">
        <p className="text-red-600 font-medium">{error || "Child not found"}</p>
      </div>
    </div>
  )

  const a = child.analytics

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Back button */}
      <button onClick={() => router.push("/parent/children")} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Children
      </button>

      {/* Profile Hero */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{child.name}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{child.email}</span>
              {child.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{child.phone}</span>}
              {child.class && (
                <span className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5" />{child.class.name}
                  <span className="text-slate-300 mx-1">·</span>
                  <BookOpen className="w-3.5 h-3.5" />{child.class.subject}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {a && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: `${Math.round(a.totalStudyTime / 60)}h`, label: "Study Time", gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
            { value: a.averageGrade !== null ? `${Math.round(a.averageGrade)}%` : "N/A", label: "Average Grade", gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
            { value: `${a.streakDays}d`, label: "Day Streak", gradient: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
            { value: String(a.completedAssignments), label: "Completed", gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="progress" className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <TabsList className="w-full border-b border-slate-200 bg-slate-50/50 rounded-none p-0">
          <TabsTrigger value="progress" className="flex-1 rounded-none py-3.5 data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />Progress
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex-1 rounded-none py-3.5 data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
            <BookOpen className="w-4 h-4 mr-2" />Assignments
          </TabsTrigger>
        </TabsList>

        <div className="p-5">
          <TabsContent value="progress" className="mt-0 space-y-3">
            {child.progress && child.progress.length > 0 ? (
              child.progress.map((p, i) => {
                const score = p.masteryScore
                const barColor = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
                const textColor = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-600"
                return (
                  <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800">{p.subject}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <Badge variant="outline" className="text-[10px] bg-white">{p.status}</Badge>
                          {p.lastPracticedAt && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.lastPracticedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className={`text-right ${textColor}`}>
                        <p className="text-2xl font-bold">{score}%</p>
                        <p className="text-[10px] font-medium">Mastery</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No progress data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-0">
            {child.assignments && child.assignments.length > 0 ? (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Due</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase text-right">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {child.assignments.map(a => {
                      const isOverdue = a.status === "OVERDUE" || (a.status === "PENDING" && new Date(a.dueDate) < new Date())
                      const badgeVariant = a.status === "GRADED" ? "default" : isOverdue ? "destructive" : "outline"
                      const statusLabel = isOverdue && a.status === "PENDING" ? "OVERDUE" : a.status
                      return (
                        <TableRow key={a.id} className={isOverdue ? "bg-red-50/50" : ""}>
                          <TableCell className="font-medium text-sm text-slate-800">{a.title}</TableCell>
                          <TableCell className="text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={badgeVariant} className={a.status === "GRADED" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {a.grade !== null ? (
                              <span className={a.grade >= 70 ? "text-emerald-600" : a.grade >= 40 ? "text-amber-600" : "text-red-600"}>
                                {Math.round(a.grade)}%
                              </span>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No assignments found</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
