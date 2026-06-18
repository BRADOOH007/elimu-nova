"use client"

import { useSchoolInfo } from '@/hooks/use-school-info'
import { IndependentUserWelcome } from '@/components/onboarding/independent-user-welcome'
import { SubscriptionAlert } from '@/components/subscription/subscription-alert'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cleanAIText } from '@/lib/clean-ai-text'
import {
  BookOpen,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Brain,
  Download,
  Upload,
  Eye,
  Edit,
  MoreHorizontal,
  Bell,
  Star,
  Target,
  Loader2,
  AlertCircle,
  Bot,
  Lightbulb,
  Zap,
  BookMarked,
  GraduationCap,
  Award,
  PlayCircle,
  MessageSquare,
  HelpCircle,
  Settings,
  RefreshCw,
  User,
  Layers
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { grades1to9CurriculumByTerm, getLearningAreasForTermAndGrade, type GradeLevel, type LearningAreaData } from '@/data/grades1-9CurriculumByTerm'
import { DashboardSplash } from '@/components/ui/dashboard-splash'

interface DashboardData {
  student: {
    id: string
    name: string
    email: string
    school: string
    teacher: string
    class: string
  }
  stats: {
    activeAssignments: number
    completedAssignments: number
    averageGrade: number | null
    studyTime: number
    overdueAssignments: number
  }
  assignments: Array<{
    id: string
    title: string
    description: string
    dueDate: string
    status: string
    grade: number | null
    teacher: string
    subject: string
  }>
  upcomingLessons: Array<{
    id: string
    title: string
    subject: string
    startTime: string
    duration: number
    type: string
  }>
  studySessions: Array<{
    id: string
    subject: string
    topic: string
    duration: number
    startTime: string
    isCompleted: boolean
  }>
  aiTutorSessions: Array<{
    id: string
    sessionType: string
    subject: string
    question: string
    response: string
    rating: number | null
    createdAt: string
  }>
  analytics: {
    totalStudyTime: number
    averageGrade: number | null
    completedAssignments: number
    pendingAssignments: number
    overdueAssignments: number
    lastActiveDate: string | null
    streakDays: number
    longestStreak: number
    weeklyGoal: number
    monthlyGoal: number
  }
}

interface AITeacherInsights {
  currentLesson: {
    title: string
    subject: string
    objectives: string[]
    progress: number
    nextSteps: string[]
  }
  learningPath: {
    completed: string[]
    current: string
    upcoming: string[]
  }
  personalizedRecommendations: {
    focusAreas: string[]
    studyMethods: string[]
    timeAllocation: string[]
    resources: string[]
  }
  performanceAnalysis: {
    strengths: string[]
    improvements: string[]
    trends: string
    predictions: string[]
  }
  aiTeachingPlan: {
    today: string[]
    thisWeek: string[]
    thisMonth: string[]
  }
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const { schoolInfo, isIndependent, loading: schoolInfoLoading } = useSchoolInfo()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [aiInsights, setAiInsights] = useState<AITeacherInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [isAITyping, setIsAITyping] = useState(false)
  const [currentAILesson, setCurrentAILesson] = useState<any>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    role: 'user' | 'ai'
    content: string
    timestamp: Date
  }>>([
    {
      id: '1',
      role: 'ai',
      content: isIndependent
        ? 'Hello! I\'m your personal AI Teacher. Since you\'re learning independently, I\'m here to provide personalized tutoring, create custom lessons, and guide your learning journey. What would you like to learn today?'
        : 'Hello! I\'m your AI Teacher. I have access to all your teacher\'s materials including lesson plans, schemes of work, and curriculum. How can I help you learn today?',
      timestamp: new Date()
    }
  ])

  // Hide splash screen after loading is done, with a small delay for animation
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSplash(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Get current term
  const getCurrentTerm = () => {
    const month = new Date().getMonth() + 1
    if (month >= 1 && month <= 4) return 1
    if (month >= 5 && month <= 8) return 2
    return 3
  }

  const [currentTerm] = useState(getCurrentTerm())

  // Get grade level from dashboard data, default to Grade 1
  const studentGrade = (dashboardData?.student.class as GradeLevel) || 'Grade 1'

  // Get curriculum data for current grade and term
  const termCurriculum = grades1to9CurriculumByTerm.find(t => t.term === currentTerm && t.grade === studentGrade)
  const learningAreas: LearningAreaData[] = termCurriculum?.learningAreas || []

  useEffect(() => {
    fetchDashboardData()
    fetchAITeacherInsights()
  }, [])

  // Check if this is a new independent user
  useEffect(() => {
    if (!schoolInfoLoading && isIndependent && !localStorage.getItem('independent-student-onboarded')) {
      setShowOnboarding(true)
    }
  }, [isIndependent, schoolInfoLoading])

  const handleOnboardingComplete = () => {
    localStorage.setItem('independent-student-onboarded', 'true')
    setShowOnboarding(false)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/dashboard')

      if (!response.ok) {
        // Don't crash — use empty fallback so the page still renders
        console.warn('Dashboard API returned', response.status)
        setDashboardData({
          student: {
            id: session?.user?.id || '',
            name: session?.user?.name || 'Student',
            email: session?.user?.email || '',
            school: 'ElimuNova',
            teacher: 'AI Teacher',
            class: 'Independent Study',
          },
          stats: { activeAssignments: 0, completedAssignments: 0, averageGrade: null, studyTime: 0, overdueAssignments: 0 },
          assignments: [],
          upcomingLessons: [],
          studySessions: [],
          aiTutorSessions: [],
          analytics: {
            totalStudyTime: 0, averageGrade: null, completedAssignments: 0,
            pendingAssignments: 0, overdueAssignments: 0, lastActiveDate: null,
            streakDays: 0, longestStreak: 0, weeklyGoal: 300, monthlyGoal: 1200,
          },
        })
        return
      }

      const data = await response.json()
      setDashboardData(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      // Still show the page with empty state rather than error screen
      setDashboardData({
        student: {
          id: session?.user?.id || '',
          name: session?.user?.name || 'Student',
          email: session?.user?.email || '',
          school: 'ElimuNova',
          teacher: 'AI Teacher',
          class: 'Independent Study',
        },
        stats: { activeAssignments: 0, completedAssignments: 0, averageGrade: null, studyTime: 0, overdueAssignments: 0 },
        assignments: [],
        upcomingLessons: [],
        studySessions: [],
        aiTutorSessions: [],
        analytics: {
          totalStudyTime: 0, averageGrade: null, completedAssignments: 0,
          pendingAssignments: 0, overdueAssignments: 0, lastActiveDate: null,
          streakDays: 0, longestStreak: 0, weeklyGoal: 300, monthlyGoal: 1200,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAITeacherInsights = async () => {
    try {
      console.log('📚 Fetching AI teacher insights...')
      const response = await fetch('/api/student/ai-teacher-insights')
      console.log('AI insights response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('AI insights data:', data)
        setAiInsights(data)
      } else {
        console.log('AI insights API failed, using fallback data')
        // Set fallback data if API fails
        setAiInsights({
          currentLesson: {
            title: "Welcome to AI Learning",
            subject: "General",
            objectives: ["Get started with AI learning", "Explore your dashboard", "Begin your journey"],
            progress: 0,
            nextSteps: ["Complete your profile", "Start your first lesson", "Ask questions"]
          },
          learningPath: {
            completed: [],
            current: "Getting Started",
            upcoming: ["Basic Concepts", "Practice Exercises", "Advanced Topics"]
          },
          personalizedRecommendations: {
            focusAreas: ["Core subjects", "Practice regularly", "Ask questions"],
            studyMethods: ["Visual learning", "Practice exercises", "AI tutoring"],
            timeAllocation: ["2 hours daily", "1 hour practice", "30 minutes review"],
            resources: ["AI tutor", "Practice materials", "Study guides"]
          },
          performanceAnalysis: {
            strengths: ["Eager to learn", "Good attitude", "Ready to start"],
            improvements: ["Consistent practice", "Regular study", "Ask for help"],
            trends: "Starting your learning journey",
            predictions: ["Good progress expected", "Focus on basics", "Regular practice needed"]
          },
          aiTeachingPlan: {
            today: ["Complete your profile", "Explore the dashboard", "Start first lesson"],
            thisWeek: ["Master basic concepts", "Complete practice exercises", "Take first assessment"],
            thisMonth: ["Complete first unit", "Take comprehensive test", "Move to next level"]
          }
        })
      }
    } catch (err) {
      console.error('Error fetching AI teacher insights:', err)
      // Set fallback data on error
      setAiInsights({
        currentLesson: {
          title: "Welcome to AI Learning",
          subject: "General",
          objectives: ["Get started with AI learning", "Explore your dashboard", "Begin your journey"],
          progress: 0,
          nextSteps: ["Complete your profile", "Start your first lesson", "Ask questions"]
        },
        learningPath: {
          completed: [],
          current: "Getting Started",
          upcoming: ["Basic Concepts", "Practice Exercises", "Advanced Topics"]
        },
        personalizedRecommendations: {
          focusAreas: ["Core subjects", "Practice regularly", "Ask questions"],
          studyMethods: ["Visual learning", "Practice exercises", "AI tutoring"],
          timeAllocation: ["2 hours daily", "1 hour practice", "30 minutes review"],
          resources: ["AI tutor", "Practice materials", "Study guides"]
        },
        performanceAnalysis: {
          strengths: ["Eager to learn", "Good attitude", "Ready to start"],
          improvements: ["Consistent practice", "Regular study", "Ask for help"],
          trends: "Starting your learning journey",
          predictions: ["Good progress expected", "Focus on basics", "Regular practice needed"]
        },
        aiTeachingPlan: {
          today: ["Complete your profile", "Explore the dashboard", "Start first lesson"],
          thisWeek: ["Master basic concepts", "Complete practice exercises", "Take first assessment"],
          thisMonth: ["Complete first unit", "Take comprehensive test", "Move to next level"]
        }
      })
    }
  }

  const startAILesson = async (lessonId: string) => {
    try {
      console.log('🎓 Starting AI lesson:', lessonId)
      const response = await fetch(`/api/student/ai-lessons/${lessonId}/start`, {
        method: 'POST'
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Lesson data received:', data)
        setCurrentAILesson(data.lesson)
        setShowAIChat(true)
      } else {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = { message: `Server error: ${response.status} ${response.statusText}` }
        }
        console.error('Failed to start lesson:', errorData)
        alert(errorData.message || errorData.error || 'Failed to start lesson. Please try again.')
      }
    } catch (err) {
      console.error('Error starting AI lesson:', err)
      alert('An error occurred while starting the lesson. Please try again.')
    }
  }

  const sendAIMessage = async (message: string) => {
    if (!message.trim()) return

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, userMessage])
    setAiMessage("")
    setIsAITyping(true)

    try {
      const response = await fetch('/api/student/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          sessionType: 'lesson',
          context: currentAILesson ? JSON.stringify(currentAILesson) : null
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Add AI response to chat
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai' as const,
          content: data.response || data.message || "I'm here to help you learn! Could you please rephrase your question?",
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, aiMessage])
      } else {
        // Add error message
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai' as const,
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, errorMessage])
      }
    } catch (err) {
      console.error('Error sending message to AI:', err)
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai' as const,
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAITyping(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  }

  // Show onboarding for new independent users
  if (showOnboarding && session?.user) {
    return (
      <IndependentUserWelcome
        userRole="STUDENT"
        userName={session.user.name || 'Student'}
        onComplete={handleOnboardingComplete}
      />
    )
  }

  return (
    <>
      <DashboardSplash
        role="STUDENT"
        userName={session?.user?.name || "Student"}
        visible={showSplash}
      />
      {!showSplash && (
        <div className="max-w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
            {/* Subscription Alert */}
            <SubscriptionAlert />
            {/* AI Teacher Header */}
            <div className="text-center bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 rounded-2xl p-4 md:p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-center mb-4 gap-3">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                    Welcome, {dashboardData?.student.name}!
                  </h1>
                  <p className="text-gray-600 text-sm md:text-lg">
                    Your AI Teacher is ready to guide your learning journey
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4">
                <Button
                  onClick={() => setShowAIChat(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat with AI Teacher
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white/70 backdrop-blur-sm"
                  onClick={fetchAITeacherInsights}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Insights
                </Button>
              </div>
            </div>

            {/* Summary Stats - TutorBot Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
              <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background/95 to-muted/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                      <BookOpen className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Learning Areas</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{learningAreas.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background/95 to-muted/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg shadow-accent/30">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Current Term</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Term {currentTerm}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background/95 to-muted/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shadow-lg shadow-secondary/30">
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Grade Level</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{dashboardData?.student.class || 'Not Set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Learning Areas - TutorBot Style */}
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background/95 via-background/90 to-muted/50 backdrop-blur-xl mt-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  My Learning Areas
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Explore your curriculum organized by subject
                </CardDescription>
              </CardHeader>

              <CardContent className="relative">
                <Accordion type="single" collapsible defaultValue="term-1">
                  {[1, 2, 3].map((term) => {
                    return (
                      <AccordionItem key={term} value={`term-${term}`} className="border-none">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                              term === currentTerm
                                ? 'bg-gradient-to-br from-primary to-primary/70'
                                : 'bg-gradient-to-br from-muted to-muted/70'
                            }`}>
                              <Calendar className={`h-5 w-5 ${term === currentTerm ? 'text-white' : 'text-foreground'}`} />
                            </div>
                            <span>Term {term}</span>
                            {term === currentTerm && (
                              <Badge className="bg-primary/20 text-primary border-primary/30 shadow-sm">Current</Badge>
                            )}
                            <Badge variant="outline" className="bg-muted/50 shadow-sm">
                              {learningAreas.length} Learning Areas
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="grid gap-5">
                            {learningAreas.map((subject) => {
                              const totalAreaStrands = subject.strands.length
                              const totalAreaSubStrands = subject.strands.reduce((acc, s) => acc + s.subStrands.length, 0)

                              const getSubjectGradient = (subjectName: string) => {
                                const name = subjectName.toLowerCase()
                                if (name.includes('math')) return 'from-blue-600 via-blue-500 to-cyan-400'
                                if (name.includes('english') || name.includes('language')) return 'from-emerald-600 via-green-500 to-teal-400'
                                if (name.includes('science') || name.includes('environment')) return 'from-purple-600 via-violet-500 to-indigo-400'
                                if (name.includes('social') || name.includes('studies')) return 'from-orange-600 via-amber-500 to-yellow-400'
                                return 'from-primary via-primary/80 to-primary/60'
                              }

                              return (
                                <Card key={subject.name} className="overflow-hidden border-0 shadow-2xl group">
                                  <div className="flex">
                                    {/* Book Spine */}
                                    <div className={`w-4 sm:w-5 bg-gradient-to-b ${getSubjectGradient(subject.name)} flex-shrink-0 rounded-l-lg shadow-inner`}>
                                      <div className="h-full bg-gradient-to-r from-black/20 to-transparent" />
                                    </div>

                                    {/* Book Cover */}
                                    <div className="flex-1">
                                      <div className={`relative h-40 sm:h-48 bg-gradient-to-br ${getSubjectGradient(subject.name)} overflow-hidden`}>
                                        {/* Page edge effect */}
                                        <div className="absolute top-2 bottom-2 right-0 w-2 bg-gradient-to-l from-gray-200 via-white to-gray-100 z-30 rounded-r-sm shadow-inner" />

                                        {/* Dark gradient overlay for text */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 z-20" />

                                        {/* Publisher badge top-right */}
                                        <div className="absolute top-4 right-6 z-30 flex flex-col items-end gap-1">
                                          <Badge className="bg-white/25 text-white border-white/40 backdrop-blur-md shadow-lg px-3 py-1 font-bold text-xs tracking-wider">
                                            CBC CURRICULUM
                                          </Badge>
                                        </div>

                                        {/* Textbook Title - Bottom */}
                                        <div className="absolute bottom-0 left-0 right-4 z-30 p-5">
                                          <div className="flex items-end gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30 flex-shrink-0">
                                              <BookOpen className="h-7 w-7 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-lg leading-tight tracking-tight">{subject.name}</h3>
                                              <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-white/80 text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-full">
                                                  {totalAreaStrands} Strands
                                                </span>
                                                <span className="text-white/60 text-xs">•</span>
                                                <span className="text-white/80 text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-full">
                                                  {totalAreaSubStrands} Sub-strands
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Book content below cover */}
                                      <CardHeader className="pb-3 pt-4 bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/10 dark:to-background border-t-2 border-amber-200/30 dark:border-amber-800/20">
                                        <CardDescription className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2">
                                          <BookOpen className="h-4 w-4 text-primary" />
                                          Explore strands and sub-strands below
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent className="space-y-4 bg-gradient-to-b from-background to-muted/20">
                                        {subject.strands.map((strand) => (
                                          <div key={strand.name} className="rounded-xl p-4 bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                <Layers className="h-4 w-4 text-primary" />
                                              </div>
                                              <h4 className="font-bold text-sm flex-1 text-slate-900 dark:text-white">{strand.name}</h4>
                                              <Badge variant="secondary" className="bg-secondary/20 shadow-sm">
                                                {strand.subStrands.length} Sub-strands
                                              </Badge>
                                            </div>

                                            <div className="grid gap-2">
                                              {strand.subStrands.map((subStrand) => (
                                                <div
                                                  key={subStrand.name}
                                                  className="flex items-center justify-between p-3 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 hover:shadow-md hover:border-primary/30 transition-all duration-200"
                                                >
                                                  <div className="flex items-center gap-3">
                                                    <CheckCircle className="h-4 w-4 text-primary/60" />
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{subStrand.name}</span>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all"
                                                    onClick={() => {
                                                      sessionStorage.setItem('currentLessonContext', JSON.stringify({
                                                        title: subStrand.name,
                                                        subject: subject.name
                                                      }))
                                                      window.location.href = '/student/ai-tutor'
                                                    }}
                                                  >
                                                    Start Learning
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </CardContent>
                                    </div>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>

            {/* Current AI Lesson */}
            {aiInsights?.currentLesson && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Current AI Lesson
                  </CardTitle>
                  <CardDescription>
                    Continue your learning with AI guidance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 break-words">
                        {aiInsights.currentLesson.title}
                      </h3>
                      <p className="text-gray-600 mb-3 text-sm md:text-base">
                        Subject: {aiInsights.currentLesson.subject}
                      </p>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{aiInsights.currentLesson.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${aiInsights.currentLesson.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiInsights.currentLesson.objectives.map((objective, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-0 text-xs md:text-sm">
                            {objective}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="w-full lg:w-auto flex-shrink-0">
                      <Button
                        onClick={() => startAILesson('current')}
                        className="w-full lg:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Study Time</p>
                      <p className="text-3xl font-bold">{Math.round((dashboardData?.stats.studyTime || 0) / 60)}h</p>
                      <p className="text-blue-200 text-xs">This week</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Completed</p>
                      <p className="text-3xl font-bold">{dashboardData?.stats.completedAssignments || 0}</p>
                      <p className="text-green-200 text-xs">Assignments</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium">Average Grade</p>
                      <p className="text-3xl font-bold">
                        {dashboardData?.stats.averageGrade ? Math.round(dashboardData.stats.averageGrade) : 'N/A'}%
                      </p>
                      <p className="text-yellow-200 text-xs">This week</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm font-medium">Active</p>
                      <p className="text-3xl font-bold">{dashboardData?.stats.activeAssignments || 0}</p>
                      <p className="text-pink-200 text-xs">Assignments</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-pink-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Dialog */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">AI Teacher</DialogTitle>
                  <DialogDescription className="text-gray-600">Personalized learning assistance</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isAITyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex gap-3">
                <Textarea
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="Ask me anything about your lessons..."
                  className="flex-1 bg-white shadow-sm border-gray-300"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendAIMessage(aiMessage)
                    }
                  }}
                />
                <Button
                  onClick={() => sendAIMessage(aiMessage)}
                  disabled={isAITyping || !aiMessage.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isAITyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
