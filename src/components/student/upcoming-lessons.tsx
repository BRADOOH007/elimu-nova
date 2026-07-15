'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  subject: string
  time: string
  teacher: string
  location?: string
}

interface Props {
  lessons: Lesson[]
}

export default function UpcomingLessons({ lessons }: Props) {
  if (lessons.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">No lessons scheduled today</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {lessons.map((lesson, i) => (
          <div key={lesson.id} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{lesson.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lesson.time}
                </span>
                <span>{lesson.subject}</span>
                <span className="text-gray-400">·</span>
                <span>{lesson.teacher}</span>
                {lesson.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lesson.location}
                  </span>
                )}
              </div>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs border-purple-200 text-purple-700 bg-purple-50">
              {lesson.subject}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
