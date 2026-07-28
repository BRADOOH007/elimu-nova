"use client"

import { useState, useEffect } from "react"
import { TrendingUp, BarChart3, Brain, Zap, Flame } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface TrendPoint { date: string; avgGrade: number }
interface SubjectGrade { subject: string; avgGrade: number }
interface ChildData { id: string; name: string; trend: TrendPoint[]; subjects: SubjectGrade[]; averageGrade: number }

interface SkillSummary {
  skillName: string; skillCategory: string; masteryScore: number; timesCorrect: number; timesTested: number
}

interface ChildProgress {
  xp: number; streak: number; masteryScore: number; consecutiveCorrect: number
  totalQuestions: number; correctAnswers: number; skillMastery: SkillSummary[]
}

const SUBJECT_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"]
const CHART_TOOLTIP_STYLES = { borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "10px 14px" }

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}

function scoreText(score: number): string {
  if (score >= 80) return "text-emerald-600"
  if (score >= 50) return "text-amber-600"
  return "text-red-600"
}

export default function ChildTrends() {
  const [children, setChildren] = useState<ChildData[]>([])
  const [progressMap, setProgressMap] = useState<Map<string, ChildProgress>>(new Map())
  const [selectedChild, setSelectedChild] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [trendRes, childrenRes] = await Promise.all([
          fetch("/api/parent/trends"),
          fetch("/api/parent/children"),
        ])
        if (trendRes.ok) {
          const d = await trendRes.json()
          setChildren(d.children || [])
          if (d.children?.length > 0) setSelectedChild(d.children[0].id)
        }
        if (childrenRes.ok) {
          const d = await childrenRes.json()
          const map = new Map<string, ChildProgress>()
          for (const c of d.children || []) {
            if (c.studentProgress?.[0]) {
              const p = c.studentProgress[0]
              map.set(c.id, {
                xp: p.xp, streak: p.streak, masteryScore: p.masteryScore,
                consecutiveCorrect: p.consecutiveCorrect,
                totalQuestions: p.totalQuestions, correctAnswers: p.correctAnswers,
                skillMastery: (p.skillMastery || []).map((sm: any) => ({
                  skillName: sm.skillName, skillCategory: sm.skillCategory,
                  masteryScore: sm.masteryScore, timesCorrect: sm.timesCorrect, timesTested: sm.timesTested,
                })),
              })
            }
          }
          setProgressMap(map)
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [])

  const active = children.find(c => c.id === selectedChild)
  const activeProgress = selectedChild ? progressMap.get(selectedChild) : null

  if (loading) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 animate-pulse">
          <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
          <div className="h-48 bg-slate-100 rounded-lg" />
        </div>
      ))}
    </div>
  )

  if (children.length === 0) return null

  return (
    <div className="space-y-4">
      {children.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {children.map(c => (
            <button key={c.id} onClick={() => setSelectedChild(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedChild === c.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {active && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Grade Trend (30d)</h3>
                </div>
                <span className="text-xs font-medium text-slate-500">{active.averageGrade}% avg</span>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={active.trend}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ ...CHART_TOOLTIP_STYLES, ...{ fontSize: 12 } as any }} />
                  <Area type="monotone" dataKey="avgGrade" stroke="#3b82f6" strokeWidth={2.5} fill="url(#trendFill)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Subject Breakdown</h3>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={active.subjects} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} width={72} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ ...CHART_TOOLTIP_STYLES, ...{ fontSize: 12 } as any }} />
                  <Bar dataKey="avgGrade" radius={[0, 4, 4, 0]} barSize={20}>
                    {active.subjects.map((_, i) => <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {activeProgress && activeProgress.skillMastery.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Skills at a Glance</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" />{activeProgress.xp} XP</span>
                  <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-500" />{activeProgress.streak}d streak</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeProgress.skillMastery.map(skill => (
                  <div key={skill.skillName} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-slate-700 truncate">{skill.skillName}</span>
                        <span className={`text-xs font-bold ${scoreText(skill.masteryScore)}`}>{skill.masteryScore}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${scoreColor(skill.masteryScore)}`} style={{ width: `${skill.masteryScore}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{skill.skillCategory} &middot; {skill.timesCorrect}/{skill.timesTested} correct</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
