'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Loader2, 
  Save, 
  Download, 
  Share2,
  Plus,
  Trash2,
  Search,
  Filter,
  Edit,
  Eye,
  MoreHorizontal,
  Users,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  Target,
  BookOpen
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import SchemeOfWorkModal from '@/components/modals/scheme-of-work-modal'

interface Topic {
  id: string
  title: string
  description: string
  weekNumber: number
  lessonNumber: number
  objectives: string[]
  activities: string[]
  resources: string[]
  assessment: string
  duration: number
}

interface SchemeOfWorkContent {
  generatedContent: string;
  objectives?: string[];
  topics?: string[];
  duration?: number;
}

interface SchemeOfWork {
  id: string
  title: string
  subject: string
  grade: string
  term: string
  content: SchemeOfWorkContent
  duration?: number
  objectives?: string
  createdAt: string
  updatedAt: string
  isShared: boolean
  topics?: Topic[]
  _count?: {
    lessonPlans: number;
    topics: number;
    sharedWith?: number;
  };
}

export default function SchemesOfWorkPage() {
  const { toast } = useToast()
  const [schemesOfWork, setSchemesOfWork] = useState<SchemeOfWork[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [selectedSchemeOfWork, setSelectedSchemeOfWork] = useState<SchemeOfWork | null>(null)
  const [isViewModalOpen, setViewModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [schemeOfWorkToShare, setSchemeOfWorkToShare] = useState<SchemeOfWork | null>(null)
  const [schemeToShare, setSchemeToShare] = useState<SchemeOfWork | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [sharing, setSharing] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    duration: 12,
    topics: [''],
    objectives: ['']
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [downloading, setDownloading] = useState<'pdf' | 'word' | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingScheme, setEditingScheme] = useState<SchemeOfWork | null>(null)
  const router = useRouter()

  // Fetch schemes of work on component mount
  useEffect(() => {
    const fetchSchemesOfWork = async () => {
      try {
        const response = await fetch('/api/schemes-of-work')
        if (response.ok) {
          const data = await response.json()
          setSchemesOfWork(data.schemesOfWork || [])
        } else {
          console.error('Failed to fetch schemes of work:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching schemes of work:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSchemesOfWork()
  }, [])

  // Fetch students and classes for sharing
  useEffect(() => {
    const fetchStudentsAndClasses = async () => {
      try {
        // Fetch students
        const studentsResponse = await fetch('/api/teacher/students')
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          setStudents(studentsData.students || [])
        }

        // Fetch classes
        const classesResponse = await fetch('/api/teacher/classes')
        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setClasses(classesData.classes || [])
        }
      } catch (error) {
        console.error('Error fetching students and classes:', error)
      }
    }
    fetchStudentsAndClasses()
  }, [])

  // Refresh schemes when returning from create page
  useEffect(() => {
    const handleFocus = () => {
      const fetchSchemesOfWork = async () => {
        try {
          const response = await fetch('/api/schemes-of-work')
          if (response.ok) {
            const data = await response.json()
            setSchemesOfWork(data.schemesOfWork || [])
          }
        } catch (error) {
          console.error('Error refreshing schemes of work:', error)
        }
      }
      fetchSchemesOfWork()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...formData.topics]
    newTopics[index] = value
    setFormData(prev => ({ ...prev, topics: newTopics }))
  }

  const addTopic = () => {
    setFormData(prev => ({ ...prev, topics: [...prev.topics, ''] }))
  }

  const removeTopic = (index: number) => {
    if (formData.topics.length > 1) {
      const newTopics = formData.topics.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, topics: newTopics }))
    }
  }

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objectives]
    newObjectives[index] = value
    setFormData(prev => ({ ...prev, objectives: newObjectives }))
  }

  const addObjective = () => {
    setFormData(prev => ({ ...prev, objectives: [...prev.objectives, ''] }))
  }

  const removeObjective = (index: number) => {
    if (formData.objectives.length > 1) {
      const newObjectives = formData.objectives.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, objectives: newObjectives }))
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/ai/generate-scheme-of-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (response.ok) {
        setGeneratedContent(data.content)
        setIsEditing(true)
      } else {
        alert('Error generating scheme of work: ' + data.error)
      }
    } catch (error) {
      alert('Error generating scheme of work')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateScheme = async (data: any) => {
    try {
      const response = await fetch('/api/schemes-of-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const newSchemeOfWork = await response.json()
        setSchemesOfWork(prev => [newSchemeOfWork, ...prev])
        alert('Scheme of work created successfully!')
        return true
      } else {
        const errorData = await response.json()
        alert('Error creating scheme of work: ' + (errorData.error || 'Unknown error'))
        return false
      }
    } catch (error) {
      alert('Error creating scheme of work')
      return false
    }
  }

  const handleUpdateScheme = async (data: any) => {
    if (!editingScheme) return false
    
    try {
      const response = await fetch(`/api/schemes-of-work/${editingScheme.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updatedSchemeOfWork = await response.json()
        setSchemesOfWork(prev => prev.map(scheme => 
          scheme.id === editingScheme.id ? updatedSchemeOfWork : scheme
        ))
        alert('Scheme of work updated successfully!')
        return true
      } else {
        const errorData = await response.json()
        alert('Error updating scheme of work: ' + (errorData.error || 'Unknown error'))
        return false
      }
    } catch (error) {
      alert('Error updating scheme of work')
      return false
    }
  }

  const handleDeleteScheme = async (schemeId: string) => {
    try {
      const response = await fetch(`/api/schemes-of-work/${schemeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSchemesOfWork(prev => prev.filter(scheme => scheme.id !== schemeId))
        toast({
          title: "Scheme Deleted Successfully",
          description: "The scheme of work has been permanently removed.",
          variant: "success",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.error || "Unable to delete scheme of work. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error deleting scheme of work:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }

  const handleSaveSchemeOfWork = async () => {
    if (!generatedContent) {
      alert('No content to save')
      return
    }

    try {
      const response = await fetch('/api/schemes-of-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${formData.subject} - ${formData.grade}`,
          subject: formData.subject,
          grade: formData.grade,
          content: {
            generatedContent,
            duration: formData.duration,
            topics: formData.topics.filter(topic => topic.trim()),
            objectives: formData.objectives.filter(obj => obj.trim()),
            lessonsPerWeek: 5,
            totalLessons: formData.duration * 5
          }
        }),
      })

      if (response.ok) {
        const newSchemeOfWork = await response.json()
        setSchemesOfWork(prev => [newSchemeOfWork, ...prev])
        setGeneratedContent('')
        setFormData({
          subject: '',
          grade: '',
          duration: 12,
          topics: [''],
          objectives: ['']
        })
        alert('Scheme of work saved successfully!')
      } else {
        alert('Error saving scheme of work')
      }
    } catch (error) {
      alert('Error saving scheme of work')
    }
  }

  const handleViewSchemeOfWork = async (schemeOfWork: SchemeOfWork) => {
    try {
      // Fetch full scheme of work data with content
      const response = await fetch(`/api/schemes-of-work/${schemeOfWork.id}`)
      if (response.ok) {
        const fullSchemeOfWork = await response.json()
        setSelectedSchemeOfWork(fullSchemeOfWork)
        setViewModalOpen(true)
      } else {
        console.error('Failed to fetch scheme of work details')
        // Fallback to basic data
        setSelectedSchemeOfWork(schemeOfWork)
        setViewModalOpen(true)
      }
    } catch (error) {
      console.error('Error fetching scheme of work details:', error)
      // Fallback to basic data
      setSelectedSchemeOfWork(schemeOfWork)
      setViewModalOpen(true)
    }
  }

  const handleEditSchemeOfWork = (schemeOfWork: SchemeOfWork) => {
    router.push(`/teacher/schemes-of-work/edit/${schemeOfWork.id}`)
  }

  const handleDeleteSchemeOfWork = async (schemeOfWork: SchemeOfWork) => {
    await handleDeleteScheme(schemeOfWork.id)
  }

  const handleEditScheme = (schemeOfWork: SchemeOfWork) => {
    router.push(`/teacher/schemes-of-work/edit/${schemeOfWork.id}`)
  }

  const handleDownloadScheme = async (format: 'pdf' | 'word', schemeOfWork: SchemeOfWork) => {
    try {
      const response = await fetch('/api/export/scheme-of-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: schemeOfWork.content.generatedContent || '',
          title: schemeOfWork.title,
          subject: schemeOfWork.subject,
          grade: schemeOfWork.grade,
          duration: schemeOfWork.duration || schemeOfWork.content.duration || 12,
          lessonsPerWeek: 5,
          lessonDuration: 45,
          topics: schemeOfWork.content.topics || [],
          format: format
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const element = document.createElement('a')
        element.href = url
        element.download = `${schemeOfWork.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scheme_of_work.${format === 'pdf' ? 'html' : 'doc'}`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        window.URL.revokeObjectURL(url)
      } else {
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: "Unable to generate document. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error downloading scheme of work:', error)
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }

  const handleShare = (schemeOfWork: SchemeOfWork) => {
    setSchemeToShare(schemeOfWork)
    setIsShareModalOpen(true)
  }

  const confirmShare = async () => {
    if (!schemeToShare) return

    setSharing(true)
    try {
      const response = await fetch('/api/schemes-of-work/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemeOfWorkId: schemeToShare.id,
          studentIds: selectedStudents,
          classId: selectedClass || undefined
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Scheme Shared Successfully",
          description: `Scheme of work shared with ${data.sharedCount} students!`,
          variant: "success",
        })
        setIsShareModalOpen(false)
        setSelectedStudents([])
        setSelectedClass('')
        setSchemeToShare(null)
      } else {
        toast({
          variant: "destructive",
          title: "Share Failed",
          description: "Unable to share scheme of work. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error sharing scheme of work:', error)
      toast({
        variant: "destructive",
        title: "Share Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    } finally {
      setSharing(false)
    }
  }

  // Filter schemes of work
  const filteredSchemesOfWork = schemesOfWork.filter(sw => {
    const matchesSearch = sw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sw.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sw.grade.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = !subjectFilter || sw.subject === subjectFilter
    const matchesGrade = !gradeFilter || sw.grade === gradeFilter
    return matchesSearch && matchesSubject && matchesGrade
  })

  const subjects = [...new Set(schemesOfWork.map(sw => sw.subject))].sort()
  const grades = [...new Set(schemesOfWork.map(sw => sw.grade))].sort()

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Schemes of Work</span>
            </h1>
            <p className="text-gray-600">Generate and manage AI-powered schemes of work for your classes</p>
          </div>
          <Button onClick={() => router.push('/teacher/schemes-of-work/create')} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search schemes of work..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gradient-to-r from-white via-green-50 to-blue-50 border-0 shadow-sm hover:shadow-md transition-all duration-300"
                />
              </div>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="flex h-10 items-center justify-between rounded-md border-0 bg-gradient-to-r from-white via-green-50 to-blue-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="flex h-10 items-center justify-between rounded-md border-0 bg-gradient-to-r from-white via-green-50 to-blue-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-300"
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

        {/* Schemes of Work List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : filteredSchemesOfWork.length === 0 ? (
          <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schemes of work found</h3>
              <p className="text-gray-600 mb-4">
                Create your first scheme of work to get started.
              </p>
              <Button onClick={() => router.push('/teacher/schemes-of-work/create')} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Scheme of Work
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemesOfWork.map((schemeOfWork) => (
              <Card key={schemeOfWork.id} className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {schemeOfWork.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <span className="flex items-center space-x-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>{schemeOfWork.grade}</span>
                          <span>•</span>
                          <span>{schemeOfWork.subject}</span>
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
                        <DropdownMenuItem onClick={() => handleViewSchemeOfWork(schemeOfWork)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditScheme(schemeOfWork)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadScheme('pdf', schemeOfWork)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadScheme('word', schemeOfWork)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Download Word
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(schemeOfWork)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share with Students
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteScheme(schemeOfWork.id)}
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
                      <span>{new Date(schemeOfWork.createdAt).toLocaleDateString()}</span>
                    </div>
                    {schemeOfWork.duration && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{schemeOfWork.duration} weeks</span>
                      </div>
                    )}
                    {schemeOfWork._count && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>{schemeOfWork._count.lessonPlans} lesson plans</span>
                        {schemeOfWork._count.topics && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{schemeOfWork._count.topics} topics</span>
                          </>
                        )}
                      </div>
                    )}
                    {typeof schemeOfWork._count?.sharedWith === 'number' && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Shared with {schemeOfWork._count.sharedWith} students</span>
                      </div>
                    )}
                    {schemeOfWork.topics && schemeOfWork.topics.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2" />
                        <span>Week {Math.max(...schemeOfWork.topics.map(t => t.weekNumber))} of {schemeOfWork.duration || 'N/A'}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        onClick={() => handleViewSchemeOfWork(schemeOfWork)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleShare(schemeOfWork)}
                        variant="outline"
                        className="bg-white/70 hover:bg-white/90"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Scheme of Work Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                {selectedSchemeOfWork?.title}
              </DialogTitle>
              <DialogDescription>
                {selectedSchemeOfWork?.subject} • {selectedSchemeOfWork?.grade}
                <br />
                Created on {selectedSchemeOfWork ? new Date(selectedSchemeOfWork.createdAt).toLocaleDateString() : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedSchemeOfWork?.content?.generatedContent || selectedSchemeOfWork?.content ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Scheme of Work Content</h4>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {selectedSchemeOfWork.content?.generatedContent || 
                       'No content available'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No content available for this scheme of work.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                onClick={() => selectedSchemeOfWork && handleEditSchemeOfWork(selectedSchemeOfWork)}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => selectedSchemeOfWork && handleShare(selectedSchemeOfWork)}
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
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
                Share Scheme of Work
              </DialogTitle>
              <DialogDescription>
                Share "{schemeToShare?.title}" with your students
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
                    <SelectValue placeholder={classes.length > 0 ? "Select a class" : "No classes available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.grade}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-classes" disabled>
                        No classes found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Or Share with Individual Students */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Or Share with Individual Students
                </label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                  {students.length > 0 ? (
                    students.map((student) => (
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
                          {student.user?.firstName} {student.user?.lastName} - {student.class?.name || student.grade}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No students found</p>
                      <p className="text-xs">Make sure you have enrolled students in your classes</p>
                    </div>
                  )}
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

        {/* Create Scheme Modal removed; navigation now goes to dedicated create page */}

        {/* Edit Scheme Modal */}
        <SchemeOfWorkModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingScheme(null)
          }}
          onSave={handleUpdateScheme}
          initialData={editingScheme}
          isEditing={true}
        />
      </div>
  )
}