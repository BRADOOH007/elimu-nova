"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Bell, AlertCircle, Info, CheckCircle, User, Calendar, Eye } from "lucide-react"

interface Alert {
  id: string; studentId: string; studentName: string; type: string
  title: string; message: string; severity: "critical" | "warning" | "info"
  subject?: string; detectedAt: string; isRead: boolean
}

export default function ParentAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all")

  useEffect(() => {
    fetch("/api/parent/alerts")
      .then(r => r.ok ? r.json() : { alerts: [] })
      .then(data => { setAlerts(data.alerts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sevConfig = (s: string) => {
    switch (s) {
      case "critical": return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-800", ring: "ring-red-500/20" }
      case "warning": return { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800", ring: "ring-amber-500/20" }
      default: return { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", ring: "" }
    }
  }

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.severity === filter)
  const critical = alerts.filter(a => a.severity === "critical").length
  const warning = alerts.filter(a => a.severity === "warning").length
  const info = alerts.filter(a => a.severity === "info").length

  const filterPills = [
    { key: "all" as const, label: "All", count: alerts.length },
    { key: "critical" as const, label: "Critical", count: critical },
    { key: "warning" as const, label: "Warning", count: warning },
    { key: "info" as const, label: "Info", count: info },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alerts &amp; Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stay informed about your children&apos;s progress</p>
        </div>
        {critical > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-700">{critical} critical</span>
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filterPills.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === f.key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            {f.label}
            <span className={`ml-1.5 text-[10px] ${filter === f.key ? "text-blue-200" : "text-slate-400"}`}>({f.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/80 bg-white">
              <div className="w-5 h-5 bg-slate-200 rounded-full shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-2/5 bg-slate-200 rounded" />
                  <div className="h-5 w-16 bg-slate-200 rounded-full" />
                </div>
                <div className="h-3 w-full bg-slate-200 rounded" />
                <div className="flex items-center gap-4">
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-slate-700 font-semibold text-lg">All clear!</p>
          <p className="text-slate-400 text-sm mt-1">No alerts found — everything looks good</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const cfg = sevConfig(alert.severity)
            const SevIcon = cfg.icon
            const isCritical = alert.severity === "critical"
            return (
              <div key={alert.id} className={`bg-white rounded-xl border ${cfg.border} shadow-sm hover:shadow-md transition-all ${
                isCritical ? "ring-1 ring-red-500/10" : ""
              }`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <SevIcon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-900 text-sm">{alert.title}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge} shrink-0`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{alert.studentName}</span>
                        {alert.subject && <span className="font-medium">{alert.subject}</span>}
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(alert.detectedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
