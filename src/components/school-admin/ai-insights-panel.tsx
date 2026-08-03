"use client"

import { useState, useEffect } from "react"
import { Brain, AlertTriangle, AlertCircle, CheckCircle, TrendingUp, Users, DollarSign, BarChart3, Lightbulb, ChevronDown, ChevronUp } from "lucide-react"

interface Insight {
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  recommendation: string
  students?: { name: string; grade: number | null; pending: number; class?: string }[]
  details?: string[]
}

interface InsightsSummary {
  total: number
  high: number
  medium: number
  low: number
}

const priorityConfig: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  high: { bg: 'bg-red-50', border: 'border-red-200', icon: <AlertTriangle className="w-4 h-4 text-red-500" />, label: 'Urgent' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertCircle className="w-4 h-4 text-amber-500" />, label: 'Review' },
  low: { bg: 'bg-blue-50', border: 'border-blue-200', icon: <Lightbulb className="w-4 h-4 text-blue-500" />, label: 'Suggestion' },
}

const typeIcons: Record<string, React.ReactNode> = {
  teacher_productivity: <Users className="w-4 h-4" />,
  student_retention: <AlertTriangle className="w-4 h-4" />,
  performance_gap: <BarChart3 className="w-4 h-4" />,
  submission_trends: <TrendingUp className="w-4 h-4" />,
  enrollment: <Users className="w-4 h-4" />,
  subscription: <DollarSign className="w-4 h-4" />,
  resource_allocation: <BarChart3 className="w-4 h-4" />,
}

export default function SchoolAIInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [summary, setSummary] = useState<InsightsSummary>({ total: 0, high: 0, medium: 0, low: 0 })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/school-admin/ai-insights?period=30')
      .then(r => r.ok ? r.json() : { insights: [], summary: { total: 0, high: 0, medium: 0, low: 0 } })
      .then(d => { setInsights(d.insights || []); setSummary(d.summary || { total: 0, high: 0, medium: 0, low: 0 }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet-500 animate-pulse" />
          <span className="text-sm font-semibold text-gray-700">Analyzing school data...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white via-emerald-50 to-green-50 rounded-xl border border-emerald-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-800">School Health: Excellent</span>
        </div>
        <p className="text-xs text-gray-600">No critical issues detected. All systems operating normally.</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white via-violet-50 to-indigo-50 rounded-xl border border-violet-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">AI School Insights</h3>
              <p className="text-[10px] text-gray-500">Smart analysis of your school data</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {summary.high > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">{summary.high} urgent</span>
            )}
            {summary.medium > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{summary.medium} review</span>
            )}
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="px-5 pb-5 space-y-2 max-h-80 overflow-y-auto">
        {insights.map((insight, i) => {
          const config = priorityConfig[insight.priority] || priorityConfig.low
          const isExpanded = expanded === `insight-${i}`
          return (
            <div key={i} className={`rounded-xl border ${config.border} ${config.bg} overflow-hidden transition-all`}>
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : `insight-${i}`)}
                className="w-full flex items-start gap-3 p-3 text-left"
              >
                <div className="shrink-0 mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{insight.title}</span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/60 text-gray-500">{config.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{insight.message}</p>
                </div>
                <div className="shrink-0 text-gray-400">
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-white/50">
                  <div className="p-2 bg-white/60 rounded-lg">
                    <p className="text-[10px] font-semibold text-gray-700 mb-1">Recommendation</p>
                    <p className="text-[11px] text-gray-600">{insight.recommendation}</p>
                  </div>
                  {insight.students && insight.students.length > 0 && (
                    <div className="p-2 bg-white/60 rounded-lg">
                      <p className="text-[10px] font-semibold text-gray-700 mb-1">Affected Students</p>
                      <div className="space-y-1">
                        {insight.students.map((s, j) => (
                          <div key={j} className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-700">{s.name}{s.class ? ` (${s.class})` : ''}</span>
                            <span className="text-gray-500">
                              {s.grade !== null ? `Grade: ${s.grade}%` : ''}{s.pending > 0 ? ` · ${s.pending} pending` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.details && insight.details.length > 0 && (
                    <div className="p-2 bg-white/60 rounded-lg">
                      <p className="text-[10px] font-semibold text-gray-700 mb-1">Details</p>
                      <ul className="text-[11px] text-gray-600 space-y-0.5">
                        {insight.details.map((d, j) => <li key={j}>· {d}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
