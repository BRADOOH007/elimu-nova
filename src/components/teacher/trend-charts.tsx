'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface GradePoint { date: string; avgGrade: number; submissions: number }
interface SubmissionPoint { week: string; submissions: number }

export default function TeacherTrendCharts() {
  const [gradeTrend, setGradeTrend] = useState<GradePoint[]>([])
  const [submissionTrend, setSubmissionTrend] = useState<SubmissionPoint[]>([])
  const [masteryAvg, setMasteryAvg] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [trendRes, masteryRes] = await Promise.all([
          fetch('/api/teacher/trends'),
          fetch('/api/teacher/mastery-summary')
        ])
        if (trendRes.ok) {
          const data = await trendRes.json()
          setGradeTrend(data.gradeTrend || [])
          setSubmissionTrend(data.submissionTrend || [])
        }
        if (masteryRes.ok) {
          const data = await masteryRes.json()
          if (data.students?.length > 0) {
            setMasteryAvg(Math.round(data.students.reduce((s: number, st: any) => s + st.masteryScore, 0) / data.students.length))
          }
        }
      } catch (e) { console.warn('[TrendCharts] Failed to fetch:', e) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardContent className="p-6 flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const avgGrade = gradeTrend.filter(g => g.submissions > 0).reduce((s, g) => s + g.avgGrade, 0)
  const gradeCount = gradeTrend.filter(g => g.submissions > 0).length
  const overallAvg = gradeCount > 0 ? (avgGrade / gradeCount).toFixed(1) : '—'

  const totalSubmissions = submissionTrend.reduce((s, w) => s + w.submissions, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Grade Trend (30d)
            <span className="ml-auto text-sm font-normal text-gray-500">Avg: {overallAvg}%</span>
            {masteryAvg !== null && (
              <span className={`text-sm font-normal ${masteryAvg >= 70 ? 'text-emerald-600' : masteryAvg >= 45 ? 'text-amber-600' : 'text-red-600'}`}>
                · Mastery: {masteryAvg}%
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={gradeTrend}>
              <defs>
                <linearGradient id="gradeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`${value}%`, 'Avg Grade']}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Area type="monotone" dataKey="avgGrade" stroke="#3b82f6" strokeWidth={2} fill="url(#gradeFill)" />
            </AreaChart>
          </ResponsiveContainer>
          {masteryAvg !== null && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-600">Class Mastery</span>
                <span className={`font-bold ${masteryAvg >= 70 ? 'text-emerald-600' : masteryAvg >= 45 ? 'text-amber-600' : 'text-red-600'}`}>{masteryAvg}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${masteryAvg >= 70 ? 'bg-emerald-500' : masteryAvg >= 45 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${masteryAvg}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Submissions (12w)
            <span className="ml-auto text-sm font-normal text-gray-500">Total: {totalSubmissions}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={submissionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value) => [value, 'Submissions']}
                labelFormatter={(l) => `Week of: ${l}`}
              />
              <Bar dataKey="submissions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
