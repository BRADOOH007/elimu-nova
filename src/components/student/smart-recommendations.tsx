'use client'

import useSWR from 'swr'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, AlertTriangle, AlertCircle, Info, CheckCircle, Loader2, ArrowRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useAITutor } from '@/components/ai-tutor-provider'

interface Recommendation {
  type: string; title: string; description: string; action: string; href: string
}

interface TypeConfig {
  icon: LucideIcon; accent: string; bg: string; badge: string; label: string
}

const typeConfig: Record<string, TypeConfig> = {
  danger:  { icon: AlertTriangle, accent: 'border-l-red-500', bg: 'bg-red-50/50', badge: 'bg-red-100 text-red-700', label: 'High Priority' },
  warning: { icon: AlertCircle,   accent: 'border-l-amber-500', bg: 'bg-amber-50/50', badge: 'bg-amber-100 text-amber-700', label: 'Needs Attention' },
  info:    { icon: Info,          accent: 'border-l-blue-500', bg: 'bg-blue-50/50', badge: 'bg-blue-100 text-blue-700', label: 'Tip' },
  success: { icon: CheckCircle,   accent: 'border-l-green-500', bg: 'bg-green-50/50', badge: 'bg-green-100 text-green-700', label: 'On Track' },
}

export default function SmartRecommendations() {
  const { openAITutor } = useAITutor()
  const { data, isLoading } = useSWR<{ recommendations?: Recommendation[] }>(
    '/api/student/recommendations',
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch recommendations')
      return res.json()
    },
  )
  const recs = data?.recommendations || []

  if (isLoading) return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center justify-center h-32">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
    </div>
  )
  if (recs.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-bold text-slate-800">Study Recommendations</h2>
        <Badge className="ml-auto bg-amber-100 text-amber-700 border-0 text-xs">{recs.length}</Badge>
      </div>
      <div className="space-y-2.5">
        {recs.map((r, i) => {
          const cfg = typeConfig[r.type] || typeConfig.info
          const Icon = cfg.icon
          return (
            <div key={i} className={`border-l-4 ${cfg.accent} ${cfg.bg} p-3 rounded-r-lg`}>
              <div className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-slate-800">{r.title}</p>
                    <Badge className={`${cfg.badge} border-0 text-[10px]`}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{r.description}</p>
                  {r.action === 'Chat with AI Tutor' ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800 mt-1"
                      onClick={() => openAITutor('Can you help me understand where I went wrong on this topic?')}
                    >
                      {r.action} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  ) : r.href ? (
                    <Link href={r.href}>
                      <Button variant="link" className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800 mt-1">
                        {r.action} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
