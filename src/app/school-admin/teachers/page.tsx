"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  GraduationCap,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { EnrollTeacherModal } from "@/components/modals/enroll-teacher-modal"
import { EditTeacherModal } from "@/components/modals/edit-teacher-modal"
import { useRouter } from 'next/navigation'

interface Teacher {
  id: string
  name: string
  email: string
  students: number
  status: string
  joinDate: string
  subjects: string[]
  phone?: string
  address?: string
}

export default function TeachersPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/school-admin/teachers')
      
      if (response.ok) {
        const data = await response.json()
        setTeachers(data.teachers || [])
      } else {
        console.error('Failed to fetch teachers')
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollSuccess = () => {
    fetchTeachers()
    setIsEnrollModalOpen(false)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchTeachers()
    setIsEditModalOpen(false)
    setSelectedTeacher(null)
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTeachers(teachers.filter(teacher => teacher.id !== teacherId))
        setSuccessMessage('Teacher deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        const errorData = await response.json()
        const errorMsg = errorData.error || 'Failed to delete teacher'
        setErrorMessage(errorMsg)
        setTimeout(() => setErrorMessage(''), 8000)
        console.error('Failed to delete teacher:', errorMsg)
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      setErrorMessage('Network error occurred while deleting teacher')
      setTimeout(() => setErrorMessage(''), 8000)
    }
  }

  const handleToggleStatus = async (teacherId: string, currentStatus: string) => {
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: currentStatus === 'Inactive'
        })
      })

      if (response.ok) {
        fetchTeachers()
      } else {
        console.error('Failed to update teacher status')
      }
    } catch (error) {
      console.error('Error updating teacher status:', error)
    }
  }

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && teacher.status === 'Active') ||
                         (statusFilter === 'inactive' && teacher.status === 'Inactive')
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading teachers...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Notifications */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border-0 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setErrorMessage('')}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border-0 text-green-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage('')}
                className="text-green-400 hover:text-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="edugenius-text-gradient">Teachers Management</span>
            </h1>
            <p className="text-gray-600">Manage teachers and their information</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search teachers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsEnrollModalOpen(true)}
            className="edugenius-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Enroll Teacher
          </Button>
        </div>
      </div>

      {/* Teachers Table */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="edugenius-text-gradient-blue">Teachers List</CardTitle>
          <CardDescription>
            {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-none">
                    <TableHead className="border-none">Teacher</TableHead>
                    <TableHead className="border-none">Email</TableHead>
                    <TableHead className="border-none">Students</TableHead>
                    <TableHead className="border-none">Status</TableHead>
                    <TableHead className="border-none">Join Date</TableHead>
                    <TableHead className="border-none">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="border-none hover:bg-blue-50/50">
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{teacher.name}</p>
                            {teacher.phone && (
                              <p className="text-sm text-gray-500">{teacher.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{teacher.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{teacher.students}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          teacher.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {teacher.status}
                        </span>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(teacher.joinDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTeacher(teacher)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(teacher.id, teacher.status)}
                            >
                              {teacher.status === 'Active' ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className={`${teacher.students > 0 || teacher.subjects?.length > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'}`}
                              disabled={teacher.students > 0 || teacher.subjects?.length > 0}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {teacher.students > 0 || teacher.subjects?.length > 0 ? 'Cannot Delete (Has Students/Classes)' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No teachers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by enrolling your first teacher'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Button 
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="edugenius-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll First Teacher
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EnrollTeacherModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={handleEnrollSuccess}
      />

      <EditTeacherModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedTeacher(null)
        }}
        onSuccess={handleEditSuccess}
        teacher={selectedTeacher}
      />
    </div>
  )
}
