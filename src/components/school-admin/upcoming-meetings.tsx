"use client"

import { Calendar, Clock, MapPin, Video, ExternalLink, Eye, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Meeting {
  id: string; title: string; description?: string; date: string; time: string
  duration: number; location?: string; meetingType?: string; videoLink?: string; creator: string
}

interface UpcomingMeetingsProps { meetings: Meeting[] }

export default function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  return (
    <Card className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Upcoming Meetings
          </CardTitle>
          <CardDescription>Scheduled meetings and events</CardDescription>
        </div>
        <Link href="/school-admin/calendar">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View All <Eye className="w-3.5 h-3.5" />
          </span>
        </Link>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No upcoming meetings</p>
              <p className="text-xs text-slate-400 mt-0.5">Schedule a meeting to see it here</p>
              <Button variant="outline" size="sm" className="mt-3 text-xs gap-1.5" asChild>
                <Link href="/school-admin/meetings"><Plus className="w-3.5 h-3.5" />Schedule Meeting</Link>
              </Button>
            </div>
        ) : (
          <ul className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {meetings.slice(0, 5).map((m) => {
              const isVirtual = m.meetingType === 'VIRTUAL' || !!m.videoLink
              return (
                <li key={m.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isVirtual ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                    {isVirtual ? <Video className="w-5 h-5 text-indigo-600" /> : <Calendar className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{m.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.date).toLocaleDateString()} {m.time}</span>
                      {m.location && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{m.location}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">by {m.creator}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ${isVirtual ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isVirtual ? 'Online' : `${m.duration}min`}
                    </span>
                    {isVirtual && m.videoLink && (
                      <a href={m.videoLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Join Call
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
