"use client"

import { useSchoolInfo } from "@/hooks/use-school-info"
import { IndependentUserWelcome } from "@/components/onboarding/independent-user-welcome"
import { SubscriptionAlert } from "@/components/subscription/subscription-alert"
import LiveStudyPulse from "@/components/student/live-study-pulse"
import PerformanceTrends from "@/components/student/performance-trends"
import StudyGoalTracker from "@/components/student/study-goal-tracker"
import SmartRecommendations from "@/components/student/smart-recommendations"
import AssignmentsList from "@/components/student/assignments-list"
import UpcomingLessons from "@/components/student/upcoming-lessons"
import StudyStreak from "@/components/student/study-streak"
import AIInsightsCards from "@/components/student/ai-insights-cards"
import XpBadge from "@/components/student/xp-badge"
import SkillMasteryWidget from "@/components/student/skill-mastery-widget"
import CommonMistakes from "@/components/student/common-mistakes"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import ChatContainer from "@/components/chat/chat-container"
import RecentStudySessions from "@/components/student/recent-study-sessions"
import AITutorHistory from "@/components/student/ai-tutor-history"
import { AIUsageCard } from "@/components/ai-usage-card"
import StudentGreeting from "@/components/student/greeting"
import StudentSummaryStats from "@/components/student/summary-stats"
import CurriculumAccordion from "@/components/student/curriculum-accordion"
import LearningStats from "@/components/student/learning-stats"
import { CardSkeleton, StatsCardSkeleton } from "@/components/ui/skeleton"
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus"
import { useSession } from "next-auth/react"
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Bell, Code2, ChevronRight, GraduationCap, Brain, ClipboardList } from "lucide-react"
import { grades1to9CurriculumByTerm, type GradeLevel, type LearningAreaData } from "@/data/grades1-9CurriculumByTerm"

interface SubStrand { name: string; learningOutcomes?: string[]; activities?: string[] }
interface Strand { name: string; subStrands: SubStrand[] }
interface LearningArea { name: string; strands: Strand[] }

interface SkillMasteryItem {
  skillName: string; skillCategory: string; masteryScore: number; timesCorrect: number; timesTested: number
}

interface ProgressData {
  xp: number; streak: number; consecutiveCorrect: number; masteryScore: number
  preferredDifficulty: string; commonMistakes: any; totalQuestions: number; correctAnswers: number
  skillMastery: SkillMasteryItem[]
}

interface DashboardData {
  student: { id: string; name: string; email: string; school: string; teacher: string; class: string }
  stats: { activeAssignments: number; completedAssignments: number; averageGrade: number | null; studyTime: number; overdueAssignments: number }
  progress: ProgressData | null
  assignments: Array<{ id: string; title: string; description: string; dueDate: string; status: string; grade: number | null; teacher: string; subject: string }>
  upcomingLessons: Array<{ id: string; title: string; subject: string; time: string; teacher: string; location?: string }>
  studySessions: Array<{ id: string; subject: string; topic: string; duration: number; startTime: string; endTime?: string; notes?: string }>
  aiTutorSessions: Array<{ id: string; sessionType?: string; subject: string; topic?: string; question: string; response: string; rating: number | null; isHelpful?: boolean | null; createdAt: string }>
  analytics: { totalStudyTime: number; averageGrade: number | null; completedAssignments: number; pendingAssignments: number; overdueAssignments: number; lastActiveDate: string | null; streakDays: number; longestStreak: number; weeklyGoal: number; monthlyGoal: number }
  unreadNotificationCount?: number
}

