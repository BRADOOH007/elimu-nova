'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { confirmToast } from '@/lib/confirm-toast'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  Phone,
  Mail,
  Ban,
} from 'lucide-react'

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
  subject: string
}

interface Meeting {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: number
  location?: string
  status: string
  creator: { firstName: string; lastName: string; email: string }
  createdAt: string
}

const DURATIONS = [15, 30, 45, 60, 90]

export default function ParentMeetingsPage() {
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequest, setShowRequest] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    teacherId: '',
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 30,
    location: '',
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const load = async () => {
      try {
        const [teachersRes, meetingsRes] = await Promise.all([
          fetch('/api/parent/teachers'),
          fetch(`/api/parent/meetings?includePast=true&page=${page}&limit=10`),
        ])
        if (teachersRes.ok) {
          const d = await teachersRes.json()
          setTeachers(d.teachers || [])
        }
        if (meetingsRes.ok) {
          const d = await meetingsRes.json()
          setMeetings(d.meetings || [])
          setTotalPages(d.pagination?.totalPages || 1)
        }
      } catch (e) { console.warn('[ParentMeetings] fetch meetings error:', e) } finally {
        setLoading(false)
      }
    }
    load()
  }, [page])

  const requestMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/parent/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowRequest(false)
        setForm({ teacherId: '', title: '', description: '', date: '', time: '', duration: 30, location: '' })
        setPage(1)
      } else {
        const err = await res.json()
        toast({ variant: 'destructive', title: 'Request failed', description: err.error || 'Unknown error' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to request meeting' })
    } finally {
      setSaving(false)
    }
  }

  const cancelMeeting = async (id: string) => {
    if (!(await confirmToast({ title: 'Cancel this meeting request?' }))) return
    try {
      await fetch(`/api/parent/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: 'CANCELLED' } : m))
    } catch (e) { console.warn('[ParentMeetings] cancelMeeting error:', e) }
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const fmtTime = (t: string) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700'
      case 'COMPLETED': return 'bg-green-100 text-green-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      case 'POSTPONED': return 'bg-orange-100 text-orange-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded-lg" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-56 bg-slate-200 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-slate-50">
              <div className="w-10 h-10 bg-slate-200 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-2/5 bg-slate-200 rounded" />
                  <div className="h-5 w-20 bg-slate-200 rounded-full" />
                </div>
                <div className="h-3 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="edugenius-text-gradient">Teacher Meetings</span>
          </h1>
          <p className="text-gray-600">Schedule and manage meetings with your child's teachers.</p>
        </div>
        <Button onClick={() => setShowRequest(true)} className="edugenius-button">
          <Plus className="w-4 h-4 mr-2" /> Request Meeting
        </Button>
      </div>

      {/* Meeting Request Form */}
      {showRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request a Meeting</CardTitle>
            <CardDescription>Fill in the details to request a meeting with a teacher.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={requestMeeting} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teacher *</Label>
                  <Select value={form.teacherId} onValueChange={v => setForm(f => ({ ...f, teacherId: v }))} required>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.subject})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Discuss progress" />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={`${form.duration}`} onValueChange={v => setForm(f => ({ ...f, duration: parseInt(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => <SelectItem key={d} value={`${d}`}>{d} minutes</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Room / Zoom link" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What would you like to discuss?" rows={3} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowRequest(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                  {saving ? 'Submitting...' : 'Request Meeting'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Meetings</CardTitle>
          <CardDescription>{meetings.length} meeting{meetings.length !== 1 ? 's' : ''} total</CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No meetings yet</p>
              <p className="text-sm mt-1">Request a meeting with your child's teacher above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map(m => (
                <div key={m.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">{m.title}</h4>
                        {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                      </div>
                      <Badge className={statusColor(m.status)}>{m.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(m.date)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtTime(m.time)} ({m.duration} min)</span>
                      {m.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {m.location}</span>}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {m.creator?.firstName} {m.creator?.lastName}
                      </span>
                    </div>
                  </div>
                  {m.status === 'SCHEDULED' && (
                    <Button variant="ghost" size="sm" onClick={() => cancelMeeting(m.id)} className="text-red-500 hover:text-red-700 shrink-0">
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
