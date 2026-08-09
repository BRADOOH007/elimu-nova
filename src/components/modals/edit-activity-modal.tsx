"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
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
import { Loader2, Edit } from "lucide-react"

interface Activity {
  id: string
  type: string
  action: string
  description: string
  metadata: any
  user: {
    name: string
    email: string
    role: string
  } | null
  createdAt: string
}

interface EditActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onActivityUpdated: () => void
  activity: Activity | null
}

const activityTypes = [
  { value: 'TEACHER_ENROLLED', label: 'Teacher Enrolled' },
  { value: 'STUDENT_ENROLLED', label: 'Student Enrolled' },
  { value: 'CLASS_CREATED', label: 'Class Created' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
  { value: 'MEETING_SCHEDULED', label: 'Meeting Scheduled' },
  { value: 'USER_LOGIN', label: 'User Login' },
  { value: 'USER_LOGOUT', label: 'User Logout' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
  { value: 'REPORT_GENERATED', label: 'Report Generated' },
  { value: 'OTHER', label: 'Other' }
]

export default function EditActivityModal({ isOpen, onClose, onActivityUpdated, activity }: EditActivityModalProps) {
  const [formData, setFormData] = useState({
    type: '',
    action: '',
    description: '',
    metadata: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (activity) {
      setFormData({
        type: activity.type,
        action: activity.action,
        description: activity.description,
        metadata: activity.metadata ? JSON.stringify(activity.metadata, null, 2) : ''
      })
    }
  }, [activity])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type || !formData.action || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (!activity) return

    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/school-admin/activities/${activity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          metadata: formData.metadata ? JSON.parse(formData.metadata) : null
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Activity updated successfully",
        })
        onActivityUpdated()
        onClose()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update activity",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating activity:', error)
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
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <DialogHeader>
          <DialogTitle className="edugenius-text-gradient-blue">Edit Activity</DialogTitle>
          <DialogDescription>
            Update the activity details.
          </DialogDescription>
        </DialogHeader>
        
        <form id="edit-activity-form" onSubmit={handleSubmit} className="contents">
          <DialogBody className="space-y-4 mt-1">
          <div className="space-y-2">
            <Label htmlFor="type">Activity Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger className="edugenius-glass">
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action">Action *</Label>
            <Input
              id="action"
              placeholder="e.g., Student Enrolled, Teacher Added"
              value={formData.action}
              onChange={(e) => handleInputChange('action', e.target.value)}
              className="edugenius-glass"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the activity in detail..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="edugenius-glass min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              placeholder='{"key": "value"} - Optional additional data'
              value={formData.metadata}
              onChange={(e) => handleInputChange('metadata', e.target.value)}
              className="edugenius-glass min-h-[80px] font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Enter valid JSON format for additional metadata (optional)
            </p>
          </div>

          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="edugenius-glass px-5 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-activity-form"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-5 py-2.5 text-sm font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Activity
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