const fallbackData: DashboardData = {
  student: { id: "", name: "Student", email: "", school: "ElimuNova", teacher: "AI Teacher", class: "Independent Study" },
  stats: { activeAssignments: 0, completedAssignments: 0, averageGrade: null, studyTime: 0, overdueAssignments: 0 },
  progress: null,
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
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState<Array<{id:string;title:string;message:string;type:string;createdAt:string;isRead:boolean}>>([])
  const notifRef = useRef<HTMLDivElement>(null)

  const currentTerm = useState(getCurrentTerm())[0]
  const rawGrade = dashboardData?.student.class
  const knownGrades: GradeLevel[] = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','PP1','PP2']
  const studentGrade: GradeLevel = rawGrade && knownGrades.includes(rawGrade as GradeLevel) ? (rawGrade as GradeLevel) : 'Grade 1'
  const termCurriculum = grades1to9CurriculumByTerm.find(t => t.term === currentTerm && t.grade === studentGrade)
  const learningAreas: LearningAreaData[] = termCurriculum?.learningAreas || []

  // DB curriculum state — fetched from API, falls back to hardcoded
  const [dbCurriculum, setDbCurriculum] = useState<LearningArea[] | null>(null)

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
  const allLearningAreas: LearningArea[] = dbCurriculum || [...learningAreas, codingLearningArea]

  // Fetch curriculum from DB on mount — falls back to hardcoded data
  useEffect(() => {
    if (!studentGrade || studentGrade === 'Grade 10' || studentGrade === 'Grade 11' || studentGrade === 'Grade 12') return
    const subjects = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE']
    Promise.all(subjects.map(subject =>
      fetch('/api/curriculum/auto-populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: studentGrade, subject, term: currentTerm }),
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    )).then(results => {
      const areas: LearningArea[] = []
      results.forEach((data, i) => {
        if (data?.topics?.length > 0) {
          areas.push({
            name: subjects[i],
            strands: data.topics.map((t: any) => ({
              name: t.strandName,
              subStrands: t.substrands?.map((s: any) => ({ name: s.name, learningOutcomes: s.learningOutcomes, activities: s.activities })) || [],
            })),
          })
        }
      })
      if (areas.length > 0) setDbCurriculum([...areas, codingLearningArea as any])
    }).catch(() => {})
  }, [studentGrade, currentTerm])

  useEffect(() => {
    fetchDashboardData()
    if (session?.user?.id) {
      fetch(`/api/user-profile?userId=${session.user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p) setDisplayName(`${p.firstName || ""} ${p.lastName || ""}`.trim()) })
        .catch(e => console.error('Failed to fetch profile:', e))
    }
  }, [session?.user?.id])

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications?unreadOnly=true&limit=10')
      if (r.ok) setNotifications(await r.json())
    } catch (e) { console.error('Failed to fetch notifications:', e) }
  }, [])

  useEffect(() => {
    if (showNotifs) fetchNotifications()
  }, [showNotifs, fetchNotifications])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session?.user?.id }) })
      setNotifications([])
      setDashboardData(prev => prev ? { ...prev, unreadNotificationCount: 0 } : prev)
    } catch (e) { console.error('Failed to mark all as read:', e) }
  }

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

  const handleAIChat = async (message: string, history: any[]) => {
    const res = await fetch("/api/student/ai-tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message, sessionType: "lesson", messages: history }),
    })
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return data.response || "I'm here to help!"
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
              <div className="relative">
                <StudentGreeting
                  displayName={displayName || dashboardData?.student.name || session?.user?.name || "Student"}
                  onChatClick={() => setShowAIChat(true)}
                  onRefreshInsights={fetchDashboardData}
                />
                <div ref={notifRef} className="absolute top-3 right-3">
                  <button onClick={() => setShowNotifs(v => !v)}
                    className="relative p-2 rounded-full bg-white hover:bg-slate-50 transition-colors shadow-sm">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {(dashboardData?.unreadNotificationCount || 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none shadow">
                        {dashboardData!.unreadNotificationCount! > 99 ? '99+' : dashboardData!.unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between p-3 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">Notifications</span>
                        {notifications.length > 0 && (
                          <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="p-6 text-center text-sm text-slate-400">All caught up!</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link href="/student/learn?tab=quiz"
                  className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl text-white hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <Brain className="h-5 w-5 shrink-0" />
                  <div><p className="text-sm font-bold">Take Quiz</p><p className="text-[10px] text-purple-200">Bloom's & Checkpoint</p></div>
                </Link>
                <Link href="/student/learn?tab=study"
                  className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl text-white hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <GraduationCap className="h-5 w-5 shrink-0" />
                  <div><p className="text-sm font-bold">Study Topic</p><p className="text-[10px] text-blue-200">AI-powered lessons</p></div>
                </Link>
                <Link href="/student/assignments"
                  className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl text-white hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <ClipboardList className="h-5 w-5 shrink-0" />
                  <div><p className="text-sm font-bold">Assignments</p><p className="text-[10px] text-amber-200">View & submit</p></div>
                </Link>
                <Link href="/student/learn?tab=tutor"
                  className="flex items-center gap-3 p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl text-white hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <Brain className="h-5 w-5 shrink-0" />
                  <div><p className="text-sm font-bold">AI Tutor</p><p className="text-[10px] text-emerald-200">Ask anything</p></div>
                </Link>
              </div>
              {dashboardData?.progress && <XpBadge progress={dashboardData.progress} />}
              <LiveStudyPulse />
              <PerformanceTrends />
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
              <StudyGoalTracker />
              <AIUsageCard />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AssignmentsList assignments={dashboardData?.assignments || []} />
                <UpcomingLessons lessons={dashboardData?.upcomingLessons || []} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentStudySessions sessions={dashboardData?.studySessions || []} />
                <SmartRecommendations />
              </div>
              {dashboardData?.analytics && (
                <StudyStreak analytics={dashboardData.analytics} studyTimeThisWeek={dashboardData.stats.studyTime} />
              )}
              {dashboardData?.progress?.skillMastery && dashboardData.progress.skillMastery.length > 0 && (
                <SkillMasteryWidget skills={dashboardData.progress.skillMastery} />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AITutorHistory sessions={dashboardData?.aiTutorSessions || []} />
                <CommonMistakes
                  mistakes={dashboardData?.progress?.commonMistakes ?? null}
                  preferredDifficulty={dashboardData?.progress?.preferredDifficulty ?? "medium"}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-2xl w-full h-[85vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl shadow-2xl">
          <ChatContainer
            onSend={handleAIChat}
            headerTitle="AI Teacher"
            headerSubtitle="Personalised learning assistant"
            quickPrompts={['Explain this lesson', 'Give me practice questions', 'What should I study next?', 'Quiz me!']}
            placeholder="Ask me anything about your lessons…"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
