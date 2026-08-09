'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Share, 
  X, 
  BookOpen,
  School,
  Users,
  AlertCircle
} from 'lucide-react'

interface ShareLessonPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classData: any
}

interface LessonPlan {
  id: string
  title: string
  subject: string
  grade: string
  createdAt: string
}

export default function ShareLessonPlanModal({ isOpen, onClose, onSuccess, classData }: ShareLessonPlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [selectedLessonPlans, setSelectedLessonPlans] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch lesson plans for this teacher
  useEffect(() => {
    if (isOpen) {
      fetchLessonPlans()
    }
  }, [isOpen])

  const fetchLessonPlans = async () => {
    try {
      const response = await fetch('/api/lesson-plans')
      if (response.ok) {
        const data = await response.json()
        setLessonPlans(data.lessonPlans || [])
      }
    } catch (error) {
      console.error('Error fetching lesson plans:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (selectedLessonPlans.length === 0) {
      newErrors.lessonPlans = 'At least one lesson plan must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/teacher/classes/share-lesson-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: classData.id,
          lessonPlanIds: selectedLessonPlans
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        console.error('Error sharing lesson plans:', error)
      }
    } catch (error) {
      console.error('Error sharing lesson plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedLessonPlans([])
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleLessonPlanToggle = (lessonPlanId: string) => {
    setSelectedLessonPlans(prev => 
      prev.includes(lessonPlanId) 
        ? prev.filter(id => id !== lessonPlanId)
        : [...prev, lessonPlanId]
    )
  }

  const handleSelectAll = () => {
    setSelectedLessonPlans(lessonPlans.map(lp => lp.id))
  }

  const handleDeselectAll = () => {
    setSelectedLessonPlans([])
  }

  if (!classData) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-white border-0 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Share className="w-5 h-5 text-white" />
            </div>
            Share Lesson Plans
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            Share lesson plans with students in {classData.name} class.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6 mt-1">
          <form id="share-lesson-plan-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Class Information */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{classData.name}</h3>
                <p className="text-sm text-gray-600">{classData.subject} • {classData.grade}</p>
              </div>
            </div>
          </div>

          {/* Lesson Plans Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Select Lesson Plans to Share <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="bg-white border-gray-200 hover:bg-gray-50"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="bg-white border-gray-200 hover:bg-gray-50"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white shadow-inner">
              {lessonPlans.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No lesson plans available</p>
                  <p className="text-sm text-gray-400">Create lesson plans first to share them with students</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessonPlans.map((lessonPlan) => (
                    <div key={lessonPlan.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                      <Checkbox
                        id={`lesson-${lessonPlan.id}`}
                        checked={selectedLessonPlans.includes(lessonPlan.id)}
                        onCheckedChange={() => handleLessonPlanToggle(lessonPlan.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <label
                            htmlFor={`lesson-${lessonPlan.id}`}
                            className="font-medium text-gray-900 cursor-pointer"
                          >
                            {lessonPlan.title}
                          </label>
                        </div>
                        <p className="text-sm text-gray-500">
                          {lessonPlan.subject} • {lessonPlan.grade} • Created {new Date(lessonPlan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.lessonPlans && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.lessonPlans}
              </p>
            )}
          </div>

          {/* Selected Lesson Plans Summary */}
          {selectedLessonPlans.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Sharing Summary
              </h4>
              <p className="text-sm text-green-700">
                <strong>{selectedLessonPlans.length}</strong> lesson plan{selectedLessonPlans.length !== 1 ? 's' : ''} will be shared with <strong>{classData.studentCount || 0}</strong> student{classData.studentCount !== 1 ? 's' : ''} in {classData.name}
              </p>
            </div>
          )}

          </form>
        </DialogBody>
        <DialogFooter className="border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="bg-white border-gray-200 hover:bg-gray-50 px-5 py-2.5 text-sm font-medium"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            form="share-lesson-plan-form"
            disabled={loading || selectedLessonPlans.length === 0}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg px-5 py-2.5 text-sm font-medium"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Share className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Sharing...' : 'Share Lesson Plans'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
