'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Heart, User, Calendar } from 'lucide-react'

interface AtRiskStudent {
  studentId: string
  studentName: string
  score: number
  flags: string[]
  lastCheckin: string
}

const FLAG_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  ATTENTION: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW_MOOD: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH_STRESS: 'bg-purple-100 text-purple-700 border-purple-200',
  SLEEP_ISSUE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SOCIAL_ISOLATION: 'bg-orange-100 text-orange-700 border-orange-200',
  LOW_ENERGY: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

export function WellnessAlertsWidget() {
  const [students, setStudents] = useState<AtRiskStudent[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/wellness/at-risk')
      .then(r => r.json())
      .then(d => setStudents(d.students || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <Card><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></CardContent></Card>
  )

  return (
    <Card className="border-amber-200/60">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-sm font-semibold">Wellness Alerts</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={load}>
          <Loader2 className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {students.length === 0 ? (
          <div className="text-center py-4">
            <Heart className="h-8 w-8 text-green-300 mx-auto mb-1" />
            <p className="text-xs text-slate-400">No alerts — all students doing well ❤️</p>
          </div>
        ) : (
          students.slice(0, 5).map(s => (
            <div key={s.studentId} className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-700 truncate">{s.studentName}</p>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${s.score < 30 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {s.score}%
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.flags.slice(0, 3).map(f => (
                    <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${FLAG_COLORS[f] || 'bg-slate-100 text-slate-600'}`}>
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(s.lastCheckin).toLocaleDateString('en-GB')}
                </p>
              </div>
              <AlertTriangle className={`h-4 w-4 mt-1 shrink-0 ${s.flags.includes('CRITICAL') ? 'text-red-500' : 'text-amber-400'}`} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
