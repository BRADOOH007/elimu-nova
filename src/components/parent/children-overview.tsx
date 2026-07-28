"use client"

import { Users, ArrowRight, AlertCircle, AlertTriangle, Info, Zap, Flame, CheckCircle } from "lucide-react"
import Link from "next/link"

interface SkillSummary {
  skillName: string; skillCategory: string; masteryScore: number; timesCorrect: number; timesTested: number
}

interface ChildProgress {
  xp: number; streak: number; masteryScore: number; consecutiveCorrect: number
  totalQuestions: number; correctAnswers: number; skillMastery: SkillSummary[]
}

interface Child {
  id: string; name: string; grade: string; school: string
  averageGrade: number | null; pendingAssignments: number
  completedAssignments: number; streakDays: number
  progress?: ChildProgress | null
}

interface Alert {
  id: string; studentName: string; title: string; message: string
  severity: "critical" | "warning" | "info"; type: string; subject?: string
}

interface ChildrenOverviewProps {
  children: Child[]
  alerts: Alert[]
  loading: boolean
  alertsLoading: boolean
  gradeColor: (g: number | null) => string
}

function severityIcon(s: string) {
  if (s === "critical") return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
  if (s === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
  return <Info className="h-4 w-4 text-blue-500 shrink-0" />
}

function severityBg(s: string) {
  if (s === "critical") return "bg-red-50 border-red-200"
  if (s === "warning") return "bg-amber-50 border-amber-200"
  return "bg-blue-50 border-blue-200"
}

function MasteryBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function ChildrenOverview({ children, alerts, loading, alertsLoading, gradeColor }: ChildrenOverviewProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">My Children</h2>
          <Link href="/parent/children" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 w-12 bg-slate-200 rounded ml-auto" />
                  <div className="h-3 w-16 bg-slate-200 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No children linked yet</p>
            <p className="text-xs text-slate-400 mt-1">Ask the school to link your account</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {children.map(child => {
              const initials = child.name.split(" ").map(n => n[0]).join("").toUpperCase()
              const colors = ["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-violet-500 to-purple-600", "from-rose-500 to-pink-600"]
              const grad = colors[children.indexOf(child) % colors.length]
              return (
                <Link key={child.id} href={`/parent/children/${child.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{child.name}</p>
                        <p className="text-xs text-slate-500">{child.grade}</p>
                        {child.progress && (
                          <div className="flex items-center gap-3 mt-1.5">
                            <MasteryBar score={child.progress.masteryScore} />
                            <span className="text-[10px] font-medium text-slate-400 shrink-0">{child.progress.masteryScore}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`font-bold text-base ${gradeColor(child.averageGrade)}`}>
                        {child.averageGrade !== null ? `${Math.round(child.averageGrade)}%` : "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 justify-end">
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                          <Zap className="w-3 h-3" />{child.progress?.xp ?? 0}
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] text-orange-600">
                          <Flame className="w-3 h-3" />{child.streakDays}d
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
              <AlertCircle className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">AI Early Warnings</h2>
          </div>
          {alerts.filter(a => a.severity === "critical").length > 0 && (
            <span className="text-[11px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {alerts.filter(a => a.severity === "critical").length} critical
            </span>
          )}
        </div>
        {alertsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-slate-200 animate-pulse">
                <div className="w-4 h-4 bg-slate-200 rounded-full shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/5 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">All clear!</p>
            <p className="text-xs text-slate-400 mt-1">No concerns detected by AI</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {alerts.slice(0, 5).map(alert => {
              const isCritical = alert.severity === "critical"
              return (
                <div key={alert.id} className={`flex gap-3 p-3 rounded-lg border ${severityBg(alert.severity)} ${isCritical ? "ring-1 ring-red-500/20" : ""}`}>
                  {severityIcon(alert.severity)}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{alert.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">{alert.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{alert.studentName}</p>
                  </div>
                </div>
              )
            })}
            {alerts.length > 5 && (
              <Link href="/parent/progress">
                <p className="text-xs font-medium text-center text-blue-600 hover:text-blue-700 pt-2 transition-colors">
                  View all {alerts.length} alerts &rarr;
                </p>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
