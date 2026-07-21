"use client"

import { useSchoolInfo } from "@/hooks/use-school-info"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { IndependentUserWelcome } from "@/components/onboarding/independent-user-welcome"
import { SubscriptionAlert } from "@/components/subscription/subscription-alert"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import TeacherStatsGrid from "@/components/teacher/stats-grid"
import QuickActionsGrid from "@/components/teacher/quick-actions"
import TodaySchedule from "@/components/teacher/today-schedule"
import AIAlertsPanel from "@/components/teacher/ai-alerts"
import RecentSubmissionsPanel from "@/components/teacher/recent-submissions"
import MessagesOverview from "@/components/teacher/messages-overview"
import ActivityList from "@/components/teacher/activity-list"
import MeetingsList from "@/components/teacher/meetings-list"

interface Meeting {
  id: string; title: string; description: string | null; date: string; time: string;
  duration: number; location: string | null; status: string; attendees?: any;
  creator: { firstName: string; lastName: string; email: string };
  createdAt: string; updatedAt: string; progress: number; progressText: string;
  daysUntil: number; hoursUntil: number; minutesUntil: number;
  isUpcoming: boolean; isToday: boolean; isTomorrow: boolean; isThisWeek: boolean;
}

interface DashboardStats {
  totalStudents: { value: number; change: string; changeType: "positive" | "negative" | "neutral" | "warning" }
  activeLessonPlans: { value: number; change: string; changeType: "positive" | "negative" | "neutral" | "warning" }
  pendingAssignments: { value: number; change: string; changeType: "positive" | "negative" | "neutral" | "warning" }
  completedThisWeek: { value: number; change: string; changeType: "positive" | "negative" | "neutral" | "warning" }
}

interface RecentActivity {
  id: string; type: string; action: string; description: string; time: string;
  user: string; metadata?: { activityType?: string }
}

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const { schoolInfo, isIndependent, loading: schoolInfoLoading } = useSchoolInfo()
  const { unreadCount } = useUnreadMessages()
  const [displayName, setDisplayName] = useState("")
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [aiAlerts, setAiAlerts] = useState<any[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/user-profile?userId=${session.user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p) setDisplayName(`${p.firstName || ""} ${p.lastName || ""}`.trim()) })
      .catch(() => {})
  }, [session?.user?.id])

  useEffect(() => {
    const fetchStats = async (attempt = 0) => {
      try {
        const response = await fetch("/api/teacher/dashboard-stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setRecentActivities(data.recentActivities || [])
        } else if (response.status >= 500 && attempt < 2) {
          setTimeout(() => fetchStats(attempt + 1), 1500 * (attempt + 1))
          return
        } else {
          setStats({
            totalStudents: { value: 0, change: "Unable to load", changeType: "neutral" },
            activeLessonPlans: { value: 0, change: "Unable to load", changeType: "neutral" },
            pendingAssignments: { value: 0, change: "Unable to load", changeType: "neutral" },
            completedThisWeek: { value: 0, change: "Unable to load", changeType: "neutral" },
          })
        }
      } catch {
        if (attempt < 2) {
          setTimeout(() => fetchStats(attempt + 1), 1500 * (attempt + 1))
          return
        }
        setStats({
          totalStudents: { value: 0, change: "Connection error", changeType: "neutral" },
          activeLessonPlans: { value: 0, change: "Connection error", changeType: "neutral" },
          pendingAssignments: { value: 0, change: "Connection error", changeType: "neutral" },
          completedThisWeek: { value: 0, change: "Connection error", changeType: "neutral" },
        })
      } finally { setStatsLoading(false) }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/teacher/meetings?limit=1")
        if (response.ok) {
          const data = await response.json()
          setMeetings((data.upcomingMeetings || []).filter((m: Meeting) => m.status !== "COMPLETED" && m.status !== "CANCELLED"))
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      setScheduleLoading(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        const res = await fetch(`/api/teacher/schedules?date=${today}&limit=10&sortOrder=asc`)
        if (res.ok) setTodaySchedule((await res.json()).schedules || [])
      } catch { /* silent */ }
      finally { setScheduleLoading(false) }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      setAlertsLoading(true)
      try {
        const res = await fetch("/api/teacher/analytics/ai-insights?period=7")
        if (res.ok) {
          const data = await res.json()
          setAiAlerts((data.insights || []).filter((i: any) => i.priority === "high" || i.priority === "medium").slice(0, 5))
        }
      } catch { /* silent */ }
      finally { setAlertsLoading(false) }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      setSubmissionsLoading(true)
      try {
        const res = await fetch("/api/assignments?limit=5")
        if (res.ok) {
          const data = await res.json()
          setRecentSubmissions(data.assignments || data.submissions || [])
        }
      } catch { /* silent */ }
      finally { setSubmissionsLoading(false) }
    })()
  }, [])

  useEffect(() => {
    if (!schoolInfoLoading && isIndependent && !localStorage.getItem("independent-teacher-onboarded")) {
      setShowOnboarding(true)
    }
  }, [isIndependent, schoolInfoLoading])

  const refreshActivities = async () => {
    setActivityLoading(true)
    try {
      const response = await fetch("/api/activities?limit=3")
      if (response.ok) setRecentActivities((await response.json()).activities)
    } catch { /* silent */ }
    finally { setActivityLoading(false) }
  }

  const deleteActivity = async (activityId: string) => {
    if (!confirm('Delete this activity?')) return
    try {
      const response = await fetch(`/api/activities/${activityId}`, { method: "DELETE" })
      if (response.ok) setRecentActivities(prev => prev.filter(a => a.id !== activityId))
    } catch { /* silent */ }
  }

  if (showOnboarding && session?.user) {
    return (
      <IndependentUserWelcome
        userRole="TEACHER"
        userName={displayName || session.user.name || "Teacher"}
        onComplete={() => { localStorage.setItem("independent-teacher-onboarded", "true"); setShowOnboarding(false) }}
      />
    )
  }

  return (
    <div>
      <SubscriptionAlert />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Mwalimu {(displayName || session?.user?.name || "Teacher").split(" ")[0]}!
        </h1>
        <p className="text-gray-600">
          {isIndependent
            ? "Welcome to your independent teaching workspace! Create lesson plans, manage content, and use AI tools without school restrictions."
            : schoolInfo?.school?.name
              ? `Here's what's happening at ${schoolInfo.school.name} today.`
              : "Here's what's happening in your classroom today."
          }
        </p>
      </div>

      <TeacherStatsGrid stats={stats} loading={statsLoading} />
      <QuickActionsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TodaySchedule schedules={todaySchedule} loading={scheduleLoading} />
        <AIAlertsPanel alerts={aiAlerts} loading={alertsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentSubmissionsPanel submissions={recentSubmissions} loading={submissionsLoading} />
        <MessagesOverview unreadCount={unreadCount} hasSession={!!session} />
      </div>

      <ActivityList activities={recentActivities} loading={statsLoading || activityLoading} onRefresh={refreshActivities} onDelete={deleteActivity} />
      <MeetingsList meetings={meetings} loading={loading} />
    </div>
  )
}
