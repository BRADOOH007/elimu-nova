"use client"

import { useState, useEffect } from "react"
import { Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, BookOpen, Home, ChevronDown, ChevronUp, Target, Flame } from "lucide-react"

interface Insight {
  childName: string
  studentId: string
  type: string
  title: string
  message: string
  suggestion: string
}

interface ActionPlan {
  childName: string
  studentId: string
  title: string
  items: { skill: string; action: string; resource: string; timeframe: string }[]
}

interface RiskAlert {
  childName: string
  studentId: string
  severity: 'critical' | 'warning'
  title: string
  message: string
  reasons: string[]
}

interface Summary {
  totalChildren: number
  atRisk: number
  warnings: number
  strengths: number
}

const typeIcon: Record<string, React.ReactNode> = {
  strength: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  weakness: <Target className="w-4 h-4 text-amber-500" />,
  habit: <Flame className="w-4 h-4 text-orange-500" />,
  trend_up: <TrendingUp className="w-4 h-4 text-emerald-500" />,
  trend_down: <TrendingDown className="w-4 h-4 text-red-500" />,
  trend: <TrendingUp className="w-4 h-4 text-blue-500" />,
}

export default function ParentAIInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([])
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])
  const [summary, setSummary] = useState<Summary>({ totalChildren: 0, atRisk: 0, warnings: 0, strengths: 0 })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/parent/ai-insights')
      .then(r => r.ok ? r.json() : { insights: [], actionPlans: [], riskAlerts: [], summary: { totalChildren: 0, atRisk: 0, warnings: 0, strengths: 0 } })
      .then(d => {
        setInsights(d.insights || [])
        setActionPlans(d.actionPlans || [])
        setRiskAlerts(d.riskAlerts || [])
        setSummary(d.summary || { totalChildren: 0, atRisk: 0, warnings: 0, strengths: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-700">Analyzing your children&apos;s progress...</span>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      </div>
    )
  }

  const hasInsights = insights.length > 0 || actionPlans.length > 0 || riskAlerts.length > 0

  if (!hasInsights) {
    return (
      <div className="bg-gradient-to-br from-white via-emerald-50 to-green-50 rounded-xl border border-emerald-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-semibold text-slate-800">All Children Doing Well</span>
        </div>
        <p className="text-xs text-slate-600">No concerns detected. Your children are on track with their studies.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-bold text-gray-900">Needs Attention</h3>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">{riskAlerts.length}</span>
            </div>
          </div>
          <div className="px-5 pb-4 space-y-2">
            {riskAlerts.map((alert, i) => (
              <div key={i} className={`p-3 rounded-xl border ${alert.severity === 'critical' ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <p className="text-xs font-bold text-gray-800">{alert.title}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">{alert.message}</p>
                {alert.reasons.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {alert.reasons.map((r, j) => <li key={j} className="text-[10px] text-gray-500">· {r}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Plans */}
      {actionPlans.length > 0 && (
        <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-gray-900">At-Home Action Plans</h3>
            </div>
          </div>
          <div className="px-5 pb-4 space-y-3">
            {actionPlans.map((plan, i) => {
              const key = `plan-${i}`
              const isOpen = expanded === key
              return (
                <div key={i} className="rounded-xl border border-blue-100 bg-white/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-800">{plan.title}</p>
                      <p className="text-[10px] text-gray-500">{plan.items.length} skill{plan.items.length !== 1 ? 's' : ''} to work on</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-2">
                      {plan.items.map((item, j) => (
                        <div key={j} className="p-2 bg-blue-50/50 rounded-lg space-y-1">
                          <p className="text-[11px] font-semibold text-gray-800">{item.skill}</p>
                          <p className="text-[10px] text-gray-600">{item.action}</p>
                          <div className="flex items-center gap-3 text-[9px] text-gray-500">
                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{item.resource}</span>
                            <span>⏱ {item.timeframe}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* General Insights */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-br from-white via-violet-50 to-purple-50 rounded-xl border border-violet-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" />
              <h3 className="text-sm font-bold text-gray-900">AI Insights</h3>
              {summary.strengths > 0 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">{summary.strengths} strength{summary.strengths !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <div className="px-5 pb-4 space-y-2 max-h-64 overflow-y-auto">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-violet-100">
                <div className="shrink-0 mt-0.5">{typeIcon[insight.type] || <Brain className="w-4 h-4 text-gray-400" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800">{insight.title}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{insight.message}</p>
                  <p className="text-[10px] text-blue-600 mt-1 font-medium">{insight.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
