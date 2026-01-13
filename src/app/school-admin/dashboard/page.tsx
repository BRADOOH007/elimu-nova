"use client"

import { useState, useEffect } from 'react'
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
  UserX
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
import { toast } from 'sonner'
import { toast } from 'sonner'
import { toast } from 'sonner'

interface DashboardStats {
  totalTeachers: { value: number; change: string }
  totalStudents: { value: number; change: string }
  activeClasses: { value: number; change: string }
  monthlyRevenue: { value: number; change: string }
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
  subscription: string
  packagePrice: number
}

export default function SchoolAdminDashboard() {
  const { schoolInfo: schoolData } = useSchoolInfo()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTeachers, setRecentTeachers] = useState<RecentTeacher[]>([])
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
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
      const response = await fetch('/api/school-admin/dashboard-stats')
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentTeachers(data.recentTeachers)
        setRecentStudents(data.recentStudents)
        setRecentActivities(data.recentActivities)
        setSchoolInfo(data.schoolInfo)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch dashboard data:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
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
    // Confirmation removed - using toast notifications only
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTeachers(prev => prev.filter(t => t.id !== teacherId))
        toast.success('Teacher deleted successfully')
      } else {
        toast.error('Failed to delete teacher')
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error('Failed to delete teacher')
    }
  }
  re
turn (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">School Admin Dashboard</h1>
      {/* Dashboard content would go here */}
    </div>
  )
}