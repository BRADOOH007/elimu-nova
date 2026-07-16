"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSchoolInfo } from '@/hooks/use-school-info'
import { SubscriptionAlert } from '@/components/subscription/subscription-alert'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  Plus, 
  Settings, 
  UserPlus,
  BarChart3,
  FileText,
  Calendar,
  Bell,
  Eye,
  Edit,
  MoreHorizontal,
  Building2,
  CreditCard,
  TrendingUp,
  Download,
  Loader2,
  LogIn,
  LogOut,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  Brain,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { EnrollTeacherModal } from "@/components/modals/enroll-teacher-modal"
import EnrollStudentModal from "@/components/modals/enroll-student-modal"
import CreateClassModal from "@/components/modals/create-class-modal"
import { ScheduleMeetingModal } from "@/components/modals/schedule-meeting-modal"
import { EditTeacherModal } from "@/components/modals/edit-teacher-modal"
import EditStudentModal from "@/components/modals/edit-student-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardStats {
  totalTeachers: { value: number; change: string }
  totalStudents: { value: number; change: string }
  activeClasses: { value: number; change: string }
  monthlyRevenue: { value: number; change: string }
  activeTeachers: { value: number; change: string }
}

interface RecentTeacher {
  id: string
  name: string
  email: string
  students: number
  status: string
  joinDate: string
}

interface RecentStudent {
  id: string
  name: string
  email: string
  teacher: string
  status: string
  joinDate: string
}

interface RecentActivity {
  id: string
  type: string
  action: string
  description: string
  metadata: any
  user: {
    name: string
    email: string
    role: string
  } | null
  createdAt: string
}

interface SchoolInfo {
  name: string
  address: string
  package: string
  subscription: {
    packageName: string
    status: string
    amount: number
    daysRemaining: number
  }
  packagePrice: number
}

