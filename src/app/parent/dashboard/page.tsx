"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Bell, Users, ClipboardList, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import ParentGreeting from "@/components/parent/greeting"
import { ParentStatCard } from "@/components/parent/stats-cards"
import ChildrenOverview from "@/components/parent/children-overview"
import QuickNav from "@/components/parent/quick-nav"

interface Child {
  id: string; name: string; grade: string; school: string
  averageGrade: number | null; pendingAssignments: number
  completedAssignments: number; streakDays: number
}

interface Alert {
  id: string; studentName: string; title: string; message: string
  severity: "critical" | "warning" | "info"; type: string; subject?: string
}

function gradeColor(g: number | null) {
  if (g === null) return "text-slate-400"
  if (g >= 75) return "text-green-400"
  if (g >= 60) return "text-amber-400"
  return "text-red-400"
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [displayName, setDisplayName] = useState("")

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user-profile?userId=${session.user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p) setDisplayName(`${p.firstName || ""} ${p.lastName || ""}`.trim()) })
        .catch(() => {})
    }
  }, [session?.user?.id])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/parent/children")
        if (res.ok) {
          const { children: raw } = await res.json()
          setChildren(raw.map((c: any) => ({
            id: c.id, name: `${c.user.firstName} ${c.user.lastName}`,
            grade: c.class?.grade || "N/A", school: c.school?.name || "ElimuNova",
            averageGrade: c.analytics?.averageGrade ?? null,
            pendingAssignments: c.analytics?.pendingAssignments ?? 0,
            completedAssignments: c.analytics?.completedAssignments ?? 0,
            streakDays: c.analytics?.streakDays ?? 0,
          })))
        }
      } catch { /* silent */ }
      finally { setLoading(false) }

      try {
        const ar = await fetch("/api/parent/alerts")
        if (ar.ok) setAlerts((await ar.json()).alerts || [])
      } catch { /* silent */ }
      finally { setAlertsLoading(false) }
    }
    fetchData()
  }, [])

  const totalChildren = children.length
  const totalPending = children.reduce((s, c) => s + c.pendingAssignments, 0)
  const avgGrade = children.length ? Math.round(children.reduce((s, c) => s + (c.averageGrade ?? 0), 0) / children.length) : null
  const criticalAlerts = alerts.filter(a => a.severity === "critical").length
  const warningAlerts = alerts.filter(a => a.severity === "warning").length

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <ParentGreeting displayName={displayName} />
        <Link href="/parent/progress">
          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors" title="View AI alerts">
            <Bell className="h-5 w-5 text-slate-600" />
            {(criticalAlerts + warningAlerts) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {criticalAlerts + warningAlerts}
              </span>
            )}
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ParentStatCard label="My Children" value={totalChildren} icon={Users} color="text-blue-600" bg="bg-blue-50" href="/parent/children" />
        <ParentStatCard label="Pending Work" value={totalPending} icon={ClipboardList} color="text-amber-600" bg="bg-amber-50" />
        <ParentStatCard label="Avg Grade" value={avgGrade !== null ? `${avgGrade}%` : "—"} icon={TrendingUp} color={gradeColor(avgGrade)} bg="bg-green-50" />
        <ParentStatCard label="AI Alerts" value={criticalAlerts + warningAlerts} icon={AlertTriangle} color={criticalAlerts > 0 ? "text-red-600" : "text-amber-600"} bg={criticalAlerts > 0 ? "bg-red-50" : "bg-amber-50"} href="/parent/progress" />
      </div>

      <ChildrenOverview children={children} alerts={alerts} loading={loading} alertsLoading={alertsLoading} gradeColor={gradeColor} />
      <QuickNav />
    </div>
  )
}
