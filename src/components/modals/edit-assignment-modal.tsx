'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Edit, 
  X, 
  Calendar, 
  Users, 
  BookOpen,
  FileText,
  Clock,
  AlertCircle,
  Eye,
  Edit3,
  Video,
  Upload,
  Link,
  Play,
  Loader2,
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { useToast } from '@/hooks/use-toast'

const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE','Agriculture','Physics','Chemistry','Biology','History','Geography','Business Studies','Computer Studies','Home Science','Art & Design']
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

interface EditAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  assignment: any
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

export default function EditAssignmentModal({ isOpen, onClose, onSuccess, assignment }: EditAssignmentModalProps) {
  const [loading, setLoading] = useState(false)
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
    grade: '',
    status: 'PENDING'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Structured (interactive MCQ) assignments store { questions, markdown } JSON
  // in content — keep the questions alongside the markdown the teacher edits.
  const [embeddedQuestions, setEmbeddedQuestions] = useState<any[]>([])

  // Video state
  const [videoUrl, setVideoUrl] = useState('')
  const [videoProvider, setVideoProvider] = useState<'youtube' | 'vimeo' | 'upload' | ''>('')
  const [videoName, setVideoName] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const videoDropRef = useRef<HTMLDivElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize form data when assignment changes
  useEffect(() => {
    if (assignment && isOpen) {
      const dueDate = new Date(assignment.dueDate)
      // Structured interactive assignments store { questions, markdown } JSON.
      // Show the markdown in the editor and keep the questions to re-wrap on save.
      const raw = assignment.content || ''
      let content = raw
      let embedded: any[] = []
      try {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.questions && Array.isArray(parsed.questions) && typeof parsed.markdown === 'string') {
          content = parsed.markdown
          embedded = parsed.questions
        }
      } catch { /* not structured */ }
      setEmbeddedQuestions(embedded)
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        content,
        dueDate: dueDate.toISOString().split('T')[0],
        dueTime: dueDate.toTimeString().slice(0, 5),
        lessonPlanId: assignment.lessonPlan?.id || '',
        subject: assignment.lessonPlan?.subject || '',
        grade: assignment.lessonPlan?.grade || '',
        status: assignment.status || 'PENDING'
      })
      setSelectedStudents(assignment.students?.map((s: any) => s.id) || [])
      setVideoUrl(assignment.videoUrl || '')
      setVideoProvider(assignment.videoProvider || '')
      setVideoName(assignment.videoUrl ? (assignment.videoProvider === 'youtube' ? 'YouTube' : assignment.videoProvider === 'vimeo' ? 'Vimeo' : 'Uploaded Video') : '')
    }
  }, [assignment, isOpen])

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

  const uploadVideo = async (file: File) => {
    if (file.size > 500 * 1024 * 1024) { toast({ title: 'Video too large (max 500MB)', variant: 'destructive' }); return }
    setVideoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/upload-video', { method: 'POST', body: fd })
      if (r.ok) {
        const data = await r.json()
        setVideoUrl(data.url)
        setVideoProvider('upload')
        setVideoName(data.name || file.name)
        toast({ title: 'Video uploaded successfully' })
      } else {
        const err = await r.json()
        toast({ title: err.error || 'Video upload failed', variant: 'destructive' })
      }
    } catch { toast({ title: 'Video upload failed', variant: 'destructive' }) }
    finally { setVideoUploading(false) }
  }

  const parseVideoLink = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
    if (ytMatch) {
      setVideoUrl(`https://www.youtube.com/embed/${ytMatch[1]}`)
      setVideoProvider('youtube')
      setLinkInput('')
      toast({ title: 'YouTube video linked' })
      return
    }
    const vmMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vmMatch) {
      setVideoUrl(`https://player.vimeo.com/video/${vmMatch[1]}`)
      setVideoProvider('vimeo')
      setLinkInput('')
      toast({ title: 'Vimeo video linked' })
      return
    }
    toast({ title: 'Paste a valid YouTube or Vimeo URL', variant: 'destructive' })
  }

  const clearVideo = () => {
    setVideoUrl('')
    setVideoProvider('')
    setVideoName('')
    setLinkInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`)
      
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          content: embeddedQuestions.length > 0
            ? JSON.stringify({ questions: embeddedQuestions, markdown: formData.content })
            : formData.content,
          dueDate: dueDateTime.toISOString(),
          status: formData.status,
          lessonPlanId: formData.lessonPlanId || null,
          studentIds: selectedStudents,
          videoUrl: videoUrl || null,
          videoProvider: videoProvider || null,
          videoDuration: 0,
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        console.error('Error updating assignment:', error)
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setErrors({})
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

  if (!assignment) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl">
        <div className="max-h-[85vh] overflow-y-auto px-1">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            Edit Assignment
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            Update the assignment details and requirements.
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
                placeholder="Enter assignment title"
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

          {/* Status */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Status & Curriculum
            </h3>
            
            <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
              Assignment Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="GRADED">Graded</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              Link to Lesson Plan (Optional)
            </Label>
            <Select
              value={formData.lessonPlanId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, lessonPlanId: value }))}
            >
              <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Select a lesson plan" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          {/* Subject and Grade (if no lesson plan selected) */}
          {!formData.lessonPlanId && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Subject & Grade
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
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
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.grade && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.grade}
                  </p>
                )}
              </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Description
            </h3>
            
            <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              Assignment Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a brief description of the assignment"
              rows={3}
              className="bg-white border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
            </div>
          </div>

          {/* Video */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Video className="w-5 h-5 text-violet-600" />
              Video <span className="text-sm text-gray-400 font-normal">(optional)</span>
            </h3>

            {videoUrl ? (
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-xl overflow-hidden shadow">
                  {videoProvider === 'youtube' || videoProvider === 'vimeo' ? (
                    <iframe src={videoUrl} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  ) : (
                    <video src={videoUrl} controls className="w-full aspect-video" preload="metadata" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Play className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{videoName || videoProvider}</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={clearVideo} className="h-8 text-xs text-red-500 hover:text-red-600">
                    <X className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  ref={videoDropRef}
                  className={`relative p-5 rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center
                    ${videoUploading ? 'border-violet-300 bg-violet-50' : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'}`}
                  onClick={() => !videoUploading && videoInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); if (videoDropRef.current) videoDropRef.current.classList.add('border-violet-400', 'bg-violet-50') }}
                  onDragLeave={() => { if (videoDropRef.current) videoDropRef.current.classList.remove('border-violet-400', 'bg-violet-50') }}
                  onDrop={e => {
                    e.preventDefault()
                    if (videoDropRef.current) videoDropRef.current.classList.remove('border-violet-400', 'bg-violet-50')
                    const f = e.dataTransfer.files?.[0]
                    if (f) uploadVideo(f)
                  }}
                >
                  <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideo(f) }} />
                  {videoUploading ? (
                    <div className="space-y-2">
                      <Loader2 className="w-6 h-6 mx-auto animate-spin text-violet-500" />
                      <p className="text-xs font-medium text-violet-700">Uploading...</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5 text-violet-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">Upload Video</p>
                      <p className="text-[10px] text-gray-400">MP4, WebM, MOV, AVI &bull; Max 500MB</p>
                    </div>
                  )}
                </div>
                <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <Link className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center">YouTube / Vimeo Link</p>
                  <div className="flex gap-2">
                    <Input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..." 
                      className="h-8 text-xs flex-1" 
                      onKeyDown={e => { if (e.key === 'Enter' && linkInput.trim()) parseVideoLink(linkInput) }} />
                    <Button type="button" size="sm" onClick={() => linkInput.trim() && parseVideoLink(linkInput)}
                      disabled={!linkInput.trim()} className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white">
                      Link
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                Assignment Content <span className="text-red-500">*</span>
              </Label>
              {formData.content && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="bg-white border-gray-200 hover:bg-gray-50"
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
            </div>
            
            {isPreviewMode && formData.content ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
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
                className="bg-white border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
            )}
            
            {errors.content && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.content}
              </p>
            )}
          </div>

          {/* Student Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Assign to Students <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllStudents}
                  className="bg-white border-gray-200 hover:bg-gray-50"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllStudents}
                  className="bg-white border-gray-200 hover:bg-gray-50"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white shadow-inner">
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
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
              <p className="text-sm text-green-800 font-medium">
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
              className="bg-white border-gray-200 hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Updating...' : 'Update Assignment'}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
