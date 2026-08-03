"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Calendar, Clock, MapPin, BookOpen } from "lucide-react"

const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE','Agriculture','Physics','Chemistry','Biology','History','Geography','Business Studies','Computer Studies','Home Science','Art & Design']
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

interface CreateScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onScheduleCreated: () => void
}

const scheduleTypes = [
  { value: 'CLASS', label: 'Class' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'OFFICE_HOURS', label: 'Office Hours' },
  { value: 'EXAM', label: 'Exam' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHER', label: 'Other' }
]

const recurringPatterns = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
]

export default function CreateScheduleModal({ isOpen, onClose, onScheduleCreated }: CreateScheduleModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    startTime: '',
    endTime: '',
    location: '',
    type: '',
    classId: '',
    recurring: false,
    recurringPattern: '',
    metadata: ''
  })
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchClasses()
    }
  }, [isOpen])

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true)
      const response = await fetch('/api/teacher/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setLoadingClasses(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.startTime || !formData.endTime || !formData.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/teacher/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          classId: formData.classId === 'loading' || formData.classId === 'no-classes' ? null : formData.classId,
          metadata: formData.metadata ? JSON.parse(formData.metadata) : null
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Schedule created successfully",
        })
        setFormData({
          title: '',
          description: '',
          subject: '',
          grade: '',
          startTime: '',
          endTime: '',
          location: '',
          type: '',
          classId: '',
          recurring: false,
          recurringPattern: '',
          metadata: ''
        })
        onScheduleCreated()
        onClose()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create schedule",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        title: '',
        description: '',
        subject: '',
        grade: '',
        startTime: '',
        endTime: '',
        location: '',
        type: '',
        classId: '',
        recurring: false,
        recurringPattern: '',
        metadata: ''
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <DialogHeader>
          <DialogTitle className="edugenius-text-gradient-blue">Create New Schedule</DialogTitle>
          <DialogDescription>
            Add a new schedule item to your calendar.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Mathematics Class"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the schedule item..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => handleInputChange('grade', e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Room 101, Lab 205"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="classId">Class (Optional)</Label>
            <Select
              value={formData.classId}
              onValueChange={(value) => handleInputChange('classId', value)}
            >
              <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
                <SelectContent>
                  {loadingClasses ? (
                    <SelectItem value="loading" disabled>Loading classes...</SelectItem>
                  ) : classes.length > 0 ? (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.subject} ({cls.grade})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>No classes available</SelectItem>
                  )}
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) => handleInputChange('recurring', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="recurring">Recurring Event</Label>
            </div>

            {formData.recurring && (
              <div className="space-y-2">
                <Label htmlFor="recurringPattern">Recurring Pattern</Label>
                <Select
                  value={formData.recurringPattern}
                  onValueChange={(value) => handleInputChange('recurringPattern', value)}
                >
                  <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {recurringPatterns.map((pattern) => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              placeholder='{"key": "value"} - Optional additional data'
              value={formData.metadata}
              onChange={(e) => handleInputChange('metadata', e.target.value)}
              className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500 min-h-[60px] font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Enter valid JSON format for additional metadata (optional)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
