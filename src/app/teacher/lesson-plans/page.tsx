'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import DocumentUploadButton from '@/components/teacher/document-upload-button'
import { 
  BookOpen, 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Calendar,
  Clock,
  GraduationCap,
  FileText,
  MoreHorizontal,
  Loader2,
  Users,
  Send
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface LessonPlan {
  id: string
  title: string
  subject: string
  grade: string
  content: any
  createdAt: string
  updatedAt: string
  schemeOfWork?: {
    id: string
    title: string
  }
}

export default function LessonPlansPage() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [lessonPlanToDelete, setLessonPlanToDelete] = useState<LessonPlan | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [lessonPlanToShare, setLessonPlanToShare] = useState<LessonPlan | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [sharing, setSharing] = useState(false)
  const router = useRouter()

  // Fetch lesson plans
  useEffect(() => {
    const fetchLessonPlans = async () => {
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (subjectFilter) params.append('subject', subjectFilter)
        if (gradeFilter) params.append('grade', gradeFilter)
        
        const response = await fetch(`/api/lesson-plans?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setLessonPlans(data.lessonPlans || [])
        }
      } catch (error) {
        console.error('Error fetching lesson plans:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLessonPlans()
  }, [searchTerm, subjectFilter, gradeFilter])

  // Refresh lesson plans when returning from create page
  useEffect(() => {
    const handleFocus = () => {
      const fetchLessonPlans = async () => {
        try {
          const params = new URLSearchParams()
          if (searchTerm) params.append('search', searchTerm)
          if (subjectFilter) params.append('subject', subjectFilter)
          if (gradeFilter) params.append('grade', gradeFilter)
          
          const response = await fetch(`/api/lesson-plans?${params.toString()}`)
          if (response.ok) {
            const data = await response.json()
            setLessonPlans(data.lessonPlans || [])
          }
        } catch (error) {
          console.error('Error refreshing lesson plans:', error)
        }
      }
      fetchLessonPlans()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [searchTerm, subjectFilter, gradeFilter])

  const handleDelete = async (lessonPlan: LessonPlan) => {
    setLessonPlanToDelete(lessonPlan)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!lessonPlanToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/lesson-plans/${lessonPlanToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setLessonPlans(prev => prev.filter(lp => lp.id !== lessonPlanToDelete.id))
        setIsDeleteModalOpen(false)
        setLessonPlanToDelete(null)
      } else {
        alert('Error deleting lesson plan')
      }
    } catch (error) {
      console.error('Error deleting lesson plan:', error)
      alert('Error deleting lesson plan')
    } finally {
      setDeleting(false)
    }
  }

  const handleView = async (lessonPlan: LessonPlan) => {
    try {
      // Fetch full lesson plan data with content
      const response = await fetch(`/api/lesson-plans/${lessonPlan.id}`)
      if (response.ok) {
        const fullLessonPlan = await response.json()
        setSelectedLessonPlan(fullLessonPlan)
        setIsViewModalOpen(true)
      } else {
        console.error('Failed to fetch lesson plan details')
        // Fallback to basic data
        setSelectedLessonPlan(lessonPlan)
        setIsViewModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching lesson plan details:', error)
      // Fallback to basic data
      setSelectedLessonPlan(lessonPlan)
      setIsViewModalOpen(true)
    }
  }

  const handleEdit = (lessonPlan: LessonPlan) => {
    router.push(`/teacher/lesson-plans/edit/${lessonPlan.id}`)
  }

  const handleToggleShare = async (lessonPlan: LessonPlan) => {
    try {
      const response = await fetch(`/api/teacher/lesson-plans/${lessonPlan.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Update the lesson plan in the list
        setLessonPlans(prev => 
          prev.map(lp => 
            lp.id === lessonPlan.id 
              ? { ...lp, isShared: data.lessonPlan.isShared }
              : lp
          )
        )
        alert(data.message)
      } else {
        const error = await response.json()
        alert('Error: ' + (error.error || 'Failed to update share status'))
      }
    } catch (error) {
      console.error('Error toggling share status:', error)
      alert('Error updating share status')
    }
  }

  const handleShare = async (lessonPlan: LessonPlan) => {
    setLessonPlanToShare(lessonPlan)
    setIsShareModalOpen(true)
    
    // Fetch students and classes
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch('/api/teacher/students'),
        fetch('/api/teacher/classes')
      ])
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(studentsData.students || [])
      }
      
      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData.classes || [])
      }
    } catch (error) {
      console.error('Error fetching students and classes:', error)
    }
  }

  const confirmShare = async () => {
    if (!lessonPlanToShare) return

    setSharing(true)
    try {
      const response = await fetch('/api/lesson-plans/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonPlanId: lessonPlanToShare.id,
          studentIds: selectedStudents,
          classId: selectedClass || undefined
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Lesson plan shared successfully with ${data.sharedCount} students!`)
        setIsShareModalOpen(false)
        setSelectedStudents([])
        setSelectedClass('')
        setLessonPlanToShare(null)
      } else {
        alert('Error sharing lesson plan')
      }
    } catch (error) {
      console.error('Error sharing lesson plan:', error)
      alert('Error sharing lesson plan')
    } finally {
      setSharing(false)
    }
  }

  const handleDownload = async (lessonPlan: LessonPlan) => {
    try {
      const response = await fetch('/api/export/lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: lessonPlan.content.generatedContent || '',
          title: lessonPlan.title,
          subject: lessonPlan.subject,
          grade: lessonPlan.grade,
          topic: lessonPlan.content.topic || '',
          duration: lessonPlan.content.duration || 45,
          format: 'pdf'
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const element = document.createElement('a')
        element.href = url
        element.download = `${lessonPlan.title}-lesson-plan.html`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        window.URL.revokeObjectURL(url)
      } else {
        alert('Error generating document')
      }
    } catch (error) {
      console.error('Error downloading lesson plan:', error)
      alert('Error downloading lesson plan')
    }
  }

  const filteredLessonPlans = lessonPlans.filter(lp => {
    const matchesSearch = lp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lp.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lp.grade.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = !subjectFilter || lp.subject === subjectFilter
    const matchesGrade = !gradeFilter || lp.grade === gradeFilter
    
    return matchesSearch && matchesSubject && matchesGrade
  })

  const subjects = [...new Set(lessonPlans.map(lp => lp.subject))].sort()
  const grades = [...new Set(lessonPlans.map(lp => lp.grade))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Lesson Plans</span>
          </h1>
          <p className="text-gray-600">Manage your AI-generated lesson plans</p>
        </div>
        <div className="flex items-center gap-3">
          <DocumentUploadButton docType="lesson-plan" />
          <Button 
            onClick={() => router.push('/teacher/lesson-plans/create')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search lesson plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300"
              />
            </div>
            
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="flex h-10 items-center justify-between rounded-md border-0 bg-gradient-to-r from-white via-blue-50 to-purple-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="flex h-10 items-center justify-between rounded-md border-0 bg-gradient-to-r from-white via-blue-50 to-purple-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <option value="">All Grades</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSubjectFilter('')
                setGradeFilter('')
              }}
              className="bg-gradient-to-r from-white via-gray-50 to-gray-100 border-0 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredLessonPlans.length === 0 ? (
        <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plans found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || subjectFilter || gradeFilter 
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first AI-powered lesson plan to get started.'
              }
            </p>
            <Button 
              onClick={() => router.push('/teacher/lesson-plans/create')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Lesson Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessonPlans.map((lessonPlan) => (
            <Card key={lessonPlan.id} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {lessonPlan.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <span className="flex items-center space-x-2 text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4" />
                        <span>{lessonPlan.grade}</span>
                        <span>•</span>
                        <span>{lessonPlan.subject}</span>
                      </span>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleView(lessonPlan)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(lessonPlan)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleShare(lessonPlan)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        {lessonPlan.isShared ? 'Unshare' : 'Share with Students'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(lessonPlan)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(lessonPlan)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Created {new Date(lessonPlan.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {lessonPlan.content?.duration && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{lessonPlan.content.duration} minutes</span>
                    </div>
                  )}

                  {lessonPlan.content?.objectives && lessonPlan.content.objectives.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Objectives:</p>
                      <div className="space-y-1">
                        {lessonPlan.content.objectives.slice(0, 2).map((objective: string, index: number) => (
                          <p key={index} className="text-xs text-gray-600 line-clamp-1">
                            • {objective}
                          </p>
                        ))}
                        {lessonPlan.content.objectives.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{lessonPlan.content.objectives.length - 2} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                      {lessonPlan.subject}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(lessonPlan)}
                      className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              {selectedLessonPlan?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedLessonPlan?.subject} • {selectedLessonPlan?.grade}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLessonPlan && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Lesson Plan Content</h4>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedLessonPlan.content?.generatedContent || 
                     selectedLessonPlan.content?.content || 
                     selectedLessonPlan.content || 
                     'No content available'}
                  </div>
                </div>
              </div>
              
              {selectedLessonPlan.content?.objectives && selectedLessonPlan.content.objectives.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Learning Objectives</h4>
                  <ul className="space-y-1">
                    {selectedLessonPlan.content.objectives.map((objective: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedLessonPlan)}
                  className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => handleEdit(selectedLessonPlan)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{lessonPlanToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Share2 className="mr-2 h-5 w-5" />
              Share Lesson Plan
            </DialogTitle>
            <DialogDescription>
              Share "{lessonPlanToShare?.title}" with your students
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Share with Class */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Share with Entire Class
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Or Share with Individual Students */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Or Share with Individual Students
              </label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={student.id}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents(prev => [...prev, student.id])
                        } else {
                          setSelectedStudents(prev => prev.filter(id => id !== student.id))
                        }
                      }}
                    />
                    <label
                      htmlFor={student.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {student.name} - {student.grade}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsShareModalOpen(false)}
                disabled={sharing}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmShare}
                disabled={sharing || (!selectedClass && selectedStudents.length === 0)}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {sharing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}