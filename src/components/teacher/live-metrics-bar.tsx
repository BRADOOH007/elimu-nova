'use client'

import { Users, BookOpen, Clock, CheckCircle2, TrendingUp, Activity } from 'lucide-react'
import { useTeacherLiveMetrics } from '@/hooks/use-teacher-live-metrics'

interface MetricDef {
  key: keyof TeacherLiveMetricsData
  label: string
  icon: any
  color: string
  format: (v: number) => string
}

interface TeacherLiveMetricsData {
  studentsTotal: number
  submissionsToday: number
  pendingGrading: number
  lessonsThisWeek: number
  averagePerformance: number
  activeStudents30d: number
}

const metricDefs: MetricDef[] = [
  { key: 'studentsTotal', label: 'Students', icon: Users, color: 'from-blue-500 to-cyan-500', format: (v: number) => v.toString() },
  { key: 'submissionsToday', label: 'Submissions Today', icon: CheckCircle2, color: 'from-green-500 to-emerald-500', format: (v: number) => v.toString() },
  { key: 'pendingGrading', label: 'Pending Grading', icon: Clock, color: 'from-amber-500 to-orange-500', format: (v: number) => v.toString() },
  { key: 'lessonsThisWeek', label: 'Lessons This Week', icon: BookOpen, color: 'from-purple-500 to-violet-500', format: (v: number) => v.toString() },
  { key: 'averagePerformance', label: 'Avg Performance', icon: TrendingUp, color: 'from-rose-500 to-pink-500', format: (v: number) => `${v}%` },
  { key: 'activeStudents30d', label: 'Active (30d)', icon: Activity, color: 'from-indigo-500 to-blue-500', format: (v: number) => v.toString() },
]

export default function TeacherLiveMetricsBar() {
  const { metrics, loading } = useTeacherLiveMetrics()

  if (loading) {
    return (
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-10 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {metricDefs.map(({ key, label, icon: Icon, color, format }) => {
        const value = metrics[key]
        return (
          <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
              <div className={`w-7 h-7 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{format(value)}</p>
          </div>
        )
      })}
    </div>
  )
}
