'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const ScheduleTab  = dynamic(() => import('@/app/teacher/schedule/page'),  { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })
const TimetableTab = dynamic(() => import('@/app/teacher/timetable/page'), { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })
const MeetingsTab  = dynamic(() => import('@/app/teacher/meetings/page'),  { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

interface ScheduleEvent {
  id: string; title: string; subject: string; startTime: string; endTime: string; type: string
}

function CalendarView() {
  const today = new Date()
  const [year, setYear]     = useState(today.getFullYear())
  const [month, setMonth]   = useState(today.getMonth())
  const [events, setEvents] = useState<Record<string, ScheduleEvent[]>>({})
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/teacher/schedules')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, ScheduleEvent[]> = {}
        ;(d.schedules || []).forEach((s: any) => {
          const key = new Date(s.startTime).toDateString()
          if (!map[key]) map[key] = []
          map[key].push(s)
        })
        setEvents(map)
      }).catch(() => {})
  }, [])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()
  const cells       = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const getTerm = (m: number) => {
    if (m <= 2)  return { name: 'Term 1', color: 'text-blue-600'   }
    if (m <= 6)  return { name: 'Term 2', color: 'text-green-600'  }
    if (m <= 10) return { name: 'Term 3', color: 'text-purple-600' }
    return { name: 'Holiday', color: 'text-slate-400' }
  }

  const termInfo       = getTerm(month)
  const selectedEvents = selected ? (events[selected] || []) : []

  const typeColor = (type: string) => {
    if (type === 'CLASS') return 'bg-blue-100 text-blue-700'
    if (type === 'EXAM')  return 'bg-red-100 text-red-700'
    if (type === 'EVENT') return 'bg-green-100 text-green-700'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-5 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Teaching Calendar</h2>
          <p className={`text-sm font-medium ${termInfo.color}`}>{termInfo.name} · {year}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Calendar grid */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <h3 className="font-bold text-slate-800">{MONTHS[month]} {year}</h3>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wide">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dateStr  = day ? new Date(year, month, day).toDateString() : ''
              const isToday  = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const hasEvts  = !!(dateStr && events[dateStr]?.length > 0)
              const isSel    = dateStr === selected
              const isWknd   = (i % 7 === 0 || i % 7 === 6)
              return (
                <button key={i} onClick={() => day && setSelected(isSel ? null : dateStr)}
                  className={`min-h-[60px] p-2 border-b border-r border-slate-100 text-left transition-all ${
                    !day ? 'bg-slate-50' : isSel ? 'bg-blue-50' : isWknd ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-slate-50'
                  }`}>
                  {day && (
                    <>
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' :
                        isSel   ? 'text-blue-700' : isWknd ? 'text-slate-400' : 'text-slate-700'
                      }`}>{day}</span>
                      {hasEvts && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {events[dateStr].slice(0, 3).map((e, j) => (
                            <span key={j} className={`text-[9px] px-1 rounded-sm font-medium truncate max-w-full ${typeColor(e.type)}`}>
                              {e.title?.substring(0, 10)}
                            </span>
                          ))}
                          {events[dateStr].length > 3 && <span className="text-[9px] text-slate-400">+{events[dateStr].length - 3}</span>}
                        </div>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Event detail panel */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="font-semibold text-slate-800 text-sm mb-3">
              {selected ? new Date(selected).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Select a date'}
            </p>
            {selected && selectedEvents.length === 0 && <p className="text-slate-400 text-sm">No events on this day</p>}
            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.type === 'CLASS' ? 'bg-blue-500' : ev.type === 'EXAM' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{ev.title}</p>
                    <p className="text-xs text-slate-400">{ev.subject} · {new Date(ev.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
            <p className="font-semibold text-slate-800 text-sm mb-3">Term Overview</p>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between"><span>Current term</span><span className={`font-bold ${termInfo.color}`}>{termInfo.name}</span></div>
              <div className="flex justify-between"><span>Total events</span><span className="font-bold">{Object.values(events).flat().length}</span></div>
              <div className="flex justify-between"><span>Classes</span><span className="font-bold">{Object.values(events).flat().filter(e => e.type === 'CLASS').length}</span></div>
              <div className="flex justify-between"><span>Exams</span><span className="font-bold text-red-600">{Object.values(events).flat().filter(e => e.type === 'EXAM').length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeacherCalendarPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Calendar</h1>
      <Tabs defaultValue="calendar">
        <TabsList className="w-full overflow-x-auto flex gap-2 bg-slate-100/80 p-1.5 rounded-xl h-12 border-0 mb-4">
          <TabsTrigger value="calendar" className="shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg bg-white/60 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Calendar className="w-4 h-4 mr-2" />Calendar</TabsTrigger>
          <TabsTrigger value="schedule" className="shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg bg-white/60 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Clock className="w-4 h-4 mr-2" />Schedule</TabsTrigger>
          <TabsTrigger value="timetable" className="shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg bg-white/60 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Calendar className="w-4 h-4 mr-2" />Timetable</TabsTrigger>
          <TabsTrigger value="meetings" className="shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg bg-white/60 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Users className="w-4 h-4 mr-2" />Meetings</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar"><CalendarView /></TabsContent>
        <TabsContent value="schedule"><ScheduleTab /></TabsContent>
        <TabsContent value="timetable"><TimetableTab /></TabsContent>
        <TabsContent value="meetings"><MeetingsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
