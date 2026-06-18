'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, User, MapPin, BookOpen, RefreshCw } from 'lucide-react'

interface Child { id: string; name: string }

interface ScheduleItem {
  id: string
  title: string
  subject?: string
  type: string
  startTime: string
  endTime: string
  location?: string
  teacherName?: string
  day: string
}

const TYPE_COLORS: Record<string, string> = {
  CLASS:        'bg-blue-100 text-blue-700 border-blue-200',
  EXAM:         'bg-red-100 text-red-700 border-red-200',
  MEETING:      'bg-purple-100 text-purple-700 border-purple-200',
  OFFICE_HOURS: 'bg-green-100 text-green-700 border-green-200',
  EVENT:        'bg-amber-100 text-amber-700 border-amber-200',
}

export default function ParentSchedule() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState<string>('all')
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(({ children: raw }) => {
        setChildren(raw.map((c: any) => ({ id: c.id, name: `${c.user.firstName} ${c.user.lastName}` })))
      })
      .catch(console.error)
  }, [])

  const loadSchedule = (childId: string) => {
    setLoading(true)
    const url = childId !== 'all'
      ? `/api/parent/schedule?studentId=${childId}`
      : '/api/parent/schedule'
    fetch(url)
      .then(r => r.json())
      .then(({ schedules }) => {
        setSchedule((schedules || []).map((s: any) => ({
          id:          s.id,
          title:       s.title || s.subject || 'Class',
          subject:     s.subject,
          type:        s.type || 'CLASS',
          startTime:   s.startTime,
          endTime:     s.endTime,
          location:    s.location,
          teacherName: s.teacher?.user
            ? `${s.teacher.user.firstName} ${s.teacher.user.lastName}`
            : undefined,
          day: new Date(s.startTime).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }),
        })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSchedule(selectedId) }, [selectedId])

  // Group by day
  const grouped: Record<string, ScheduleItem[]> = {}
  schedule.forEach(item => {
    if (!grouped[item.day]) grouped[item.day] = []
    grouped[item.day].push(item)
  })

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500 text-sm mt-0.5">Upcoming classes and events for your children</p>
        </div>
        <div className="flex items-center gap-2">
          {children.length > 0 && (
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All children</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button onClick={() => loadSchedule(selectedId)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No upcoming classes</p>
          <p className="text-slate-400 text-sm mt-1">Schedule will appear once classes are set up by the school</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{day}</h2>
              </div>
              <div className="space-y-2">
                {items.map(item => {
                  const typeColor = TYPE_COLORS[item.type] || TYPE_COLORS.CLASS
                  return (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-slate-800 text-sm">{item.title}</h3>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>
                              {item.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {fmtTime(item.startTime)} – {fmtTime(item.endTime)}
                            </span>
                            {item.teacherName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.teacherName}
                              </span>
                            )}
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.subject && (
                          <div className="shrink-0 flex items-center gap-1 text-xs text-slate-400">
                            <BookOpen className="h-3 w-3" />
                            {item.subject}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
