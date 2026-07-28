'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Users, Plus, MoreHorizontal, User, Mail, Calendar, Edit, Trash2,
  UserCheck, UserX, Loader2, GraduationCap, BookOpen, School, UserPlus,
  Settings, Eye, Key, Copy, Lock, CheckCircle, Activity,
  Send, MessageSquare, Search, X, Phone,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import CreateClassModal from "@/components/modals/create-class-modal"
import EnrollStudentModal from "@/components/modals/enroll-student-modal"
import EditStudentModal from "@/components/modals/edit-student-modal"
import ViewStudentModal from "@/components/modals/view-student-modal"
import ViewStudentPasswordModal from "@/components/modals/view-student-password-modal"
import { StudentFilters } from './components/student-filters'
import { Pagination } from './components/pagination'
import { EditClassDialog, DeleteClassDialog } from './components/class-dialogs'

// Lazy-load merged tab pages — no re-implementation needed
const AttendanceTab   = dynamic(() => import('@/app/teacher/attendance/page'),      { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })
const ProgressTab     = dynamic(() => import('@/app/teacher/progress-monitor/page'),{ ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })

// ── Parent types ──────────────────────────────────────────────────────────
interface Parent {
  id: string; name: string; email: string; phone?: string; status: string
  children: Array<{ id: string; name: string }>
}

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: string
  joinDate: string
  subjects?: string[]
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


