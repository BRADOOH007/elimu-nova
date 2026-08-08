"use client"

import { useState, useEffect } from 'react'
import {
  AdminModal, AdminModalFooter, AdminFormField, adminInputClass,
} from "@/components/ui/admin-modal"
import { Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MeetingData {
  id: string; title: string; description?: string
  date: string; time: string; duration: number; location?: string
}

interface ScheduleMeetingModalProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; meeting?: MeetingData | null
}

export function ScheduleMeetingModal({ isOpen, onClose, onSuccess, meeting }: ScheduleMeetingModalProps) {
  const [formData, setFormData] = useState({ title: '', description: '', date: '', time: '', duration: '60', location: '' })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const isEdit = !!meeting

  useEffect(() => {
    if (meeting) setFormData({
      title: meeting.title, description: meeting.description || '', date: meeting.date,
      time: meeting.time, duration: String(meeting.duration), location: meeting.location || ''
    })
    else setFormData({ title: '', description: '', date: '', time: '', duration: '60', location: '' })
  }, [meeting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.date || !formData.time) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" }); return
    }
    setIsLoading(true)
    try {
      const url = isEdit ? `/api/school-admin/meetings/${meeting.id}` : '/api/school-admin/meetings'
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: formData.title, description: formData.description, date: formData.date, time: formData.time, duration: parseInt(formData.duration), location: formData.location }) })
      if (res.ok) { toast({ title: "Success", description: isEdit ? "Meeting updated" : "Meeting scheduled" }); onSuccess(); onClose() }
      else { const d = await res.json(); toast({ title: "Error", description: d.error || "Failed", variant: "destructive" }) }
    } catch { toast({ title: "Error", description: "Unexpected error", variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [f]: e.target.value }))
  const today = new Date().toISOString().split('T')[0]

  return (
    <AdminModal open={isOpen} onClose={onClose}
      title={isEdit ? 'Edit Meeting' : 'Schedule Meeting'}
      subtitle={isEdit ? 'Update the meeting details below.' : 'Schedule a meeting with teachers, parents, or staff members.'}
      icon={<Calendar />} size="md"
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
        <div className="grid grid-cols-2 gap-4">
          <AdminFormField label="Duration (minutes)" htmlFor="mt-dur">
            <input id="mt-dur" type="number" placeholder="60" value={formData.duration}
              onChange={set('duration')} className={adminInputClass} min="15" max="480" />
          </AdminFormField>
          <AdminFormField label="Location" htmlFor="mt-loc">
            <input id="mt-loc" type="text" autoComplete="off" placeholder="e.g., Conference Room A"
              value={formData.location} onChange={set('location')} className={adminInputClass} />
          </AdminFormField>
        </div>
      </form>
    </AdminModal>
  )
}
