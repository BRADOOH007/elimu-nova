"use client"

import { useState, useEffect } from 'react'
import {
  AdminModal, AdminModalFooter, AdminFormField, adminInputClass,
} from "@/components/ui/admin-modal"
import { Calendar, Video, MapPin, Link as LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MeetingData {
  id: string; title: string; description?: string
  date: string; time: string; duration: number
  location?: string; meetingType?: string; videoLink?: string
}

interface ScheduleMeetingModalProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; meeting?: MeetingData | null
}

export function ScheduleMeetingModal({ isOpen, onClose, onSuccess, meeting }: ScheduleMeetingModalProps) {
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', time: '', duration: '60',
    location: '', meetingType: 'IN_PERSON', videoLink: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const isEdit = !!meeting

  useEffect(() => {
    if (meeting) setFormData({
      title: meeting.title, description: meeting.description || '',
      date: meeting.date, time: meeting.time, duration: String(meeting.duration),
      location: meeting.location || '', meetingType: meeting.meetingType || 'IN_PERSON',
      videoLink: meeting.videoLink || '',
    })
    else setFormData({ title: '', description: '', date: '', time: '', duration: '60', location: '', meetingType: 'IN_PERSON', videoLink: '' })
  }, [meeting])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.date || !formData.time) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" }); return
    }
    if (formData.meetingType === 'VIRTUAL' && !formData.videoLink) {
      formData.videoLink = `https://meet.jit.si/${encodeURIComponent(formData.title.replace(/\s+/g, '-'))}-${Date.now().toString(36)}`
    }
    setIsLoading(true)
    try {
      const url = isEdit ? `/api/school-admin/meetings/${meeting.id}` : '/api/school-admin/meetings'
      const body = { title: formData.title, description: formData.description, date: formData.date, time: formData.time, duration: parseInt(formData.duration), location: formData.meetingType === 'IN_PERSON' ? formData.location : null, meetingType: formData.meetingType, videoLink: formData.meetingType === 'VIRTUAL' ? formData.videoLink : null }
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast({ title: "Success", description: isEdit ? "Meeting updated" : "Meeting scheduled" }); onSuccess(); onClose() }
      else { const d = await res.json(); toast({ title: "Error", description: d.error || "Failed", variant: "destructive" }) }
    } catch { toast({ title: "Error", description: "Unexpected error", variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <AdminModal open={isOpen} onClose={onClose}
      title={isEdit ? 'Edit Meeting' : 'Schedule Meeting'}
      subtitle={isEdit ? 'Update the meeting details below.' : 'Schedule a meeting with teachers, parents, or staff members.'}
      icon={<Calendar />} size="lg"
      footer={<AdminModalFooter onCancel={onClose} submitLabel={isEdit ? 'Update Meeting' : 'Schedule Meeting'} loading={isLoading} type="submit" />}
    >
      <form id="schedule-meeting-form" onSubmit={handleSubmit} className="space-y-4">
        <AdminFormField label="Meeting Title" htmlFor="mt-title" required>
          <input id="mt-title" type="text" autoComplete="off" placeholder="e.g., Parent-Teacher Conference"
            value={formData.title} onChange={set('title')} className={adminInputClass} required />
        </AdminFormField>
        <AdminFormField label="Description" htmlFor="mt-desc">
          <textarea id="mt-desc" placeholder="Meeting agenda or description..."
            value={formData.description} onChange={set('description')}
            className={`${adminInputClass} resize-none`} rows={3} />
        </AdminFormField>

        {/* Meeting Type Toggle */}
        <AdminFormField label="Meeting Type" htmlFor="mt-type">
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setFormData(prev => ({ ...prev, meetingType: 'IN_PERSON' }))}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${formData.meetingType === 'IN_PERSON' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <MapPin className="w-4 h-4" /> In-Person (Venue)
            </button>
            <button type="button"
              onClick={() => setFormData(prev => ({ ...prev, meetingType: 'VIRTUAL' }))}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${formData.meetingType === 'VIRTUAL' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <Video className="w-4 h-4" /> Virtual (Video Call)
            </button>
          </div>
        </AdminFormField>

        {/* Conditional: Venue or Video Link */}
        {formData.meetingType === 'IN_PERSON' ? (
          <AdminFormField label="Location / Venue" htmlFor="mt-loc" required>
            <input id="mt-loc" type="text" autoComplete="off" placeholder="e.g., Conference Room A, Staff Room"
              value={formData.location} onChange={set('location')} className={adminInputClass} required />
          </AdminFormField>
        ) : (
          <AdminFormField label="Video Call Link" htmlFor="mt-vlink">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input id="mt-vlink" type="url" autoComplete="off" placeholder="Leave blank to auto-generate Jitsi room"
                value={formData.videoLink} onChange={set('videoLink')} className={`${adminInputClass} pl-9`} />
            </div>
            <p className="text-xs text-slate-400 mt-1">A Jitsi Meet room will be auto-generated if left empty.</p>
          </AdminFormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <AdminFormField label="Date" htmlFor="mt-date" required>
            <input id="mt-date" type="date" value={formData.date} onChange={set('date')}
              className={adminInputClass} min={isEdit ? undefined : today} required />
          </AdminFormField>
          <AdminFormField label="Time" htmlFor="mt-time" required>
            <input id="mt-time" type="time" value={formData.time} onChange={set('time')}
              className={adminInputClass} required />
          </AdminFormField>
        </div>
        <AdminFormField label="Duration (minutes)" htmlFor="mt-dur">
          <input id="mt-dur" type="number" placeholder="60" value={formData.duration}
            onChange={set('duration')} className={adminInputClass} min="15" max="480" />
        </AdminFormField>
      </form>
    </AdminModal>
  )
}
