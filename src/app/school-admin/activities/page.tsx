"use client"

import { useState, useEffect, useMemo } from 'react'
import {
  Bell, Search, RefreshCw, Zap, Users, Video, AlertTriangle,
  GraduationCap, FileText, ClipboardEdit, MessageCircle, Award,
  BarChart3, BookOpen, Calendar, Settings, UserPlus, Clock, Trash2,
} from 'lucide-react'

interface Activity {
  id: string; type: string; action: string; description: string; metadata: any
  user: { name: string; email: string; role: string } | null; createdAt: string
}

const CATEGORIES = [
  { value: 'all', label: 'All Events' },
  { value: 'LIVE_CLASS', label: 'Live Classes' },
  { value: 'LESSON_PLAN', label: 'Lesson Planning' },
  { value: 'GRADING', label: 'Grading & Assessment' },
  { value: 'STUDENT_INTERACTION', label: 'Student Interactions' },
  { value: 'REPORT', label: 'Reports' },
  { value: 'SYSTEM', label: 'System' },
]

const ROLE_FILTERS = [
  { value: 'all', label: 'All Roles' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'SCHOOL_ADMIN', label: 'System' },
]

const TYPE_BADGES: Record<string, { icon: any; label: string; color: string; bg: string; text: string }> = {
  LIVE_CLASS:           { icon: Video,           label: 'Live',         color: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  LESSON_PLAN:          { icon: BookOpen,        label: 'Planning',     color: 'bg-indigo-500',  bg: 'bg-indigo-50',   text: 'text-indigo-700' },
  GRADING:              { icon: Award,           label: 'Grading',      color: 'bg-amber-500',   bg: 'bg-amber-50',    text: 'text-amber-700' },
  STUDENT_INTERACTION:  { icon: MessageCircle,   label: 'Interaction',  color: 'bg-sky-500',     bg: 'bg-sky-50',      text: 'text-sky-700' },
  REPORT:               { icon: FileText,        label: 'Reports',      color: 'bg-violet-500',  bg: 'bg-violet-50',   text: 'text-violet-700' },
  SYSTEM:               { icon: Settings,        label: 'System',       color: 'bg-slate-500',   bg: 'bg-slate-50',    text: 'text-slate-700' },
  TEACHER_ENROLLED:     { icon: UserPlus,        label: 'Enrolment',    color: 'bg-blue-500',    bg: 'bg-blue-50',     text: 'text-blue-700' },
  STUDENT_ENROLLED:     { icon: Users,           label: 'Enrolment',    color: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  CLASS_CREATED:        { icon: BookOpen,        label: 'Class',        color: 'bg-purple-500',  bg: 'bg-purple-50',   text: 'text-purple-700' },
  MEETING_SCHEDULED:    { icon: Calendar,        label: 'Meeting',      color: 'bg-orange-500',  bg: 'bg-orange-50',   text: 'text-orange-700' },
  REPORT_GENERATED:     { icon: FileText,        label: 'Reports',      color: 'bg-violet-500',  bg: 'bg-violet-50',   text: 'text-violet-700' },
  ASSESSMENT_PUBLISHED: { icon: ClipboardEdit,   label: 'Assessment',   color: 'bg-rose-500',    bg: 'bg-rose-50',     text: 'text-rose-700' },
  CURRICULUM_GENERATED: { icon: BarChart3,       label: 'Curriculum',   color: 'bg-teal-500',    bg: 'bg-teal-50',     text: 'text-teal-700' },
}

function getBadge(type: string) {
  return TYPE_BADGES[type] || { icon: Bell, label: 'Event', color: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-700' }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString); if (isNaN(date.getTime())) return ''
  const now = new Date(); const secs = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (secs < 60) return 'Just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`
  return date.toLocaleDateString()
}

function getInitials(name: string) {
  return name.split(' ').map(s => s[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [cleanupDone, setCleanupDone] = useState(false)

  useEffect(() => { fetchData(); triggerCleanup() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/school-admin/activities?limit=100')
      if (res.ok) { const d = await res.json(); setActivities(d.activities || []) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const triggerCleanup = async () => {
    try {
      await fetch('/api/school-admin/activities/cleanup')
      setCleanupDone(true)
    } catch {}
  }

  const filtered = useMemo(() => {
    let list = activities
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.description.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.user?.name?.toLowerCase().includes(q)
      )
    }
    if (category !== 'all') list = list.filter(a => a.type === category)
    if (roleFilter !== 'all') list = list.filter(a => a.user?.role === roleFilter)
    return list
  }, [activities, search, category, roleFilter])

  // KPI stats
  const last24h = Date.now() - 86400000
  const total24h = activities.filter(a => new Date(a.createdAt).getTime() > last24h).length
  const activeLive = activities.filter(a => a.type === 'LIVE_CLASS' && new Date(a.createdAt).getTime() > last24h).length
  const teacherActions = activities.filter(a => a.user?.role === 'TEACHER' && new Date(a.createdAt).getTime() > last24h).length
  const pendingFlags = 0 // placeholder for future AI moderation

  const kpis = [
    { icon: Zap, label: 'Total Events (24h)', value: total24h, color: 'text-indigo-600 bg-indigo-50' },
    { icon: Users, label: 'Teacher Actions', value: teacherActions, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Video, label: 'Live Classes', value: activeLive, color: 'text-sky-600 bg-sky-50', pulse: activeLive > 0 },
    { icon: AlertTriangle, label: 'Pending Flags', value: pendingFlags, color: 'text-amber-600 bg-amber-50' },
  ]

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="flex gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-9 w-20 bg-slate-200 rounded-lg" />)}</div>
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live School Activity Audit</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time telemetry and event tracking across your school</p>
        </div>
        <div className="flex items-center gap-2">
          {cleanupDone && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100">
              <RefreshCw className="w-3 h-3" /> Logs auto-purged every 72 hours
            </span>
          )}
          <button onClick={fetchData} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition inline-flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${kpi.color} relative`}>
              <kpi.icon className="w-5 h-5" />
              {kpi.pulse && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white" />}
            </div>
            <div>
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by name, action, or description..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
          {ROLE_FILTERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              category === cat.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No activities found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {search || roleFilter !== 'all' || category !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Activities will appear here as your school operates'}
            </p>
          </div>
        ) : (
          filtered.map(activity => {
            const badge = getBadge(activity.type)
            const Icon = badge.icon
            const isLive = activity.type === 'LIVE_CLASS'
            const isRecent = new Date(activity.createdAt).getTime() > Date.now() - 300000 // last 5 min
            return (
              <div key={activity.id}
                className={`bg-white border border-slate-100 shadow-sm rounded-xl p-4 hover:border-slate-200 transition flex items-start gap-4 ${isRecent ? 'ring-1 ring-emerald-200' : ''}`}>
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${badge.bg} ${badge.text}`}>
                    {activity.user ? getInitials(activity.user.name) : <Settings className="w-4 h-4" />}
                  </div>
                  {isLive && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-snug">
                    <span className="font-semibold">{activity.user?.name || 'System'}</span>
                    {' '}{activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatTimeAgo(activity.createdAt)}
                    </span>
                    {activity.user && (
                      <span className="text-xs text-slate-400">· {activity.user.role === 'TEACHER' ? 'Teacher' : activity.user.role === 'SCHOOL_ADMIN' ? 'Admin' : 'Student'}</span>
                    )}
                  </div>
                </div>

                {/* Badge */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 align-middle" />}
                    {badge.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
