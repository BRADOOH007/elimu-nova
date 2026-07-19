"use client"

import { TrendingUp, Users, BookOpen, ClipboardList, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatItem {
  value: number
  change: string
  changeType: "positive" | "negative" | "neutral" | "warning"
}

interface TeacherStats {
  totalStudents: StatItem
  activeLessonPlans: StatItem
  pendingAssignments: StatItem
  completedThisWeek: StatItem
}

interface TeacherStatsGridProps {
  stats: TeacherStats | null
  loading: boolean
}

const statCards = [
  { key: "totalStudents" as const, label: "Total Students", icon: Users, gradient: "from-blue-500 to-blue-600", bg: "from-blue-50 to-purple-50" },
  { key: "activeLessonPlans" as const, label: "Active Lesson Plans", icon: BookOpen, gradient: "from-green-500 to-green-600", bg: "from-green-50 to-emerald-50" },
  { key: "pendingAssignments" as const, label: "Pending Assignments", icon: ClipboardList, gradient: "from-purple-500 to-purple-600", bg: "from-purple-50 to-violet-50" },
  { key: "completedThisWeek" as const, label: "Completed This Week", icon: CheckCircle, gradient: "from-pink-500 to-pink-600", bg: "from-pink-50 to-rose-50" },
] as const

function StatIcon({ icon: Icon, gradient }: { icon: any; gradient: string }) {
  return (
    <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  )
}

export default function TeacherStatsGrid({ stats, loading }: TeacherStatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
              </div>
              <div className="mt-4 h-4 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map(({ key, label, icon, gradient, bg }) => {
        const s = stats?.[key]
        const changeType = s?.changeType || "neutral"
        return (
          <Card key={key} className={`bg-gradient-to-br from-white ${bg} shadow-lg border-0`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-3xl font-bold text-gray-900">{s?.value ?? 0}</p>
                </div>
                <StatIcon icon={icon} gradient={gradient} />
              </div>
              <div className={`mt-4 flex items-center text-sm ${
                changeType === "positive" ? "text-green-600" :
                changeType === "negative" ? "text-red-600" :
                changeType === "warning" ? "text-orange-600" : "text-gray-500"
              }`}>
                {changeType !== "neutral" && <TrendingUp className="w-4 h-4 mr-1" />}
                <span>{s?.change ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
