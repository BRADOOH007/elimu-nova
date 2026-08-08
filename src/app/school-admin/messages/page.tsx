'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminFormField, adminInputClass } from '@/components/ui/admin-modal'
import { MessageSquare, Send, Megaphone, Users, GraduationCap, School, UserRound, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Message {
  id: string; title: string; message: string; type: string; targetRole: string; createdAt: string; sender: string
}

const TARGET_OPTIONS = [
  { value: 'ALL', label: 'All Staff, Students & Parents', icon: School },
  { value: 'TEACHERS', label: 'All Teachers', icon: Users },
  { value: 'STUDENTS', label: 'All Students', icon: GraduationCap },
  { value: 'PARENTS', label: 'All Parents', icon: UserRound },
]

const GRADE_OPTIONS = ['', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'ALL', targetGrade: '', priority: 'INFO' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/school-admin/broadcast').then(r => r.json()).then(d => { setMessages(d.messages || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.message) { setError('Title and message are required'); return }
    setSending(true); setError('')
    try {
      const res = await fetch('/api/school-admin/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const d = await res.json()
        setSent(true); setForm({ title: '', message: '', targetRole: 'ALL', targetGrade: '', priority: 'INFO' })
        setMessages(prev => [{ id: Date.now().toString(), title: form.title, message: form.message, type: 'announcement', targetRole: form.targetRole, createdAt: new Date().toISOString(), sender: 'You' }, ...prev])
        setTimeout(() => setSent(false), 3000)
      } else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
    finally { setSending(false) }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages &amp; Notices</h1>
        <p className="text-sm text-slate-500 mt-1">Broadcast announcements and communicate with staff and students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="w-5 h-5 text-indigo-600" />Compose Broadcast</CardTitle>
            <CardDescription>Send a school-wide or targeted announcement</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <AdminFormField label="Announcement Title" htmlFor="msg-title" required>
                <input id="msg-title" type="text" autoComplete="off" placeholder="e.g., Staff Meeting Tomorrow"
                  value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} className={adminInputClass} required />
              </AdminFormField>
              <AdminFormField label="Message" htmlFor="msg-body" required>
                <textarea id="msg-body" placeholder="Type your announcement..."
                  value={form.message} onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  className={`${adminInputClass} resize-none`} rows={4} required />
              </AdminFormField>
          <AdminFormField label="Send To" htmlFor="msg-target">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TARGET_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(prev => ({ ...prev, targetRole: opt.value, targetGrade: '' }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${form.targetRole === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                      <opt.icon className="w-3.5 h-3.5" />{opt.label}
                    </button>
                  ))}
                </div>
              </AdminFormField>
              {(form.targetRole !== 'ALL') && (
                <AdminFormField label="Filter by Grade (optional)" htmlFor="msg-grade">
                  <select id="msg-grade" value={form.targetGrade} onChange={e => setForm(prev => ({ ...prev, targetGrade: e.target.value }))} className={adminInputClass}>
                    <option value="">All Grades</option>
                    {GRADE_OPTIONS.filter(g => g).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </AdminFormField>
              )}
              <AdminFormField label="Priority Level" htmlFor="msg-priority">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, priority: 'INFO' }))}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${form.priority === 'INFO' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    Info
                  </button>
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, priority: 'URGENT' }))}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${form.priority === 'URGENT' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    <AlertCircle className="w-3.5 h-3.5" />Urgent
                  </button>
                </div>
              </AdminFormField>
              {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg"><AlertCircle className="w-4 h-4" />{error}</div>}
              {sent && <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg"><CheckCircle className="w-4 h-4" />Broadcast sent successfully!</div>}
              <button type="submit" disabled={sending}
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Broadcast</>}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Sent Messages */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="w-5 h-5 text-indigo-600" />Sent Messages</CardTitle>
            <CardDescription>Previously sent announcements and notices</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No messages sent yet</p>
                <p className="text-xs text-slate-400">Send your first broadcast using the form</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {messages.map(m => (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{m.title}</p>
                      <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">{m.targetRole}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.message}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {new Date(m.createdAt).toLocaleString()} · by {m.sender}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
