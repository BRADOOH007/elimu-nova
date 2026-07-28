"use client"

import { useState, useEffect } from "react"
import { Calendar, MessageSquare, Users, TrendingUp, type LucideIcon } from "lucide-react"

interface Meeting { id: string; title: string; date: string; status: string }
interface Message { id: string; subject: string; createdAt: string; recipientType: string }
interface EngagementStats { meetingsAttended: number; messagesSent: number; childrenCount: number }
interface EngagementData { stats: EngagementStats; recentMeetings: Meeting[]; recentMessages: Message[]; children: { id: string; name: string }[] }

export default function EngagementSummary() {
  const [data, setData] = useState<EngagementData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parent/engagement")
        if (res.ok) setData(await res.json())
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 animate-pulse">
      <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-100">
            <div className="h-6 w-10 bg-slate-200 rounded mx-auto mb-1" />
            <div className="h-3 w-14 bg-slate-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )

  if (!data) return null

  const statItems: { icon: LucideIcon; label: string; value: number; gradient: string }[] = [
    { icon: Calendar,      label: "Meetings", value: data.stats.meetingsAttended, gradient: "from-blue-500 to-cyan-500" },
    { icon: MessageSquare, label: "Messages", value: data.stats.messagesSent,     gradient: "from-violet-500 to-purple-600" },
    { icon: Users,         label: "Children", value: data.stats.childrenCount,     gradient: "from-emerald-500 to-teal-600" },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">30-Day Engagement</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {statItems.map(item => (
          <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-1.5`}>
              <item.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-lg font-bold text-slate-800">{item.value}</p>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      {data.recentMeetings?.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Meetings</p>
          <div className="space-y-1">
            {data.recentMeetings.map(m => (
              <div key={m.id} className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700 truncate mr-2">{m.title}</span>
                <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  m.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentMessages?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Messages</p>
          <div className="space-y-1">
            {data.recentMessages.map(m => (
              <div key={m.id} className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700 truncate mr-2">{m.subject}</span>
                <span className="text-slate-400 shrink-0">{new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
