"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { X, Video, Calendar, ExternalLink } from 'lucide-react'

interface ActiveMeeting {
  id: string
  title: string
  description?: string
  meetingType: string
  videoLink?: string
  date: string
  time: string
  duration: number
  status: string
}

export default function ActiveMeetingBanner() {
  const { data: session } = useSession()
  const [meetings, setMeetings] = useState<ActiveMeeting[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const fetchActiveMeetings = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch('/api/meetings/active')
      if (res.ok) {
        const data = await res.json()
        setMeetings(data.meetings || [])
      }
    } catch {}
  }, [session])

  useEffect(() => {
    fetchActiveMeetings()
    const interval = setInterval(fetchActiveMeetings, 30000)
    return () => clearInterval(interval)
  }, [fetchActiveMeetings])

  const activeMeetings = meetings.filter(m => !dismissed.has(m.id))
  if (activeMeetings.length === 0) return null

  return (
    <div className="space-y-1.5 px-4 pt-2">
      {activeMeetings.map(m => {
        const startTime = new Date(`${m.date}T${m.time}`)
        const minsUntil = Math.round((startTime.getTime() - Date.now()) / 60000)
        const isLive = minsUntil <= 0
        const isStarting = minsUntil > 0 && minsUntil <= 15

        return (
          <div key={m.id}
            className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm transition-all ${
              isLive
                ? 'bg-emerald-50 border-emerald-200 animate-pulse'
                : isStarting
                ? 'bg-amber-50 border-amber-200'
                : 'bg-indigo-50 border-indigo-200'
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isLive ? 'bg-emerald-500 text-white' : isStarting ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white'
            }`}>
              {m.meetingType === 'VIRTUAL' ? <Video className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {isLive && <span className="inline-flex items-center gap-1 mr-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> LIVE</span>}
                {m.title}
              </p>
              <p className="text-xs text-slate-500">
                {isLive
                  ? 'Meeting is live now'
                  : isStarting
                  ? `Starts in ${minsUntil} min · ${m.time}`
                  : `${m.date} · ${m.time} (${m.duration} min)`}
                {m.meetingType === 'IN_PERSON' && m.description && ` · ${m.description}`}
              </p>
            </div>
            {m.meetingType === 'VIRTUAL' && m.videoLink && (isLive || isStarting) && (
              <a href={m.videoLink} target="_blank" rel="noopener noreferrer"
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isLive
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}>
                <ExternalLink className="w-3.5 h-3.5" /> Join Now
              </a>
            )}
            <button onClick={() => setDismissed(prev => new Set(prev).add(m.id))}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
