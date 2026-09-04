'use client'

import { useToast } from '@/hooks/use-toast'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  Download,
  Brain,
  Target,
  FileText,
  Calendar,
  GraduationCap,
  MoreHorizontal,
  Loader2,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  content: SchemeOfWorkContent
  duration?: number
  objectives?: string
  createdAt: string
  updatedAt: string
  teacher?: {
    user: {
      name: string;
    };
  };
  _count?: {
    lessonPlans: number;
  };
}

interface SharedSchemeOfWork {
  id: string;
  schemeOfWorkId: string;
  studentId: string;
  teacherId: string;
  schoolId: string;
  sharedAt: string;
  schemeOfWork: SchemeOfWork;
}

export default function StudentSchemesOfWorkPage() {
  const { toast } = useToast()
  const [sharedSchemesOfWork, setSharedSchemesOfWork] = useState<SharedSchemeOfWork[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [selectedSchemeOfWork, setSelectedSchemeOfWork] = useState<SharedSchemeOfWork | null>(null)
  const [isViewModalOpen, setViewModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchSharedSchemesOfWork = async () => {
      try {
        const response = await fetch('/api/schemes-of-work/share')
        if (response.ok) {
          const data = await response.json()
          setSharedSchemesOfWork(data.sharedSchemesOfWork || [])
        } else {
          console.error('Failed to fetch shared schemes of work:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching shared schemes of work:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSharedSchemesOfWork()
  }, [])

  const handleViewSchemeOfWork = (sharedSchemeOfWork: SharedSchemeOfWork) => {
    setSelectedSchemeOfWork(sharedSchemeOfWork)
    setViewModalOpen(true)
  }

  const handleStartAITutor = (schemeOfWork: any) => {
    const context = {
      schemeOfWork: {
        title: schemeOfWork.title,
        subject: schemeOfWork.subject,
        grade: schemeOfWork.grade,
        content: schemeOfWork.content,
        duration: schemeOfWork.duration,
        objectives: schemeOfWork.objectives
      }
    }
    sessionStorage.setItem('currentSchemeContext', JSON.stringify(context))
    router.push('/student/learn')
  }

  const handleGenerateAssessment = async (schemeOfWork: any) => {
    try {
      const response = await fetch('/api/ai/generate-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonPlan: {
            title: schemeOfWork.title,
            subject: schemeOfWork.subject,
            grade: schemeOfWork.grade,
            content: schemeOfWork.content
          },
          assessmentType: 'mixed',
          questionCount: 15
        }),
      })

      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem('currentAssessment', JSON.stringify(data.assessment))
        toast({ title:'✅ Assessment ready!' })
      } else {
        toast({ variant:'destructive', title:'Failed to generate assessment' })
      }
    } catch (error) {
      console.error('Error generating assessment:', error)
      toast({ variant:'destructive', title:'Failed to generate assessment' })
    }
  }

  const handleGenerateNotes = async (schemeOfWork: any) => {
    try {
      const response = await fetch('/api/ai/generate-lesson-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonPlan: {
            title: schemeOfWork.title,
            subject: schemeOfWork.subject,
            grade: schemeOfWork.grade,
            content: schemeOfWork.content
          },
          noteType: 'comprehensive'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem('currentNotes', JSON.stringify(data.notes))
        toast({ title:'✅ Study notes ready!' })
      } else {
        toast({ variant:'destructive', title:'Failed to generate notes' })
      }
    } catch (error) {
      console.error('Error generating study notes:', error)
      toast({ variant:'destructive', title:'Failed to generate notes' })
    }
  }

  const handleDownloadSchemeOfWork = async (format: 'pdf' | 'word', schemeOfWork: any) => {
    try {
      const response = await fetch('/api/export/scheme-of-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemeOfWorkId: schemeOfWork.id,
          format
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const element = document.createElement('a')
        element.href = url
        element.download = `${schemeOfWork.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-scheme-of-work.${format === 'pdf' ? 'html' : 'doc'}`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        window.URL.revokeObjectURL(url)
      } else {
        toast({ variant:'destructive', title:'Download failed' })
      }
    } catch (error) {
      console.error('Error downloading scheme of work:', error)
      toast({ variant:'destructive', title:'Download failed' })
    }
  }

  const filteredSchemesOfWork = sharedSchemesOfWork.filter(shared => {
    const sw = shared.schemeOfWork;
    const matchesSearch = sw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sw.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sw.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sw.teacher?.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !subjectFilter || sw.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjects = [...new Set(sharedSchemesOfWork.map(shared => shared.schemeOfWork.subject))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">My Schemes of Work</span>
          </h1>
          <p className="text-gray-600">Access schemes of work shared by your teachers</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSubjectFilter('')
              }}
              className="bg-gradient-to-r from-white via-gray-50 to-gray-100 border-0 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schemes of Work Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : filteredSchemesOfWork.length === 0 ? (
        <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schemes of work shared with you yet</h3>
            <p className="text-gray-600 mb-4">
              Your teachers will share schemes of work here. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemesOfWork.map((shared) => (
            <Card key={shared.id} className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {shared.schemeOfWork.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <span className="flex items-center space-x-2 text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4" />
                        <span>{shared.schemeOfWork.grade}</span>
                        <span>•</span>
                        <span>{shared.schemeOfWork.subject}</span>
                      </span>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewSchemeOfWork(shared)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStartAITutor(shared.schemeOfWork)}>
                        <Brain className="mr-2 h-4 w-4" />
                        Start AI Tutor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGenerateAssessment(shared.schemeOfWork)}>
                        <Target className="mr-2 h-4 w-4" />
                        Generate Assessment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGenerateNotes(shared.schemeOfWork)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadSchemeOfWork('pdf', shared.schemeOfWork)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadSchemeOfWork('word', shared.schemeOfWork)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Word
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Shared by {shared.schemeOfWork.teacher?.user.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(shared.sharedAt).toLocaleDateString()}</span>
                  </div>
                  {shared.schemeOfWork.duration && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{shared.schemeOfWork.duration} weeks</span>
                    </div>
                  )}
                  {shared.schemeOfWork._count && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>{shared.schemeOfWork._count.lessonPlans} lesson plans</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      onClick={() => handleViewSchemeOfWork(shared)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleStartAITutor(shared.schemeOfWork)}
                      variant="outline"
                      className="bg-white/70 hover:bg-white/90"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Tutor
                    </Button>
                    <Button
                      onClick={() => handleGenerateAssessment(shared.schemeOfWork)}
                      variant="outline"
                      className="bg-white/70 hover:bg-white/90"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Assessment
                    </Button>
                    <Button
                      onClick={() => handleGenerateNotes(shared.schemeOfWork)}
                      variant="outline"
                      className="bg-white/70 hover:bg-white/90"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Notes
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              {selectedSchemeOfWork?.schemeOfWork.title}
            </DialogTitle>
            <DialogDescription>
              {selectedSchemeOfWork?.schemeOfWork.subject} • {selectedSchemeOfWork?.schemeOfWork.grade}
              <br />
              Shared by {selectedSchemeOfWork?.schemeOfWork.teacher?.user.name || 'N/A'} on {new Date(selectedSchemeOfWork?.sharedAt || '').toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 mt-1">
            {selectedSchemeOfWork?.schemeOfWork.content?.generatedContent ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Scheme of Work Content</h4>
                <div className="lesson-content">
                  <MarkdownRenderer content={selectedSchemeOfWork.schemeOfWork.content.generatedContent} />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No content available for this scheme of work.</p>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              onClick={() => selectedSchemeOfWork && handleStartAITutor(selectedSchemeOfWork.schemeOfWork)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              Start AI Tutor
            </Button>
            <Button
              onClick={() => selectedSchemeOfWork && handleGenerateAssessment(selectedSchemeOfWork.schemeOfWork)}
              variant="outline"
            >
              <Target className="w-4 h-4 mr-2" />
              Generate Assessment
            </Button>
            <Button
              onClick={() => selectedSchemeOfWork && handleGenerateNotes(selectedSchemeOfWork.schemeOfWork)}
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Notes
            </Button>
            <Button
              onClick={() => selectedSchemeOfWork && handleDownloadSchemeOfWork('pdf', selectedSchemeOfWork.schemeOfWork)}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={() => selectedSchemeOfWork && handleDownloadSchemeOfWork('word', selectedSchemeOfWork.schemeOfWork)}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Word
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
