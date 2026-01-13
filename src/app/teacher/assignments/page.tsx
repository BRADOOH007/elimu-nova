'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Brain
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

export default function AssignmentsPage() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [viewAssignmentId, setViewAssignmentId] = useState<string | null>(null)

  // Fetch assignments from API
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (statusFilter !== 'all') params.append('status', statusFilter)
        
        const response = await fetch(`/api/assignments?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setAssignments(data.assignments || [])
        } else {
          console.error('Failed to fetch assignments')
        }
      } catch (error) {
        console.error('Error fetching assignments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'GRADED': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'SUBMITTED': return <FileText className="w-4 h-4" />
      case 'GRADED': return <CheckCircle className="w-4 h-4" />
      case 'OVERDUE': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
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
          title: "Assignment Deleted Successfully",
          description: "The assignment has been permanently removed.",
          variant: "success",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.error || "Unable to delete assignment. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }

  const handleAssignmentCreated = () => {
    setShowCreateModal(false)
    // Refresh assignments
    window.location.reload()
  }

  const handleAssignmentUpdated = () => {
    setShowEditModal(false)
    setSelectedAssignment(null)
    // Refresh assignments
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">Create and manage assignments for your students</p>
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
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="GRADED">Graded</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Grid */}
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
                {/* Status and Due Date */}
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

                {/* Stats */}
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

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round((assignment.stats.totalSubmissions / assignment.stats.totalStudents) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(assignment.stats.totalSubmissions / assignment.stats.totalStudents) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {assignments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first assignment to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
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