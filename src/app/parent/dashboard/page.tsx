"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Users, ClipboardList, TrendingUp, AlertTriangle, Plus, Mail, Sparkles, CalendarClock } from "lucide-react"
import Link from "next/link"
import ParentGreeting from "@/components/parent/greeting"
import { ParentStatCard } from "@/components/parent/stats-cards"
import QuickNav from "@/components/parent/quick-nav"
import ChildTrends from "@/components/parent/child-trends"
import EngagementSummary from "@/components/parent/engagement-summary"
import SkillComparison from "@/components/parent/skill-comparison"
import ParentAIInsightsPanel from "@/components/parent/ai-insights-panel"
import EnrollChildModal from "@/components/parent/enroll-child-modal"
import PaymentModal from "@/components/billing/PaymentModal"
import { useSubscription } from "@/hooks/use-subscription"

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
  const { subscription, loading: subLoading } = useSubscription()
  const [children, setChildren] = useState<Child[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [showEnrollChild, setShowEnrollChild] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [country, setCountry] = useState("US")

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user-profile?userId=${session.user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p) { setDisplayName(`${p.firstName || ""} ${p.lastName || ""}`.trim()); setCountry(p.country || "US") } })
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
      } catch { /* silent */ } finally { setLoading(false) }
      try { const ar = await fetch("/api/parent/alerts"); if (ar.ok) setAlerts((await ar.json()).alerts || []) } catch { } finally { setAlertsLoading(false) }
    }
    fetchData()
  }, [])

  const totalChildren = children.length
  const totalPending = children.reduce((s, c) => s + c.pendingAssignments, 0)
  const avgGrade = children.length ? Math.round(children.reduce((s, c) => s + (c.averageGrade ?? 0), 0) / children.length) : null
  const criticalAlerts = alerts.filter(a => a.severity === "critical").length
  const warningAlerts = alerts.filter(a => a.severity === "warning").length
  const totalAlerts = criticalAlerts + warningAlerts

  const currency = country === "KE" ? "KES" : "USD"
  const fmt = (n: number) => country === "KE"
    ? `KES ${n.toLocaleString()}.00`
    : `$${n.toFixed(2)} USD`

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Hero Header */}
      <div className="flex items-start justify-between">
        <ParentGreeting displayName={displayName} />
        <div className="flex items-center gap-2">
          {subscription && !subLoading && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${
              subscription.isExpired ? 'bg-red-50 text-red-700 border-red-200' :
              subscription.isTrial ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{subscription.packageName || subscription.status || 'Freemium Plan'}</span>
              {subscription.daysRemaining > 0 ? (
                <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{subscription.daysRemaining} days left</span>
              ) : subscription.isExpired ? (
                <span>Expired</span>
              ) : (
                <span>Active</span>
              )}
            </div>
          )}
          <button onClick={() => setShowEnrollChild(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Child
          </button>
        </div>
      </div>

      {/* Top Quick Navigation Bar */}
      <QuickNav />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ParentStatCard label="Children" value={totalChildren} icon={Users} color="text-blue-600" href="/parent/children" />
        <ParentStatCard label="Pending Work" value={totalPending} icon={ClipboardList} color="text-amber-600" />
        <ParentStatCard label="Average Grade" value={avgGrade !== null ? `${avgGrade}%` : "—"} icon={TrendingUp} color={gradeColor(avgGrade)} />
        <ParentStatCard label="AI Alerts" value={totalAlerts} icon={AlertTriangle} color={criticalAlerts > 0 ? "text-red-600" : "text-amber-600"} href="/parent/alerts" />
      </div>

      {/* Conditional Content */}
      {totalChildren === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to Elimu Nova AI Parent Portal</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Your account is not linked to any active student records yet.
            Add your children below, or contact your school administrator to link your child's profile.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => setShowEnrollChild(true)} className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> + Link Child Profile
            </button>
            <Link href="/parent/messages" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
              <Mail className="w-4 h-4" /> Contact School Admin
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ParentAIInsightsPanel />
          <ChildTrends />
          <SkillComparison children={children} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementSummary />
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">Billing & Subscription</h3>
                <p className="text-2xl font-bold text-slate-900">{fmt(0)}</p>
                {subscription ? (
                  <p className="text-xs text-slate-500 mt-1">{subscription.isTrial ? `${subscription.daysRemaining}-day free trial` : subscription.isActive ? 'Active subscription' : 'Subscription needed'} · {currency === "KES" ? "KES" : "USD"} billing</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">14-day free trial · {currency === "KES" ? "KES" : "USD"} billing</p>
                )}
              </div>
              <button onClick={() => setShowPayment(true)}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition">
                Upgrade Plan
              </button>
            </div>
          </div>
        </>
      )}

      {showEnrollChild && <EnrollChildModal isOpen={showEnrollChild} onClose={() => setShowEnrollChild(false)} onSuccess={() => { setShowEnrollChild(false); window.location.reload() }} />}
      {showPayment && <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} country={country} currency={currency} amount={9.99} planName="Parent Premium" />}
    </div>
  )
}
