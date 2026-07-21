"use client"

import { useSchoolInfo } from "@/hooks/use-school-info"
import { IndependentUserWelcome } from "@/components/onboarding/independent-user-welcome"
import { SubscriptionAlert } from "@/components/subscription/subscription-alert"
import AssignmentsList from "@/components/student/assignments-list"
import UpcomingLessons from "@/components/student/upcoming-lessons"
import StudyStreak from "@/components/student/study-streak"
import AIInsightsCards from "@/components/student/ai-insights-cards"
import RecentStudySessions from "@/components/student/recent-study-sessions"
import AITutorHistory from "@/components/student/ai-tutor-history"
import StudentGreeting from "@/components/student/greeting"
import StudentSummaryStats from "@/components/student/summary-stats"
import CurriculumAccordion from "@/components/student/curriculum-accordion"
import LearningStats from "@/components/student/learning-stats"
import AIChatDialog from "@/components/student/ai-chat-dialog"
import { CardSkeleton, StatsCardSkeleton } from "@/components/ui/skeleton"
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus"
import { useSession } from "next-auth/react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Code2, ChevronRight } from "lucide-react"
import { grades1to9CurriculumByTerm, type GradeLevel, type LearningAreaData } from "@/data/grades1-9CurriculumByTerm"

interface DashboardData {
  student: { id: string; name: string; email: string; school: string; teacher: string; class: string }
  stats: { activeAssignments: number; completedAssignments: number; averageGrade: number | null; studyTime: number; overdueAssignments: number }
  assignments: Array<{ id: string; title: string; description: string; dueDate: string; status: string; grade: number | null; teacher: string; subject: string }>
  upcomingLessons: Array<{ id: string; title: string; subject: string; time: string; teacher: string; location?: string }>
  studySessions: Array<{ id: string; subject: string; topic: string; duration: number; startTime: string; endTime?: string; notes?: string }>
  aiTutorSessions: Array<{ id: string; sessionType?: string; subject: string; topic?: string; question: string; response: string; rating: number | null; isHelpful?: boolean | null; createdAt: string }>
  analytics: { totalStudyTime: number; averageGrade: number | null; completedAssignments: number; pendingAssignments: number; overdueAssignments: number; lastActiveDate: string | null; streakDays: number; longestStreak: number; weeklyGoal: number; monthlyGoal: number }
}

const fallbackData: DashboardData = {
  student: { id: "", name: "Student", email: "", school: "ElimuNova", teacher: "AI Teacher", class: "Independent Study" },
  stats: { activeAssignments: 0, completedAssignments: 0, averageGrade: null, studyTime: 0, overdueAssignments: 0 },
  assignments: [], upcomingLessons: [], studySessions: [], aiTutorSessions: [],
  analytics: { totalStudyTime: 0, averageGrade: null, completedAssignments: 0, pendingAssignments: 0, overdueAssignments: 0, lastActiveDate: null, streakDays: 0, longestStreak: 0, weeklyGoal: 300, monthlyGoal: 1200 },
}

