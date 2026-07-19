"use client"

import { Brain, CheckCircle, AlertCircle, AlertTriangle, Info, ArrowRight, Users } from "lucide-react"
import Link from "next/link"

interface Child {
  id: string; name: string; grade: string; school: string
  averageGrade: number | null; pendingAssignments: number
  completedAssignments: number; streakDays: number
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
  if (s === "critical") return <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
  if (s === "warning") return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
  return <Info className="h-4 w-4 text-blue-400 shrink-0" />
}

function severityBorder(s: string) {
  if (s === "critical") return "border-red-500/30 bg-red-500/5"
  if (s === "warning") return "border-amber-500/30 bg-amber-500/5"
  return "border-blue-500/30 bg-blue-500/5"
}

export default function ChildrenOverview({ children, alerts, loading, alertsLoading, gradeColor }: ChildrenOverviewProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">My Children</h2>
          <Link href="/parent/children" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No children linked yet</p>
            <Link href="/parent/children">
              <button className="mt-3 text-xs text-blue-600 hover:underline">Add a child →</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map(child => (
              <div key={child.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {child.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{child.name}</p>
                    <p className="text-xs text-slate-500">{child.grade}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${gradeColor(child.averageGrade)}`}>
                    {child.averageGrade !== null ? `${Math.round(child.averageGrade)}%` : "—"}
                  </p>
                  <p className="text-xs text-slate-400">avg grade</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <h2 className="font-semibold text-slate-800">AI Early Warnings</h2>
          </div>
          {alerts.filter(a => a.severity === "critical").length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
              {alerts.filter(a => a.severity === "critical").length} critical
            </span>
          )}
        </div>
        {alertsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" />
            <p className="text-slate-600 text-sm font-medium">All clear!</p>
            <p className="text-slate-400 text-xs mt-1">No concerns detected by AI at this time</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`flex gap-3 p-3 rounded-xl border ${severityBorder(alert.severity)}`}>
                {severityIcon(alert.severity)}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{alert.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
            {alerts.length > 5 && (
              <Link href="/parent/progress">
                <p className="text-xs text-center text-blue-600 hover:underline pt-1">View all {alerts.length} alerts →</p>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
