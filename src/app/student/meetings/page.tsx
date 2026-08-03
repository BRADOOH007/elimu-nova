'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Video, Loader2, MapPin } from 'lucide-react'
import { ClientDateTime } from '@/components/ui/client-date'

interface Meeting {
  id: string
  title: string
  description?: string
  date: string
  time: string
  duration?: number
  location?: string
  status: string
  type?: string
  zoomJoinUrl?: string | null
}

export default function StudentMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/schedule')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const items = Array.isArray(data) ? data : (data.schedule || data.meetings || data.events || [])
        setMeetings(items.filter((m: Meeting) => m.status !== 'COMPLETED' && (m.type === 'MEETING' || m.zoomJoinUrl)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Video className="h-6 w-6 text-blue-500" /> Live Meetings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Join your scheduled video meetings</p>
      </div>

      {meetings.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No upcoming meetings</p>
            <p className="text-sm text-slate-400 mt-1">Scheduled meetings will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meetings.map(m => (
            <Card key={m.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{m.title}</h3>
                    {m.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{m.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /><ClientDateTime date={m.date} /></span>
                      {m.duration && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{m.duration} min</span>}
                      {m.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{m.location}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant="outline">{m.status}</Badge>
                    <Link href={`/student/meetings/${m.id}`}>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white h-8 text-xs">
                        <Video className="w-3.5 h-3.5 mr-1.5" />Join
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}