function getCurrentTerm() {
  const month = new Date().getMonth() + 1
  if (month >= 1 && month <= 4) return 1
  if (month >= 5 && month <= 8) return 2
  return 3
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const { schoolInfo, isIndependent, loading: schoolInfoLoading } = useSchoolInfo()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
  const [isAITyping, setIsAITyping] = useState(false)
  const [currentAILesson, setCurrentAILesson] = useState<any>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "ai"; content: string; timestamp: Date }>>([
    {
      id: "1",
      role: "ai",
      content: "Hello! I'm your AI Teacher. I have access to all your teacher's materials including lesson plans, schemes of work, and curriculum. How can I help you learn today?",
      timestamp: new Date(),
    },
  ])

  const currentTerm = useState(getCurrentTerm())[0]
  const studentGrade = (dashboardData?.student.class as GradeLevel) || "Grade 1"
  const termCurriculum = grades1to9CurriculumByTerm.find(t => t.term === currentTerm && t.grade === studentGrade)
  const learningAreas: LearningAreaData[] = termCurriculum?.learningAreas || []

  // Inject "Coding & Programming" as a learning area available to all grades
  const codingLearningArea: LearningAreaData = {
    name: "Coding & Programming",
    strands: [
      {
        name: "COMPUTATIONAL THINKING",
        subStrands: [
          { name: "Algorithms & Flowcharts" },
          { name: "Pattern Recognition" },
          { name: "Decomposition" },
          { name: "Debugging Strategies" },
        ]
      },
      {
        name: "PROGRAMMING FUNDAMENTALS",
        subStrands: [
          { name: "Variables & Data Types" },
          { name: "Conditionals & Logic" },
          { name: "Loops & Iteration" },
          { name: "Functions & Reusability" },
        ]
      },
      {
        name: "WEB DEVELOPMENT",
        subStrands: [
          { name: "HTML Structure & Semantics" },
          { name: "CSS Styling & Layouts" },
          { name: "JavaScript Interactivity" },
          { name: "Responsive Design" },
        ]
      },
      {
        name: "ADVANCED TOPICS",
        subStrands: [
          { name: "Python Programming" },
          { name: "Data Structures & Algorithms" },
          { name: "APIs & Databases" },
          { name: "AI & Machine Learning Basics" },
        ]
      },
    ]
  }
  const allLearningAreas = [...learningAreas, codingLearningArea]

  useEffect(() => {
    fetchDashboardData()
    if (session?.user?.id) {
      fetch(`/api/user-profile?userId=${session.user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p) setDisplayName(`${p.firstName || ""} ${p.lastName || ""}`.trim()) })
        .catch(() => {})
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!schoolInfoLoading && isIndependent && !localStorage.getItem("independent-student-onboarded")) {
      setShowOnboarding(true)
    }
  }, [isIndependent, schoolInfoLoading])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/student/dashboard")
      if (!response.ok) {
        setDashboardData({ ...fallbackData, student: { ...fallbackData.student, id: session?.user?.id || "", name: session?.user?.name || "Student" } })
        return
      }
      setDashboardData(await response.json())
    } catch {
      setDashboardData({ ...fallbackData, student: { ...fallbackData.student, id: session?.user?.id || "", name: session?.user?.name || "Student" } })
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useRefreshOnFocus(fetchDashboardData, !loading)

  const sendAIMessage = async (message: string) => {
    if (!message.trim()) return
    const userMessage = { id: Date.now().toString(), role: "user" as const, content: message, timestamp: new Date() }
    setChatMessages(prev => [...prev, userMessage])
    setAiMessage("")
    setIsAITyping(true)
    try {
      const response = await fetch("/api/student/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message, sessionType: "lesson", context: currentAILesson ? JSON.stringify(currentAILesson) : null }),
      })
      if (response.ok) {
        const data = await response.json()
        setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: data.response || "I'm here to help!", timestamp: new Date() }])
      } else {
        setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.", timestamp: new Date() }])
      }
    } catch {
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.", timestamp: new Date() }])
    } finally {
      setIsAITyping(false)
    }
  }

  if (showOnboarding && session?.user) {
    return <IndependentUserWelcome userRole="STUDENT" userName={displayName || session.user.name || "Student"} onComplete={() => { localStorage.setItem("independent-student-onboarded", "true"); setShowOnboarding(false) }} />
  }

  return (
    <>
      <div className="max-w-full overflow-x-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
          <SubscriptionAlert />
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          ) : (
            <>
              <StudentGreeting
                displayName={displayName || dashboardData?.student.name || session?.user?.name || "Student"}
                onChatClick={() => setShowAIChat(true)}
                onRefreshInsights={() => {}}
              />
              <StudentSummaryStats learningAreasCount={allLearningAreas.length} currentTerm={currentTerm} gradeLevel={dashboardData?.student.class || "Not Set"} />
              <CurriculumAccordion learningAreas={allLearningAreas} currentTerm={currentTerm} />
              <Link
                href="/student/coding"
                className="block group bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 rounded-2xl p-5 hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                      <Code2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">AI Coding Studio</h3>
                      <p className="text-white/80 text-sm">Learn Scratch, Web Dev, Python, AI & more</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all">
                    <span className="text-sm font-semibold">Start Coding</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
              <LearningStats
                studyTime={dashboardData?.stats.studyTime || 0}
                completedAssignments={dashboardData?.stats.completedAssignments || 0}
                averageGrade={dashboardData?.stats.averageGrade ?? null}
                activeAssignments={dashboardData?.stats.activeAssignments || 0}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AssignmentsList assignments={dashboardData?.assignments || []} />
                <UpcomingLessons lessons={dashboardData?.upcomingLessons || []} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentStudySessions sessions={dashboardData?.studySessions || []} />
                <AITutorHistory sessions={dashboardData?.aiTutorSessions || []} />
              </div>
              {dashboardData?.analytics && (
                <StudyStreak analytics={dashboardData.analytics} studyTimeThisWeek={dashboardData.stats.studyTime} />
              )}
            </>
          )}
        </div>
      </div>

      <AIChatDialog
        open={showAIChat}
        onOpenChange={setShowAIChat}
        currentLesson={currentAILesson}
        isTyping={isAITyping}
        messages={chatMessages}
        message={aiMessage}
        onMessageChange={setAiMessage}
        onSend={sendAIMessage}
      />
    </>
  )
}
