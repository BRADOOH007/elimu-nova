'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, ThumbsUp, ThumbsDown, MessageSquare, ChevronRight } from 'lucide-react'

interface AITutorSession {
  id: string
  sessionType?: string
  subject: string
  topic?: string
  question: string
  response: string
  rating: number | null
  isHelpful?: boolean | null
  createdAt: string
}

interface Props {
  sessions: AITutorSession[]
}

export default function AITutorHistory({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            AI Tutor History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">No AI tutor sessions yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          AI Tutor History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.slice(0, 5).map(s => (
          <div key={s.id} className="p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">{s.topic || s.subject}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-200 text-indigo-700 bg-indigo-50 shrink-0">
                    {s.sessionType || 'chat'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-1">{s.question}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span>{s.subject}</span>
                  <span>·</span>
                  <span>{new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  {s.rating && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        {s.rating >= 4 ? (
                          <ThumbsUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <ThumbsDown className="w-3 h-3 text-red-400" />
                        )}
                        {s.rating}/5
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
