"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, BookOpen, ClipboardList, CheckCircle, Brain, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  const [masteryAvg, setMasteryAvg] = useState<number | null>(null)
  const [atRiskCount, setAtRiskCount] = useState(0)
  const [masteryLoading, setMasteryLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/teacher/mastery-summary")
        if (res.ok) {
          const data = await res.json()
          if (data.students?.length > 0) {
            setMasteryAvg(Math.round(data.students.reduce((s: number, st: any) => s + st.masteryScore, 0) / data.students.length))
          }
          setAtRiskCount(data.atRiskStudents?.length ?? 0)
        }
      } catch { /* silent */ }
      finally { setMasteryLoading(false) }
    })()
  }, [])
  if (loading) {
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-stagger">
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

  const masteryStatus = masteryAvg !== null ? (masteryAvg >= 70 ? "positive" : masteryAvg >= 45 ? "warning" : "negative") : "neutral"
  const masteryColors = {
    positive: "from-emerald-100 to-green-50 border-emerald-200 text-emerald-700",
    warning: "from-amber-100 to-yellow-50 border-amber-200 text-amber-700",
    negative: "from-red-100 to-rose-50 border-red-200 text-red-700",
    neutral: "from-slate-100 to-gray-50 border-slate-200 text-slate-600"
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-stagger">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className={`bg-gradient-to-br ${masteryColors[masteryStatus]} shadow-lg border`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <p className="font-semibold">Class Mastery Average</p>
              </div>
              {!masteryLoading && masteryAvg !== null && (
                <Badge className={`border-0 ${
                  masteryStatus === "positive" ? "bg-emerald-200 text-emerald-800" :
                  masteryStatus === "warning" ? "bg-amber-200 text-amber-800" :
                  "bg-red-200 text-red-800"
                }`}>
                  {masteryAvg}%
                </Badge>
              )}
            </div>
            {masteryLoading ? (
              <div className="h-2 bg-white/50 rounded-full animate-pulse" />
            ) : masteryAvg !== null ? (
              <>
                <div className="w-full bg-white/50 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${
                    masteryAvg >= 70 ? "bg-emerald-500" : masteryAvg >= 45 ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${masteryAvg}%` }} />
                </div>
                <p className="text-xs mt-2 opacity-75">Across all students with activity data</p>
              </>
            ) : (
              <p className="text-xs opacity-75">No student mastery data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 shadow-lg border border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <p className="font-semibold text-slate-800">Students At Risk</p>
              </div>
              {!masteryLoading && (
                <Badge className={`border-0 ${atRiskCount > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {atRiskCount > 0 ? `${atRiskCount} need help` : "All clear"}
                </Badge>
              )}
            </div>
            {masteryLoading ? (
              <div className="h-4 bg-slate-200 rounded animate-pulse" />
            ) : atRiskCount > 0 ? (
              <p className="text-sm text-slate-600">
                {atRiskCount} student{atRiskCount !== 1 ? "s" : ""} with mastery below 40% or accuracy below 40%. Review in Mastery Overview below.
              </p>
            ) : (
              <p className="text-sm text-slate-600">All students are maintaining adequate mastery levels. Keep up the great work!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