function StudentRow({ student, handleViewStudent, handleEditStudent, handleViewPassword, handleDeleteStudent }: {
  student: Student
  handleViewStudent: (s: Student) => void
  handleEditStudent: (s: Student) => void
  handleViewPassword: (s: Student) => void
  handleDeleteStudent: (id: string) => void
}) {
  return (
    <tr className="hover:bg-blue-50/50 transition-colors">
      <td className="p-4 w-[35%]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{student.name}</div>
            <div className="text-sm text-gray-500">
              {student.email.endsWith('@student.local')
                ? `@${student.email.replace('@student.local', '')}`
                : student.email}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 w-[22%]">
        {student.class ? (
          <div>
            <div className="font-medium text-gray-900">{student.class.name}</div>
            <div className="text-sm text-gray-500">{student.class.grade}</div>
          </div>
        ) : (
          <span className="text-gray-400">No class assigned</span>
        )}
        {student.subjects && student.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {student.subjects.map(s => (
              <span key={s} className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-medium">{s}</span>
            ))}
          </div>
        )}
      </td>
      <td className="p-4 w-[12%]">
        <Badge
          variant={student.status === 'active' ? 'default' : 'secondary'}
          className={student.status === 'active'
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }
        >
          {student.status === 'active' ? <UserCheck className="mr-1 h-3 w-3" /> : <UserX className="mr-1 h-3 w-3" />}
          {student.status}
        </Badge>
      </td>
      <td className="p-4 hidden md:table-cell w-[18%]">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="mr-1 h-4 w-4" />
          {new Date(student.joinDate).toLocaleDateString()}
        </div>
      </td>
      <td className="p-4 w-[13%]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleViewStudent(student)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditStudent(student)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Student
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleViewPassword(student)}>
              <Key className="mr-2 h-4 w-4" /> View Credentials
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteStudent(student.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Student
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const PAGE_SIZE = 50
  
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

  // ── Class management state ────────────────────────────────────────────
  const [showEditClassModal, setShowEditClassModal] = useState(false)
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false)
  const [classToDelete, setClassToDelete] = useState<Class | null>(null)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [editClassForm, setEditClassForm] = useState({ name: '', subject: '', grade: '', description: '' })
  const [savingClass, setSavingClass] = useState(false)
  const [deletingClass, setDeletingClass] = useState(false)

  // ── Parent state ──────────────────────────────────────────────────────
  const [parents,       setParents]       = useState<Parent[]>([])
  const [loadingParents,setLoadingParents] = useState(false)
  const [showAddParent, setShowAddParent] = useState(false)
  const [parentForm,    setParentForm]    = useState({ firstName:'', lastName:'', email:'', phone:'', studentId:'' })
  const [addingParent,  setAddingParent]  = useState(false)
  const [msgParent,     setMsgParent]     = useState<Parent|null>(null)
  const [msgSubject,    setMsgSubject]    = useState('')
  const [msgContent,    setMsgContent]    = useState('')
  const [sendingMsg,    setSendingMsg]    = useState(false)
  const [parentSearch,  setParentSearch]  = useState('')

  const filteredParents = parents.filter(p =>
    !parentSearch || p.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(parentSearch.toLowerCase())
  )

  useEffect(() => {
    fetchStudents('', 'all', 'all', 1)
    fetchClasses()
    fetchParents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    await Promise.all([
      fetchStudents(searchTerm, statusFilter, classFilter, page),
      fetchClasses()
    ])
  }

  const fetchParents = async () => {
    setLoadingParents(true)
    try {
      const r = await fetch('/api/teacher/parents')
      if (r.ok) { const d = await r.json(); setParents(d.parents || []) }
    } finally { setLoadingParents(false) }
  }

  const handleAddParent = async () => {
    const { firstName, lastName, email, studentId } = parentForm
    if (!firstName || !lastName || !email || !studentId) {
      toast({ variant:'destructive', title:'Fill in all required fields' }); return
    }
    setAddingParent(true)
    try {
      const r = await fetch('/api/teacher/parents', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(parentForm),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast({ title:'✅ Parent added and linked to student!' })
      setShowAddParent(false)
      setParentForm({ firstName:'', lastName:'', email:'', phone:'', studentId:'' })
      fetchParents()
    } catch(e:any) { toast({ variant:'destructive', title:'Failed', description:e.message }) }
    finally { setAddingParent(false) }
  }

  const handleSendMessage = async () => {
    if (!msgParent || !msgSubject.trim() || !msgContent.trim()) return
    setSendingMsg(true)
    try {
      const r = await fetch('/api/teacher/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          recipientId:   msgParent.id,
          recipientType: 'PARENT',
          subject:       msgSubject,
          content:       msgContent,
        }),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      toast({ title:'✅ Message sent to parent!' })
      setMsgParent(null); setMsgSubject(''); setMsgContent('')
    } catch(e:any) { toast({ variant:'destructive', title:'Send failed', description:e.message }) }
    finally { setSendingMsg(false) }
  }

  const fetchStudents = useCallback(async (searchVal: string, statusVal: string, classVal: string, pageVal: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', String(pageVal))
      params.set('limit', String(PAGE_SIZE))
      if (searchVal) params.set('search', searchVal)
      if (statusVal !== 'all') params.set('status', statusVal)
      if (classVal !== 'all') params.set('classId', classVal)

      const response = await fetch(`/api/teacher/students?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setStudents(data.data || [])
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
          setTotalStudents(data.pagination.total)
        }
      } else {
        console.error('Failed to fetch students')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes')
      
      if (response.ok) {
        const data = await response.json()
        setClasses(data.data || [])
      } else {
        console.error('Failed to fetch classes')
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const handleEnrollSuccess = () => {
    setPage(1)
    fetchStudents(searchTerm, statusFilter, classFilter, 1)
    fetchClasses()
    setShowEnrollModal(false)
  }

  const handleClassSuccess = () => {
    fetchClasses()
    setShowCreateClassModal(false)
  }

  const openEditClass = (cls: Class) => {
    setEditingClass(cls)
    setEditClassForm({ name: cls.name, subject: cls.subject, grade: cls.grade, description: cls.description || '' })
    setShowEditClassModal(true)
  }

  const handleEditClass = async () => {
    if (!editingClass || !editClassForm.name.trim()) return
    setSavingClass(true)
    try {
      const r = await fetch(`/api/teacher/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editClassForm),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast({ title: '✅ Class updated!' })
      setShowEditClassModal(false)
      setEditingClass(null)
      fetchClasses()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to update', description: e.message })
    } finally { setSavingClass(false) }
  }

  const handleDeleteClass = async () => {
    if (!classToDelete) return
    setDeletingClass(true)
    try {
      const r = await fetch(`/api/teacher/classes/${classToDelete.id}`, { method: 'DELETE' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast({ title: '🗑️ Class deleted successfully' })
      setShowDeleteClassModal(false)
      setClassToDelete(null)
      fetchClasses()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to delete', description: e.message })
    } finally { setDeletingClass(false) }
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
        fetchStudents(searchTerm, statusFilter, classFilter, page)
        toast({
          title: "Student Deleted Successfully",
          description: "The student has been permanently removed.",
          variant: "default",
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

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
      fetchStudents(val, statusFilter, classFilter, 1)
    }, 300)
  }

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val)
    setPage(1)
    fetchStudents(searchTerm, val, classFilter, 1)
  }

  const handleClassFilterChange = (val: string) => {
    setClassFilter(val)
    setPage(1)
    fetchStudents(searchTerm, statusFilter, val, 1)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setClassFilter('all')
    setPage(1)
    fetchStudents('', 'all', 'all', 1)
  }

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
    fetchStudents(searchTerm, statusFilter, classFilter, p)
  }

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
        <TabsList className="w-full overflow-x-auto flex bg-gradient-to-r from-blue-50 to-purple-50">
          <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
            <School className="mr-2 h-4 w-4" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
            <CheckCircle className="mr-2 h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
            <Activity className="mr-2 h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="parents" className="data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
            <User className="mr-2 h-4 w-4" />
            Parents
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          {/* Filters */}
          <StudentFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            classFilter={classFilter}
            onClassFilterChange={handleClassFilterChange}
            classes={classes}
            onClearFilters={handleClearFilters}
          />

          {/* Students Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : students.length === 0 ? (
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
            <>
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="font-semibold text-gray-900 text-left p-4 w-[35%]">Student</th>
                        <th className="font-semibold text-gray-900 text-left p-4 w-[22%]">Class</th>
                        <th className="font-semibold text-gray-900 text-left p-4 w-[12%]">Status</th>
                        <th className="font-semibold text-gray-900 text-left p-4 hidden md:table-cell w-[18%]">Join Date</th>
                        <th className="font-semibold text-gray-900 text-left p-4 w-[13%]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <StudentRow key={student.id} student={student} handleViewStudent={handleViewStudent} handleEditStudent={handleEditStudent} handleViewPassword={handleViewPassword} handleDeleteStudent={handleDeleteStudent} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalStudents={totalStudents}
              studentsCount={students.length}
              onGoToPage={goToPage}
            />
            </>
          )}
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredClasses.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="text-center py-16">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <School className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No classes yet</h3>
                <p className="text-gray-500 text-sm mb-5">Create a class to organise your students into groups.</p>
                <Button onClick={() => setShowCreateClassModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />Create First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClasses.map((cls) => (
                <div key={cls.id} className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {/* Colour bar at top */}
                  <div className={`h-1.5 w-full ${cls.isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-slate-200'}`} />

                  <div className="p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-base truncate">{cls.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{cls.grade} &nbsp;·&nbsp; {cls.subject}</p>
                      </div>
                      <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        cls.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cls.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="font-semibold text-slate-800">{cls.studentCount}</span>
                        <span className="text-slate-400">students</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(cls.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {cls.description && (
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{cls.description}</p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditClass(cls)}
                        className="flex-1 h-8 text-xs font-medium border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setClassToDelete(cls); setShowDeleteClassModal(true) }}
                        className="h-8 text-xs font-medium border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors px-3"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Attendance Tab ─────────────────────── */}
        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>

        {/* ── Progress Monitor Tab ───────────────── */}
        <TabsContent value="progress">
          <ProgressTab />
        </TabsContent>

        {/* ── Parents Tab ─────────────────────────── */}
        <TabsContent value="parents" className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Parents',   value: parents.length,           icon: Users,       color: 'text-blue-600',  gradient: 'from-blue-500/10 to-blue-600/5',  bg: 'bg-blue-100'  },
              { label: 'Linked Students', value: parents.reduce((a,p)=>a+p.children.length,0), icon: GraduationCap, color: 'text-purple-600', gradient: 'from-purple-500/10 to-purple-600/5', bg: 'bg-purple-100' },
              { label: 'Active',          value: parents.filter(p=>p.status==='Active').length, icon: UserCheck,     color: 'text-emerald-600', gradient: 'from-emerald-500/10 to-emerald-600/5', bg: 'bg-emerald-100' },
            ].map(s => (
              <div key={s.label} className={`relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 bg-gradient-to-br ${s.gradient}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shadow-sm`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Header + search + add */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text" value={parentSearch} onChange={e=>setParentSearch(e.target.value)}
                placeholder="Search parents..."
                className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            <Button onClick={()=>setShowAddParent(v=>!v)}
              className={`${showAddParent ? 'bg-slate-600 hover:bg-slate-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'} shadow-sm`}>
              {showAddParent ? <X className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4"/>}
              {showAddParent ? 'Cancel' : 'Add Parent'}
            </Button>
          </div>

          {/* Add parent slide-down */}
          <div className={`transition-all duration-200 overflow-hidden ${showAddParent ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <Card className="border-blue-200 shadow-sm bg-gradient-to-br from-blue-50/80 to-white">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Link a Parent to a Student</h3>
                    <p className="text-xs text-slate-500">Fill in the details to create and link a parent account</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">First Name <span className="text-red-500">*</span></label>
                    <Input value={parentForm.firstName} onChange={e=>setParentForm(f=>({...f,firstName:e.target.value}))} placeholder="Jane" className="bg-white"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Last Name <span className="text-red-500">*</span></label>
                    <Input value={parentForm.lastName} onChange={e=>setParentForm(f=>({...f,lastName:e.target.value}))} placeholder="Wanjiku" className="bg-white"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input type="email" value={parentForm.email} onChange={e=>setParentForm(f=>({...f,email:e.target.value}))} placeholder="parent@example.com" className="pl-9 bg-white"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone (optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input value={parentForm.phone} onChange={e=>setParentForm(f=>({...f,phone:e.target.value}))} placeholder="+254 700 000000" className="pl-9 bg-white"/>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Student <span className="text-red-500">*</span></label>
                    <select value={parentForm.studentId} onChange={e=>setParentForm(f=>({...f,studentId:e.target.value}))}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select student…</option>
                      {students.map((s:any)=>(
                        <option key={s.id} value={s.id}>{s.name} — {s.className||s.class?.grade||''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={()=>setShowAddParent(false)} className="bg-white">Cancel</Button>
                  <Button onClick={handleAddParent} disabled={addingParent}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm">
                    {addingParent?<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Adding…</>:<><UserPlus className="h-4 w-4 mr-2"/>Link Parent</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parents list */}
          {loadingParents ? (
            <div className="flex justify-center py-16">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : parents.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="text-center py-14">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">No parents linked yet</h3>
                <p className="text-sm text-slate-400 mb-5">Link parents to your students for direct communication</p>
                <Button onClick={()=>setShowAddParent(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm">
                  <UserPlus className="mr-2 h-4 w-4"/>Add First Parent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search results count */}
              {parentSearch && <p className="text-xs text-slate-400">{filteredParents.length} of {parents.length} parent{parents.length!==1?'s':''}</p>}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParents.map((p:Parent)=>(
                  <Card key={p.id} className="group hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-blue-200 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Top gradient bar */}
                      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                      <div className="p-5 space-y-4">
                        {/* Avatar + name row */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                              {p.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3 shrink-0" />
                                {p.email}
                              </p>
                              {p.phone && (
                                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                  <Phone className="h-3 w-3 shrink-0" />
                                  {p.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={p.status==='Active'?'default':'secondary'} className={`text-[10px] px-2 py-0.5 ${p.status==='Active'?'bg-emerald-100 text-emerald-700 hover:bg-emerald-100':'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                            {p.status}
                          </Badge>
                        </div>

                        {/* Children chips */}
                        {p.children.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                              {p.children.length} {p.children.length === 1 ? 'Child' : 'Children'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {p.children.map(c => (
                                <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                  <GraduationCap className="h-3 w-3" />
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="border-t border-slate-100 pt-3">
                          <Button onClick={()=>{ setMsgParent(p); setMsgSubject(''); setMsgContent('') }}
                            size="sm" variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all">
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5"/>Send Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredParents.length === 0 && parentSearch && (
                <div className="text-center py-10 text-slate-400">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No parents match &quot;{parentSearch}&quot;</p>
                </div>
              )}
            </>
          )}

          {/* Send message dialog */}
          {msgParent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setMsgParent(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Message to {msgParent.name}</h3>
                    <p className="text-xs text-emerald-100">{msgParent.email}</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Subject</label>
                    <Input value={msgSubject} onChange={e=>setMsgSubject(e.target.value)} placeholder="e.g. Progress Update" className="bg-slate-50"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Message</label>
                    <textarea value={msgContent} onChange={e=>setMsgContent(e.target.value)}
                      placeholder="Type your message…" rows={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none transition-all"/>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={()=>setMsgParent(null)}>Cancel</Button>
                    <Button onClick={handleSendMessage} disabled={sendingMsg||!msgSubject.trim()||!msgContent.trim()}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm">
                      {sendingMsg?<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Sending…</>:<><Send className="h-4 w-4 mr-2"/>Send Message</>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

      </Tabs>
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
          classes={classes}
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

      {/* ── Edit Class Modal ───────────────────────────────────────── */}
      <EditClassDialog
        open={showEditClassModal}
        onOpenChange={open => { setShowEditClassModal(open); if (!open) setEditingClass(null) }}
        form={editClassForm}
        onFormChange={setEditClassForm}
        onSave={handleEditClass}
        saving={savingClass}
      />

      <DeleteClassDialog
        open={showDeleteClassModal}
        onOpenChange={open => { setShowDeleteClassModal(open); if (!open) setClassToDelete(null) }}
        classToDelete={classToDelete}
        onConfirm={handleDeleteClass}
        deleting={deletingClass}
      />

    </div>
  )
}
     