'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  X, 
  Calendar, 
  Users, 
  BookOpen,
  FileText,
  Clock,
  AlertCircle,
  Brain,
  Loader2,
  Eye,
  Edit3
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface CreateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Student {
  id: string
  name: string
  email: string
}

interface LessonPlan {
  id: string
  title: string
  subject: string
  grade: string
}

export default function CreateAssignmentModal({ isOpen, onClose, onSuccess }: CreateAssignmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    dueDate: '',
    dueTime: '23:59',
    lessonPlanId: '',
    subject: '',
    grade: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch students and lesson plans
  useEffect(() => {
    if (isOpen) {
      fetchStudents()
      fetchLessonPlans()
    }
  }, [isOpen])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

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

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    } else {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`)
      if (dueDateTime <= new Date()) {
        newErrors.dueDate = 'Due date must be in the future'
      }
    }

    if (!formData.lessonPlanId && (!formData.subject || !formData.grade)) {
      newErrors.subject = 'Either select a lesson plan or specify subject and grade'
    }

    if (selectedStudents.length === 0) {
      newErrors.students = 'At least one student must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`)
      
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          dueDate: dueDateTime.toISOString(),
          lessonPlanId: formData.lessonPlanId || null,
          studentIds: selectedStudents
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        const error = await response.json()
        console.error('Error creating assignment:', error)
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      dueDate: '',
      dueTime: '23:59',
      lessonPlanId: '',
      subject: '',
      grade: ''
    })
    setSelectedStudents([])
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAllStudents = () => {
    setSelectedStudents(students.map(s => s.id))
  }

  const handleDeselectAllStudents = () => {
    setSelectedStudents([])
  }

  const selectedLessonPlan = lessonPlans.find(lp => lp.id === formData.lessonPlanId)

  const generateAIContent = async () => {
    if (!formData.title.trim() || (!formData.lessonPlanId && (!formData.subject.trim() || !formData.grade.trim()))) {
      alert('Please fill in the assignment title and either select a lesson plan or specify subject and grade before generating content.')
      return
    }

    setIsGeneratingContent(true)
    try {
      const requestData = {
        type: 'assignment',
        title: formData.title,
        description: formData.description,
        subject: selectedLessonPlan?.subject || formData.subject,
        grade: selectedLessonPlan?.grade || formData.grade,
        topic: formData.title, // Use title as topic for now
        lessonPlanId: formData.lessonPlanId,
        duration: 60, // Default duration
        difficulty: 'intermediate', // Default difficulty
        requirements: formData.description // Use description as requirements
      };
      
      console.log('Sending AI generation request with data:', requestData);
      
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, content: data.content }))
      } else {
        const error = await response.json()
        alert(`Error generating content: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
      alert('Error generating content. Please try again.')
    } finally {
      setIsGeneratingContent(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl">
        <div className="max-h-[85vh] overflow-y-auto px-1">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            Create New Assignment
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            Create engaging assignments for your students. Use AI to generate content automatically or write your own.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Assignment Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Assignment Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Solving Linear Equations"
                  className="bg-white border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Due Date <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="bg-white border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <Input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="bg-white border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent w-32"
                  />
                </div>
                {errors.dueDate && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dueDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Lesson Plan & Subject */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Subject & Curriculum
            </h3>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Link to Lesson Plan (Optional)
              </Label>
              <Select
                value={formData.lessonPlanId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, lessonPlanId: value }))}
              >
                <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="Select a lesson plan" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {lessonPlans.map((lessonPlan) => (
                    <SelectItem key={lessonPlan.id} value={lessonPlan.id}>
                      {lessonPlan.title} - {lessonPlan.subject} ({lessonPlan.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLessonPlan && (
                <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                  <p className="text-sm text-blue-900 font-medium">
                    ✓ Linked to: {selectedLessonPlan.title} - {selectedLessonPlan.subject} ({selectedLessonPlan.grade})
                  </p>
                </div>
              )}
            </div>

            {/* Subject and Grade (if no lesson plan selected) */}
            {!formData.lessonPlanId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Mathematics, Science"
                    className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Grade Level <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    placeholder="e.g., Grade 7, Grade 10"
                    className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.grade && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.grade}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Assignment Overview
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief overview of what students will do (e.g., 'Practice solving linear equations with word problems')"
                rows={3}
                className="bg-white border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                Assignment Content *
              </Label>
              <div className="flex items-center gap-2">
                {formData.content && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="bg-white/70 backdrop-blur-sm border-gray-300 hover:bg-gray-50"
                  >
                    {isPreviewMode ? (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAIContent}
                  disabled={isGeneratingContent || !formData.title.trim() || (!formData.lessonPlanId && (!formData.subject.trim() || !formData.grade.trim()))}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-sm"
                >
                  {isGeneratingContent ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {isPreviewMode && formData.content ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Assignment Preview</h3>
                  <p className="text-sm text-gray-600">This is how your assignment will appear to students</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <MarkdownRenderer content={formData.content} />
                </div>
              </div>
            ) : (
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Provide detailed instructions, questions, or tasks for the assignment"
                rows={8}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            )}
            
            {errors.content && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.content}
              </p>
            )}
            <p className="text-xs text-gray-500">
              💡 Fill in the assignment details above, then click "Generate with AI" to create detailed assignment content automatically. Use the Preview button to see how it will look to students.
            </p>
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Assign to Students *
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllStudents}
                  className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllStudents}
                  className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white/50 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                    />
                    <Label
                      htmlFor={`student-${student.id}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {student.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {errors.students && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.students}
              </p>
            )}
          </div>

          {/* Selected Students Summary */}
          {selectedStudents.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>{selectedStudents.length}</strong> student{selectedStudents.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
