'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, BookOpen, Award } from 'lucide-react'
import Link from 'next/link'

interface Summary {
  totalStudents: number; totalTeachers: number; totalClasses: number; avgSchoolScore: number
}
interface AnalyticsData {
  summary: Summary
  classPerformance: Array<{ name: string; avgScore: number }>
  subjectPerformance: Array<{ subject: string; avgScore: number }>
}

export default function AnalyticsSummary() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetch('/api/school-admin/analytics').then(r => r.json()).then(d => setData(d)).catch(() => {})
  }, [])

  if (!data) return null

  const { summary, classPerformance, subjectPerformance } = data
  const topClass = classPerformance[0]
  const topSubject = subjectPerformance[0]
  const lowSubject = [...subjectPerformance].reverse()[0]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">Overall School Average</p>
          <p className="text-lg font-bold text-slate-900">{summary.avgSchoolScore}%</p>
          <p className="text-xs text-slate-400">{summary.totalStudents} students · {summary.totalClasses} classes</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">Top Subject</p>
          <p className="text-sm font-bold text-slate-900 truncate">{topSubject?.subject || 'N/A'}</p>
          <p className="text-xs text-slate-400">{topSubject?.avgScore || 0}% average</p>
        </div>
      </div>

      <Link href="/school-admin/analytics"
        className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Award className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500">Top Class</p>
          <p className="text-sm font-bold text-slate-900 truncate">{topClass?.name || 'N/A'}</p>
          <p className="text-xs text-indigo-600 group-hover:underline">View full analytics →</p>
        </div>
      </Link>
    </div>
  )
}
