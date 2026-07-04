'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ScheduleEvent {
  id: string
  title: string
  subject?: string
  grade?: string
  startTime: string
  endTime: string
  location?: string
  type: string
  status: string
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function TeacherTimetablePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchTimetable = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/teacher/schedules?limit=100&sortBy=startTime&sortOrder=asc')
      const data = await response.json()
      if (response.ok) {
        setEvents(data.schedules || [])
        setMessage(data.message || '')
      } else {
        setMessage(data.error || 'Failed to load timetable')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimetable()
  }, [])

  const grouped = useMemo(() => {
    return weekDays.reduce<Record<string, ScheduleEvent[]>>((acc, day) => {
      acc[day] = events.filter(event =>
        new Date(event.startTime).toLocaleDateString('en-US', { weekday: 'long' }) === day
      )
      return acc
    }, {})
  }, [events])

  const formatTime = (value: string) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold edugenius-text-gradient-blue">Timetable</h1>
          <p className="text-gray-600 mt-1">A weekly teaching view built from your schedule.</p>
        </div>
        <Button onClick={fetchTimetable} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {message && <p className="text-sm text-gray-600">{message}</p>}

      <div className="grid gap-4 xl:grid-cols-5">
        {weekDays.map(day => (
          <Card key={day} className="min-h-80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-5 w-5" />
                {day}
              </CardTitle>
              <CardDescription>{grouped[day]?.length || 0} session{grouped[day]?.length === 1 ? '' : 's'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
              ) : grouped[day]?.length ? (
                grouped[day].map(event => (
                  <div key={event.id} className="rounded-lg border bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <Badge variant="secondary">{event.type.replace('_', ' ')}</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
                      {event.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{event.location}</div>}
                      {(event.subject || event.grade) && <div>{event.subject} {event.grade}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">No sessions scheduled.</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
