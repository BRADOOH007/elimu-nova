'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Repeat, Clock, CheckCircle, Loader2, Calendar, Flame } from 'lucide-react'

interface ReviewItem {
  id: string
  subject: string
  topic: string
  unitName: string | null
  easeFactor: number
  intervalDays: number
  repetitions: number
  nextReviewAt: string
  lastReviewAt: string | null
  quality: number
  totalReviews: number
}

interface SpacedRepetitionWidgetProps {
  subject?: string
  onStartReview?: (topic: string) => void
}

export function SpacedRepetitionWidget({ subject, onStartReview }: SpacedRepetitionWidgetProps) {
  const [dueReviews, setDueReviews] = useState<ReviewItem[]>([])
  const [upcoming, setUpcoming] = useState<ReviewItem[]>([])
  const [stats, setStats] = useState({ totalScheduled: 0, masteredCount: 0 })
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<string | null>(null)

  useEffect(() => { fetchReviews() }, [subject])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = subject ? `?subject=${encodeURIComponent(subject)}` : ''
      const r = await fetch(`/api/student/review-schedule${params}`)
      if (r.ok) {
        const d = await r.json()
        setDueReviews(d.dueForReview || [])
        setUpcoming(d.upcoming || [])
        setStats({ totalScheduled: d.totalScheduled || 0, masteredCount: d.masteredCount || 0 })
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const recordReview = async (item: ReviewItem, quality: number) => {
    setReviewing(item.id)
    try {
      await fetch('/api/student/review-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: item.subject, topic: item.topic, unitName: item.unitName, quality }),
      })
      await fetchReviews()
    } catch { /* ignore */ }
    finally { setReviewing(null) }
  }

  const formatInterval = (days: number) => {
    if (days === 0) return 'Now'
    if (days === 1) return '1 day'
    if (days < 7) return `${days} days`
    if (days < 30) return `${Math.round(days / 7)} weeks`
    return `${Math.round(days / 30)} months`
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Repeat className="h-5 w-5" /> Spaced Repetition
        </CardTitle>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center bg-white/10 rounded-lg p-2">
            <p className="text-xl font-black">{dueReviews.length}</p>
            <p className="text-[10px] text-orange-200">Due Now</p>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-2">
            <p className="text-xl font-black">{upcoming.length}</p>
            <p className="text-[10px] text-orange-200">This Week</p>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-2">
            <p className="text-xl font-black">{stats.masteredCount}</p>
            <p className="text-[10px] text-orange-200">Well Learned</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          </div>
        ) : dueReviews.length === 0 && upcoming.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No reviews scheduled</p>
            <p className="text-sm">Complete quizzes to schedule spaced reviews</p>
          </div>
        ) : (
          <>
            {dueReviews.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> Due for Review ({dueReviews.length})
                </p>
                {dueReviews.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.topic}</p>
                      <p className="text-[10px] text-gray-500">
                        {item.totalReviews} reviews · Interval: {formatInterval(item.intervalDays)}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {[
                        { q: 2, label: 'Hard', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                        { q: 3, label: 'Good', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                        { q: 5, label: 'Easy', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      ].map(btn => (
                        <Button
                          key={btn.q}
                          size="sm"
                          variant="ghost"
                          className={`text-[10px] h-7 ${btn.color}`}
                          disabled={reviewing === item.id}
                          onClick={() => recordReview(item, btn.q)}
                        >
                          {reviewing === item.id ? <Loader2 className="h-3 animate-spin" /> : btn.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Upcoming
                </p>
                {upcoming.slice(0, 5).map(item => {
                  const daysUntil = Math.max(0, Math.ceil((new Date(item.nextReviewAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 mb-1">
                      <CheckCircle className="h-4 w-4 text-gray-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{item.topic}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}

            {onStartReview && dueReviews.length > 0 && (
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90"
                onClick={() => onStartReview(dueReviews[0].topic)}
              >
                <Repeat className="h-4 w-4 mr-2" /> Start Review Session
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
