'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar, Search, Plus, Trash2, Clock, MapPin, User, Video, Users, Crown, CheckCircle, Copy, ExternalLink, Loader2, RefreshCw, Sparkles, Filter, ArrowRight, Phone
} from "lucide-react"
import { ScheduleMeetingModal } from "@/components/modals/schedule-meeting-modal"
import { useRouter } from 'next/navigation'
import { confirmToast } from '@/lib/confirm-toast'
import { useToast } from "@/hooks/use-toast"

interface Meeting {
  id: string; title: string; description?: string; date: string; time: string
  duration: number; location?: string; status: string; meetingType?: string; videoLink?: string
  createdBy: { name: string; email: string }; createdAt: string
}

const TABS = [
  { id: 'all', label: 'All Meetings' },
  { id: 'SCHEDULED', label: 'Upcoming' },
  { id: 'LIVE', label: 'In Progress' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2"><div className="h-4 w-48 bg-slate-200 rounded" /><div className="h-3 w-32 bg-slate-200 rounded" /></div>
        <div className="h-5 w-16 bg-slate-200 rounded-full" />
      </div>
      <div className="h-3 w-40 bg-slate-200 rounded" />
      <div className="flex items-center justify-between pt-2"><div className="h-8 w-24 bg-slate-200 rounded-lg" /><div className="flex gap-2"><div className="h-8 w-8 bg-slate-200 rounded-lg" /><div className="h-8 w-8 bg-slate-200 rounded-lg" /></div></div>
    </div>
  )
}

export default function MeetingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tab, setTab] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Meeting | null>(null)

  useEffect(() => { fetchMeetings() }, [])

  const fetchMeetings = async () => {
    setLoading(true)
    try { const r = await fetch('/api/school-admin/meetings?limit=50'); if (r.ok) setMeetings((await r.json()).meetings || []) } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!(await confirmToast({ title: 'Delete this meeting?' }))) return
    try { await fetch(`/api/school-admin/meetings/${id}`, { method: 'DELETE' }); setMeetings(prev => prev.filter(m => m.id !== id)); toast({ title: 'Deleted' }) }
    catch { toast({ title: 'Error', variant: 'destructive' }) }
  }

  const copyInviteLink = (m: Meeting) => {
    const link = m.videoLink || `${window.location.origin}/meetings/${m.id}`
    navigator.clipboard.writeText(link); toast({ title: 'Copied', description: 'Invite link copied' })
  }

  const filtered = meetings.filter(m => {
    const q = search.toLowerCase()
    if (q && !m.title.toLowerCase().includes(q) && !m.description?.toLowerCase().includes(q)) return false
    if (tab !== 'all' && m.status !== tab) return false
    if (statusFilter !== 'all' && m.status !== statusFilter) return false
    return true
  })

  const thisWeek = filtered.filter(m => {
    const d = new Date(m.date); const now = new Date()
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    const end = new Date(start); end.setDate(start.getDate() + 7)
    return d >= start && d < end
  })
  const virtualCount = filtered.filter(m => m.meetingType === 'VIRTUAL' || m.videoLink).length
  const ptaCount = filtered.filter(m => m.title?.toLowerCase().includes('pta') || m.title?.toLowerCase().includes('parent')).length

  const getStatusBadge = (s: string) => {
    switch(s) { case 'SCHEDULED': return <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Upcoming</span>; case 'LIVE': return <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">Live</span>; case 'COMPLETED': return <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Ended</span>; case 'CANCELLED': return <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">Cancelled</span>; default: return <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span> }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meetings Management</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule, manage, and host virtual and in-person meetings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMeetings} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-indigo-600" /></div><div><p className="text-xs text-slate-500">Upcoming This Week</p><p className="text-xl font-bold text-slate-900">{thisWeek.length}</p></div></div></CardContent></Card>
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">PTA Conferences</p><p className="text-xl font-bold text-slate-900">{ptaCount}</p></div></div></CardContent></Card>
        <Card className="border-slate-100 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><Video className="w-5 h-5 text-violet-600" /></div><div><p className="text-xs text-slate-500">Virtual Rooms</p><p className="text-xl font-bold text-slate-900">{virtualCount}<span className="text-sm font-normal text-slate-400"> active</span></p></div></div></CardContent></Card>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${tab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search meetings..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-60 rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
            <option value="all">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">In Progress</option>
            <option value="COMPLETED">Ended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Meeting Cards or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-slate-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
          <CardContent className="py-16 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No meetings found</h3>
            <p className="text-sm text-slate-500 mb-6">Get started by scheduling your first meeting</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => { setEditing(null); setModalOpen(true) }} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition flex items-center gap-2"><Plus className="w-4 h-4" /> Schedule Staff Briefing</button>
              <button onClick={() => { setEditing(null); setModalOpen(true) }} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition flex items-center gap-2"><Users className="w-4 h-4" /> Schedule PTA Session</button>
              <button onClick={() => { setEditing(null); setModalOpen(true) }} className="rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition flex items-center gap-2"><Video className="w-4 h-4" /> Create Instant Jitsi Room</button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(m => {
            const isLive = m.status === 'LIVE'
            const isVirtual = m.meetingType === 'VIRTUAL' || !!m.videoLink
            return (
              <div key={m.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition hover:shadow-md ${isLive ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-100'}`}>
                <div className={`h-1 ${isLive ? 'bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse' : isVirtual ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{m.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })} · {m.time}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.duration} min</span>
                        {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                      </div>
                    </div>
                    {getStatusBadge(m.status)}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User className="w-3 h-3" />by {m.createdBy?.name || 'Unknown'}
                      {isVirtual && <span className="flex items-center gap-1 text-violet-600"><Video className="w-3 h-3" />Virtual</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isVirtual && m.videoLink && (
                        <a href={m.videoLink} target="_blank" rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${isLive ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
                          <Video className="w-3 h-3" /> Join
                        </a>
                      )}
                      {isVirtual && (
                        <button onClick={() => copyInviteLink(m)} className="px-2 py-1.5 rounded-lg text-[11px] text-slate-500 hover:bg-slate-100 transition" title="Copy link"><Copy className="w-3 h-3" /></button>
                      )}
                      <button onClick={() => { setEditing(m); setModalOpen(true) }} className="px-2 py-1.5 rounded-lg text-[11px] text-slate-500 hover:bg-slate-100 transition" title="Edit"><ExternalLink className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(m.id)} className="px-2 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && <ScheduleMeetingModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSuccess={fetchMeetings} meeting={editing} />}
    </div>
  )
}
