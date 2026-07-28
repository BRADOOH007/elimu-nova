'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, BarChart3, Clock } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface GradePoint { date: string; avgGrade: number; submissions: number }
interface SubjectPerf { subject: string; avgGrade: number; submissions: number }
interface StudyPoint { date: string; hours: number }

const SUBJECT_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444']

export default function PerformanceTrends() {
  const [gradeTrend, setGradeTrend] = useState<GradePoint[]>([])
  const [subjectPerf, setSubjectPerf] = useState<SubjectPerf[]>([])
  const [studyTime, setStudyTime] = useState<StudyPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/student/trends')
        if (res.ok) {
          const d = await res.json()
          setGradeTrend(d.gradeTrend || [])
          setSubjectPerf(d.subjectPerformance || [])
          setStudyTime(d.studyTimeTrend || [])
        }
      } catch (e) { console.warn('[PerformanceTrends] Failed to fetch:', e) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-lg"><CardContent className="p-6 flex items-center justify-center h-56"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></CardContent></Card>
      ))}
    </div>
  )

  const recent = gradeTrend.filter(g => g.submissions > 0)
  const avg = recent.length > 0 ? (recent.reduce((s, g) => s + g.avgGrade, 0) / recent.length).toFixed(1) : '—'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 lg:col-span-1">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="w-5 h-5 text-blue-600" /> Subject Performance</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectPerf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="subject" tick={{ fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="avgGrade" radius={[0, 4, 4, 0]}>
                {subjectPerf.map((_, i) => <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 lg:col-span-1">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-5 h-5 text-purple-600" /> Grade Trend (30d) <span className="ml-auto text-sm font-normal text-gray-500">Avg: {avg}%</span></CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={gradeTrend}>
              <defs><linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="avgGrade" stroke="#8b5cf6" strokeWidth={2} fill="url(#gFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 lg:col-span-1">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Clock className="w-5 h-5 text-green-600" /> Study Time (30d)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={studyTime}>
              <defs><linearGradient id="tFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => [`${v || 0}h`, 'Study Time'] as any} />
              <Area type="monotone" dataKey="hours" stroke="#22c55e" strokeWidth={2} fill="url(#tFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
