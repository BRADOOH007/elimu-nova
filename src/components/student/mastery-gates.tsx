'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Target, Lock, CheckCircle, Flame, Loader2 } from 'lucide-react'

interface UnitMastery {
  id: string
  subject: string
  unitName: string
  masteryScore: number
  masteryLevel: string
  totalQuestions: number
  correctAnswers: number
  studyTimeMins: number
  quizzesTaken: number
  lessonsCompleted: number
  lastPracticedAt: string | null
  nextReviewAt: string | null
}

interface MasteryGatesProps {
  subject?: string
  onSelectUnit?: (unit: string) => void
}

const LEVEL_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string; description: string }> = {
  NOT_STARTED: { color: 'text-gray-400', bg: 'bg-gray-100', icon: Lock, label: 'Not Started', description: 'Begin learning to unlock' },
  BEGINNER:    { color: 'text-blue-600', bg: 'bg-blue-100', icon: Star, label: 'Beginner', description: 'Getting started' },
  DEVELOPING:  { color: 'text-amber-600', bg: 'bg-amber-100', icon: Target, label: 'Developing', description: 'Making progress' },
  PROFICIENT:  { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Proficient', description: 'Strong understanding' },
  MASTERED:    { color: 'text-purple-600', bg: 'bg-purple-100', icon: Trophy, label: 'Mastered', description: 'Expert level!' },
}

export function MasteryGates({ subject, onSelectUnit }: MasteryGatesProps) {
  const [masteries, setMasteries] = useState<UnitMastery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMasteries()
  }, [subject])

  const fetchMasteries = async () => {
    setLoading(true)
    try {
      const params = subject ? `?subject=${encodeURIComponent(subject)}` : ''
      const r = await fetch(`/api/student/mastery${params}`)
      if (r.ok) {
        const d = await r.json()
        setMasteries(d.masteries || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  // Group by subject
  const grouped: Record<string, UnitMastery[]> = {}
  for (const m of masteries) {
    if (!grouped[m.subject]) grouped[m.subject] = []
    grouped[m.subject].push(m)
  }

  const overallScore = masteries.length > 0
    ? Math.round(masteries.reduce((s, m) => s + m.masteryScore, 0) / masteries.length)
    : 0
  const masteredCount = masteries.filter(m => m.masteryLevel === 'MASTERED').length
  const totalStudyTime = masteries.reduce((s, m) => s + m.studyTimeMins, 0)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5" /> Mastery Gates
        </CardTitle>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="text-center">
            <p className="text-2xl font-black">{overallScore}%</p>
            <p className="text-xs text-purple-200">Overall</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black">{masteredCount}/{masteries.length}</p>
            <p className="text-xs text-purple-200">Mastered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black">{totalStudyTime}m</p>
            <p className="text-xs text-purple-200">Study Time</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {masteries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No mastery data yet</p>
            <p className="text-sm">Complete quizzes and study sessions to build mastery</p>
          </div>
        ) : (
          masteries.slice(0, 10).map((m) => {
            const config = LEVEL_CONFIG[m.masteryLevel] || LEVEL_CONFIG.NOT_STARTED
            const Icon = config.icon
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => onSelectUnit?.(m.unitName)}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{m.unitName}</p>
                    <Badge className={`text-[10px] ${config.bg} ${config.color} border-0`}>{config.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <Progress value={m.masteryScore} className="h-1.5 flex-1" />
                    <span className="text-xs font-bold text-slate-600">{m.masteryScore}%</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-400">{m.correctAnswers}/{m.totalQuestions} correct</span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-[10px] text-gray-400">{m.quizzesTaken} quizzes</span>
                    {m.nextReviewAt && (
                      <>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                          <Flame className="h-3 w-3" /> Review due
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
