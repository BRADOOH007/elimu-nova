'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users, ClipboardList, CheckCircle, TrendingUp, AlertTriangle,
  AlertCircle, Info, BookOpen, Calendar, Brain, ArrowRight, Bell
} from 'lucide-react'
import Link from 'next/link'

interface Child {
  id: string
  name: string
  grade: string
  school: string
  averageGrade: number | null
  pendingAssignments: number
  completedAssignments: number
  streakDays: number
}

interface Alert {
  id: string
  studentName: string
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  type: string
  subject?: string
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch children
        const res = await fetch('/api/parent/children')
        if (res.ok) {
          const { children: raw } = await res.json()
          setChildren(raw.map((c: any) => ({
            id: c.id,
            name: `${c.user.firstName} ${c.user.lastName}`,
            grade: c.class?.grade || 'N/A',
            school: c.school?.name || 'ElimuNova',
            averageGrade: c.analytics?.averageGrade ?? null,
            pendingAssignments: c.analytics?.pendingAssignments ?? 0,
            completedAssignments: c.analytics?.completedAssignments ?? 0,
            streakDays: c.analytics?.streakDays ?? 0,
          })))
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }

      // Fetch alerts
      try {
        const ar = await fetch('/api/parent/alerts')
        if (ar.ok) {
          const { alerts: raw } = await ar.json()
          setAlerts(raw || [])
        }
      } catch (e) { console.error(e) }
      finally { setAlertsLoading(false) }
    }
    fetchData()
  }, [])

  const totalChildren = children.length
  const totalPending = children.reduce((s, c) => s + c.pendingAssignments, 0)
  const avgGrade = children.length
    ? Math.round(children.reduce((s, c) => s + (c.averageGrade ?? 0), 0) / children.length)
    : null
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length

  const severityIcon = (s: string) => {
    if (s === 'critical') return <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
    if (s === 'warning')  return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
    return <Info className="h-4 w-4 text-blue-400 shrink-0" />
  }

  const severityBorder = (s: string) => {
    if (s === 'critical') return 'border-red-500/30 bg-red-500/5'
    if (s === 'warning')  return 'border-amber-500/30 bg-amber-500/5'
    return 'border-blue-500/30 bg-blue-500/5'
  }

  const gradeColor = (g: number | null) => {
    if (g === null) return 'text-slate-400'
    if (g >= 75) return 'text-green-400'
    if (g >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parent Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Parent'}
          </p>
        </div>
        <Link href="/parent/messages">
          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell className="h-5 w-5 text-slate-600" />
            {(criticalAlerts + warningAlerts) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {criticalAlerts + warningAlerts}
              </span>
            )}
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Children', value: totalChildren, icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50'  },
          { label: 'Pending Work', value: totalPending, icon: ClipboardList,  color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Avg Grade',    value: avgGrade !== null ? `${avgGrade}%` : '—', icon: TrendingUp, color: gradeColor(avgGrade), bg: 'bg-green-50' },
          { label: 'AI Alerts',    value: criticalAlerts + warningAlerts, icon: AlertTriangle, color: criticalAlerts > 0 ? 'text-red-600' : 'text-amber-600', bg: criticalAlerts > 0 ? 'bg-red-50' : 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Children overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">My Children</h2>
            <Link href="/parent/children" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No children linked yet</p>
              <Link href="/parent/children">
                <button className="mt-3 text-xs text-blue-600 hover:underline">Add a child →</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map(child => (
                <div key={child.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {child.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{child.name}</p>
                      <p className="text-xs text-slate-500">{child.grade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${gradeColor(child.averageGrade)}`}>
                      {child.averageGrade !== null ? `${Math.round(child.averageGrade)}%` : '—'}
                    </p>
                    <p className="text-xs text-slate-400">avg grade</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Early Warning Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <h2 className="font-semibold text-slate-800">AI Early Warnings</h2>
            </div>
            {criticalAlerts > 0 && (
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                {criticalAlerts} critical
              </span>
            )}
          </div>
          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" />
              <p className="text-slate-600 text-sm font-medium">All clear!</p>
              <p className="text-slate-400 text-xs mt-1">No concerns detected by AI at this time</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`flex gap-3 p-3 rounded-xl border ${severityBorder(alert.severity)}`}>
                  {severityIcon(alert.severity)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-tight">{alert.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
              {alerts.length > 5 && (
                <Link href="/parent/progress">
                  <p className="text-xs text-center text-blue-600 hover:underline pt-1">
                    View all {alerts.length} alerts →
                  </p>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/parent/progress',    icon: TrendingUp,   label: 'Progress',    color: 'text-green-600',  bg: 'bg-green-50'  },
          { href: '/parent/assignments', icon: ClipboardList, label: 'Assignments', color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { href: '/parent/schedule',    icon: Calendar,     label: 'Schedule',    color: 'text-purple-600', bg: 'bg-purple-50' },
          { href: '/parent/messages',    icon: BookOpen,     label: 'Messages',    color: 'text-amber-600',  bg: 'bg-amber-50'  },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer text-center">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-2`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <p className="text-sm font-medium text-slate-700">{item.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
