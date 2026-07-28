"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, User, MapPin, BookOpen, RefreshCw, GraduationCap, type LucideIcon } from "lucide-react"

interface Child { id: string; name: string }

interface ScheduleItem {
  id: string; title: string; subject?: string; type: string
  startTime: string; endTime: string; location?: string; teacherName?: string; day: string
}

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; icon: LucideIcon }> = {
  CLASS:        { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: BookOpen },
  EXAM:         { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: GraduationCap },
  MEETING:      { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: User },
  OFFICE_HOURS: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: Clock },
  EVENT:        { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Calendar },
}

export default function ParentSchedule() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedId, setSelectedId] = useState<string>("all")
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/parent/children")
      .then(r => r.json())
      .then(({ children: raw }) => {
        setChildren(raw.map((c: any) => ({ id: c.id, name: `${c.user.firstName} ${c.user.lastName}` })))
      })
      .catch(console.error)
  }, [])

  const loadSchedule = (childId: string) => {
    setLoading(true)
    const url = childId !== "all"
      ? `/api/parent/schedule?studentId=${childId}`
      : "/api/parent/schedule"
    fetch(url)
      .then(r => r.json())
      .then(({ schedules }) => {
        setSchedule((schedules || []).map((s: any) => ({
          id: s.id, title: s.title || s.subject || "Class", subject: s.subject,
          type: s.type || "CLASS",
          startTime: s.startTime, endTime: s.endTime, location: s.location,
          teacherName: s.teacher?.user ? `${s.teacher.user.firstName} ${s.teacher.user.lastName}` : undefined,
          day: new Date(s.startTime).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }),
        })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSchedule(selectedId) }, [selectedId])

  const grouped: Record<string, ScheduleItem[]> = {}
  schedule.forEach(item => {
    if (!grouped[item.day]) grouped[item.day] = []
    grouped[item.day].push(item)
  })

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  const typeColor = (type: string) => TYPE_STYLES[type] || TYPE_STYLES.CLASS

  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const sortedDays = Object.keys(grouped).sort((a, b) => DAY_ORDER.indexOf(a.split(",")[0]) - DAY_ORDER.indexOf(b.split(",")[0]))

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5">Upcoming classes and events for your children</p>
        </div>
        <div className="flex items-center gap-2">
          {children.length > 0 && (
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="all">All children</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button onClick={() => loadSchedule(selectedId)}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200">
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map(day => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="h-4 w-28 bg-slate-200 rounded" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-2/5 bg-slate-200 rounded" />
                        <div className="flex items-center gap-4">
                          <div className="h-3 w-20 bg-slate-200 rounded" />
                          <div className="h-3 w-24 bg-slate-200 rounded" />
                        </div>
                      </div>
                      <div className="h-5 w-16 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sortedDays.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-semibold">No upcoming classes</p>
          <p className="text-slate-400 text-sm mt-1">Schedule will appear once classes are set up by the school</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map(day => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{day}</h2>
              </div>
              <div className="space-y-2.5">
                {grouped[day].map(item => {
                  const style = typeColor(item.type)
                  return (
                    <div key={item.id} className="bg-white border border-slate-200/80 shadow-sm rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="font-semibold text-slate-800 text-sm">{item.title}</h3>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                              {item.type.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {fmtTime(item.startTime)} &ndash; {fmtTime(item.endTime)}
                            </span>
                            {item.teacherName && (
                              <span className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                {item.teacherName}
                              </span>
                            )}
                            {item.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.subject && (
                          <div className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
                            <BookOpen className="h-3.5 w-3.5" />
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
