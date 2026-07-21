"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSchoolInfo } from "@/hooks/use-school-info"
import { SubscriptionAlert } from "@/components/subscription/subscription-alert"
import { Loader2 } from "lucide-react"
import StatsGrid from "@/components/school-admin/stats-grid"
import QuickActions from "@/components/school-admin/quick-actions"
import SchoolInfoPanel from "@/components/school-admin/school-info-panel"
import PersonList from "@/components/school-admin/person-list"
import SchoolOverview from "@/components/school-admin/school-overview"
import { EnrollTeacherModal } from "@/components/modals/enroll-teacher-modal"
import EnrollStudentModal from "@/components/modals/enroll-student-modal"
import CreateClassModal from "@/components/modals/create-class-modal"
import { ScheduleMeetingModal } from "@/components/modals/schedule-meeting-modal"
import { EditTeacherModal } from "@/components/modals/edit-teacher-modal"
import EditStudentModal from "@/components/modals/edit-student-modal"

interface DashboardStats {
  totalTeachers: { value: number; change: string }
  totalStudents: { value: number; change: string }
  activeClasses: { value: number; change: string }
  monthlyRevenue: { value: number; change: string }
  activeTeachers: { value: number; change: string }
}

interface Teacher { id: string; name: string; email: string; students: number; status: string; joinDate: string }
interface Student { id: string; name: string; email: string; teacher: string; status: string; joinDate: string }
interface Activity { id: string; type: string; action: string; description: string; metadata: any; user: { name: string; email: string; role: string } | null; createdAt: string }
interface SchoolInfo { name: string; address: string; package: string; subscription: { packageName: string; status: string; amount: number; daysRemaining: number }; packagePrice: number }

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount)
}

export default function SchoolAdminDashboard() {
  const router = useRouter()
  const { schoolInfo: schoolData } = useSchoolInfo()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTeachers, setRecentTeachers] = useState<Teacher[]>([])
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([])
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [enrollTeacherOpen, setEnrollTeacherOpen] = useState(false)
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false)
  const [createClassOpen, setCreateClassOpen] = useState(false)
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false)
  const [editTeacherOpen, setEditTeacherOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, classesRes] = await Promise.all([
        fetch("/api/school-admin/dashboard-stats"),
        fetch("/api/school-admin/classes"),
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
      if (classesRes.ok) setAvailableClasses((await classesRes.json()).classes || [])
    } catch (e) { console.error("Error fetching dashboard data:", e) }
    finally { setLoading(false) }
  }

  const handleModalSuccess = () => fetchDashboardData()

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
    <div className="max-w-full overflow-x-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <SubscriptionAlert />

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
            {schoolData?.school?.name ? `${schoolData.school.name} Overview` : "School Admin Overview"}
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            {schoolData?.school?.name ? `Manage teachers, students, and operations at ${schoolData.school.name}` : "Manage teachers, students, and school operations"}
          </p>
        </div>

        <StatsGrid stats={stats} formatCurrency={formatCurrency} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-8">
          <QuickActions
            onEnrollTeacher={() => setEnrollTeacherOpen(true)}
            onEnrollStudent={() => setEnrollStudentOpen(true)}
            onCreateClass={() => setCreateClassOpen(true)}
            onScheduleMeeting={() => setScheduleMeetingOpen(true)}
          />
          <SchoolInfoPanel schoolInfo={schoolInfo} activities={recentActivities} formatCurrency={formatCurrency} />
        </div>

        <PersonList
          teachers={recentTeachers}
          students={recentStudents}
          onEditTeacher={(t) => { setSelectedTeacher(t); setEditTeacherOpen(true) }}
          onEditStudent={(s) => { setSelectedStudent(s); setEditStudentOpen(true) }}
          onDeleteTeacher={async (id) => {
            if (!confirm('Delete this teacher?')) return
            try { await fetch(`/api/school-admin/teachers/${id}`, { method: "DELETE" }); setRecentTeachers(prev => prev.filter(t => t.id !== id)) }
            catch (e) { console.error("Error deleting teacher:", e) }
          }}
          onDeleteStudent={async (id) => {
            if (!confirm('Delete this student?')) return
            try { await fetch(`/api/school-admin/students/${id}`, { method: "DELETE" }); setRecentStudents(prev => prev.filter(s => s.id !== id)) }
            catch (e) { console.error("Error deleting student:", e) }
          }}
          onToggleTeacherStatus={async (id, status) => {
            try { await fetch(`/api/school-admin/teachers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: status === "Inactive" }) }); fetchDashboardData() }
            catch (e) { console.error("Error updating teacher status:", e) }
          }}
          onToggleStudentStatus={async (id, status) => {
            try { await fetch(`/api/school-admin/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: status === "Inactive" }) }); fetchDashboardData() }
            catch (e) { console.error("Error updating student status:", e) }
          }}
          onViewTeachers={() => router.push("/school-admin/teachers")}
          onViewStudents={() => router.push("/school-admin/students")}
        />

        <SchoolOverview stats={stats} upcomingMeetings={upcomingMeetings} />

        <EnrollTeacherModal isOpen={enrollTeacherOpen} onClose={() => setEnrollTeacherOpen(false)} onSuccess={handleModalSuccess} />
        <EnrollStudentModal isOpen={enrollStudentOpen} onClose={() => setEnrollStudentOpen(false)} onSuccess={handleModalSuccess} classes={availableClasses} />
        <CreateClassModal isOpen={createClassOpen} onClose={() => setCreateClassOpen(false)} onSuccess={handleModalSuccess} />
        <ScheduleMeetingModal isOpen={scheduleMeetingOpen} onClose={() => setScheduleMeetingOpen(false)} onSuccess={handleModalSuccess} />
        <EditTeacherModal isOpen={editTeacherOpen} onClose={() => { setEditTeacherOpen(false); setSelectedTeacher(null) }} onSuccess={handleModalSuccess} teacher={selectedTeacher} />
        <EditStudentModal isOpen={editStudentOpen} onClose={() => { setEditStudentOpen(false); setSelectedStudent(null) }} onSuccess={handleModalSuccess} student={selectedStudent} classes={availableClasses} />
      </div>
    </div>
  )
}
