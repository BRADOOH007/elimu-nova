'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const MarksTab   = dynamic(() => import('@/app/teacher/marks/page'),    { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })
const ExamBkTab  = dynamic(() => import('@/app/teacher/exam-bank/page'), { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  ClipboardList, Plus, Search, Filter, Calendar, Clock, User, MoreHorizontal,
  Eye, Edit, Trash2, Download, Users, CheckCircle, AlertCircle, FileText,
  Brain,   GraduationCap, Database, Lightbulb, Play
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import CreateAssignmentModal from '@/components/modals/create-assignment-modal'
import EditAssignmentModal from '@/components/modals/edit-assignment-modal'
import ViewAssignmentModal from '@/components/modals/view-assignment-modal'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import AIGeneratorModal from '@/components/modals/ai-generator-modal'

interface Assignment {
  id: string
  title: string
  description: string
  content: string
  dueDate: string
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE'
  createdAt: string
  updatedAt: string
  teacher: {
    id: string
    name: string
    email: string
  }
  lessonPlan?: {
    id: string
    title: string
    subject: string
    grade: string
  }
  students: Array<{
    id: string
    name: string
  }>
  submissions: Array<{
    id: string
    content: string
    attachments: string[]
    grade?: number
    feedback?: string
    submittedAt: string
    gradedAt?: string
    student: {
      id: string
      name: string
    }
  }>
  stats: {
    totalStudents: number
    totalSubmissions: number
    gradedSubmissions: number
    pendingSubmissions: number
  }
  videoUrl?: string | null
  videoProvider?: string | null
  videoDuration?: number | null
}

interface Exam {
  id: string
  title: string
  subject: string
  grade: string
  description: string
  date: string
  duration: number
  status: 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED'
  createdAt: string
  updatedAt: string
  questions?: Array<any>
  stats?: {
    totalStudents: number
    completed: number
    averageGrade: number
  }
}

export default function AssessmentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('assignments')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [examsLoading, setExamsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all')
  const [examSearch, setExamSearch] = useState('')
  const [examStatusFilter, setExamStatusFilter] = useState('all')
  const [assignmentPage, setAssignmentPage] = useState(1)
  const [assignmentTotalPages, setAssignmentTotalPages] = useState(1)
  const [assignmentTotal, setAssignmentTotal] = useState(0)
  const ASSIGNMENTS_PAGE_SIZE = 20
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleAssignmentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setAssignmentSearch(value)
      setAssignmentPage(1)
    }, 300)
  }

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createInitialData, setCreateInitialData] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [viewAssignmentId, setViewAssignmentId] = useState<string | null>(null)

  // Suggest
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const suggestRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = async () => {
    setSuggestLoading(true)
    try {
      const r = await fetch('/api/lesson-plans?limit=10&sort=recent')
      if (r.ok) {
        const data = await r.json()
        const topics = (data.lessonPlans || []).map((lp: any) => lp.title).filter(Boolean)
        const uniq = [...new Set<string>(topics)]
        setSuggestions(uniq.length > 0 ? uniq : ['Review Quiz', 'End of Topic Test', 'Homework Practice', 'Group Discussion Task'])
      } else {
        setSuggestions(['Review Quiz', 'End of Topic Test', 'Homework Practice', 'Group Discussion Task'])
      }
    } catch {
      setSuggestions(['Review Quiz', 'End of Topic Test', 'Homework Practice', 'Group Discussion Task'])
    } finally {
      setSuggestLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggest(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // "Use Exam" from Exam Bank: prefill the create modal from sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('fromBank')) return
    let prefill: Record<string, unknown> | null = null
    try { prefill = JSON.parse(sessionStorage.getItem('examBankSelection') || 'null') } catch {}
    if (prefill) {
      setCreateInitialData(prefill)
      setShowCreateModal(true)
      setActiveTab('exams')
    }
    try { sessionStorage.removeItem('examBankSelection') } catch {}
    const url = new URL(window.location.href)
    url.searchParams.delete('fromBank')
    window.history.replaceState({}, '', url)
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: String(assignmentPage),
          limit: String(ASSIGNMENTS_PAGE_SIZE),
          ...(assignmentSearch && { search: assignmentSearch }),
          ...(assignmentStatusFilter !== 'all' && { status: assignmentStatusFilter })
        })
        const assignmentsRes = await fetch(`/api/assignments?${params}`)
        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json()
          setAssignments(data.assignments || [])
          if (data.pagination) {
            setAssignmentTotalPages(data.pagination.totalPages)
            setAssignmentTotal(data.pagination.total)
          }
        }
      } catch (error) {
        console.error('Error fetching assignments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [assignmentSearch, assignmentStatusFilter, assignmentPage])

  // Fetch scheduled exams (assignments that were scheduled from the exam generator)
  useEffect(() => {
    if (activeTab !== 'exams') return
    setExamsLoading(true)
    fetch('/api/assignments?type=EXAM')
      .then(r => r.ok ? r.json() : { assignments: [] })
      .then(d => {
        const examAssignments = (d.assignments || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          subject: a.subject || '',
          grade: a.grade || '',
          description: a.description || '',
          date: a.dueDate,
          duration: a.timeLimit || 60,
          status: a.status === 'GRADED' ? 'COMPLETED' : a.status === 'PENDING' ? 'SCHEDULED' : 'DRAFT',
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          stats: {
            totalStudents: a.stats?.totalStudents || 0,
            completed: a.stats?.gradedSubmissions || 0,
            averageGrade: a.stats?.averageGrade || 0,
          }
        }))
        setExams(examAssignments)
      })
      .catch(() => setExams([]))
      .finally(() => setExamsLoading(false))
  }, [activeTab])

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(examSearch.toLowerCase()) || 
                         exam.subject.toLowerCase().includes(examSearch.toLowerCase()) || 
                         exam.grade.toLowerCase().includes(examSearch.toLowerCase())
    const matchesStatus = examStatusFilter === 'all' || exam.status === examStatusFilter
    return matchesSearch && matchesStatus
  })

  // Handle exam delete
  const handleDeleteExam = (id: string) => {
    setExams(exams.filter(e => e.id !== id))
    toast({ title: 'Exam Deleted Successfully', variant: 'success' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'SUBMITTED':
      case 'SCHEDULED':
      case 'ONGOING':
        return 'bg-blue-100 text-blue-800'
      case 'GRADED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'DRAFT':
      case 'SCHEDULED':
        return <Clock className="w-4 h-4" />
      case 'SUBMITTED':
      case 'ONGOING':
        return <FileText className="w-4 h-4" />
      case 'GRADED':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const handleCreateNew = () => {
    setShowCreateModal(true)
  }

  const handleView = (id: string) => {
    setViewAssignmentId(id)
    setShowViewModal(true)
  }

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssignments(assignments.filter(a => a.id !== id))
        toast({
          title: "Assessment Deleted Successfully",
          description: "The assessment has been permanently removed.",
          variant: "default",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.error || "Unable to delete assessment. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }

  const handleAssignmentCreated = () => {
    setShowCreateModal(false)
    // Refetch instead of full page reload
    setLoading(true)
    fetch(`/api/assignments`)
      .then(r => r.ok ? r.json() : { assignments: [] })
      .then(d => setAssignments(d.assignments || []))
      .finally(() => setLoading(false))
  }

  const handleAssignmentUpdated = () => {
    setShowEditModal(false)
    setSelectedAssignment(null)
    setLoading(true)
    fetch(`/api/assignments`)
      .then(r => r.ok ? r.json() : { assignments: [] })
      .then(d => setAssignments(d.assignments || []))
      .finally(() => setLoading(false))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Assessments</span>
          </h1>
          <p className="text-gray-600">Manage assignments and exams for your students</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative" ref={suggestRef}>
            <Button
              onClick={() => { if (!showSuggest) fetchSuggestions(); setShowSuggest(!showSuggest) }}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Suggest Ideas</span>
            </Button>
            {showSuggest && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white border rounded-lg shadow-xl z-50 p-2">
                <div className="text-xs font-medium text-gray-500 px-2 py-1.5">Suggested Topics</div>
                {suggestLoading ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                ) : (
                  <div className="space-y-0.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCreateInitialData({ title: s, subject: '', grade: '' })
                          setShowCreateModal(true)
                          setShowSuggest(false)
                        }}
                        className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowAIGenerator(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Brain className="w-4 h-4" />
            <span>AI Generator</span>
          </Button>
          <Button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create {activeTab === 'assignments' ? 'Assignment' : 'Exam'}</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-4">
          <TabsTrigger value="assignments"><ClipboardList className="w-4 h-4 mr-2" />Assignments</TabsTrigger>
          <TabsTrigger value="exams"><GraduationCap className="w-4 h-4 mr-2" />Exams</TabsTrigger>
          <TabsTrigger value="marks"><Brain className="w-4 h-4 mr-2" />Marks</TabsTrigger>
          <TabsTrigger value="exambank"><Database className="w-4 h-4 mr-2" />Exam Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search assignments..."
                      value={assignmentSearch}
                      onChange={handleAssignmentSearchChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={assignmentStatusFilter}
                    onChange={(e) => { setAssignmentStatusFilter(e.target.value); setAssignmentPage(1) }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="GRADED">Graded</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => { setAssignmentSearch(''); setAssignmentStatusFilter('all'); setAssignmentPage(1) }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">
                        {assignment.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(assignment.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(assignment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(assignment.status)}>
                          {getStatusIcon(assignment.status)}
                          <span className="ml-1">{assignment.status}</span>
                        </Badge>
                        {assignment.videoUrl && (
                          <Badge variant="outline" className="flex items-center gap-1 text-violet-600 border-violet-300 bg-violet-50">
                            <Play className="w-3 h-3 fill-violet-500" />
                            Video
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-blue-500" />
                        <span>{assignment.stats.totalStudents} Students</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-green-500" />
                        <span>{assignment.stats.totalSubmissions} Submissions</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {assignment.stats.totalStudents > 0
                            ? `${Math.round((assignment.stats.totalSubmissions / assignment.stats.totalStudents) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: assignment.stats.totalStudents > 0
                              ? `${Math.min(100, Math.round((assignment.stats.totalSubmissions / assignment.stats.totalStudents) * 100))}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

            {assignments.length > 0 && assignmentTotalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                <p className="text-sm text-gray-600">
                  Page {assignmentPage} of {assignmentTotalPages} ({assignmentTotal} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setAssignmentPage(p => Math.max(1, p - 1))}
                    disabled={assignmentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">Page {assignmentPage}</span>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setAssignmentPage(p => Math.min(assignmentTotalPages, p + 1))}
                    disabled={assignmentPage >= assignmentTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {assignments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments found</h3>
                <p className="text-gray-600 mb-6">
                  {assignmentSearch || assignmentStatusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first assignment to get started'
                  }
                </p>
                {!assignmentSearch && assignmentStatusFilter === 'all' && (
                  <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="exams" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search exams..."
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={examStatusFilter}
                    onChange={(e) => setExamStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <Button variant="outline" onClick={() => { setExamSearch(''); setExamStatusFilter('all') }}>
                    <Filter className="w-4 h-4 mr-2" />Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {examsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExams.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{exam.title}</CardTitle>
                          <CardDescription className="mt-2 line-clamp-2">{exam.description || `${exam.subject} · ${exam.grade}`}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setViewAssignmentId(exam.id); setShowViewModal(true) }}>
                              <Eye className="w-4 h-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteExam(exam.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(exam.status)}>
                            {getStatusIcon(exam.status)}
                            <span className="ml-1">{exam.status}</span>
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(exam.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <GraduationCap className="w-4 h-4 mr-2 text-blue-500" />
                            <span>{exam.grade || '—'}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-green-500" />
                            <span>{exam.duration} min</span>
                          </div>
                        </div>
                        {exam.stats && exam.stats.totalStudents > 0 && (
                          <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                            {exam.stats.completed}/{exam.stats.totalStudents} completed
                            {exam.stats.averageGrade > 0 && ` · Avg ${Math.round(exam.stats.averageGrade)}%`}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredExams.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled exams</h3>
                    <p className="text-gray-600 mb-6">
                      {examSearch || examStatusFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Generate an exam in AI Tools and click "Schedule for Students" to see it here'
                      }
                    </p>
                    {!examSearch && examStatusFilter === 'all' && (
                      <Button
                        onClick={() => router.push('/teacher/ai-tools')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Go to AI Exam Generator
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="marks"><MarksTab /></TabsContent>
        <TabsContent value="exambank"><ExamBkTab /></TabsContent>

      </Tabs>

      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateInitialData(null) }}
        onSuccess={handleAssignmentCreated}
        initialData={createInitialData}
      />

      <EditAssignmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        assignment={selectedAssignment}
        onSuccess={handleAssignmentUpdated}
      />

      <ViewAssignmentModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        assignmentId={viewAssignmentId}
        onEdit={(assignment) => {
          setShowViewModal(false)
          handleEdit(assignment)
        }}
        onDelete={(id) => {
          setShowViewModal(false)
          handleDelete(id)
        }}
      />

      {showAIGenerator && (
        <AIGeneratorModal
          isOpen={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
          onSuccess={(result) => {
            if (result.type === 'assignment' || result.type === 'exam') {
              setCreateInitialData({
                title: result.title,
                content: result.content,
                subject: result.subject,
                grade: result.grade,
                topic: result.topic,
              })
              setShowCreateModal(true)
            }
          }}
        />
      )}
    </div>
  )
}
