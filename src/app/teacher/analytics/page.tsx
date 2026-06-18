'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Activity,
  Brain,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import AIInsightModal from '@/components/modals/ai-insight-modal'

interface AnalyticsData {
  totalStudents: number
  totalAssignments: number
  completedAssignments: number
  averageGrade: number
  completionRate: number
  activeStudents: number
  totalHours: number
}

interface StudentProgress {
  id: string
  name: string
  className: string
  totalSubmissions: number
  averageGrade: number
  lastActivity: string | null
}

interface AssignmentStat {
  id: string
  title: string
  totalSubmissions: number
  completionRate: number
  averageGrade: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  user: string
  submittedAt: string
}

interface AIInsight {
  id: string
  studentName: string
  className: string
  subject: string
  progress: number
  notes: string
  submittedAt: string
  type?: string
  recommendation?: string
  priority?: string
  createdAt?: string
}

interface AnalyticsResponse {
  analytics: AnalyticsData
  studentProgress: StudentProgress[]
  assignmentStats: AssignmentStat[]
  recentActivity: RecentActivity[]
  aiInsights: AIInsight[]
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [selectedClass, setSelectedClass] = useState('all')
  const [classes, setClasses] = useState<any[]>([])
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null)
  const [showInsightModal, setShowInsightModal] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching analytics for period:', selectedPeriod, 'class:', selectedClass)
      
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedClass !== 'all' && { classId: selectedClass })
      })
      
      const response = await fetch(`/api/teacher/analytics?${params}`)
      
      console.log('Analytics API Response Status:', response.status)
      console.log('Analytics API Response Headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Analytics API Error Response:', errorText)
        
        if (response.headers.get('content-type')?.includes('application/json')) {
          try {
            const errorData = JSON.parse(errorText)
            throw new Error(errorData.error || `HTTP ${response.status}`)
          } catch (parseError) {
            throw new Error(`Server returned non-JSON response: ${errorText.substring(0, 100)}...`)
          }
        } else {
          throw new Error(`Server returned non-JSON response: ${errorText.substring(0, 100)}...`)
        }
      }
      
      const data = await response.json()
      console.log('Analytics API Success - Received data:', data)
      
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(Array.isArray(data) ? data : [])
      } else {
        setClasses([])
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      setClasses([])
    }
  }

  useEffect(() => {
    if (session) {
      fetchClasses()
      fetchAnalytics()
    }
  }, [session, selectedPeriod, selectedClass])

  const handleRefresh = () => {
    fetchAnalytics()
  }

  const handleInsightClick = (insight: AIInsight) => {
    setSelectedInsight(insight)
    setShowInsightModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium text-gray-600">Loading analytics...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-gray-600 mb-4">
                Start by creating classes, enrolling students, and assigning work to see analytics.
              </p>
              <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Overview</h1>
              <p className="text-gray-600">Track student performance and engagement</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes && Array.isArray(classes) && classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg backdrop-blur-sm border-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold">{analytics.analytics.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg backdrop-blur-sm border-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Assignments</p>
                  <p className="text-3xl font-bold">{analytics.analytics.totalAssignments}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-200" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg backdrop-blur-sm border-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold">{analytics.analytics.completionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-200" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg backdrop-blur-sm border-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Average Grade</p>
                  <p className="text-3xl font-bold">{analytics.analytics.averageGrade.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg backdrop-blur-sm border-0">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.analytics.activeStudents}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white shadow-lg backdrop-blur-sm border-0">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.analytics.totalHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white shadow-lg backdrop-blur-sm border-0">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.analytics.completedAssignments}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students">Student Progress</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card className="bg-white shadow-lg backdrop-blur-sm border-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress</h3>
                <div className="space-y-4">
                  {analytics.studentProgress.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.className}</p>
                          </div>
                          <Badge variant="outline">{student.totalSubmissions} submissions</Badge>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Average Grade:</span>
                            <span className="font-medium">{student.averageGrade.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card className="bg-white shadow-lg backdrop-blur-sm border-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Statistics</h3>
                <div className="space-y-4">
                  {analytics.assignmentStats.map((assignment) => (
                    <div key={assignment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <Badge variant="outline">{assignment.totalSubmissions} submissions</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Completion Rate</span>
                          <span className="font-medium">{assignment.completionRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${assignment.completionRate}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Average Grade</span>
                          <span className="font-medium">{assignment.averageGrade.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-white shadow-lg backdrop-blur-sm border-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-600">by {activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card className="bg-white shadow-lg backdrop-blur-sm border-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
                <div className="space-y-4">
                  {analytics.aiInsights.map((insight) => (
                    <div 
                      key={insight.id} 
                      className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleInsightClick(insight)}
                    >
                      <div className="flex items-center space-x-3">
                        <Brain className="h-6 w-6 text-purple-600" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{insight.studentName}</h4>
                            <Badge variant="outline">{insight.className}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{insight.subject}</p>
                          <div className="mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Progress:</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${insight.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{insight.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Insight Modal */}
        {showInsightModal && selectedInsight && (
          <AIInsightModal
            insight={selectedInsight}
            onClose={() => setShowInsightModal(false)}
            onUpdate={() => {
              setShowInsightModal(false)
              fetchAnalytics()
            }}
          />
        )}
      </div>
    </div>
  )
}