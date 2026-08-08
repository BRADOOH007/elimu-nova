'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Award, BookOpen, Users, Activity, AlertTriangle, BarChart3 } from 'lucide-react'

interface Analytics {
  classPerformance: Array<{ id: string; name: string; grade: string; studentCount: number; avgScore: number; totalScores: number }>
  subjectPerformance: Array<{ subject: string; avgScore: number; assessmentCount: number }>
  topStudents: Array<{ id: string; name: string; className: string; grade: string; avgScore: number; assessmentCount: number }>
  lowPerformingSubjects: Array<{ subject: string; avgScore: number; assessmentCount: number }>
  teacherCoverage: { totalAssignments: number; gradedSubmissions: number; totalSubmissions: number; coveragePercent: number; teachers: Array<{ id: string; name: string; totalAssignments: number }> }
  summary: { totalStudents: number; totalTeachers: number; totalClasses: number; avgSchoolScore: number }
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}%</span>
}

function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const r = 20; const c = Math.PI * r * 2
  const offset = c - (c * percent) / 100
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 24 24)"
        className={percent >= 70 ? 'text-emerald-500' : percent >= 50 ? 'text-amber-500' : 'text-red-500'} />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="central" className="fill-slate-700 text-[9px] font-bold">{percent}%</text>
    </svg>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/school-admin/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 animate-pulse space-y-6"><div className="h-8 w-48 bg-slate-200 rounded" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}</div></div>
  if (!data) return <div className="p-8 text-slate-500">Unable to load analytics.</div>

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">School Performance &amp; Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">KICD-aligned academic insights and operational metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Students', value: data.summary.totalStudents, color: 'text-indigo-600 bg-indigo-50' },
          { icon: Activity, label: 'Total Teachers', value: data.summary.totalTeachers, color: 'text-emerald-600 bg-emerald-50' },
          { icon: BookOpen, label: 'Active Classes', value: data.summary.totalClasses, color: 'text-violet-600 bg-violet-50' },
          { icon: BarChart3, label: 'Avg School Score', value: `${data.summary.avgSchoolScore}%`, color: 'text-amber-600 bg-amber-50' },
        ].map((card, i) => (
          <Card key={i} className="border-slate-100 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-xl font-bold text-slate-900">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 2-col */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Performance */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-5 h-5 text-indigo-600" />Top Class Performance</CardTitle>
              <CardDescription>Ranked by mean assessment score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-500"><th className="pb-2 w-8">#</th><th className="pb-2">Class</th><th className="pb-2">Grade</th><th className="pb-2 text-right">Students</th><th className="pb-2 text-right">Avg Score</th></tr></thead>
                  <tbody>
                    {data.classPerformance.slice(0, 8).map((c, i) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 font-bold text-slate-400">{i + 1}</td>
                        <td className="py-2.5 font-medium text-slate-800">{c.name}</td>
                        <td className="py-2.5 text-slate-500">{c.grade}</td>
                        <td className="py-2.5 text-right text-slate-500">{c.studentCount}</td>
                        <td className="py-2.5 text-right"><ScoreBadge score={c.avgScore} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Students */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Award className="w-5 h-5 text-amber-600" />Top Performing Students</CardTitle>
              <CardDescription>Highest achievers across all grades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.topStudents.slice(0, 6).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.className} · {s.grade}</p>
                    </div>
                    <ScoreBadge score={s.avgScore} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: 1-col */}
        <div className="space-y-6">
          {/* Subject Mastery */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="w-5 h-5 text-violet-600" />Subject Mastery</CardTitle>
              <CardDescription>KICD Learning Areas performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.subjectPerformance.slice(0, 8).map(s => (
                  <div key={s.subject} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-32 truncate">{s.subject}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${s.avgScore >= 70 ? 'bg-emerald-500' : s.avgScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(s.avgScore, 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-10 text-right">{s.avgScore}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Performing */}
          {data.lowPerformingSubjects.length > 0 && (
            <Card className="border-red-100 shadow-sm bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-red-800"><AlertTriangle className="w-5 h-5 text-red-600" />Needs Attention</CardTitle>
                <CardDescription className="text-red-600/80">Lowest performing subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.lowPerformingSubjects.map(s => (
                    <div key={s.subject} className="flex items-center justify-between p-2 rounded-lg bg-white border border-red-100">
                      <span className="text-sm font-medium text-slate-700">{s.subject}</span>
                      <ScoreBadge score={s.avgScore} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teacher Coverage */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Activity className="w-5 h-5 text-teal-600" />Assessment Coverage</CardTitle>
              <CardDescription>Graded vs pending submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-3">
                <ProgressRing percent={data.teacherCoverage.coveragePercent} />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{data.teacherCoverage.gradedSubmissions} graded</span>
                <span>{data.teacherCoverage.totalSubmissions} total</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
