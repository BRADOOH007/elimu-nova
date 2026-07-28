"use client"

import { useEffect, useState } from "react"
import { Users, TrendingUp, Calendar, BookOpen, ClipboardList, Brain, RefreshCw, ArrowRight, Zap, Flame } from "lucide-react"
import Link from "next/link"

interface Child {
  id: string; name: string; initials: string; grade: string; school: string; subject: string
  averageGrade: number | null; pendingAssignments: number; completedAssignments: number
  streakDays: number; totalStudyTime: number
}

export default function ParentChildren() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchChildren = async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/parent/children")
      if (!res.ok) throw new Error("Failed to fetch")
      const { children: raw } = await res.json()
      setChildren(raw.map((c: any) => {
        const first = c.user.firstName; const last = c.user.lastName
        return {
          id: c.id, name: `${first} ${last}`,
          initials: `${first[0]}${last[0]}`.toUpperCase(),
          grade: c.class?.grade || "N/A", school: c.school?.name || "ElimuNova",
          subject: c.class?.subject || "General",
          averageGrade: c.analytics?.averageGrade ?? null,
          pendingAssignments: c.analytics?.pendingAssignments ?? 0,
          completedAssignments: c.analytics?.completedAssignments ?? 0,
          streakDays: c.analytics?.streakDays ?? 0,
          totalStudyTime: c.analytics?.totalStudyTime ?? 0,
        }
      }))
    } catch { setError("Could not load children. Please try again.") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchChildren() }, [])

  const gradeColor = (g: number | null) => {
    if (g === null) return "text-slate-400"
    if (g >= 75) return "text-emerald-600"
    if (g >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const gradeLabel = (g: number | null) => {
    if (g === null) return "—"
    if (g >= 75) return "On track"
    if (g >= 60) return "Needs focus"
    return "Needs support"
  }

  const gradeBg = (g: number | null) => {
    if (g === null) return "bg-slate-100"
    if (g >= 75) return "bg-emerald-50"
    if (g >= 60) return "bg-amber-50"
    return "bg-red-50"
  }

  const initialsColors = [
    "from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600", "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600", "from-cyan-500 to-blue-600",
  ]

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Children</h1>
          <p className="text-sm text-slate-500 mt-0.5">Linked student accounts and their academic overview</p>
        </div>
        <button onClick={fetchChildren} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" title="Refresh">
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="p-3 bg-slate-50 rounded-lg space-y-1 text-center">
                    <div className="h-5 w-5 bg-slate-200 rounded mx-auto" />
                    <div className="h-5 w-8 bg-slate-200 rounded mx-auto" />
                    <div className="h-3 w-10 bg-slate-200 rounded mx-auto" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-slate-200 rounded-lg" />
                <div className="h-10 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={fetchChildren} className="mt-3 text-blue-600 text-sm font-medium hover:underline">Try again</button>
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-slate-700 font-semibold mb-2">No children linked</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Ask your child&apos;s school administrator to link your account to their profile.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {children.map((child, idx) => {
            const grad = initialsColors[idx % initialsColors.length]
            const avg = child.averageGrade
            return (
              <div key={child.id} className="group bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                {/* Top accent bar */}
                <div className={`h-1.5 bg-gradient-to-r ${grad}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm`}>
                      {child.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{child.name}</h3>
                      <p className="text-sm text-slate-500">{child.grade} &middot; {child.school}</p>
                    </div>
                    <div className={`text-right ${gradeBg(avg)} rounded-xl px-4 py-2`}>
                      <p className={`text-xl font-bold ${gradeColor(avg)}`}>
                        {avg !== null ? `${Math.round(avg)}%` : "—"}
                      </p>
                      <p className={`text-[10px] font-semibold ${gradeColor(avg)}`}>
                        {gradeLabel(avg)}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[
                      { value: child.completedAssignments, label: "Completed", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
                      { value: child.pendingAssignments, label: "Pending", icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
                      { value: child.streakDays, label: "Day Streak", icon: Brain, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-1`}>
                          <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                        </div>
                        <p className="text-base font-bold text-slate-800">{s.value}</p>
                        <p className="text-[10px] font-medium text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* XP & Study Time */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" />{child.totalStudyTime}h studied</span>
                    <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-500" />{child.subject}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link href={`/parent/progress?studentId=${child.id}`}>
                      <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors">
                        <TrendingUp className="h-4 w-4" /> Progress
                      </div>
                    </Link>
                    <Link href={`/parent/assignments?studentId=${child.id}`}>
                      <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors">
                        <BookOpen className="h-4 w-4" /> Assignments
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
