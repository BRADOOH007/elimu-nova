"use client"

import { useSchoolInfo } from '@/hooks/use-school-info'
import { IndependentUserWelcome } from '@/components/onboarding/independent-user-welcome'
import { SubscriptionAlert } from '@/components/subscription/subscription-alert'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  User
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

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
  const [error, setError] = useState<string | null>(null)
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
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
        ? "Hello! I'm your personal AI Teacher. Since you're learning independently, I'm here to provide personalized tutoring, create custom lessons, and guide your learning journey. What would you like to learn today?"
        : "Hello! I'm your AI Teacher. I have access to all your teacher's materials including lesson plans, schemes of work, and curriculum. How can I help you learn today?",
      timestamp: new Date()
    }
  ])

  useEffect(() => {
    fetchDashboardData()
    fetchAITeacherInsights()
    
    // Refresh dashboard data every minute to handle session expiration
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 60000) // 60 seconds
    
    return () => clearInterval(interval)
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
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your AI-powered dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

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
              Welcome, {dashboardData.student.name}!
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

      {/* AI Teaching Plan */}
      {aiInsights && aiInsights.aiTeachingPlan && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg border-0">
              <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <GraduationCap className="w-5 h-5 mr-2" />
              AI Teaching Plan
                </CardTitle>
            <CardDescription>
              Your personalized learning path designed by your AI Teacher
            </CardDescription>
              </CardHeader>
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm md:text-base">
                  <Calendar className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                  Today's Focus
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {(aiInsights.aiTeachingPlan.today || []).map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Target className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm md:text-base">
                  <Clock className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                  This Week
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {(aiInsights.aiTeachingPlan.thisWeek || []).map((item, index) => (
                    <li key={index} className="flex items-start">
                      <BookOpen className="w-3 h-3 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span className="break-words">{item}</span>
                    </li>
                  ))}
                </ul>
                        </div>
                        <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm md:text-base">
                  <TrendingUp className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                  This Month
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {(aiInsights.aiTeachingPlan.thisMonth || []).map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Award className="w-3 h-3 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                      <span className="break-words">{item}</span>
                    </li>
                  ))}
                </ul>
                        </div>
                      </div>
              </CardContent>
            </Card>
      )}

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
                <p className="text-3xl font-bold">{Math.round(dashboardData.stats.studyTime / 60)}h</p>
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
                <p className="text-3xl font-bold">{dashboardData.stats.completedAssignments}</p>
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
                  {dashboardData.stats.averageGrade ? Math.round(dashboardData.stats.averageGrade) : 'N/A'}%
                </p>
                <p className="text-yellow-200 text-xs">Overall</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">AI Sessions</p>
                <p className="text-3xl font-bold">{dashboardData.aiTutorSessions.length}</p>
                <p className="text-purple-200 text-xs">This week</p>
              </div>
              <Brain className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

      {/* AI Learning Path */}
      {aiInsights?.learningPath && (
        <Card className="shadow-lg border-0">
              <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <BookMarked className="w-5 h-5 mr-2 text-blue-600" />
              Your Learning Journey
            </CardTitle>
            <CardDescription>
              Track your progress through the AI-designed curriculum
            </CardDescription>
              </CardHeader>
              <CardContent>
            <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto pb-4">
              {(aiInsights.learningPath.completed || []).map((topic, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold">
                    ✓
                      </div>
                  <span className="ml-1 md:ml-2 text-xs md:text-sm text-gray-600 whitespace-nowrap">{topic}</span>
                  {index < (aiInsights.learningPath.completed || []).length - 1 && (
                    <div className="w-4 md:w-8 h-0.5 bg-gray-300 mx-1 md:mx-2"></div>
                  )}
                </div>
              ))}
              <div className="flex items-center flex-shrink-0">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold">
                  →
                </div>
                <span className="ml-1 md:ml-2 text-xs md:text-sm font-medium text-blue-600 whitespace-nowrap">
                  {aiInsights.learningPath.current || 'Current Topic'}
                </span>
              </div>
              {(aiInsights.learningPath.upcoming || []).map((topic, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  <div className="w-4 md:w-8 h-0.5 bg-gray-300 mx-1 md:mx-2"></div>
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs md:text-sm font-bold">
                    {index + 1}
                      </div>
                  <span className="ml-1 md:ml-2 text-xs md:text-sm text-gray-400 whitespace-nowrap">{topic}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
      )}

      {/* Quick Actions */}
      <Card className=" border-0shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Zap className="w-5 h-5 mr-2 text-yellow-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Access your learning tools and resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Link href="/student/lesson-plans">
              <Button className="w-full h-20 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg">
                <div className="text-center">
                  <BookOpen className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">AI Lessons</div>
                </div>
            </Button>
            </Link>
            <Link href="/student/assignments">
              <Button className="w-full h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg">
                <div className="text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Assignments</div>
                </div>
            </Button>
            </Link>
            <Link href="/student/ai-tutor">
              <Button className="w-full h-20 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg">
                <div className="text-center">
                  <Brain className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">AI Tutor</div>
                </div>
            </Button>
            </Link>
            <Button 
              onClick={() => setShowAIChat(true)}
              className="w-full h-20 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
            >
              <div className="text-center">
                <MessageSquare className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Ask AI</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent AI Sessions */}
      {(() => {
        const now = new Date()
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
        
        const recentSessions = dashboardData.aiTutorSessions
          .filter(session => {
            const sessionTime = new Date(session.createdAt)
            return sessionTime > thirtyMinutesAgo
          })
          .slice(0, 3)
        
        return (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Recent AI Sessions
              </CardTitle>
              <CardDescription>
                Your latest interactions with your AI Teacher (last 30 minutes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => {
                    const sessionTime = new Date(session.createdAt)
                    const timeAgo = Math.floor((now.getTime() - sessionTime.getTime()) / (1000 * 60))
                    
                    return (
                      <div key={session.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                {session.sessionType}
                              </Badge>
                              {session.subject && (
                                <Badge variant="outline" className="bg-purple-100 text-purple-700">
                                  {session.subject}
                                </Badge>
                              )}
                              <Badge variant="outline" className="bg-green-100 text-green-700">
                                {timeAgo}m ago
                              </Badge>
                            </div>
                            <p className="text-gray-900 font-medium mb-1">{session.question}</p>
                            <p className="text-gray-600 text-sm line-clamp-2">{session.response}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-xs text-gray-500">
                              {sessionTime.toLocaleTimeString()}
                            </p>
                            {session.rating && (
                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3 h-3 ${
                                      i < session.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    No recent AI sessions in the last 30 minutes
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Start a conversation with your AI Teacher to see sessions here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* AI Chat Modal */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2 text-blue-600" />
              Chat with Your AI Teacher
            </DialogTitle>
            <DialogDescription>
              Ask questions, get help, or request personalized lessons
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="h-64 bg-gray-50 rounded-lg p-4 overflow-y-auto">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-green-500' 
                        : 'bg-blue-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg shadow-sm max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-green-100 text-green-900' 
                        : 'bg-white text-gray-700'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{cleanAIText(message.content)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isAITyping && (
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask me anything about your studies..."
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button 
                onClick={() => sendAIMessage(aiMessage)}
                disabled={isAITyping || !aiMessage.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {isAITyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
