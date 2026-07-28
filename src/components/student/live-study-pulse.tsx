'use client'

import { BookOpen, Clock, CheckCircle2, TrendingUp, Zap, Calendar, type LucideIcon } from 'lucide-react'
import { useStudentLiveMetrics } from '@/hooks/use-student-live-metrics'

export default function LiveStudyPulse() {
  const { metrics, loading } = useStudentLiveMetrics()

  if (loading) return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-3 w-14 bg-gray-200 rounded mb-2" />
          <div className="h-6 w-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )

  if (!metrics) return null

  const studyHrs = Math.round((metrics.studyTimeMinutes / 60) * 10) / 10

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <PulseCard icon={BookOpen} label="Pending" value={String(metrics.pendingAssignments)} color="from-amber-500 to-orange-500" />
      <PulseCard icon={Calendar} label="Lessons Today" value={String(metrics.upcomingLessons)} color="from-blue-500 to-cyan-500" />
      <PulseCard icon={CheckCircle2} label="Done Today" value={String(metrics.completedToday)} color="from-green-500 to-emerald-500" />
      <PulseCard icon={Clock} label="Study Today" value={`${studyHrs}h`} color="from-purple-500 to-violet-500" />
      <PulseCard icon={TrendingUp} label="Avg Grade" value={`${metrics.averageGrade}%`} color="from-rose-500 to-pink-500" />
      <PulseCard icon={Zap} label="Streak" value={`${metrics.streakDays}d`} color="from-indigo-500 to-blue-500" />
    </div>
  )
}

function PulseCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        <div className={`w-7 h-7 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
