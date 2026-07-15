'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Timer, TrendingUp } from 'lucide-react'

interface StudySession {
  id: string
  subject: string
  topic: string
  duration: number
  startTime: string
  endTime?: string
  notes?: string
  isCompleted?: boolean
}

interface Props {
  sessions: StudySession[]
}

export default function RecentStudySessions({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            Recent Study Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">No study sessions this week</p>
        </CardContent>
      </Card>
    )
  }

  const totalMin = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-600" />
          Recent Study Sessions
        </CardTitle>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Timer className="w-3 h-3" />
          {totalMin}m total
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.slice(0, 5).map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{s.topic || s.subject}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{s.subject}</span>
                <span>·</span>
                <span>{new Date(s.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>·</span>
                <span>{s.duration} min</span>
              </div>
            </div>
            {s.duration >= 30 && (
              <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
