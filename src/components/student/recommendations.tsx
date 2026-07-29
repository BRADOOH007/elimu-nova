'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb, Loader2, Sparkles, TrendingUp, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'

interface Recommendation {
  type: 'success' | 'warning' | 'info' | 'danger'
  title: string
  description: string
  action?: string
  href?: string
}

interface RecommendationCardProps {
  recommendation: Recommendation
  onAct?: (rec: Recommendation) => void
}

function RecCard({ recommendation: r, onAct }: RecommendationCardProps) {
  const colors = {
    success: { bg: 'bg-green-50 border-green-200', icon: 'text-green-600', title: 'text-green-800', desc: 'text-green-700' },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', title: 'text-amber-800', desc: 'text-amber-700' },
    info: { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', title: 'text-blue-800', desc: 'text-blue-700' },
    danger: { bg: 'bg-red-50 border-red-200', icon: 'text-red-600', title: 'text-red-800', desc: 'text-red-700' },
  }
  const c = colors[r.type]

  return (
    <div className={`${c.bg} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${c.icon}`}>
          {r.type === 'danger' ? <AlertCircle className="h-5 w-5" /> :
           r.type === 'warning' ? <TrendingUp className="h-5 w-5" /> :
           <Sparkles className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${c.title}`}>{r.title}</p>
          <p className={`text-xs mt-0.5 ${c.desc}`}>{r.description}</p>
          {r.action && (
            <button
              onClick={() => onAct?.(r)}
              className={`mt-2 text-xs font-semibold inline-flex items-center gap-1 ${c.icon} hover:underline`}
            >
              {r.action} <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function Recommendations({ onStudy }: { onStudy?: (subject: string, topic: string) => void }) {
  const [aiRecommendations, setAiRecommendations] = useState<Recommendation[]>([])
  const [ruleRecommendations, setRuleRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    loadRuleRecommendations()
    loadAiRecommendations()
  }, [])

  const loadRuleRecommendations = async () => {
    try {
      const res = await fetch('/api/student/recommendations')
      if (res.ok) {
        const data = await res.json()
        setRuleRecommendations(data.recommendations || [])
      }
    } catch { /* ignore */ }
  }

  const loadAiRecommendations = async () => {
    setAiLoading(true)
    try {
      const [progressRes, sessionsRes] = await Promise.all([
        fetch('/api/student/progress'),
        fetch('/api/student/study-sessions?period=month'),
      ])
      const progress = progressRes.ok ? await progressRes.json() : null
      const sessions = sessionsRes.ok ? await sessionsRes.json() : null

      const subjectScores = (progress?.subjectPerformance || []).map((s: any) => `${s.subject}: ${Math.round(s.averageGrade)}%`).join(', ')
      const weakAreas = (progress?.aiInsights?.areasForImprovement || []).join(', ')
      const recentTopics = (sessions?.sessions || []).slice(0, 3).map((s: any) => s.topic).filter(Boolean).join(', ')

      const prompt = `Based on this student's learning profile, give 3 specific, actionable study recommendations:
- Subject performance: ${subjectScores || 'No data'}
- Areas to improve: ${weakAreas || 'General'}
- Recent topics: ${recentTopics || 'None'}

Return exactly 3 recommendations as a JSON array. Each object: { "title": "short title", "description": "1 sentence why", "action": "button text", "type": "info|warning|success" }
Respond with ONLY the JSON array, no markdown.`

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, context: 'student_tutor' }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.response || ''
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          setAiRecommendations(parsed.map((r: any) => ({ ...r, type: r.type || 'info' })))
        }
      }
    } catch { /* ignore */ }
    setAiLoading(false)
    setLoading(false)
  }

  const allRecs = [...aiRecommendations, ...ruleRecommendations]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          AI-Powered Study Recommendations
        </p>
        <button
          onClick={loadAiRecommendations}
          disabled={aiLoading}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && aiLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          <span className="ml-2 text-sm text-slate-400">Analysing your progress...</span>
        </div>
      ) : allRecs.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No recommendations yet. Study more to get personalised insights.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allRecs.map((r, i) => (
            <RecCard key={i} recommendation={r} onAct={(rec) => {
              if (onStudy && rec.title.toLowerCase().includes('study')) {
                const topicMatch = rec.description.match(/\b(Algebra|Fractions|Decimals|Geometry|Grammar|Reading|Writing|Biology|Chemistry|Physics|History|Geography)\b/i)
                if (topicMatch) onStudy('General', topicMatch[0])
              }
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
