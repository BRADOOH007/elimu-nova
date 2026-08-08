"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSchoolInfo } from "@/hooks/use-school-info"
import { SubscriptionAlert } from "@/components/subscription/subscription-alert"
import DashboardSkeleton from "@/components/dashboard-skeleton"
import StatsGrid from "@/components/school-admin/stats-grid"
import QuickActions from "@/components/school-admin/quick-actions"
import SchoolAIInsightsPanel from "@/components/school-admin/ai-insights-panel"
import { AIUsageCard } from "@/components/ai-usage-card"
import ActivityLog from "@/components/school-admin/activity-log"
import UpcomingMeetings from "@/components/school-admin/upcoming-meetings"
import SubscriptionBadge from "@/components/school-admin/subscription-badge"
import { EnrollTeacherModal } from "@/components/modals/enroll-teacher-modal"
import EnrollStudentModal from "@/components/modals/enroll-student-modal"
import { EditTeacherModal } from "@/components/modals/edit-teacher-modal"
import EditStudentModal from "@/components/modals/edit-student-modal"

interface DashboardStats {
  totalTeachers: { value: number; change: string }
  totalStudents: { value: number; change: string }
  activeClasses: { value: number; change: string }
  monthlyRevenue: { value: number; change: string }
  activeTeachers: { value: number; change: string }
  activeStudents: { value: number; change: string }
}

interface TermInfo {
  termName: string; term: number; weekNumber: number; weeksCount: number; nextEvent: string
}

interface Teacher { id: string; name: string; email: string; phone?: string; address?: string; status: string; students?: number; joinDate?: string }
interface Student { id: string; name: string; email: string; grade?: string; teacher?: string; status: string; joinDate?: string }
interface Activity { id: string; type: string; action: string; description: string; metadata: unknown; user: { name: string; email: string; role: string } | null; createdAt: string }
interface Meeting { id: string; title: string; description?: string; date: string; time: string; duration: number; location?: string; creator: string }
interface Subscription { packageName: string; status: string; amount: number; daysRemaining: number }

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount)
}

export default function SchoolAdminDashboard() {
  const router = useRouter()
  const { schoolInfo: schoolData } = useSchoolInfo()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([])
  const [gradeBreakdown, setGradeBreakdown] = useState<{ grade: string; count: number }[]>([])
  const [subjectCoverage, setSubjectCoverage] = useState<{ total: number; assigned: number }>({ total: 0, assigned: 0 })
  const [termInfo, setTermInfo] = useState<TermInfo | null>(null)
  const [cbcReadiness, setCbcReadiness] = useState<{ percent: number; total: number; pending: number }>({ percent: 0, total: 0, pending: 0 })
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [availableClasses, setAvailableClasses] = useState<Array<{ id: string; name: string; subject: string; grade: string }>>([])
  const [loading, setLoading] = useState(true)

  const [enrollTeacherOpen, setEnrollTeacherOpen] = useState(false)
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false)
  const [editTeacherOpen, setEditTeacherOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const statsRes = await fetch("/api/school-admin/dashboard-stats")
      const classesRes = await fetch("/api/school-admin/classes")
      if (classesRes.ok) setAvailableClasses((await classesRes.json()).classes || [])
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
        setRecentActivities(data.recentActivities || [])
        setUpcomingMeetings(data.upcomingMeetings || [])
        setGradeBreakdown(data.gradeBreakdown || [])
        setSubjectCoverage(data.subjectCoverage || { total: 0, assigned: 0 })
        setTermInfo(data.termInfo || null)
        setCbcReadiness(data.cbcReadiness || { percent: 0, total: 0, pending: 0 })
        if (data.schoolInfo?.subscription) setSubscription(data.schoolInfo.subscription)
      }
    } catch (e) { console.error("Error fetching dashboard data:", e) }
    finally { setLoading(false) }
  }

  const handleModalSuccess = () => fetchDashboardData()

  if (loading) return <DashboardSkeleton variant="admin" />

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="space-y-6 py-4 md:py-6">
        <SubscriptionAlert />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-900 truncate">
              {schoolData?.school?.name ? `${schoolData.school.name} Overview` : "School Admin Overview"}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {schoolData?.school?.name ? `Manage teachers, students, and operations at ${schoolData.school.name}` : "Manage teachers, students, and school operations"}
            </p>
          </div>
          <SubscriptionBadge subscription={subscription} formatCurrency={formatCurrency} />
        </div>

        {/* Top KPI metrics */}
        <StatsGrid
          stats={stats}
          gradeBreakdown={gradeBreakdown}
          subjectCoverage={subjectCoverage}
          termInfo={termInfo}
          cbcReadiness={cbcReadiness}
        />

        {/* Main grid: 2-col left, 1-col right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start">

          {/* Left column: 2/3 width */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* AI Insights + Usage */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <SchoolAIInsightsPanel />
              </div>
              <AIUsageCard />
            </div>

            {/* Quick Actions */}
            <QuickActions
              onEnrollTeacher={() => setEnrollTeacherOpen(true)}
              onEnrollStudent={() => setEnrollStudentOpen(true)}
            />

            {/* System Activity Log (unified — replaces dual teacher/student cards) */}
            <ActivityLog activities={recentActivities} />
          </div>

          {/* Right column: 1/3 width */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <UpcomingMeetings meetings={upcomingMeetings} />
          </div>
        </div>

        <EnrollTeacherModal isOpen={enrollTeacherOpen} onClose={() => setEnrollTeacherOpen(false)} onSuccess={handleModalSuccess} />
        <EnrollStudentModal isOpen={enrollStudentOpen} onClose={() => setEnrollStudentOpen(false)} onSuccess={handleModalSuccess} classes={availableClasses} />
        <EditTeacherModal isOpen={editTeacherOpen} onClose={() => { setEditTeacherOpen(false); setSelectedTeacher(null) }} onSuccess={handleModalSuccess} teacher={selectedTeacher} />
        <EditStudentModal isOpen={editStudentOpen} onClose={() => { setEditStudentOpen(false); setSelectedStudent(null) }} onSuccess={handleModalSuccess} student={selectedStudent} classes={availableClasses} />
      </div>
    </div>
  )
}