export default function SchoolAdminDashboard() {
  const router = useRouter()
  const { schoolInfo: schoolData } = useSchoolInfo()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTeachers, setRecentTeachers] = useState<RecentTeacher[]>([])
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([])
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [enrollTeacherModalOpen, setEnrollTeacherModalOpen] = useState(false)
  const [enrollStudentModalOpen, setEnrollStudentModalOpen] = useState(false)
  const [createClassModalOpen, setCreateClassModalOpen] = useState(false)
  const [scheduleMeetingModalOpen, setScheduleMeetingModalOpen] = useState(false)
  const [editTeacherModalOpen, setEditTeacherModalOpen] = useState(false)
  const [editStudentModalOpen, setEditStudentModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<RecentTeacher | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<RecentStudent | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, classesRes] = await Promise.all([
        fetch('/api/school-admin/dashboard-stats'),
        fetch('/api/school-admin/classes'),
      ])
      
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
        setRecentTeachers(data.recentTeachers)
        setRecentStudents(data.recentStudents)
        setRecentActivities(data.recentActivities)
        setSchoolInfo(data.schoolInfo)
        setUpcomingMeetings(data.upcomingMeetings || [])
      }
      if (classesRes.ok) {
        const { classes } = await classesRes.json()
        setAvailableClasses(classes || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModalSuccess = () => {
    // Refresh dashboard data when a modal action is successful
    fetchDashboardData()
  }

  const handleEditTeacher = (teacher: RecentTeacher) => {
    setSelectedTeacher(teacher)
    setEditTeacherModalOpen(true)
  }

  const handleEditStudent = (student: RecentStudent) => {
    setSelectedStudent(student)
    setEditStudentModalOpen(true)
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    // deletion confirmed by UI action

    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setRecentTeachers(recentTeachers.filter(teacher => teacher.id !== teacherId))
      } else {
        console.error('Failed to delete teacher')
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    // deletion confirmed by UI action

    try {
      const response = await fetch(`/api/school-admin/students/${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setRecentStudents(recentStudents.filter(student => student.id !== studentId))
      } else {
        console.error('Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
    }
  }

  const handleToggleTeacherStatus = async (teacherId: string, currentStatus: string) => {
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
        fetchDashboardData()
      } else {
        console.error('Failed to update teacher status')
      }
    } catch (error) {
      console.error('Error updating teacher status:', error)
    }
  }

  const handleToggleStudentStatus = async (studentId: string, currentStatus: string) => {
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
        fetchDashboardData()
      } else {
        console.error('Failed to update student status')
      }
    } catch (error) {
      console.error('Error updating student status:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TEACHER_ENROLLED':
        return <UserPlus className="w-4 h-4 text-blue-500" />
      case 'STUDENT_ENROLLED':
        return <Users className="w-4 h-4 text-green-500" />
      case 'CLASS_CREATED':
        return <BookOpen className="w-4 h-4 text-purple-500" />
      case 'PAYMENT_RECEIVED':
        return <CreditCard className="w-4 h-4 text-emerald-500" />
      case 'MEETING_SCHEDULED':
        return <Calendar className="w-4 h-4 text-orange-500" />
      case 'USER_LOGIN':
        return <LogIn className="w-4 h-4 text-indigo-500" />
      case 'USER_LOGOUT':
        return <LogOut className="w-4 h-4 text-gray-500" />
      case 'SETTINGS_UPDATED':
        return <Settings className="w-4 h-4 text-yellow-500" />
      case 'REPORT_GENERATED':
        return <FileText className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const statsConfig = [
    {
      title: "Total Teachers",
      value: stats?.totalTeachers.value.toString() || "0",
      change: stats?.totalTeachers.change || "Loading...",
      icon: GraduationCap,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: "Total Students",
      value: stats?.totalStudents.value.toString() || "0",
      change: stats?.totalStudents.change || "Loading...",
      icon: Users,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Active Classes",
      value: stats?.activeClasses.value.toString() || "0",
      change: stats?.activeClasses.change || "Loading...",
      icon: BookOpen,
      color: "from-pink-500 to-rose-600"
    },
    {
      title: "Monthly Revenue",
      value: stats?.monthlyRevenue.value ? formatCurrency(stats.monthlyRevenue.value) : "$0",
      change: stats?.monthlyRevenue.change || "Loading...",
      icon: DollarSign,
      color: "from-rose-500 to-red-600"
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full overflow-x-hidden">
      {/* Subscription Alert */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <SubscriptionAlert />
      </div>

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="edugenius-text-gradient">
            {schoolData?.school?.name ? `${schoolData.school.name} Overview` : 'School Admin Overview'}
          </span>
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          {schoolData?.school?.name 
            ? `Manage teachers, students, and operations at ${schoolData.school.name}`
            : 'Manage teachers, students, and school operations'
          }
        </p>
      </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statsConfig.map((stat, index) => (
            <Card key={stat.title} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm group hover:scale-105 transition-all duration-300 border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold edugenius-text-gradient-blue mb-1 break-words">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & School Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-8">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full edugenius-button justify-start"
                onClick={() => setEnrollTeacherModalOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll New Teacher
              </Button>
              <Button 
                variant="outline" 
                className="w-full edugenius-glass justify-start"
                onClick={() => setEnrollStudentModalOpen(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Add New Student
              </Button>
              <Button 
                variant="outline" 
                className="w-full edugenius-glass justify-start"
                onClick={() => setCreateClassModalOpen(true)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
              <Button 
                variant="outline" 
                className="w-full edugenius-glass justify-start"
                onClick={() => setScheduleMeetingModalOpen(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button 
                variant="outline" 
                className="w-full edugenius-glass justify-start"
                onClick={() => router.push('/school-admin/credentials')}
              >
                <Users className="w-4 h-4 mr-2" />
                Credential Generator
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">School Information</CardTitle>
              <CardDescription>Current school details and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600 flex-shrink-0">School Name</span>
                <span className="text-sm font-medium text-gray-900 text-right truncate">{schoolInfo?.name || 'Loading...'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600 flex-shrink-0">Location</span>
                <span className="text-sm text-gray-600 text-right truncate">{schoolInfo?.address || 'Loading...'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600 flex-shrink-0">Package</span>
                <span className="text-sm text-green-600 font-medium truncate">{schoolInfo?.subscription?.packageName || 'Loading...'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600 flex-shrink-0">Subscription</span>
                <span className={`text-sm font-medium truncate ${
                  schoolInfo?.subscription?.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {schoolInfo?.subscription?.status || 'Loading...'}
                </span>
              </div>
              {schoolInfo?.subscription?.amount && schoolInfo.subscription.amount > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-600 flex-shrink-0">Package Price</span>
                  <span className="text-sm text-blue-600 font-medium">
                    {formatCurrency(schoolInfo.subscription.amount)}
                  </span>
                </div>
              )}
              {schoolInfo?.subscription?.daysRemaining !== undefined && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-600 flex-shrink-0">Days Remaining</span>
                  <span className={`text-sm font-medium ${schoolInfo.subscription.daysRemaining <= 7 ? 'text-red-600' : schoolInfo.subscription.daysRemaining <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                    {schoolInfo.subscription.daysRemaining} days
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Recent Activity</CardTitle>
              <CardDescription>Latest school activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-2 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg shadow-sm">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(activity.createdAt)}
                        {activity.user && ` • by ${activity.user.name}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activities</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teachers and Students Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
          {/* Recent Teachers */}
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="edugenius-text-gradient-blue">Recent Teachers</CardTitle>
                <CardDescription>Latest teacher enrollments and activity</CardDescription>
              </div>
              <Button 
                variant="outline" 
                className="edugenius-glass"
                onClick={() => router.push('/school-admin/teachers')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentTeachers.length > 0 ? (
                  recentTeachers.map((teacher, index) => (
                    <div key={teacher.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg hover:from-white/90 hover:to-blue-50/90 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{teacher.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{teacher.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="text-left sm:text-right flex-1 sm:flex-initial">
                          <p className="text-sm font-medium text-gray-900">{teacher.students} students</p>
                          <p className="text-xs text-gray-500 truncate">Joined: {teacher.joinDate}</p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            teacher.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {teacher.status}
                          </span>
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
                                onClick={() => handleToggleTeacherStatus(teacher.id, teacher.status)}
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
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No teachers found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="edugenius-text-gradient-blue">Recent Students</CardTitle>
                <CardDescription>Latest student enrollments</CardDescription>
              </div>
              <Button 
                variant="outline" 
                className="edugenius-glass"
                onClick={() => router.push('/school-admin/students')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentStudents.length > 0 ? (
                  recentStudents.map((student, index) => (
                    <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg hover:from-white/90 hover:to-blue-50/90 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="text-left sm:text-right flex-1 sm:flex-initial">
                          <p className="text-sm font-medium text-gray-900 truncate">{student.teacher}</p>
                          <p className="text-xs text-gray-500">Teacher</p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            student.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {student.status}
                          </span>
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
                                onClick={() => handleToggleStudentStatus(student.id, student.status)}
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
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No students found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
          <Card className="bg-gradient-to-br from-white via-orange-50 to-amber-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  Upcoming Meetings
                </CardTitle>
                <CardDescription>Scheduled meetings and events</CardDescription>
              </div>
              <Link href="/school-admin/meetings">
                <Button variant="outline" size="sm" className="edugenius-glass">
                  <Eye className="w-4 h-4 mr-1" /> View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming meetings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.slice(0, 4).map((m: any) => (
                    <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-orange-100">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.title}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{new Date(m.date).toLocaleDateString()} {m.time}
                          </span>
                          {m.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{m.location}
                            </span>
                          )}
                          <span>{m.duration}min</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">by {m.creator}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-600" />
                School Overview
              </CardTitle>
              <CardDescription>Quick snapshot of your school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Teachers', value: stats?.totalTeachers.value || 0, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
                  { label: 'Students', value: stats?.totalStudents.value || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
                  { label: 'Classes', value: stats?.activeClasses.value || 0, icon: BookOpen, color: 'text-pink-600', bg: 'bg-pink-100' },
                  { label: 'Active %', value: stats?.activeTeachers ? `${Math.round((stats.activeTeachers.value / Math.max(stats.totalTeachers.value, 1)) * 100)}%` : '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl bg-white/70 border border-slate-100 text-center">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-1`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <p className="text-lg font-bold text-slate-800">{s.value}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>
              <Link href="/school-admin/reports">
                <Button variant="outline" size="sm" className="w-full mt-4 edugenius-glass">
                  <FileText className="w-4 h-4 mr-2" /> View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <EnrollTeacherModal
          isOpen={enrollTeacherModalOpen}
          onClose={() => setEnrollTeacherModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
        
        <EnrollStudentModal
          isOpen={enrollStudentModalOpen}
          onClose={() => setEnrollStudentModalOpen(false)}
          onSuccess={handleModalSuccess}
          classes={availableClasses}
        />
        
        <CreateClassModal
          isOpen={createClassModalOpen}
          onClose={() => setCreateClassModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
        
        <ScheduleMeetingModal
          isOpen={scheduleMeetingModalOpen}
          onClose={() => setScheduleMeetingModalOpen(false)}
          onSuccess={handleModalSuccess}
        />

        <EditTeacherModal
          isOpen={editTeacherModalOpen}
          onClose={() => {
            setEditTeacherModalOpen(false)
            setSelectedTeacher(null)
          }}
          onSuccess={handleModalSuccess}
          teacher={selectedTeacher}
        />

        <EditStudentModal
          isOpen={editStudentModalOpen}
          onClose={() => {
            setEditStudentModalOpen(false)
            setSelectedStudent(null)
          }}
          onSuccess={handleModalSuccess}
          student={selectedStudent}
          classes={[]}
        />
    </div>
  )
}


