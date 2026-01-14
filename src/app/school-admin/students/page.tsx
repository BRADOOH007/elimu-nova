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
  User,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  ArrowLeft,
  Loader2,
  GraduationCap
} from "lucide-react"
import EnrollStudentModal from "@/components/modals/enroll-student-modal"
import EditStudentModal from "@/components/modals/edit-student-modal"
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  name: string
  email: string
  teacher: string
  class?: string
  status: string
  joinDate: string
  phone?: string
  address?: string
  grade?: string
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/school-admin/students')
      
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        console.error('Failed to fetch students')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollSuccess = () => {
    fetchStudents()
    setIsEnrollModalOpen(false)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchStudents()
    setIsEditModalOpen(false)
    setSelectedStudent(null)
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const response = await fetch(`/api/school-admin/students/${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setStudents(students.filter(student => student.id !== studentId))
      } else {
        console.error('Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }

  const handleToggleStatus = async (studentId: string, currentStatus: string) => {
    try {
      const response = await fetch(`/api/school-admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: currentStatus === 'Inactive'
        })
      })

      if (response.ok) {
        fetchStudents()
      } else {
        console.error('Failed to update student status')
      }
    } catch (error) {
      console.error('Error updating student status:', error)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && student.status === 'Active') ||
                         (statusFilter === 'inactive' && student.status === 'Inactive')
    
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
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
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
              <span className="edugenius-text-gradient">Students Management</span>
            </h1>
            <p className="text-gray-600">Manage students and their information</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search students by name, email, or teacher..."
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
            Enroll Student
          </Button>
        </div>
      </div>

      {/* Students Table */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="edugenius-text-gradient-blue">Students List</CardTitle>
          <CardDescription>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-none">
                    <TableHead className="border-none">Student</TableHead>
                    <TableHead className="border-none">Email</TableHead>
                    <TableHead className="border-none">Teacher</TableHead>
                    <TableHead className="border-none">Class</TableHead>
                    <TableHead className="border-none">Status</TableHead>
                    <TableHead className="border-none">Join Date</TableHead>
                    <TableHead className="border-none">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="border-none hover:bg-blue-50/50">
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            {student.phone && (
                              <p className="text-sm text-gray-500">{student.phone}</p>
                            )}
                            {student.grade && (
                              <p className="text-xs text-blue-600 font-medium">Grade {student.grade}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{student.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{student.teacher}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        {student.class ? (
                          <span className="text-sm font-medium text-blue-600">{student.class}</span>
                        ) : (
                          <span className="text-sm text-gray-400">No class</span>
                        )}
                      </TableCell>
                      <TableCell className="border-none">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          student.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.status}
                        </span>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(student.joinDate)}</span>
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
                            <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(student.id, student.status)}
                            >
                              {student.status === 'Active' ? (
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
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by enrolling your first student'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Button 
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="edugenius-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enroll First Student
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={handleEnrollSuccess}
        classes={[]}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedStudent(null)
        }}
        onSuccess={handleEditSuccess}
        student={selectedStudent}
        classes={[]}
      />
    </div>
  )
}
