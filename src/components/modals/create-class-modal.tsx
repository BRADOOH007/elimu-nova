'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  X, 
  School,
  BookOpen,
  GraduationCap,
  AlertCircle
} from 'lucide-react'

interface CreateClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade: '',
    description: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Class name is required'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade level is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        try {
          const error = await response.json()
          // Show the error to the user — most likely a duplicate name
          if (response.status === 409 || error.error) {
            setErrors({ name: error.error || 'A class with this name already exists.' })
          } else {
            setErrors({ name: 'Failed to create class. Please try again.' })
          }
        } catch {
          setErrors({ name: 'Failed to create class. Please try again.' })
        }
      }
    } catch (error) {
      console.error('Error creating class:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      grade: '',
      description: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl">
        <div className="max-h-[85vh] overflow-y-auto px-1">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            Create New Class
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            Create a new class to organize your students by subject and grade level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <School className="w-5 h-5 text-green-600" />
              Class Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Class Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Mathematics 7A, Science Grade 9"
                className="bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Mathematics, Science, English"
                className="bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.subject && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.subject}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              Grade Level <span className="text-red-500">*</span>
            </Label>
            <Input
              id="grade"
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              placeholder="e.g., Grade 7, Grade 9, Form 2"
              className="bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {errors.grade && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.grade}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Class Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a brief description of this class..."
              rows={3}
              className="bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          </div>

          {/* Class Preview */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              Class Preview
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Name:</strong> {formData.name || 'Class name will appear here'}</p>
              <p><strong>Subject:</strong> {formData.subject || 'Subject will appear here'}</p>
              <p><strong>Grade:</strong> {formData.grade || 'Grade level will appear here'}</p>
              {formData.description && (
                <p><strong>Description:</strong> {formData.description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-white border-gray-200 hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Create Class'}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}