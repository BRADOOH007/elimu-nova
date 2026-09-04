'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cleanAIText } from '@/lib/clean-ai-text'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CustomLessonModal from '@/components/custom-lesson-modal'
import { useAITutor } from '@/components/ai-tutor-provider'
import { StudentQuiz } from '@/components/student/student-quiz'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
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
  Activity,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  customGenerated?: boolean
  generatedContent?: string
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
  const { toast } = useToast()
  const router = useRouter()
  const { openAITutor } = useAITutor()
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
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'quizzes' | 'shared' | 'recommended'>(() => {
    return (searchParams.get('tab') as any) || 'quizzes'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const { data: session } = useSession()
  const [quizSubject, setQuizSubject] = useState('Mathematics')
  const [quizGrade, setQuizGrade] = useState('Grade 4')
  const [quizTopic, setQuizTopic] = useState('')
  const [activeQuiz, setActiveQuiz] = useState(false)
  const [quizCurriculum, setQuizCurriculum] = useState('')

  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/user-preferences').then(r => r.json()).then(d => {
      if (d?.curriculum) setQuizCurriculum(d.curriculum)
    }).catch(() => {})
  }, [session?.user?.id])

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

        // Fetch recommendations
        const recResponse = await fetch('/api/student/recommendations')
        if (recResponse.ok) {
          const recData = await recResponse.json()
          // Store recommendations for use in the Recommendations tab
          setAiInsights((prev: any) => prev ? { ...prev, ...recData } : recData)
        }

        // Fetch available subjects
        const subjectsResponse = await fetch('/api/subjects')
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json()
          setAvailableSubjects(subjectsData.subjects || [])
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        toast({ variant: 'destructive', title: 'Failed to load data', description: 'Please check your connection and try again.' })
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
    const subject = lessonPlan?.subject || 'your studies'
    const topic = lessonPlan?.title || ''
    openAITutor(
      `I'm studying "${topic}" in ${subject}. Can you walk me through this lesson and explain it clearly?`,
      subject,
      topic,
    )
  }

  const handleStartAILesson = async (lesson: AILesson) => {
    try {
      setIsGenerating(true)
      
      // Start study session
      const now = new Date()
      const sessionResponse = await fetch('/api/student/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          subject: lesson.subject,
          topic: lesson.title,
          duration: lesson.duration || 30,
          startTime: now.toISOString(),
          endTime: new Date(now.getTime() + (lesson.duration || 30) * 60000).toISOString()
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
        toast({ title: '✅ Assessment ready!', description: 'You can now take the assessment.' })
      } else {
        toast({ variant: 'destructive', title: 'Failed to generate assessment' })
      }
    } catch (error) {
      console.error('Error generating assessment:', error)
      toast({ variant: 'destructive', title: 'Failed to generate assessment' })
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
        toast({ title: '✅ Notes ready!', description: 'Lesson notes have been generated.' })
      } else {
        toast({ variant: 'destructive', title: 'Failed to generate notes' })
      }
    } catch (error) {
      console.error('Error generating lesson notes:', error)
      toast({ variant: 'destructive', title: 'Failed to generate notes' })
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
          toast({ title: '✅ AI lesson ready!', variant: 'success' })
        } else {
          throw new Error('Invalid lesson data received')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to generate lesson')
      }
    } catch (error) {
      console.error('Error generating AI lesson:', error)
      toast({ variant: 'destructive', title: 'Failed to generate lesson', description: error instanceof Error ? error.message : 'Unknown error' })
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
          toast({ title: '✅ Custom lesson ready!' })
        } else {
          throw new Error('Invalid lesson data received')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to generate custom lesson')
      }
    } catch (error) {
      console.error('Error generating custom AI lesson:', error)
      toast({ variant: 'destructive', title: 'Failed to generate lesson', description: error instanceof Error ? error.message : 'Unknown error' })
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
        toast({ title: '🎉 Lesson completed! Great job!' })
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
            { id: 'quizzes', label: 'Quizzes', icon: Target },
            { id: 'shared', label: 'Teacher Shared', icon: BookOpen },
            { id: 'recommended', label: 'Recommended', icon: Star },
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
        </div>
      </div>

      {/* Content based on active tab */}
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
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600" /> AI Recommendations
              </CardTitle>
              <CardDescription>Personalised suggestions based on your learning patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {(aiInsights?.recommendations && aiInsights.recommendations.length > 0) ? (
                <div className="space-y-3">
                  {aiInsights.recommendations.map((rec: any, i: number) => (
                    <div key={i} className={`rounded-xl border p-4 ${
                      rec.type === 'danger' ? 'border-red-200 bg-red-50/50' :
                      rec.type === 'warning' ? 'border-amber-200 bg-amber-50/50' :
                      rec.type === 'success' ? 'border-green-200 bg-green-50/50' :
                      'border-blue-200 bg-blue-50/50'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          rec.type === 'danger' ? 'bg-red-100 text-red-600' :
                          rec.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                          rec.type === 'success' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {rec.type === 'danger' ? <AlertCircle className="h-5 w-5" /> :
                           rec.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
                           <Lightbulb className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-800">{rec.title}</h3>
                          <p className="text-xs text-slate-600 mt-1">{rec.description}</p>
                          {rec.action && (
                            <Button
                              size="sm"
                              className="mt-2"
                              variant={rec.type === 'danger' ? 'destructive' : 'outline'}
                              onClick={() => {
                                if (rec.subject) handleGenerateAILesson(rec.subject, rec.title)
                                else if (rec.href) router.push(rec.href)
                              }}
                            >
                              {rec.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Lightbulb className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500 text-center">
                    Complete some lessons and quizzes to get personalised recommendations.
                  </p>
                  <Button
                    onClick={() => handleGenerateAILesson('Mathematics', 'Algebra')}
                    disabled={isGenerating}
                    className="mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                    Generate AI Lesson
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {activeQuiz && quizTopic ? (
            <StudentQuiz subject={quizSubject} grade={quizGrade} topic={quizTopic} curriculum={quizCurriculum} onClose={() => setActiveQuiz(false)} />
          ) : (
            <>
              <Card className="bg-gradient-to-br from-white via-amber-50 to-orange-50 shadow-lg backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-600" /> Topic Quizzes
                  </CardTitle>
                  <CardDescription>Test your knowledge on any topic — no need to complete the lesson first. Earn XP and track your progress.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 mb-6">
                    <select value={quizSubject} onChange={e => setQuizSubject(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm">
                      {['Mathematics', 'English', 'Science', 'Social Studies', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art', 'Music'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select value={quizGrade} onChange={e => setQuizGrade(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm">
                      {Array.from({length:13}, (_,i) => i === 0 ? 'Kindergarten' : `Grade ${i}`).map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Enter topic (e.g. Fractions)..."
                      value={quizTopic}
                      onChange={e => setQuizTopic(e.target.value)}
                      className="h-10 rounded-xl flex-1 min-w-[200px]"
                      onKeyDown={e => { if (e.key === 'Enter' && quizTopic.trim()) setActiveQuiz(true) }}
                    />
                    <Button onClick={() => quizTopic.trim() && setActiveQuiz(true)} disabled={!quizTopic.trim()} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                      Start Quiz <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {topic:'Fractions', subject:'Mathematics'},
                      {topic:'Place Value', subject:'Mathematics'},
                      {topic:'Algebra Basics', subject:'Mathematics'},
                      {topic:'Geometry', subject:'Mathematics'},
                      {topic:'Cells', subject:'Science'},
                      {topic:'The Water Cycle', subject:'Science'},
                      {topic:'Parts of Speech', subject:'English'},
                      {topic:'World War II', subject:'History'}
                    ].map(({topic, subject}) => (
                      <button key={topic}
                        onClick={() => { setQuizSubject(subject); setQuizTopic(topic); setActiveQuiz(true) }}
                        className="rounded-xl border border-amber-200 bg-white p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-amber-400 group">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">{topic}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{subject} · 10 questions · ~5 min</p>
                          </div>
                          <Target className="w-5 h-5 text-amber-400 group-hover:text-amber-600 transition-colors" />
                        </div>
                        <span className="inline-flex items-center text-xs font-medium text-amber-600 group-hover:text-amber-700">
                          Start Quiz <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* AI Lesson Modal */}
      <Dialog open={aiLessonModalOpen} onOpenChange={setAiLessonModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center">
              <Brain className="w-6 h-6 mr-2 text-purple-600" />
              {selectedAILesson?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedAILesson?.subject} • Grade {selectedAILesson?.grade} • {selectedAILesson?.difficulty}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6 mt-1">
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
          </DialogBody>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lesson Plan Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedLessonPlan?.lessonPlan.title}
            </DialogTitle>
            <DialogDescription>
              {selectedLessonPlan?.lessonPlan.subject} • Grade {selectedLessonPlan?.lessonPlan.grade}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 mt-1">
            {selectedLessonPlan?.lessonPlan.content?.generatedContent ? (
              <div className="lesson-content">
                <MarkdownRenderer content={cleanAIText(selectedLessonPlan.lessonPlan.content.generatedContent)} />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No content available for this lesson plan.</p>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
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
          </DialogFooter>
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
