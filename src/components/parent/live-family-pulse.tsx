"use client"

import { useState, useEffect } from "react"
import { Users, ClipboardList, Bell, Calendar, type LucideIcon } from "lucide-react"

interface ChildInfo { id: string; name: string; pendingWork: number }
interface PulseData { childrenCount: number; pendingWork: number; recentAlerts: number; upcomingEvents: number; children: ChildInfo[] }

const pulseItems: { icon: LucideIcon; label: string; key: keyof PulseData; gradient: string }[] = [
  { icon: Users,         label: "Children",       key: "childrenCount", gradient: "from-blue-500 to-cyan-500" },
  { icon: ClipboardList, label: "Pending Work",    key: "pendingWork",   gradient: "from-amber-500 to-orange-500" },
  { icon: Bell,          label: "Active Alerts",   key: "recentAlerts",  gradient: "from-rose-500 to-pink-500" },
  { icon: Calendar,      label: "Upcoming Events", key: "upcomingEvents",gradient: "from-emerald-500 to-teal-500" },
]

export default function LiveFamilyPulse() {
  const [data, setData] = useState<PulseData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parent/live-metrics")
        if (res.ok) setData(await res.json())
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 border border-slate-200/80 animate-pulse">
          <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
          <div className="h-7 w-10 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  )

  if (!data) return null

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pulseItems.map(item => {
          const val = String(data[item.key] ?? 0)
          return (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{val}</p>
            </div>
          )
        })}
      </div>
      {data.children?.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.children.map(c => (
            <span key={c.id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {c.name}: {c.pendingWork} pending
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
