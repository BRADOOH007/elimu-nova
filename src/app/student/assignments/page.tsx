"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Download,
  Eye,
  Loader2,
  Search,
  Filter,
  Plus,
  Bot,
  Lightbulb,
  BookOpen,
  Target,
  TrendingUp,
  Zap,
  Paperclip,
  X,
  File
} from "lucide-react"

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE'
  grade: number | null
  teacher: {
    firstName: string
    lastName: string
    email: string
  }
  subject: string
  lessonPlan?: {
    title: string
    subject: string
    grade: string
  }
  submissions?: Array<{
    id: string
    content: string
    attachments: string[]
    grade: number | null
    feedback: string | null
    submittedAt: string
    gradedAt: string | null
  }>
}

interface AIInsights {
  strengths: string[]
  areasForImprovement: string[]
  recommendedFocus: string[]
  nextSteps: string[]
  learningStyle: string
  currentLevel: string
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showAIHelp, setShowAIHelp] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitContent, setSubmitContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ grade?: number; feedback?: string } | null>(null)
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; type: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchAssignments()
    fetchAIInsights()
  }, [])

  useEffect(() => {
    filterAssignments()
  }, [assignments, searchTerm, statusFilter, subjectFilter])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/assignments?includeCompleted=true')
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments')
      }
      
      const data = await response.json()
      setAssignments(data.assignments || [])
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchAIInsights = async () => {
    try {
      const response = await fetch('/api/student/ai-insights')
      if (response.ok) {
        const data = await response.json()
        setAiInsights(data)
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err)
    }
  }

  const filterAssignments = () => {
    let filtered = assignments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter)
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.subject === subjectFilter)
    }

    setFilteredAssignments(filtered)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GRADED':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
      case 'OVERDUE':
        return 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
      case 'SUBMITTED':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
      default:
        return 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GRADED':
        return <CheckCircle className="w-4 h-4" />
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />
      case 'SUBMITTED':
        return <Clock className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getSubjects = () => {
    // Build a case-insensitive, trimmed set while preserving first-seen original casing
    const lowerToOriginal = new Map<string, string>()
    for (const assignment of assignments) {
      const raw = assignment.subject ?? ""
      const trimmed = raw.trim()
      if (!trimmed) continue
      const lower = trimmed.toLowerCase()
      if (!lowerToOriginal.has(lower)) {
        lowerToOriginal.set(lower, trimmed)
      }
    }
    return Array.from(lowerToOriginal.values()).sort()
  }

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    try {
      const body = {
        subject: subjectFilter !== 'all' ? subjectFilter : undefined,
        prompt: searchTerm || undefined
      }
      const response = await fetch('/api/student/ai-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!response.ok) {
        throw new Error('Failed to generate assignment')
      }
      // Refresh assignments list to include the newly generated assignment
      await fetchAssignments()
      setShowAIGenerator(false)
    } catch (error) {
      console.error('Error generating assignment:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAIHelp = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setShowAIHelp(true)
  }

  const handleOpenSubmit = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setSubmitContent("")
    setSubmitResult(null)
    setAttachments([])
    setShowSubmitModal(true)
  }

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || (!submitContent.trim() && attachments.length === 0)) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: submitContent || '(See attached file)',
          attachments: attachments.map(a => a.url)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setSubmitResult({
        grade: data.submission?.grade,
        feedback: data.submission?.feedback
      })
      await fetchAssignments()
    } catch (err) {
      setSubmitResult({ feedback: err instanceof Error ? err.message : 'Submission failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/student/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        setAttachments(prev => [...prev, { url: data.url, name: data.name, type: data.type }])
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleView = (assignmentId: string) => {
    router.push(`/student/assignments/${assignmentId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assignments...</p>
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
          <Button onClick={fetchAssignments}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            AI-Powered Assignments
          </span>
        </h1>
        <p className="text-gray-600 text-lg">
          Smart assignment management with AI assistance and insights
        </p>
      </div>

      {/* AI Insights Banner */}
      {aiInsights && (
        <Card className="border-0 bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Learning Insights</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Learning Style: <span className="font-medium">{aiInsights.learningStyle || '—'}</span></p>
                    <p className="text-sm text-gray-600 mb-1">Current Level: <span className="font-medium">{aiInsights.currentLevel || '—'}</span></p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Focus Areas: {(aiInsights.recommendedFocus ?? []).slice(0, 2).join(', ') || '—'}</p>
                    <p className="text-sm text-gray-600">Next Steps: {(aiInsights.nextSteps ?? [])[0] || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Assignments</p>
                <p className="text-3xl font-bold">{assignments.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold">
                  {assignments.filter(a => a.status === 'GRADED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold">
                  {assignments.filter(a => a.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Overdue</p>
                <p className="text-3xl font-bold">
                  {assignments.filter(a => a.status === 'OVERDUE').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 bg-white/70 backdrop-blur-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="GRADED">Graded</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full md:w-40 bg-white/70 backdrop-blur-sm">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {getSubjects().map((subject, index) => (
                    <SelectItem key={`${subject}-${index}`} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAIGenerator(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="space-y-6">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(assignment.status)}`}>
                        {getStatusIcon(assignment.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {assignment.title}
                          </h3>
                          <Badge variant="outline" className="bg-white/70 backdrop-blur-sm">
                            {assignment.subject}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{assignment.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                          <span className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            {assignment.teacher.firstName} {assignment.teacher.lastName}
                          </span>
                          {assignment.grade && (
                            <span className="flex items-center text-green-600 font-medium">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              Grade: {Math.round(assignment.grade)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        {assignment.lessonPlan && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            From: {assignment.lessonPlan.title}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAIHelp(assignment)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 border-0"
                        >
                          <Bot className="w-4 h-4 mr-2" />
                          AI Help
                        </Button>
                        {assignment.status === 'PENDING' && (
                          <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            onClick={() => handleOpenSubmit(assignment)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Submit
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleView(assignment.id)} className="bg-white/70 backdrop-blur-sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {assignment.status === 'GRADED' && (
                          <Button size="sm" variant="outline" className="bg-white/70 backdrop-blur-sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className=" border-0shadow-lg">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2 text-gray-600">No assignments found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' || subjectFilter !== 'all' 
                  ? 'Try adjusting your filters to see more assignments.'
                  : 'Your assignments will appear here once they are assigned by your teacher.'
                }
              </p>
              <Button 
                onClick={() => setShowAIGenerator(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate AI Assignment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Assignment Generator Modal */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2 text-purple-600" />
              AI Assignment Generator
            </DialogTitle>
            <DialogDescription>
              Generate a personalized assignment based on your learning needs and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered Assignment Creation</h3>
              <p className="text-gray-600 mb-6">
                Our AI will create a custom assignment tailored to your learning style and current level.
              </p>
              <Button 
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Help Modal */}
      <Dialog open={showAIHelp} onOpenChange={setShowAIHelp}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2 text-blue-600" />
              AI Assignment Help
            </DialogTitle>
            <DialogDescription>
              Get personalized assistance with your assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAssignment && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">{selectedAssignment.title}</h4>
                  <p className="text-blue-800 text-sm">{selectedAssignment.description}</p>
                </div>
                <div className="space-y-3">
                  <Button className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <Target className="w-4 h-4 mr-2" />
                    Break down the assignment into steps
                  </Button>
                  <Button className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Suggest research topics and resources
                  </Button>
                  <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Help with writing and structure
                  </Button>
                  <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-600 text-white">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Review and improve your work
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Assignment Modal */}
      <Dialog open={showSubmitModal} onOpenChange={(open) => {
        if (!open) { setShowSubmitModal(false); setSubmitResult(null); setSubmitContent(""); setAttachments([]) }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2 text-green-600" />
              Submit Assignment
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>

          {submitResult ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Submitted successfully!</span>
                </div>
                {submitResult.grade !== undefined && submitResult.grade !== null && (
                  <p className="text-green-700 font-medium">AI Grade: {Math.round(submitResult.grade)}%</p>
                )}
                {submitResult.feedback && (
                  <p className="text-sm text-green-700 mt-2 whitespace-pre-wrap">{submitResult.feedback}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowSubmitModal(false)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {selectedAssignment && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-medium mb-1">{selectedAssignment.description}</p>
                  <p className="text-blue-600">Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</p>
                </div>
              )}

              {/* Text answer */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Your Answer <span className="font-normal text-gray-400">(optional if uploading a file)</span></label>
                <Textarea
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* File upload */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Attach Files <span className="font-normal text-gray-400">(images, PDF, Word, text — max 10MB each)</span></label>
                <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                  ${isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /><span className="text-sm text-blue-600">Uploading...</span></>
                  ) : (
                    <><Paperclip className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-600">Click to attach files</span></>
                  )}
                </label>

                {/* Attachment list */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <File className="w-4 h-4 text-blue-500 shrink-0" />
                        <a href={att.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate flex-1">
                          {att.name}
                        </a>
                        <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500 shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAssignment}
                  disabled={isSubmitting || isUploading || (!submitContent.trim() && attachments.length === 0)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />Submit for AI Grading</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}