'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cleanAIText } from '@/lib/clean-ai-text'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CustomLessonModal from '@/components/custom-lesson-modal'
import { 
  BookOpen, 
  Search,
  Filter,
  Eye,
  Download,
  Share2,
  Wand2,
  Calendar,
  Clock,
  GraduationCap,
  FileText,
  MoreHorizontal,
  Loader2,
  User,
  Brain,
  Target,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Star,
  TrendingUp,
  Zap,
  Lightbulb,
  BookMarked,
  Award,
  BarChart3,
  MessageSquare,
  Video,
  Headphones,
  PenTool,
  Calculator,
  Globe,
  Microscope,
  Palette,
  Music,
  Activity
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface SharedLessonPlan {
  id: string
  lessonPlan: {
    id: string
    title: string
    subject: string
    grade: string
    content: any
    createdAt: string
    updatedAt: string
  }
  teacher: {
    user: {
      firstName: string
      lastName: string
    }
  }
  sharedAt: string
  isActive: boolean
}

interface AILesson {
  id: string
  title: string
  subject: string
  grade: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // in minutes
  type: 'video' | 'interactive' | 'reading' | 'quiz' | 'project'
  aiGenerated: boolean
  personalized: boolean
  progress: number // 0-100
  completed: boolean
  rating: number // 1-5
  estimatedTime: string
  learningObjectives: string[]
  prerequisites: string[]
  aiInsights: {
    strengths: string[]
    areasForImprovement: string[]
    recommendedFocus: string[]
    nextSteps: string[]
  }
}

interface StudySession {
  id: string
  lessonId: string
  startTime: Date
  endTime?: Date
  duration: number
  completed: boolean
  notes: string[]
  aiFeedback: string
}

export default function StudentLessonPlansPage() {
  const [sharedLessonPlans, setSharedLessonPlans] = useState<SharedLessonPlan[]>([])
  const [aiLessons, setAiLessons] = useState<AILesson[]>([])
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<SharedLessonPlan | null>(null)
  const [selectedAILesson, setSelectedAILesson] = useState<AILesson | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [aiLessonModalOpen, setAiLessonModalOpen] = useState(false)
  const [customLessonModalOpen, setCustomLessonModalOpen] = useState(false)
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState<'shared' | 'ai' | 'recommended'>('ai')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

  // Fetch shared lesson plans
        const sharedResponse = await fetch('/api/lesson-plans/share')
        if (sharedResponse.ok) {
          const sharedData = await sharedResponse.json()
          setSharedLessonPlans(sharedData.sharedLessonPlans || [])
        }

        // Fetch AI lessons
        const aiResponse = await fetch('/api/student/ai-lessons')
        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          setAiLessons(aiData.lessons || [])
        }

        // Fetch AI insights
        const insightsResponse = await fetch('/api/student/ai-insights')
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json()
          setAiInsights(insightsData)
        }

        // Fetch available subjects
        const subjectsResponse = await fetch('/api/subjects')
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json()
          setAvailableSubjects(subjectsData.subjects || [])
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter functions
  const filteredLessonPlans = sharedLessonPlans.filter(shared => {
    const matchesSearch = shared.lessonPlan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shared.lessonPlan.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = filterSubject === 'all' || shared.lessonPlan.subject === filterSubject
    return matchesSearch && matchesSubject
  })

  const filteredAILessons = aiLessons.filter(lesson => {
    const matchesSearch = (lesson.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (lesson.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesSubject = filterSubject === 'all' || lesson.subject === filterSubject
    const matchesType = filterType === 'all' || lesson.type === filterType
    return matchesSearch && matchesSubject && matchesType
  })

  // Use available subjects from database, fallback to computed subjects
  const subjects = availableSubjects.length > 0 ? availableSubjects : Array.from(new Set([
    ...sharedLessonPlans.map(shared => shared.lessonPlan?.subject).filter(Boolean),
    ...aiLessons.map(lesson => lesson.subject).filter(Boolean)
  ]))
  
  const lessonTypes = ['video', 'interactive', 'reading', 'quiz', 'project']

  // AI-powered handlers
  const handleViewLessonPlan = (sharedLessonPlan: SharedLessonPlan) => {
    setSelectedLessonPlan(sharedLessonPlan)
    setViewModalOpen(true)
  }

  const handleViewAILesson = (lesson: AILesson) => {
    setSelectedAILesson(lesson)
    setAiLessonModalOpen(true)
  }

  const handleStartAITutor = (lessonPlan: any) => {
    const context = {
      lessonPlan: {
        title: lessonPlan.title,
        subject: lessonPlan.subject,
        grade: lessonPlan.grade,
        content: lessonPlan.content
      }
    }
    sessionStorage.setItem('currentLessonContext', JSON.stringify(context))
    window.location.href = '/student/ai-tutor'
  }

  const handleStartAILesson = async (lesson: AILesson) => {
    try {
      setIsGenerating(true)
      
      // Start study session
      const sessionResponse = await fetch('/api/student/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          subject: lesson.subject,
          topic: lesson.title,
          startTime: new Date().toISOString()
        })
      })

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        setCurrentSession(sessionData.session)
        
        // Generate personalized content
        const contentResponse = await fetch('/api/ai/generate-lesson-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson: lesson,
            studentLevel: aiInsights?.currentLevel || 'intermediate',
            learningStyle: aiInsights?.learningStyle || 'visual'
          })
        })

        if (contentResponse.ok) {
          const contentData = await contentResponse.json()
          // Store generated content for the lesson
          sessionStorage.setItem('currentAILesson', JSON.stringify({
            ...lesson,
            generatedContent: contentData.content
          }))
          
          // Navigate to lesson view
          setSelectedAILesson({ ...lesson, generatedContent: contentData.content })
          setAiLessonModalOpen(true)
        }
      }
    } catch (error) {
      console.error('Error starting AI lesson:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAssessment = async (lessonPlan: any) => {
    try {
      const response = await fetch('/api/ai/generate-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonPlan: lessonPlan,
          assessmentType: 'mixed',
          questionCount: 10
        }),
      })

      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem('currentAssessment', JSON.stringify(data.assessment))
        alert('Assessment generated! You can now take the assessment.')
      } else {
        alert('Error generating assessment')
      }
    } catch (error) {
      console.error('Error generating assessment:', error)
      alert('Error generating assessment')
    }
  }

  const handleGenerateNotes = async (lessonPlan: any) => {
    try {
      const response = await fetch('/api/ai/generate-lesson-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonPlan: lessonPlan,
          noteType: 'summary'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem('currentNotes', JSON.stringify(data.notes))
        alert('Lesson notes generated! You can now view the notes.')
      } else {
        alert('Error generating lesson notes')
      }
    } catch (error) {
      console.error('Error generating lesson notes:', error)
      alert('Error generating lesson notes')
    }
  }

  const handleGenerateAILesson = async (subject: string, topic: string) => {
    try {
      setIsGenerating(true)
      
      const response = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          grade: 'Grade 8', // Get from user profile
          difficulty: 'intermediate',
          learningStyle: aiInsights?.learningStyle || 'visual'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Validate lesson data
        if (data.lesson && data.lesson.title && data.lesson.subject) {
          const newLesson: AILesson = {
            id: `ai-${Date.now()}`,
            title: data.lesson.title,
            subject: data.lesson.subject,
            grade: data.lesson.grade || 'Grade 8',
            difficulty: data.lesson.difficulty || 'intermediate',
            duration: data.lesson.duration || 45,
            type: data.lesson.type || 'interactive',
            aiGenerated: true,
            personalized: true,
            progress: 0,
            completed: false,
            rating: 0,
            estimatedTime: data.lesson.estimatedTime || '45 min',
            learningObjectives: data.lesson.learningObjectives || [],
            prerequisites: data.lesson.prerequisites || [],
            aiInsights: data.lesson.aiInsights || {}
          }
          
          setAiLessons(prev => [newLesson, ...prev])
          alert('AI lesson generated successfully!')
        } else {
          throw new Error('Invalid lesson data received')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to generate lesson')
      }
    } catch (error) {
      console.error('Error generating AI lesson:', error)
      alert(`Error generating AI lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateCustomLesson = async (data: any) => {
    try {
      setIsGenerating(true)
      
      const response = await fetch('/api/ai/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: data.subject,
          topic: data.topic,
          grade: 'Grade 8',
          difficulty: data.difficulty,
          learningStyle: data.learningStyle,
          duration: data.duration,
          description: data.description
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        
        if (responseData.lesson && responseData.lesson.title && responseData.lesson.subject) {
          const newLesson: AILesson = {
            id: `custom-ai-${Date.now()}`,
            title: responseData.lesson.title,
            subject: responseData.lesson.subject,
            grade: responseData.lesson.grade || 'Grade 8',
            difficulty: responseData.lesson.difficulty || data.difficulty,
            duration: responseData.lesson.duration || data.duration,
            type: responseData.lesson.type || 'interactive',
            aiGenerated: true,
            personalized: true,
            progress: 0,
            completed: false,
            rating: 0,
            estimatedTime: `${data.duration} min`,
            learningObjectives: responseData.lesson.learningObjectives || [],
            prerequisites: responseData.lesson.prerequisites || [],
            aiInsights: responseData.lesson.aiInsights || {},
            customGenerated: true // Flag to indicate this was custom generated
          }
          
          setAiLessons(prev => [newLesson, ...prev])
          setCustomLessonModalOpen(false)
          alert('Custom AI lesson generated successfully!')
        } else {
          throw new Error('Invalid lesson data received')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to generate custom lesson')
      }
    } catch (error) {
      console.error('Error generating custom AI lesson:', error)
      alert(`Error generating custom AI lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCompleteLesson = async (lesson: AILesson) => {
    try {
      const response = await fetch('/api/student/complete-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          rating: lesson.rating,
          notes: []
        })
      })

      if (response.ok) {
        setAiLessons(prev => 
          prev.map(l => l.id === lesson.id ? { ...l, completed: true, progress: 100 } : l)
        )
        alert('Lesson completed! Great job!')
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
    }
  }

  const handleDownloadLessonPlan = (lessonPlan: any) => {
    const content = lessonPlan.content?.generatedContent || 'No content available'
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lessonPlan.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSubjectIcon = (subject: string) => {
    const icons: { [key: string]: any } = {
      'Mathematics': Calculator,
      'Science': Microscope,
      'English': BookOpen,
      'History': Globe,
      'Geography': Globe,
      'Art': Palette,
      'Music': Music,
      'Physical Education': Activity,
      'Chemistry': Microscope,
      'Physics': Microscope,
      'Biology': Microscope
    }
    return icons[subject] || BookOpen
  }

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      'video': Video,
      'interactive': Play,
      'reading': BookOpen,
      'quiz': Target,
      'project': PenTool
    }
    return icons[type] || BookOpen
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading AI-powered lessons...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with AI Features */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
        <h1 className="text-3xl font-bold mb-2">
              <span className="edugenius-text-gradient">AI-Powered Learning Hub</span>
        </h1>
            <p className="text-gray-600">Personalized lessons, assessments, and AI tutoring</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setCustomLessonModalOpen(true)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Custom AI Lesson
            </Button>
            <Button 
              onClick={() => handleGenerateAILesson('Mathematics', 'Algebra')}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Quick Generate
            </Button>
          </div>
        </div>

        {/* AI Insights Banner */}
        {aiInsights && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Learning Insights</h3>
                  <p className="text-gray-600">
                    Your learning style: <span className="font-medium">{aiInsights.learningStyle}</span> • 
                    Current level: <span className="font-medium">{aiInsights.currentLevel}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Recommended focus areas:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aiInsights.recommendedFocus?.slice(0, 3).map((focus: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {focus}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'ai', label: 'AI Lessons', icon: Brain },
            { id: 'shared', label: 'Teacher Shared', icon: BookOpen },
            { id: 'recommended', label: 'Recommended', icon: Star }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          {activeTab === 'ai' && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {lessonTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Lessons Grid */}
          {filteredAILessons.length === 0 ? (
            <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No AI Lessons Found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {searchTerm || filterSubject !== 'all' || filterType !== 'all'
                    ? 'No lessons match your search criteria.' 
                    : 'Generate your first AI lesson to get started!'}
                </p>
                <Button 
                  onClick={() => handleGenerateAILesson('Mathematics', 'Algebra')}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Generate AI Lesson
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAILessons.map((lesson) => {
                const SubjectIcon = getSubjectIcon(lesson.subject)
                const TypeIcon = getTypeIcon(lesson.type)
                
                return (
                  <Card key={lesson.id} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm group hover:scale-105 transition-all duration-300 border-0">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <SubjectIcon className="w-5 h-5 text-blue-600" />
                            <TypeIcon className="w-4 h-4 text-purple-600" />
                            {lesson.autoGenerated && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                                <BookOpen className="w-3 h-3 mr-1" />
                                From Teacher
                              </Badge>
                            )}
                            {lesson.customGenerated && (
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                                <Wand2 className="w-3 h-3 mr-1" />
                                Custom
                              </Badge>
                            )}
                            {lesson.aiGenerated && (
                              <Badge variant="secondary" className="text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                AI Enhanced
                              </Badge>
                            )}
                            {lesson.personalized && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Personalized
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mb-2 line-clamp-2">
                            {lesson.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            <span className="flex items-center space-x-2 text-sm text-gray-600">
                              <GraduationCap className="h-4 w-4" />
                              <span>{lesson.grade}</span>
                              <span>•</span>
                              <span>{lesson.subject}</span>
                              <span>•</span>
                              <span className="capitalize">{lesson.difficulty}</span>
                            </span>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewAILesson(lesson)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartAILesson(lesson)}>
                              <Play className="mr-2 h-4 w-4" />
                              Start Lesson
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCompleteLesson(lesson)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{lesson.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${lesson.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {lesson.estimatedTime}
                          </span>
                          <span className="flex items-center">
                            <Star className="h-4 w-4 mr-1" />
                            {lesson.rating || 'Not rated'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button 
                            onClick={() => handleStartAILesson(lesson)}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            {isGenerating ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            Start
                          </Button>
                          <Button 
                            onClick={() => handleViewAILesson(lesson)}
                            variant="outline"
                            className="bg-white/70 hover:bg-white/90"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shared' && (
        <div className="space-y-6">
          {/* Shared Lesson Plans Grid */}
      {filteredLessonPlans.length === 0 ? (
        <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Shared Lessons Found</h3>
            <p className="text-gray-500 text-center">
              {searchTerm || filterSubject !== 'all' 
                ? 'No lesson plans match your search criteria.' 
                : 'No lesson plans have been shared with you yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessonPlans.map((shared) => (
            <Card key={shared.id} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm group hover:scale-105 transition-all duration-300 border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {shared.lessonPlan.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <span className="flex items-center space-x-2 text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4" />
                        <span>{shared.lessonPlan.grade}</span>
                        <span>•</span>
                        <span>{shared.lessonPlan.subject}</span>
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                        <span>Shared by {shared.teacher.user.firstName} {shared.teacher.user.lastName}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(shared.sharedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      onClick={() => handleViewLessonPlan(shared)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      onClick={() => handleStartAITutor(shared.lessonPlan)}
                      variant="outline"
                      className="bg-white/70 hover:bg-white/90"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Tutor
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      )}

      {activeTab === 'recommended' && (
        <div className="space-y-6">
          {/* Recommended Lessons based on AI insights */}
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">AI Recommendations</h3>
              <p className="text-gray-500 text-center mb-4">
                AI is analyzing your learning patterns to recommend personalized lessons.
              </p>
              <Button 
                onClick={() => handleGenerateAILesson('Mathematics', 'Algebra')}
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="w-4 h-4 mr-2" />
                )}
                Get AI Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Lesson Modal */}
      <Dialog open={aiLessonModalOpen} onOpenChange={setAiLessonModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center">
              <Brain className="w-6 h-6 mr-2 text-purple-600" />
              {selectedAILesson?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedAILesson?.subject} • Grade {selectedAILesson?.grade} • {selectedAILesson?.difficulty}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedAILesson?.generatedContent ? (
              <div className="prose max-w-none">
                <div 
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                >
                  {cleanAIText(selectedAILesson.generatedContent)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>AI is generating personalized content for this lesson...</p>
              </div>
            )}
            
            {selectedAILesson?.learningObjectives && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Learning Objectives</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  {selectedAILesson.learningObjectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              onClick={() => selectedAILesson && handleCompleteLesson(selectedAILesson)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Lesson
            </Button>
            <Button 
              onClick={() => selectedAILesson && handleStartAITutor(selectedAILesson)}
              variant="outline"
            >
              <Brain className="w-4 h-4 mr-2" />
              Ask AI Tutor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Lesson Plan Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedLessonPlan?.lessonPlan.title}
            </DialogTitle>
            <DialogDescription>
              {selectedLessonPlan?.lessonPlan.subject} • Grade {selectedLessonPlan?.lessonPlan.grade}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLessonPlan?.lessonPlan.content?.generatedContent ? (
              <div className="prose max-w-none">
                <div 
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedLessonPlan.lessonPlan.content.generatedContent.replace(/\n/g, '<br>') 
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No content available for this lesson plan.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              onClick={() => selectedLessonPlan && handleStartAITutor(selectedLessonPlan.lessonPlan)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              Start AI Tutor
            </Button>
            <Button 
              onClick={() => selectedLessonPlan && handleGenerateAssessment(selectedLessonPlan.lessonPlan)}
              variant="outline"
            >
              <Target className="w-4 h-4 mr-2" />
              Generate Assessment
            </Button>
            <Button 
              onClick={() => selectedLessonPlan && handleGenerateNotes(selectedLessonPlan.lessonPlan)}
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Notes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Lesson Modal */}
      <CustomLessonModal
        isOpen={customLessonModalOpen}
        onClose={() => setCustomLessonModalOpen(false)}
        onGenerate={handleGenerateCustomLesson}
        isGenerating={isGenerating}
      />
    </div>
  )
}
