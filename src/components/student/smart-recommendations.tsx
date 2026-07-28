'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, AlertTriangle, AlertCircle, Info, CheckCircle, Loader2, ArrowRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface Recommendation {
  type: string; title: string; description: string; action: string; href: string
}

interface TypeConfig { icon: LucideIcon; color: string; bg: string; badge: string }

const typeConfig: Record<string, TypeConfig> = {
  danger: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700' },
  warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700' },
}

export default function SmartRecommendations() {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/student/recommendations')
        if (res.ok) { const d = await res.json(); setRecs(d.recommendations || []) }
      } catch (e) { console.warn('[SmartRecommendations] Failed to fetch:', e) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return (
    <Card className="border-0 shadow-lg"><CardContent className="p-6 flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></CardContent></Card>
  )
  if (recs.length === 0) return null

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Study Recommendations
          <Badge className="ml-auto bg-amber-100 text-amber-700 border-0">{recs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recs.map((r, i) => {
          const cfg = typeConfig[r.type] || typeConfig.info
          const Icon = cfg.icon
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg}`}>
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-gray-900">{r.title}</p>
                  <Badge className={`${cfg.badge} border-0 text-[10px]`}>{r.type}</Badge>
                </div>
                <p className="text-xs text-gray-600">{r.description}</p>
                {r.href && (
                  <Link href={r.href}>
                    <Button variant="link" className="h-auto p-0 text-xs text-blue-600 mt-1">
                      {r.action} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
