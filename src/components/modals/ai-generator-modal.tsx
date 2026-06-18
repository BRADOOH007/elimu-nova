'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  X, 
  FileText, 
  Presentation, 
  ClipboardList, 
  Lightbulb,
  Download,
  Share2,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AIGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (content: any) => void
}

interface GeneratedContent {
  type: 'rubric' | 'powerpoint' | 'assignment' | 'project' | 'exam';
  title: string;
  content: string;
  metadata?: any;
}

export default function AIGeneratorModal({ isOpen, onClose, onSuccess }: AIGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState('rubric')
  const [loading, setLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    topic: '',
    duration: '',
    objectives: '',
    requirements: '',
    difficulty: 'medium',
    format: 'detailed'
  })

  const handleGenerate = async () => {
    if (!formData.subject || !formData.grade || !formData.topic) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: activeTab,
          ...formData
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedContent({
          type: activeTab as any,
          title: data.title,
          content: data.content,
          metadata: data.metadata
        })
      } else {
        console.error('Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (generatedContent) {
      try {
        // Save the generated content to the database
        const response = await fetch('/api/ai-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: generatedContent.title,
            content: generatedContent.content,
            type: generatedContent.type,
            subject: formData.subject,
            grade: formData.grade,
            topic: formData.topic,
            metadata: {
              difficulty: formData.difficulty,
              duration: formData.duration,
              format: formData.format,
              objectives: formData.objectives,
              requirements: formData.requirements,
              generatedAt: new Date().toISOString()
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          onSuccess(data.content)
          onClose()
        } else {
          console.error('Failed to save generated content')
        }
      } catch (error) {
        console.error('Error saving generated content:', error)
      }
    }
  }

  const handleDownload = () => {
    if (generatedContent) {
      const element = document.createElement('a')
      const file = new Blob([generatedContent.content], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `${generatedContent.title}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const handleClose = () => {
    setGeneratedContent(null)
    setFormData({
      subject: '',
      grade: '',
      topic: '',
      duration: '',
      objectives: '',
      requirements: '',
      difficulty: 'medium',
      format: 'detailed'
    })
    onClose()
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'rubric': return <FileText className="w-4 h-4" />
      case 'powerpoint': return <Presentation className="w-4 h-4" />
      case 'assignment': return <ClipboardList className="w-4 h-4" />
      case 'exam': return <FileText className="w-4 h-4" />
      case 'project': return <Lightbulb className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getTabDescription = (tab: string) => {
    switch (tab) {
      case 'rubric': return 'Generate detailed rubrics for assessment'
      case 'powerpoint': return 'Create presentation slides with AI'
      case 'assignment': return 'Generate comprehensive assignments'
      case 'exam': return 'Generate AI-powered exams and quizzes'
      case 'project': return 'Design project-based learning activities'
      default: return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl">
        <div className="max-h-[85vh] overflow-y-auto px-1">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              AI Content Generator
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base mt-2">
              Generate educational content using AI for rubrics, presentations, assignments, and projects.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-purple-50 to-blue-50 p-1 rounded-lg">
            <TabsTrigger value="rubric" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {getTabIcon('rubric')}
              Rubric
            </TabsTrigger>
            <TabsTrigger value="powerpoint" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {getTabIcon('powerpoint')}
              PowerPoint
            </TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {getTabIcon('assignment')}
              Assignment
            </TabsTrigger>
            <TabsTrigger value="exam" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {getTabIcon('exam')}
              Exam
            </TabsTrigger>
            <TabsTrigger value="project" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              {getTabIcon('project')}
              Project
            </TabsTrigger>
          </TabsList>

            <div className="mt-6">
              <TabsContent value="rubric" className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Assessment Rubric</h3>
                  <p className="text-gray-600">{getTabDescription('rubric')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Mathematics, Science"
                      className="bg-white border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                      Grade Level *
                    </Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="e.g., Grade 7, Grade 10"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                    Topic/Assignment *
                  </Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Quadratic Equations, Photosynthesis"
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-medium text-gray-700">
                      Difficulty Level
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-sm font-medium text-gray-700">
                      Rubric Format
                    </Label>
                    <Select
                      value={formData.format}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="detailed">Detailed (4-5 levels)</SelectItem>
                        <SelectItem value="simple">Simple (3 levels)</SelectItem>
                        <SelectItem value="checklist">Checklist Format</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectives" className="text-sm font-medium text-gray-700">
                    Learning Objectives
                  </Label>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                    placeholder="What should students be able to do? (optional)"
                    rows={3}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </TabsContent>

              <TabsContent value="powerpoint" className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate PowerPoint Presentation</h3>
                  <p className="text-gray-600">{getTabDescription('powerpoint')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Mathematics, Science"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                      Grade Level *
                    </Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="e.g., Grade 7, Grade 10"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                    Presentation Topic *
                  </Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Introduction to Algebra, The Solar System"
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 45, 60"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-sm font-medium text-gray-700">
                      Slide Count
                    </Label>
                    <Select
                      value={formData.format}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (5-10 slides)</SelectItem>
                        <SelectItem value="detailed">Detailed (15-20 slides)</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive (25+ slides)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectives" className="text-sm font-medium text-gray-700">
                    Learning Objectives
                  </Label>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                    placeholder="What should students learn from this presentation? (optional)"
                    rows={3}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Assignment</h3>
                  <p className="text-gray-600">{getTabDescription('assignment')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Mathematics, Science"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                      Grade Level *
                    </Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="e.g., Grade 7, Grade 10"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                    Assignment Topic *
                  </Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Solving Linear Equations, Research on Climate Change"
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-medium text-gray-700">
                      Difficulty Level
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                      Estimated Duration (minutes)
                    </Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 30, 60, 120"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-sm font-medium text-gray-700">
                    Specific Requirements
                  </Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="Any specific requirements, format, or instructions (optional)"
                    rows={3}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </TabsContent>

              <TabsContent value="exam" className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Exam</h3>
                  <p className="text-gray-600">{getTabDescription('exam')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Mathematics, Science"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                      Grade Level *
                    </Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="e.g., Grade 7, Grade 10"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                    Exam Topic *
                  </Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Quadratic Equations, Photosynthesis"
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-medium text-gray-700">
                      Difficulty
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 30, 60, 120"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Curriculum
                    </Label>
                    <Select
                      onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500">
                        <SelectValue placeholder="Select curriculum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cbc">Kenya CBC</SelectItem>
                        <SelectItem value="commoncore">US Common Core</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-sm font-medium text-gray-700">
                    Specific Requirements
                  </Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="Question types, number of questions, etc. (optional)"
                    rows={3}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </TabsContent>

              <TabsContent value="project" className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Project-Based Learning</h3>
                  <p className="text-gray-600">{getTabDescription('project')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Mathematics, Science"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                      Grade Level *
                    </Label>
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="e.g., Grade 7, Grade 10"
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                    Project Theme *
                  </Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Sustainable City Design, Historical Timeline"
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                      Project Duration
                    </Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                    >
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-week">1 Week</SelectItem>
                        <SelectItem value="2-weeks">2 Weeks</SelectItem>
                        <SelectItem value="1-month">1 Month</SelectItem>
                        <SelectItem value="semester">Full Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-sm font-medium text-gray-700">
                      Project Type
                    </Label>
                    <Select
                      value={formData.format}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual Project</SelectItem>
                        <SelectItem value="group">Group Project</SelectItem>
                        <SelectItem value="presentation">Presentation Project</SelectItem>
                        <SelectItem value="research">Research Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectives" className="text-sm font-medium text-gray-700">
                    Learning Objectives
                  </Label>
                  <Textarea
                    id="objectives"
                    value={formData.objectives}
                    onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                    placeholder="What skills and knowledge should students develop? (optional)"
                    rows={3}
                    className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </TabsContent>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-6 border-t border-gray-200">
              <Button
                onClick={handleGenerate}
                disabled={loading || !formData.subject || !formData.grade || !formData.topic}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </>
                )}
              </Button>
            </div>

            {/* Generated Content Display */}
            {generatedContent && (
              <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{generatedContent.title}</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {generatedContent.type.charAt(0).toUpperCase() + generatedContent.type.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      className="bg-white border-gray-200 hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Save as Assignment
                    </Button>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-white p-4 rounded-lg overflow-auto max-h-96 border border-gray-200">
                    {generatedContent.content}
                  </pre>
                </div>
              </div>
            )}
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
