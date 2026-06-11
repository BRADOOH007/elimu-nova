"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cleanAIText } from "@/lib/clean-ai-text"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Target,
  Award,
  BarChart3,
  Loader2,
  AlertCircle,
  Brain,
  Bot,
  MessageCircle,
  Star,
  Calendar,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BookMarked,
  Activity,
  PieChart,
  LineChart,
  RefreshCw
} from "lucide-react"

interface ProgressData {
  // Basic metrics
  totalStudyTime: number
  weeklyStudyTime: number
  monthlyStudyTime: number
  averageGrade: number | null
  completedAssignments: number
  pendingAssignments: number
  overdueAssignments: number
  studyStreak: number
  aiHelpRequests: number

  // Goals
  weeklyGoal: number
  monthlyGoal: number
  yearlyGoal: number

  // Detailed data
  subjectPerformance: any[]
  learningPatterns: any
  recentAISessions: any[]
  recentSubmissions: any[]
  recentStudySessions: any[]

  // AI Insights
  aiInsights: {
    analysis: string
    recommendations: string[]
    strengths: string[]
    areasForImprovement: string[]
  }

  // Teacher info
  teacher: {
    name: string
    email: string
  }

  // Student info
  student: {
    name: string
    grade: string
    school: string
  }
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'patterns' | 'ai-insights'>('overview')

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/progress')
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress data')
      }
      
      const data = await response.json()
      setProgressData(data)
    } catch (err) {
      console.error('Error fetching progress data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">AI Teacher Analyzing Your Progress</h3>
          <p className="text-gray-600">Gathering comprehensive learning insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Progress</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProgressData} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!progressData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Progress Data</h3>
          <p className="text-gray-600">Start learning to see your progress here!</p>
        </div>
      </div>
    )
  }

  const weeklyProgress = getProgressPercentage(progressData.weeklyStudyTime, progressData.weeklyGoal)
  const monthlyProgress = getProgressPercentage(progressData.monthlyStudyTime, progressData.monthlyGoal)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 rounded-3xl p-8 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AI Learning Progress
              </h1>
              <p className="text-gray-600 text-lg">
                Comprehensive analysis by your AI Teacher
              </p>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Badge className="bg-blue-100 text-blue-700 px-4 py-2 text-sm">
              <Brain className="w-4 h-4 mr-1" />
              AI-Powered Analysis
            </Badge>
            <Badge className="bg-purple-100 text-purple-700 px-4 py-2 text-sm">
              <Users className="w-4 h-4 mr-1" />
              Teacher Monitored
            </Badge>
            <Badge className="bg-green-100 text-green-700 px-4 py-2 text-sm">
              <Activity className="w-4 h-4 mr-1" />
              Real-time Tracking
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'subjects', label: 'Subject Performance', icon: BookOpen },
              { id: 'patterns', label: 'Learning Patterns', icon: LineChart },
              { id: 'ai-insights', label: 'AI Insights', icon: Brain }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Weekly Study Time</p>
                    <p className="text-3xl font-bold">{formatStudyTime(progressData.weeklyStudyTime)}</p>
                    <p className="text-blue-200 text-xs">This week</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Average Grade</p>
                    <p className="text-3xl font-bold">
                      {progressData.averageGrade ? `${Math.round(progressData.averageGrade)}%` : 'N/A'}
                    </p>
                    <p className="text-green-200 text-xs">Overall performance</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold">{progressData.completedAssignments}</p>
                    <p className="text-purple-200 text-xs">Assignments done</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Study Streak</p>
                    <p className="text-3xl font-bold">{progressData.studyStreak}</p>
                    <p className="text-orange-200 text-xs">Days in a row</p>
                  </div>
                  <Award className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Progress Goals */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                <div className="flex items-center mb-4">
                  <Target className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Weekly Goal Progress</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress: {formatStudyTime(progressData.weeklyStudyTime)}</span>
                    <span className="text-gray-600">Goal: {formatStudyTime(progressData.weeklyGoal)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${weeklyProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {weeklyProgress >= 100 ? '🎉 Goal achieved!' : `${Math.round(weeklyProgress)}% complete`}
                  </p>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                <div className="flex items-center mb-4">
                  <PieChart className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Monthly Goal Progress</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress: {formatStudyTime(progressData.monthlyStudyTime)}</span>
                    <span className="text-gray-600">Goal: {formatStudyTime(progressData.monthlyGoal)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${monthlyProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {monthlyProgress >= 100 ? '🎉 Goal achieved!' : `${Math.round(monthlyProgress)}% complete`}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Status */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Assignment Status</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">{progressData.completedAssignments}</h3>
                  <p className="text-green-700 font-medium">Completed</p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-600 mb-2">{progressData.pendingAssignments}</h3>
                  <p className="text-yellow-700 font-medium">Pending</p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-600 mb-2">{progressData.overdueAssignments}</h3>
                  <p className="text-red-700 font-medium">Overdue</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject Performance Tab */}
        {activeTab === 'subjects' && (
          <div className="space-y-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Subject Performance Analysis</h3>
              </div>
              <div className="grid gap-4">
                {progressData.subjectPerformance.map((subject, index) => (
                  <div key={index} className="bg-gradient-to-r from-white/80 to-blue-50/50 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900">{subject.subject}</h4>
                      <Badge className="bg-blue-100 text-blue-700">
                        {Math.round(subject.completionRate)}% Complete
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Assignments</p>
                        <p className="font-bold text-gray-900">{subject.totalAssignments}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completed</p>
                        <p className="font-bold text-green-600">{subject.completedAssignments}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Average Grade</p>
                        <p className="font-bold text-blue-600">
                          {subject.averageGrade > 0 ? `${Math.round(subject.averageGrade)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${subject.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Learning Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <div className="flex items-center mb-6">
                <LineChart className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Learning Patterns & Habits</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Study Schedule</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Peak Study Hour</span>
                      <Badge className="bg-purple-100 text-purple-700">
                        {progressData.learningPatterns.peakStudyHour}:00
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Most Active Day</span>
                      <Badge className="bg-pink-100 text-pink-700">
                        {progressData.learningPatterns.peakStudyDay}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Average Session</span>
                      <Badge className="bg-blue-100 text-blue-700">
                        {formatStudyTime(progressData.learningPatterns.averageSessionDuration)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Activity Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Sessions</span>
                      <Badge className="bg-green-100 text-green-700">
                        {progressData.learningPatterns.totalSessions}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">AI Help Requests</span>
                      <Badge className="bg-blue-100 text-blue-700">
                        {progressData.aiHelpRequests}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Study Streak</span>
                      <Badge className="bg-orange-100 text-orange-700">
                        {progressData.studyStreak} days
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <div className="flex items-center mb-6">
                <Brain className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">AI Teacher Analysis</h3>
              </div>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">
                  {cleanAIText(progressData.aiInsights.analysis)}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <h4 className="text-lg font-bold text-gray-900">Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {progressData.aiInsights.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <Star className="w-4 h-4 text-green-500 mr-2" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center mb-4">
                  <Lightbulb className="w-6 h-6 text-yellow-600 mr-3" />
                  <h4 className="text-lg font-bold text-gray-900">Recommendations</h4>
                </div>
                <ul className="space-y-2">
                  {progressData.aiInsights.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <Zap className="w-4 h-4 text-yellow-500 mr-2" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center mb-4">
                  <Target className="w-6 h-6 text-blue-600 mr-3" />
                  <h4 className="text-lg font-bold text-gray-900">Areas for Improvement</h4>
                </div>
                <ul className="space-y-2">
                  {progressData.aiInsights.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <AlertTriangle className="w-4 h-4 text-blue-500 mr-2" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recent AI Sessions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <div className="flex items-center mb-6">
                <MessageCircle className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Recent AI Tutor Sessions</h3>
              </div>
              <div className="space-y-4">
                {progressData.recentAISessions.length > 0 ? (
                  progressData.recentAISessions.map((session, index) => (
                    <div key={index} className="bg-gradient-to-r from-white/80 to-purple-50/50 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-purple-100 text-purple-700">
                          {session.sessionType.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium mb-2">
                        {session.question}
                      </p>
                      {session.subject && (
                        <p className="text-xs text-gray-500">{session.subject}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium">No recent AI sessions</p>
                    <p className="text-xs">Start asking questions to see your AI tutor history here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Teacher Monitoring Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">Teacher Monitoring</h3>
          </div>
          <p className="text-gray-700 mb-2">
            Your progress is being monitored by <strong>{progressData.teacher.name}</strong> who can see your:
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-1">
              <li className="flex items-center text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Study time and patterns
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Assignment completion rates
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                AI tutor interactions
              </li>
            </ul>
            <ul className="space-y-1">
              <li className="flex items-center text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Grade performance
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Learning insights
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Areas needing support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
