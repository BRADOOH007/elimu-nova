"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MeetingData {
  id: string
  title: string
  description?: string
  date: string
  time: string
  duration: number
  location?: string
}

interface ScheduleMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  meeting?: MeetingData | null
}

export function ScheduleMeetingModal({ isOpen, onClose, onSuccess, meeting }: ScheduleMeetingModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '60',
    location: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const isEdit = !!meeting

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title,
        description: meeting.description || '',
        date: meeting.date,
        time: meeting.time,
        duration: String(meeting.duration),
        location: meeting.location || ''
      })
    } else {
      setFormData({ title: '', description: '', date: '', time: '', duration: '60', location: '' })
    }
  }, [meeting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.date || !formData.time) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setIsLoading(true)

    try {
      const url = isEdit ? `/api/school-admin/meetings/${meeting.id}` : '/api/school-admin/meetings'
      const method = isEdit ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          duration: parseInt(formData.duration),
          location: formData.location
        })
      })

      if (response.ok) {
        toast({ title: "Success", description: isEdit ? "Meeting updated successfully" : "Meeting scheduled successfully" })
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        toast({ title: "Error", description: errorData.error || "Failed to save meeting", variant: "destructive" })
      }
    } catch (error) {
      console.error('Error saving meeting:', error)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader className="sticky top-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 z-10 pb-4">
          <DialogTitle className="edugenius-text-gradient-blue flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {isEdit ? 'Edit Meeting' : 'Schedule Meeting'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the meeting details below.' : 'Schedule a meeting with teachers, parents, or staff members.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input id="title" type="text" placeholder="e.g., Parent-Teacher Conference"
              value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)}
              className="edugenius-glass" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Meeting agenda or description..."
              value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)}
              className="edugenius-glass" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="edugenius-glass" min={isEdit ? undefined : today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input id="time" type="time" value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="edugenius-glass" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" type="number" placeholder="60" value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="edugenius-glass" min="15" max="480" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" type="text" placeholder="e.g., Conference Room A"
                value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)}
                className="edugenius-glass" />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="edugenius-glass">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Calendar className="w-4 h-4 mr-2" /> {isEdit ? 'Update Meeting' : 'Schedule Meeting'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
