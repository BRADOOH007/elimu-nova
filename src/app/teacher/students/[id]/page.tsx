"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, School, Calendar, BookOpen, CheckCircle, Clock, AlertTriangle, Brain, TrendingUp, BarChart3, Flame, Activity } from "lucide-react"

interface StudentDetail {
  id: string; name: string; email: string; phone?: string; address?: string
  status: string; joinDate: string
  class?: { id: string; name: string; grade: string; subject: string } | null
}

interface ProgressData {
  totalStudyTime: number
  averageGrade: number | null
  completedAssignments: number
  pendingAssignments: number
  overdueAssignments: number
  lastActiveDate: string | null
  streakDays: number
}

interface AssignmentSummary {
  id: string; title: string; dueDate: string; status: string; grade: number | null
}

export default function TeacherStudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([])
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) return
    const load = async () => {
      try {
        const [detailRes, progressRes] = await Promise.all([
          fetch(`/api/teacher/students/${studentId}`),
          fetch(`/api/teacher/student-progress?studentId=${studentId}&period=all`)
        ])
        if (!detailRes.ok) throw new Error('Failed to load student')
        const detailData = await detailRes.json()
        setStudent(detailData.student)

        if (progressRes.ok) {
          const progressData = await progressRes.json()
          const s = progressData.students?.[0]
          if (s) {
            setProgress(s.analytics)
            setAssignments(s.assignments || [])
            setRecentSessions(s.recentStudySessions || [])
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error loading student')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  if (loading) return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="h-9 w-36 bg-slate-200 rounded-lg" />
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-200 rounded-xl" />
            <div className="space-y-2">
              <div className="h-6 w-44 bg-slate-200 rounded" />
              <div className="h-4 w-64 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-center space-y-1">
            <div className="h-7 w-16 bg-slate-200 rounded mx-auto" />
            <div className="h-3 w-20 bg-slate-200 rounded mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-28 bg-slate-200 rounded-lg" />
        <div className="h-10 w-28 bg-slate-200 rounded-lg" />
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
    </div>
  )
  if (error || !student) return (
    <div className="max-w-6xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/teacher/students')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error || 'Student not found'}</CardContent></Card>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push('/teacher/students')}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Students</Button>

      {/* Profile header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1 flex-wrap">
                  <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1" />{student.email}</span>
                  {student.phone && <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" />{student.phone}</span>}
                  {student.class && <span className="flex items-center"><School className="w-3.5 h-3.5 mr-1" />{student.class.name} ({student.class.subject})</span>}
                </div>
              </div>
            </div>
            <Badge className={student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{student.status}</Badge>
          </div>
          {student.address && <p className="flex items-center text-sm text-gray-500 mt-2"><MapPin className="w-3.5 h-3.5 mr-1" />{student.address}</p>}
        </CardContent>
      </Card>

      {/* Stats */}
      {progress && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow bg-gradient-to-br from-green-50 to-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{Math.round(progress.totalStudyTime / 60)}h</p><p className="text-xs text-gray-600">Study Time</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-blue-50 to-indigo-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{progress.averageGrade !== null ? `${Math.round(progress.averageGrade)}%` : 'N/A'}</p><p className="text-xs text-gray-600">Avg Grade</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-amber-50 to-orange-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{progress.streakDays}</p><p className="text-xs text-gray-600">Day Streak</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-purple-50 to-pink-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{progress.completedAssignments}</p><p className="text-xs text-gray-600">Completed</p></CardContent></Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments"><BookOpen className="w-4 h-4 mr-2" />Assignments</TabsTrigger>
          <TabsTrigger value="progress"><BarChart3 className="w-4 h-4 mr-2" />Progress</TabsTrigger>
          <TabsTrigger value="sessions"><Brain className="w-4 h-4 mr-2" />Study Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <Card className="border-0 shadow">
            <CardContent className="p-0">
              {assignments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No assignments yet</div>
              ) : (
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
                    {assignments.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell className="text-sm">{new Date(a.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === 'Completed' ? 'default' : a.status === 'Submitted' ? 'secondary' : a.status === 'Overdue' ? 'destructive' : 'outline'}>{a.status}</Badge>
                        </TableCell>
                        <TableCell>{a.grade !== null ? `${Math.round(a.grade)}%` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card className="border-0 shadow-sm overflow-hidden">
            {!progress ? (
              <CardContent className="p-8 text-center text-gray-500">No progress data</CardContent>
            ) : (
              <CardContent className="p-0">
                {/* Mini stat row */}
                <div className="grid grid-cols-4 border-b border-slate-100">
                  {[
                    { label: 'Study Time',  value: `${Math.round(progress.totalStudyTime / 60)}h`,   icon: Clock,       color: 'text-blue-600',  bg: 'bg-blue-50'  },
                    { label: 'Avg Grade',   value: progress.averageGrade !== null ? `${Math.round(progress.averageGrade)}%` : '—', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Streak',      value: `${progress.streakDays}d`,                        icon: Flame,       color: 'text-amber-600',  bg: 'bg-amber-50'  },
                    { label: 'Completed',   value: progress.completedAssignments,                    icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map(s => (
                    <div key={s.label} className="p-4 text-center border-r border-slate-100 last:border-r-0">
                      <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-1.5`}>
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                      <p className="text-lg font-bold text-slate-800">{s.value}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Performance */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      Performance
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Average Grade</span>
                          <span className="font-semibold text-slate-800">{progress.averageGrade !== null ? `${Math.round(progress.averageGrade)}%` : 'N/A'}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (progress.averageGrade || 0) >= 75
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                : (progress.averageGrade || 0) >= 60
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                : 'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                            style={{ width: `${progress.averageGrade || 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        {[
                          { label: 'Completed', value: progress.completedAssignments, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { label: 'Pending',   value: progress.pendingAssignments,   color: 'text-amber-600',   bg: 'bg-amber-50' },
                          { label: 'Overdue',   value: progress.overdueAssignments,   color: 'text-red-600',     bg: 'bg-red-50' },
                        ].map(s => (
                          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      Engagement
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Total Study Time', value: `${Math.round(progress.totalStudyTime / 60)} hours`, icon: Clock, color: 'text-blue-600' },
                        { label: 'Current Streak', value: `${progress.streakDays} days`, icon: Flame, color: progress.streakDays >= 7 ? 'text-amber-600' : 'text-slate-600' },
                        { label: 'Last Active', value: progress.lastActiveDate ? new Date(progress.lastActiveDate).toLocaleDateString() : 'Never', icon: Activity, color: 'text-slate-600' },
                      ].map(s => (
                        <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                              <s.icon className={`h-4 w-4 ${s.color}`} />
                            </div>
                            <span className="text-sm text-slate-600">{s.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="border-0 shadow">
            <CardContent className="p-6">
              {recentSessions.length === 0 ? (
                <p className="text-center text-gray-500">No study sessions recorded</p>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div><p className="font-medium text-sm">{s.subject}{s.topic ? ` - ${s.topic}` : ''}</p><p className="text-xs text-gray-500">{new Date(s.startTime).toLocaleDateString()} · {Math.round(s.duration / 60)}min</p></div>
                      {s.notes && <p className="text-xs text-gray-600 max-w-[200px] truncate">{s.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
