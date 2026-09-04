"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { confirmToast } from '@/lib/confirm-toast'
import { sanitizeHtml } from '@/lib/sanitize'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  FileText,
  Brain,
  Clock,
  Target,
  Star,
  Tag,
  Loader2,
  AlertCircle,
  Bot,
  Wand2,
  RefreshCw,
  BookMarked,
  Lightbulb,
  Zap
} from "lucide-react"

interface Resource {
  id: string
  title: string
  content: string
  type: string
  subject: string
  grade: string
  tags: string[]
  isAIGenerated: boolean
  metadata: {
    difficulty: string
    duration: string
    learningObjectives: string[]
    prerequisites: string[]
    keyPoints: string[]
    examples: string[]
    practiceQuestions: string[]
    summary: string
  }
  teacher: {
    user: {
      firstName: string
      lastName: string
    }
  }
  lessonPlan?: {
    id: string
    title: string
    subject: string
  }
  createdAt: string
  updatedAt: string
}

interface ResourceFilters {
  subjects: string[]
  types: string[]
}

const RESOURCE_TYPES = [
  { value: 'NOTE', label: 'Notes', icon: FileText },
  { value: 'SUMMARY', label: 'Summary', icon: BookOpen },
  { value: 'WORKSHEET', label: 'Worksheet', icon: Edit },
  { value: 'QUIZ', label: 'Quiz', icon: Target },
  { value: 'ASSIGNMENT', label: 'Assignment', icon: BookMarked },
  { value: 'REFERENCE', label: 'Reference', icon: BookOpen },
  { value: 'GUIDE', label: 'Guide', icon: Lightbulb },
  { value: 'FORMULA_SHEET', label: 'Formula Sheet', icon: FileText },
  { value: 'VOCABULARY', label: 'Vocabulary', icon: Tag },
  { value: 'CONCEPT_MAP', label: 'Concept Map', icon: Brain },
  { value: 'TIMELINE', label: 'Timeline', icon: Clock },
  { value: 'DIAGRAM', label: 'Diagram', icon: Target },
  { value: 'OTHER', label: 'Other', icon: FileText }
]

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filters, setFilters] = useState<ResourceFilters>({ subjects: [], types: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  })

  // Create resource form state
  const [createForm, setCreateForm] = useState({
    type: '',
    subject: '',
    topic: '',
    grade: '',
    description: ''
  })

  useEffect(() => {
    fetchResources()
  }, [searchTerm, selectedType, selectedSubject])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedType && selectedType !== 'all') params.append('type', selectedType)
      if (selectedSubject && selectedSubject !== 'all') params.append('subject', selectedSubject)

      const response = await fetch(`/api/student/resources?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }
      
      const data = await response.json()
      setResources(data.resources)
      setFilters(data.filters)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Error fetching resources:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResource = async () => {
    try {
      const response = await fetch('/api/student/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm)
      })

      if (!response.ok) {
        throw new Error('Failed to create resource')
      }

      const data = await response.json()
      setResources(prev => [data.resource, ...prev])
      setShowCreateModal(false)
      setCreateForm({ type: '', subject: '', topic: '', grade: '', description: '' })
    } catch (err) {
      console.error('Error creating resource:', err)
      setError(err instanceof Error ? err.message : 'Failed to create resource')
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!(await confirmToast({ title: 'Delete this resource?', description: 'This cannot be undone.', confirmLabel: 'Delete' }))) return
    try {
      const response = await fetch(`/api/student/resources/${resourceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete resource')
      }

      setResources(prev => prev.filter(r => r.id !== resourceId))
    } catch (err) {
      console.error('Error deleting resource:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete resource')
    }
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = RESOURCE_TYPES.find(t => t.value === type)
    return typeConfig ? typeConfig.icon : FileText
  }

  const getTypeLabel = (type: string) => {
    const typeConfig = RESOURCE_TYPES.find(t => t.value === type)
    return typeConfig ? typeConfig.label : type
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading && resources.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your AI-generated resources...</p>
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
          <Button onClick={fetchResources}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI Learning Resources
            </h1>
            <p className="text-gray-600 text-lg">
              Your AI Teacher's comprehensive collection of notes and materials
            </p>
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate AI Resource
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/70 backdrop-blur-sm"
            onClick={fetchResources}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className=" border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Search & Filter Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {RESOURCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {filters.subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setSelectedType("all")
                setSelectedSubject("all")
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => {
          const TypeIcon = getTypeIcon(resource.type)
          return (
            <Card key={resource.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="w-5 h-5 text-blue-600" />
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {getTypeLabel(resource.type)}
                    </Badge>
                    {resource.isAIGenerated && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-700">
                        <Bot className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedResource(resource)
                        setShowViewModal(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteResource(resource.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>
                  {resource.subject} • Grade {resource.grade}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {resource.metadata?.duration || '30 min'}
                    </div>
                    <Badge className={getDifficultyColor(resource.metadata?.difficulty || 'intermediate')}>
                      {resource.metadata?.difficulty || 'intermediate'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {resource.metadata?.summary || 'AI-generated educational resource'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {resources.length === 0 && !loading && (
        <Card className=" border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No resources found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || (selectedType && selectedType !== 'all') || (selectedSubject && selectedSubject !== 'all')
                ? 'Try adjusting your filters or search terms'
                : 'Generate your first AI resource to get started'
              }
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate AI Resource
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Resource Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Wand2 className="w-5 h-5 mr-2 text-blue-600" />
              Generate AI Resource
            </DialogTitle>
            <DialogDescription>
              Let your AI Teacher create a comprehensive educational resource for you
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Resource Type
                </label>
                <Select value={createForm.type} onValueChange={(value) => setCreateForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Subject
                </label>
                <Input
                  placeholder="e.g., Mathematics"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Topic
                </label>
                <Input
                  placeholder="e.g., Algebra"
                  value={createForm.topic}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, topic: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Grade
                </label>
                <Input
                  placeholder="e.g., 8"
                  value={createForm.grade}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, grade: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description (Optional)
              </label>
              <Textarea
                placeholder="Describe what you want to learn or any specific requirements..."
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateResource}
              disabled={!createForm.type || !createForm.subject || !createForm.topic || !createForm.grade}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Resource Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              {selectedResource?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedResource?.subject} • Grade {selectedResource?.grade}
            </DialogDescription>
          </DialogHeader>
          {selectedResource && (
            <DialogBody className="space-y-6 mt-1">
              <div className="flex flex-wrap gap-2">
                {selectedResource.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="lesson-content">
                <MarkdownRenderer content={selectedResource.content} />
              </div>
              {selectedResource.metadata && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Learning Objectives</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {selectedResource.metadata.learningObjectives?.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {selectedResource.metadata.keyPoints?.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  {selectedResource.metadata.practiceQuestions && selectedResource.metadata.practiceQuestions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Practice Questions</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        {selectedResource.metadata.practiceQuestions.map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

