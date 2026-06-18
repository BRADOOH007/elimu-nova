'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  GraduationCap,
  FileText,
  MoreHorizontal,
  Loader2,
  Users,
  Send,
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

interface LessonPlan {
  id: string
  title: string
  subject: string
  grade: string
  content: any
  createdAt: string
  updatedAt: string
  isShared?: boolean
  schemeOfWork?: { id: string; title: string }
}

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
  generatedContent: string
  objectives?: string[]
  topics?: string[]
  duration?: number
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
  _count?: { lessonPlans: number; topics: number; sharedWith?: number }
}

export default function PlanningPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('lesson-plans')

  // Lesson Plans State
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [lessonPlansLoading, setLessonPlansLoading] = useState(true)
  const [lessonPlanSearch, setLessonPlanSearch] = useState('')
  const [lessonPlanSubjectFilter, setLessonPlanSubjectFilter] = useState('')
  const [lessonPlanGradeFilter, setLessonPlanGradeFilter] = useState('')

  // Schemes of Work State
  const [schemesOfWork, setSchemesOfWork] = useState<SchemeOfWork[]>([])
  const [schemesLoading, setSchemesLoading] = useState(true)
  const [schemeSearch, setSchemeSearch] = useState('')
  const [schemeSubjectFilter, setSchemeSubjectFilter] = useState('')
  const [schemeGradeFilter, setSchemeGradeFilter] = useState('')

  // Common Modal State
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null)
  const [selectedScheme, setSelectedScheme] = useState<SchemeOfWork | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [itemToShare, setItemToShare] = useState<LessonPlan | SchemeOfWork | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [sharing, setSharing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<LessonPlan | SchemeOfWork | null>(null)

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonsRes, schemesRes, studentsRes, classesRes] = await Promise.all([
          fetch('/api/lesson-plans'),
          fetch('/api/schemes-of-work'),
          fetch('/api/teacher/students'),
          fetch('/api/teacher/classes')
        ])

        if (lessonsRes.ok) setLessonPlans((await lessonsRes.json()).lessonPlans || [])
        if (schemesRes.ok) setSchemesOfWork((await schemesRes.json()).schemesOfWork || [])
        if (studentsRes.ok) setStudents((await studentsRes.json()).students || [])
        if (classesRes.ok) setClasses((await classesRes.json()).classes || [])
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLessonPlansLoading(false)
        setSchemesLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtering
  const filteredLessonPlans = lessonPlans.filter(lp => {
    const matchesSearch = lp.title.toLowerCase().includes(lessonPlanSearch.toLowerCase()) ||
                         lp.subject.toLowerCase().includes(lessonPlanSearch.toLowerCase()) ||
                         lp.grade.toLowerCase().includes(lessonPlanSearch.toLowerCase())
    const matchesSubject = !lessonPlanSubjectFilter || lp.subject === lessonPlanSubjectFilter
    const matchesGrade = !lessonPlanGradeFilter || lp.grade === lessonPlanGradeFilter
    return matchesSearch && matchesSubject && matchesGrade
  })

  const filteredSchemes = schemesOfWork.filter(sw => {
    const matchesSearch = sw.title.toLowerCase().includes(schemeSearch.toLowerCase()) ||
                         sw.subject.toLowerCase().includes(schemeSearch.toLowerCase()) ||
                         sw.grade.toLowerCase().includes(schemeSearch.toLowerCase())
    const matchesSubject = !schemeSubjectFilter || sw.subject === schemeSubjectFilter
    const matchesGrade = !schemeGradeFilter || sw.grade === schemeGradeFilter
    return matchesSearch && matchesSubject && matchesGrade
  })

  const lessonSubjects = [...new Set(lessonPlans.map(lp => lp.subject))].sort()
  const lessonGrades = [...new Set(lessonPlans.map(lp => lp.grade))].sort()
  const schemeSubjects = [...new Set(schemesOfWork.map(sw => sw.subject))].sort()
  const schemeGrades = [...new Set(schemesOfWork.map(sw => sw.grade))].sort()

  // Actions
  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const isLesson = 'schemeOfWork' in itemToDelete
      const url = isLesson 
        ? `/api/lesson-plans/${itemToDelete.id}` 
        : `/api/schemes-of-work/${itemToDelete.id}`
      
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) {
        if (isLesson) {
          setLessonPlans(prev => prev.filter(lp => lp.id !== itemToDelete.id))
          toast({ title: 'Lesson Plan Deleted', variant: 'success' })
        } else {
          setSchemesOfWork(prev => prev.filter(sw => sw.id !== itemToDelete.id))
          toast({ title: 'Scheme of Work Deleted', variant: 'success' })
        }
        setItemToDelete(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleShare = async () => {
    if (!itemToShare) return
    setSharing(true)
    try {
      const isLesson = 'schemeOfWork' in itemToShare
      const url = isLesson 
        ? '/api/lesson-plans/share' 
        : '/api/schemes-of-work/share'
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [isLesson ? 'lessonPlanId' : 'schemeOfWorkId']: itemToShare.id,
          studentIds: selectedStudents,
          classId: selectedClass || undefined
        })
      })

      if (res.ok) {
        const data = await res.json()
        toast({ 
          title: `${isLesson ? 'Lesson Plan' : 'Scheme'} Shared`, 
          description: `Shared with ${data.sharedCount} students`,
          variant: 'success' 
        })
        setIsShareModalOpen(false)
        setSelectedStudents([])
        setSelectedClass('')
        setItemToShare(null)
      }
    } catch (err) {
      console.error('Share error:', err)
    } finally {
      setSharing(false)
    }
  }

  const handleDownload = async (item: LessonPlan | SchemeOfWork, format?: 'pdf' | 'word') => {
    try {
      const isLesson = 'schemeOfWork' in item
      const url = isLesson 
        ? '/api/export/lesson-plan' 
        : '/api/export/scheme-of-work'
      
      const body = isLesson 
        ? { content: item.content?.generatedContent || '', title: item.title, subject: item.subject, grade: item.grade, topic: item.content?.topic || '', duration: item.content?.duration || 45, format: 'pdf' }
        : { 
            content: item.content?.generatedContent || '', 
            title: item.title, 
            subject: item.subject, 
            grade: item.grade, 
            duration: (item as SchemeOfWork).duration || (item as SchemeOfWork).content?.duration || 12, 
            lessonsPerWeek: 5, 
            lessonDuration: 45, 
            topics: (item as SchemeOfWork).content?.topics || [], 
            format: format || 'pdf' 
          }

      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const blob = await res.blob()
        const urlObj = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = urlObj
        a.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${isLesson ? 'html' : format === 'word' ? 'doc' : 'html'}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(urlObj)
      }
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Planning</span>
          </h1>
          <p className="text-gray-600">Manage lesson plans and schemes of work</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'lesson-plans' && <DocumentUploadButton docType="lesson-plan" />}
          {activeTab === 'schemes-of-work' && (
            <>
              <DocumentUploadButton docType="scheme-of-work" />
              <DocumentUploadButton docType="curriculum" label="Upload Curriculum" />
            </>
          )}
          <Button 
            onClick={() => router.push(`/teacher/${activeTab}/create`)} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create {activeTab === 'lesson-plans' ? 'Lesson Plan' : 'Scheme of Work'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-2">
          <TabsTrigger value="lesson-plans">
            <BookOpen className="w-4 h-4 mr-2" />
            Lesson Plans
          </TabsTrigger>
          <TabsTrigger value="schemes-of-work">
            <FileText className="w-4 h-4 mr-2" />
            Schemes of Work
          </TabsTrigger>
        </TabsList>

        {/* Lesson Plans Tab */}
        <TabsContent value="lesson-plans" className="space-y-6">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search lesson plans..."
                    value={lessonPlanSearch}
                    onChange={(e) => setLessonPlanSearch(e.target.value)}
                    className="pl-10 bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm"
                  />
                </div>
                <select
                  value={lessonPlanSubjectFilter}
                  onChange={(e) => setLessonPlanSubjectFilter(e.target.value)}
                  className="flex h-10 items-center justify-between rounded-md border-0 bg-gradient-to-r from-white via-blue-50 to-purple-50 px-3 py-2 text-sm"
                >
                  <option value="">All Subjects</option>
                  {lessonSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={lessonPlanGradeFilter}
                  onChange={(e) => setLessonPlanGradeFilter(e.target.value)}
                  className="flex h-10 items-center justify-between rounded-md border-0 bg-gradient-to-r from-white via-blue-50 to-purple-50 px-3 py-2 text-sm"
                >
                  <option value="">All Grades</option>
                  {lessonGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <Button
                  variant="outline"
                  onClick={() => { setLessonPlanSearch(''); setLessonPlanSubjectFilter(''); setLessonPlanGradeFilter('') }}
                  className="bg-white"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {lessonPlansLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLessonPlans.length === 0 ? (
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50">
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plans found</h3>
                <Button 
                  onClick={() => router.push('/teacher/lesson-plans/create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Lesson Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessonPlans.map(lp => (
                <Card key={lp.id} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2">{lp.title}</CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>{lp.grade} • {lp.subject}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedLessonPlan(lp); setIsViewModalOpen(true) }}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/teacher/lesson-plans/edit/${lp.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setItemToShare(lp); setIsShareModalOpen(true) }}>
                            <Share2 className="mr-2 h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(lp)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => { setItemToDelete(lp); }} 
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created {new Date(lp.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">{lp.subject}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedLessonPlan(lp); setIsViewModalOpen(true) }}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Schemes of Work Tab */}
        <TabsContent value="schemes-of-work" className="space-y-6">
          <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search schemes..."
                    value={schemeSearch}
                    onChange={(e) => setSchemeSearch(e.target.value)}
                    className="pl-10 bg-gradient-to-r from-white via-green-50 to-blue-50 border-0 shadow-sm"
                  />
                </div>
                <select
                  value={schemeSubjectFilter}
                  onChange={(e) => setSchemeSubjectFilter(e.target.value)}
                  className="flex h-10 items-center justify-between rounded-md border-0 bg-gradient-to-r from-white via-green-50 to-blue-50 px-3 py-2 text-sm"
                >
                  <option value="">All Subjects</option>
                  {schemeSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={schemeGradeFilter}
                  onChange={(e) => setSchemeGradeFilter(e.target.value)}
                  className="flex h-10 items-center justify-between rounded-md border-0 bg-gradient-to-r from-white via-green-50 to-blue-50 px-3 py-2 text-sm"
                >
                  <option value="">All Grades</option>
                  {schemeGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <Button
                  variant="outline"
                  onClick={() => { setSchemeSearch(''); setSchemeSubjectFilter(''); setSchemeGradeFilter('') }}
                  className="bg-white"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {schemesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : filteredSchemes.length === 0 ? (
            <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50">
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No schemes of work found</h3>
                <Button 
                  onClick={() => router.push('/teacher/schemes-of-work/create')}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Scheme
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchemes.map(sw => (
                <Card key={sw.id} className="bg-gradient-to-br from-white via-green-50 to-blue-50 hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2">{sw.title}</CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{sw.grade} • {sw.subject}</span>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedScheme(sw); setIsViewModalOpen(true) }}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/teacher/schemes-of-work/edit/${sw.id}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(sw, 'pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(sw, 'word')}>
                            <FileText className="mr-2 h-4 w-4" /> Download Word
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setItemToShare(sw); setIsShareModalOpen(true) }}>
                            <Share2 className="mr-2 h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => { setItemToDelete(sw); }} 
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created {new Date(sw.createdAt).toLocaleDateString()}
                      </div>
                      {sw._count && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {sw._count.lessonPlans} lesson plans
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                          onClick={() => { setSelectedScheme(sw); setIsViewModalOpen(true) }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                        <Button
                          onClick={() => { setItemToShare(sw); setIsShareModalOpen(true) }}
                          variant="outline"
                        >
                          <Share2 className="w-4 h-4 mr-2" /> Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLessonPlan && <BookOpen className="h-5 w-5" />}
              {selectedScheme && <FileText className="h-5 w-5" />}
              {selectedLessonPlan?.title || selectedScheme?.title}
            </DialogTitle>
            <DialogDescription>
              {(selectedLessonPlan?.subject || selectedScheme?.subject)} • {(selectedLessonPlan?.grade || selectedScheme?.grade)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Content</h4>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedLessonPlan?.content?.generatedContent || selectedLessonPlan?.content?.content || selectedLessonPlan?.content ||
                   selectedScheme?.content?.generatedContent || 'No content available'}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {selectedLessonPlan && (
                <>
                  <Button variant="outline" onClick={() => handleDownload(selectedLessonPlan)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Button
                    onClick={() => router.push(`/teacher/lesson-plans/edit/${selectedLessonPlan.id}`)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </>
              )}
              {selectedScheme && (
                <>
                  <Button
                    onClick={() => router.push(`/teacher/schemes-of-work/edit/${selectedScheme.id}`)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete && ('schemeOfWork' in itemToDelete ? 'Lesson Plan' : 'Scheme of Work')}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setItemToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" /> Delete</>
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
              Share {itemToShare && ('schemeOfWork' in itemToShare ? 'Lesson Plan' : 'Scheme of Work')}
            </DialogTitle>
            <DialogDescription>
              Share "{itemToShare?.title}" with your students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Share with Entire Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder={classes.length > 0 ? "Select a class" : "No classes available"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name} - {cls.grade}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>No classes found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Or Share with Individual Students</label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                {students.length > 0 ? (
                  students.map(student => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedStudents(prev => [...prev, student.id])
                          else setSelectedStudents(prev => prev.filter(id => id !== student.id))
                        }}
                      />
                      <label htmlFor={student.id} className="text-sm font-medium">
                        {student.user?.firstName} {student.user?.lastName} - {student.class?.name || student.grade}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No students found</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsShareModalOpen(false)} disabled={sharing}>
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={sharing || (!selectedClass && selectedStudents.length === 0)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {sharing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sharing...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Share</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
