"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Users, ClipboardList, TrendingUp, AlertTriangle, ArrowRight, Plus, UserPlus, Mail, Phone } from "lucide-react"
import Link from "next/link"
import ParentGreeting from "@/components/parent/greeting"
import { ParentStatCard } from "@/components/parent/stats-cards"
import QuickNav from "@/components/parent/quick-nav"
import ChildTrends from "@/components/parent/child-trends"
import EngagementSummary from "@/components/parent/engagement-summary"
import SkillComparison from "@/components/parent/skill-comparison"
import ParentAIInsightsPanel from "@/components/parent/ai-insights-panel"
import EnrollChildModal from "@/components/parent/enroll-child-modal"

interface SkillSummary {
  skillName: string; skillCategory: string; masteryScore: number; timesCorrect: number; timesTested: number
}

interface ProgressSummary {
  xp: number; streak: number; masteryScore: number; consecutiveCorrect: number
  totalQuestions: number; correctAnswers: number; skillMastery: SkillSummary[]
}

interface Child {
  id: string; name: string; grade: string; school: string
  averageGrade: number | null; pendingAssignments: number
  completedAssignments: number; streakDays: number
  progress: ProgressSummary | null
}

interface Alert {
  id: string; studentName: string; title: string; message: string
  severity: "critical" | "warning" | "info"; type: string; subject?: string
}

function gradeColor(g: number | null) {
  if (g === null) return "text-slate-400"
  if (g >= 75) return "text-emerald-600"
  if (g >= 60) return "text-amber-600"
  return "text-red-600"
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [showEnrollChild, setShowEnrollChild] = useState(false)
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
          setChildren(raw.map((c: any) => {
            const p = c.studentProgress?.[0]
            return {
              id: c.id, name: `${c.user.firstName} ${c.user.lastName}`,
              grade: c.class?.grade || "N/A", school: c.school?.name || "ElimuNova",
              averageGrade: c.analytics?.averageGrade ?? null,
              pendingAssignments: c.analytics?.pendingAssignments ?? 0,
              completedAssignments: c.analytics?.completedAssignments ?? 0,
              streakDays: c.analytics?.streakDays ?? 0,
              progress: p ? {
                xp: p.xp, streak: p.streak, masteryScore: p.masteryScore,
                consecutiveCorrect: p.consecutiveCorrect,
                totalQuestions: p.totalQuestions, correctAnswers: p.correctAnswers,
                skillMastery: (p.skillMastery || []).map((sm: any) => ({
                  skillName: sm.skillName, skillCategory: sm.skillCategory,
                  masteryScore: sm.masteryScore, timesCorrect: sm.timesCorrect, timesTested: sm.timesTested,
                })),
              } : null,
            }
          }))
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
  const totalAlerts = criticalAlerts + warningAlerts

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <ParentGreeting displayName={displayName} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEnrollChild(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Child
          </button>
          <Link href="/parent/children">
            <div className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              View Children
            </div>
          </Link>
        </div>
      </div>

      {/* Stat Cards — single cohesive row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ParentStatCard label="Children" value={totalChildren} icon={Users} color="text-blue-600" href="/parent/children" />
        <ParentStatCard label="Pending Work" value={totalPending} icon={ClipboardList} color="text-amber-600" />
        <ParentStatCard label="Average Grade" value={avgGrade !== null ? `${avgGrade}%` : "—"} icon={TrendingUp} color={gradeColor(avgGrade)} />
        <ParentStatCard label="AI Alerts" value={totalAlerts} icon={AlertTriangle} color={criticalAlerts > 0 ? "text-red-600" : "text-amber-600"} href="/parent/alerts" />
      </div>

      {/* Conditional: Empty onboarding or Full Dashboard */}
      {totalChildren === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to Elimu Nova AI Parent Portal</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Your account is not linked to any active student records yet. 
            Add your children below, or contact your school administrator to link your child's profile.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => setShowEnrollChild(true)} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add My Children
            </button>
            <Link href="/parent/messages" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
              <Mail className="w-4 h-4" /> Contact School Admin
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* AI Insights */}
          <ParentAIInsightsPanel />

          {/* Trends & Charts */}
          <ChildTrends />

          {/* Skill Comparison */}
          <SkillComparison children={children} />
        </>
      )}

      {/* Bottom: Engagement + Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementSummary />
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm min-h-[110px] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Quick Navigation</h3>
          </div>
          <QuickNav />
        </div>
      </div>
      {showEnrollChild && (
        <EnrollChildModal
          isOpen={showEnrollChild}
          onClose={() => setShowEnrollChild(false)}
          onSuccess={() => { setShowEnrollChild(false); window.location.reload() }}
        />
      )}
    </div>
  )
}
