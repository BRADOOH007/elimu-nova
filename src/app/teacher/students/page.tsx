'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Users, Search, Plus, Edit, Trash2, MoreHorizontal, User, Mail, Calendar,
  UserCheck, UserX, Loader2, GraduationCap, BookOpen, School, UserPlus,
  Settings, Eye, Key, Copy, Lock, CheckCircle, Activity,
  Send, MessageSquare, AlertTriangle, Save
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

  useEffect(() => {
    fetchData()
    fetchParents()
  }, [])

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
        fetchStudents()
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
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="">
                        <th className="font-semibold text-gray-900 text-left p-4">Student</th>
                        <th className="font-semibold text-gray-900 text-left p-4">Class</th>
                        <th className="font-semibold text-gray-900 text-left p-4">Status</th>
                        <th className="font-semibold text-gray-900 text-left p-4 hidden md:table-cell">Join Date</th>
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
                                <div className="text-sm text-gray-500">
                                  {student.email.endsWith('@student.local')
                                    ? `@${student.email.replace('@student.local', '')}`
                                    : student.email}
                                </div>
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
                            {student.subjects && student.subjects.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {student.subjects.map(s => (
                                  <span key={s} className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-medium">{s}</span>
                                ))}
                              </div>
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
                          <td className="p-4 hidden md:table-cell">
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Parents & Guardians</h2>
              <p className="text-gray-500 text-sm">View, add, and message parents of your students</p>
            </div>
            <Button onClick={()=>setShowAddParent(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <UserPlus className="mr-2 h-4 w-4"/>Add Parent
            </Button>
          </div>

          {/* Add Parent form */}
          {showAddParent && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="pt-5 space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600"/>Link a Parent/Guardian to a Student
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">First Name *</label>
                    <Input value={parentForm.firstName} onChange={e=>setParentForm(f=>({...f,firstName:e.target.value}))} placeholder="Jane"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Last Name *</label>
                    <Input value={parentForm.lastName} onChange={e=>setParentForm(f=>({...f,lastName:e.target.value}))} placeholder="Wanjiku"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
                    <Input type="email" value={parentForm.email} onChange={e=>setParentForm(f=>({...f,email:e.target.value}))} placeholder="parent@example.com"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone (optional)</label>
                    <Input value={parentForm.phone} onChange={e=>setParentForm(f=>({...f,phone:e.target.value}))} placeholder="+254 700 000000"/>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Student *</label>
                    <select value={parentForm.studentId} onChange={e=>setParentForm(f=>({...f,studentId:e.target.value}))}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select student…</option>
                      {students.map((s:any)=>(
                        <option key={s.id} value={s.id}>{s.name} — {s.class?.grade||''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={()=>setShowAddParent(false)}>Cancel</Button>
                  <Button onClick={handleAddParent} disabled={addingParent}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {addingParent?<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Adding…</>:<><UserPlus className="h-4 w-4 mr-2"/>Link Parent</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send message modal */}
          {msgParent && (
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="pt-5 space-y-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600"/>Message to {msgParent.name}
                </h3>
                <Input value={msgSubject} onChange={e=>setMsgSubject(e.target.value)} placeholder="Subject…"/>
                <textarea value={msgContent} onChange={e=>setMsgContent(e.target.value)}
                  placeholder="Type your message…" rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"/>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={()=>setMsgParent(null)}>Cancel</Button>
                  <Button onClick={handleSendMessage} disabled={sendingMsg||!msgSubject.trim()||!msgContent.trim()}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    {sendingMsg?<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Sending…</>:<><Send className="h-4 w-4 mr-2"/>Send Message</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parents list */}
          {loadingParents ? (
            <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500"/></div>
          ) : parents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-300 mb-4"/>
                <h3 className="font-medium text-gray-600 mb-2">No parents linked yet</h3>
                <p className="text-gray-400 text-sm mb-4">Add parents to enable direct communication</p>
                <Button onClick={()=>setShowAddParent(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <UserPlus className="mr-2 h-4 w-4"/>Add First Parent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {parents.map((p:Parent)=>(
                <Card key={p.id} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-50/30">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                          {p.phone && <p className="text-xs text-slate-400">{p.phone}</p>}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status==='Active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </div>

                    {p.children.length > 0 && (
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">Children: </span>
                        {p.children.map(c=>c.name).join(', ')}
                      </div>
                    )}

                    <Button onClick={()=>{ setMsgParent(p); setMsgSubject(''); setMsgContent('') }}
                      size="sm" variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5"/>Send Message
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
      <Dialog open={showEditClassModal} onOpenChange={open => { setShowEditClassModal(open); if (!open) setEditingClass(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-600" />
              Edit Class
            </DialogTitle>
            <DialogDescription>Update the details for this class.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Class Name *</label>
              <Input
                value={editClassForm.name}
                onChange={e => setEditClassForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Grade 4B"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Subject *</label>
                <Input
                  value={editClassForm.subject}
                  onChange={e => setEditClassForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Grade *</label>
                <Input
                  value={editClassForm.grade}
                  onChange={e => setEditClassForm(f => ({ ...f, grade: e.target.value }))}
                  placeholder="e.g. Grade 4"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
              <Textarea
                value={editClassForm.description}
                onChange={e => setEditClassForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowEditClassModal(false)} disabled={savingClass} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleEditClass}
                disabled={savingClass || !editClassForm.name.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
              >
                {savingClass
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  : <><Save className="h-4 w-4 mr-2" />Save Changes</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Class Confirmation Modal ────────────────────────── */}
      <Dialog open={showDeleteClassModal} onOpenChange={open => { setShowDeleteClassModal(open); if (!open) setClassToDelete(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Delete Class
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {classToDelete && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="font-semibold text-red-900 mb-1">{classToDelete.name}</p>
                <p className="text-sm text-red-700">
                  {classToDelete.grade} · {classToDelete.subject} · {classToDelete.studentCount} student{classToDelete.studentCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            <p className="text-sm text-slate-600">
              Deleting this class will <strong>unassign all students</strong> from it. The students themselves will not be deleted. You can re-create this class and re-enrol them afterwards.
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowDeleteClassModal(false)} disabled={deletingClass} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteClass}
                disabled={deletingClass}
                variant="destructive"
                className="flex-1"
              >
                {deletingClass
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting…</>
                  : <><Trash2 className="h-4 w-4 mr-2" />Delete Class</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
     