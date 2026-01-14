'use client'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Loader2,
  GraduationCap,
  BookOpen,
  School,
  UserPlus,
  Settings,
  Eye,
  Key,
  Copy,
  Lock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import CreateClassModal from "@/components/modals/create-class-modal"
import EnrollStudentModal from "@/components/modals/enroll-student-modal"
import EditStudentModal from "@/components/modals/edit-student-modal"
import ViewStudentModal from "@/components/modals/view-student-modal"
import ViewStudentPasswordModal from "@/components/modals/view-student-password-modal"
import ShareLessonPlanModal from "@/components/modals/share-lesson-plan-modal"
import GeneratePasswordModal from "@/components/modals/generate-password-modal"

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: string
  joinDate: string
  class?: {
    id: string
    name: string
    subject: string
    grade: string
  }
  credentials?: {
    username: string
    password: string
  }
}

interface Class {
  id: string
  name: string
  subject: string
  grade: string
  description?: string
  studentCount: number
  createdAt: string
  isActive: boolean
}

export default function TeacherStudentsPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('students')
  
  // Modal states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showViewPasswordModal, setShowViewPasswordModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    await Promise.all([
      fetchStudents(),
      fetchClasses()
    ])
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teacher/students')
      
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

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes')
      
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      } else {
        console.error('Failed to fetch classes')
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const handleEnrollSuccess = () => {
    fetchData()
    setShowEnrollModal(false)
  }

  const handleClassSuccess = () => {
    fetchClasses()
    setShowCreateClassModal(false)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowEditModal(true)
  }

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowViewModal(true)
  }

  const handleEditSuccess = () => {
    fetchData()
    setShowEditModal(false)
    setSelectedStudent(null)
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/teacher/students/${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchStudents()
        toast({
          title: "Student Deleted Successfully",
          description: "The student has been permanently removed.",
          variant: "success",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.error || "Unable to delete student. Please try again.",
        })
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Network error occurred. Please check your connection and try again.",
      })
    }
  }

  const handleViewPassword = (student: Student) => {
    setSelectedStudent(student)
    setShowViewPasswordModal(true)
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    const matchesClass = classFilter === 'all' || student.class?.id === classFilter
    
    return matchesSearch && matchesStatus && matchesClass
  })

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Students</span>
          </h1>
          <p className="text-gray-600">Manage your students and classes</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowCreateClassModal(true)}
            variant="outline"
            className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
          <Button 
            onClick={() => setShowEnrollModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll Student
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-blue-50 to-purple-50">
          <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <School className="mr-2 h-4 w-4" />
            Classes
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          {/* Filters */}
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setClassFilter('all')
                  }}
                  className="bg-gradient-to-r from-white via-gray-50 to-gray-100 border-0 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || classFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms.'
                    : 'Enroll your first student to get started.'
                  }
                </p>
                <Button 
                  onClick={() => setShowEnrollModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll Student
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="">
                        <th className="font-semibold text-gray-900 text-left p-4">Student</th>
                        <th className="font-semibold text-gray-900 text-left p-4">Class</th>
                        <th className="font-semibold text-gray-900 text-left p-4">Status</th>
                        <th className="font-semibold text-gray-900 text-left p-4">Join Date</th>
                        <th className="font-semibold text-gray-900 text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {student.class ? (
                              <div>
                                <div className="font-medium text-gray-900">{student.class.name}</div>
                                <div className="text-sm text-gray-500">{student.class.grade}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No class assigned</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant={student.status === 'active' ? 'default' : 'secondary'}
                              className={student.status === 'active' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }
                            >
                              {student.status === 'active' ? (
                                <UserCheck className="mr-1 h-3 w-3" />
                              ) : (
                                <UserX className="mr-1 h-3 w-3" />
                              )}
                              {student.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="mr-1 h-4 w-4" />
                              {new Date(student.joinDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewStudent(student)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Student
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewPassword(student)}>
                                  <Key className="mr-2 h-4 w-4" />
                                  View Credentials
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Student
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          {/* Classes Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredClasses.length === 0 ? (
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="text-center py-12">
                <School className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
                <p className="text-gray-600 mb-4">
                  Create your first class to organize your students.
                </p>
                <Button 
                  onClick={() => setShowCreateClassModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {cls.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <span className="flex items-center space-x-2 text-sm text-gray-600">
                            <GraduationCap className="h-4 w-4" />
                            <span>{cls.grade}</span>
                            <span>•</span>
                            <span>{cls.subject}</span>
                          </span>
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={cls.isActive ? 'default' : 'secondary'}
                        className={cls.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {cls.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{cls.studentCount} students</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created {new Date(cls.createdAt).toLocaleDateString()}</span>
                      </div>

                      {cls.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {cls.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                          {cls.subject}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedClass(cls)}
                          className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
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

      {/* Modals */}
      {showCreateClassModal && (
        <CreateClassModal
          isOpen={showCreateClassModal}
          onClose={() => setShowCreateClassModal(false)}
          onSuccess={handleClassSuccess}
        />
      )}

      {showEnrollModal && (
        <EnrollStudentModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={handleEnrollSuccess}
          classes={classes}
        />
      )}

      {showEditModal && selectedStudent && (
        <EditStudentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          student={selectedStudent}
        />
      )}

      {showViewModal && selectedStudent && (
        <ViewStudentModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          student={selectedStudent}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
          onGenerateCredentials={() => {}}
        />
      )}

      {showViewPasswordModal && selectedStudent && (
        <ViewStudentPasswordModal
          isOpen={showViewPasswordModal}
          onClose={() => setShowViewPasswordModal(false)}
          student={selectedStudent}
        />
      )}
    </div>
  )
}
     