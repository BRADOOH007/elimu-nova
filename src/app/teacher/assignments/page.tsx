'use client'

import { useState, useEffect } from 'react'
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
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Brain,
  GraduationCap
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
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('assignments')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [exams, setExams] = useState<Exam[]>([
    {
      id: '1',
      title: 'Midterm Math Exam',
      subject: 'Mathematics',
      grade: 'Grade 7',
      description: 'Algebra and Geometry assessment',
      date: '2026-06-20',
      duration: 60,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalStudents: 25,
        completed: 0,
        averageGrade: 0
      }
    },
    {
      id: '2',
      title: 'End-of-Term Science Exam',
      subject: 'Science',
      grade: 'Grade 9',
      description: 'Biology and Chemistry assessment',
      date: '2026-06-25',
      duration: 90,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalStudents: 30,
        completed: 0,
        averageGrade: 0
      }
    }
  ])
  const [loading, setLoading] = useState(true)
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all')
  const [examSearch, setExamSearch] = useState('')
  const [examStatusFilter, setExamStatusFilter] = useState('all')
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [viewAssignmentId, setViewAssignmentId] = useState<string | null>(null)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [assignmentsRes] = await Promise.all([
          fetch(`/api/assignments${assignmentSearch || assignmentStatusFilter !== 'all' 
            ? `?${new URLSearchParams({
              ...(assignmentSearch && { search: assignmentSearch }),
              ...(assignmentStatusFilter !== 'all' && { status: assignmentStatusFilter })
            }).toString()}`
            : ''}`)
        ])

        if (assignmentsRes.ok) {
          const data = await assignmentsRes.json()
          setAssignments(data.assignments || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [assignmentSearch, assignmentStatusFilter])

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
          variant: "success",
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
    window.location.reload()
  }

  const handleAssignmentUpdated = () => {
    setShowEditModal(false)
    setSelectedAssignment(null)
    window.location.reload()
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
        <TabsList className="grid w-full sm:w-auto grid-cols-2">
          <TabsTrigger value="assignments">
            <ClipboardList className="w-4 h-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="exams">
            <GraduationCap className="w-4 h-4 mr-2" />
            Exams
          </TabsTrigger>
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
                      onChange={(e) => setAssignmentSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={assignmentStatusFilter}
                    onChange={(e) => setAssignmentStatusFilter(e.target.value)}
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
                    onClick={() => { setAssignmentSearch(''); setAssignmentStatusFilter('all') }}
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
                      <Badge className={getStatusColor(assignment.status)}>
                        {getStatusIcon(assignment.status)}
                        <span className="ml-1">{assignment.status}</span>
                      </Badge>
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
                  <Button
                    variant="outline"
                    onClick={() => { setExamSearch(''); setExamStatusFilter('all') }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {exam.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">
                        {exam.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteExam(exam.id)}
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
                        <span>{exam.grade}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-green-500" />
                        <span>{exam.duration} min</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredExams.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No exams found</h3>
                <p className="text-gray-600 mb-6">
                  {examSearch || examStatusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first exam to get started'
                  }
                </p>
                {!examSearch && examStatusFilter === 'all' && (
                  <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Exam
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleAssignmentCreated}
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
        />
      )}
    </div>
  )
}
