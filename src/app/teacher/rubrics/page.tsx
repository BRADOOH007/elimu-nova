'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Share2,
  Copy,
  CheckCircle,
  Save,
  Brain,
  Edit3,
  AlertCircle,
  Printer
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface Rubric {
  id: string
  title: string
  content: string
  subject: string
  grade: string
  topic: string
  metadata: any
  createdAt: string
  updatedAt: string
  rubricData?: {
    totalPoints: number
    performanceLevels: any[]
    criteria: any[]
  }
}

interface PerformanceLevel {
  id: string
  name: string
  description: string
  score: number
  color: string
}

interface Criterion {
  id: string
  title: string
  description: string
  weight: number
  maxScore: number
}

interface RubricForm {
  title: string
  description: string
  subject: string
  grade: string
  totalPoints: number
  performanceLevels: PerformanceLevel[]
  criteria: Criterion[]
}

const defaultPerformanceLevels: PerformanceLevel[] = [
  { id: '1', name: 'Excellent', description: 'Exceeds expectations', score: 4, color: 'bg-green-100 text-green-800' },
  { id: '2', name: 'Good', description: 'Meets expectations', score: 3, color: 'bg-blue-100 text-blue-800' },
  { id: '3', name: 'Satisfactory', description: 'Partially meets expectations', score: 2, color: 'bg-yellow-100 text-yellow-800' },
  { id: '4', name: 'Needs Improvement', description: 'Below expectations', score: 1, color: 'bg-red-100 text-red-800' }
]

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('browse')
  
  // Generator state
  const [rubricForm, setRubricForm] = useState<RubricForm>({
    title: '',
    description: '',
    subject: '',
    grade: '',
    totalPoints: 100,
    performanceLevels: [...defaultPerformanceLevels],
    criteria: []
  })
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Fetch rubrics from API
  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (subjectFilter !== 'all') params.append('subject', subjectFilter)
        if (gradeFilter !== 'all') params.append('grade', gradeFilter)
        
        const response = await fetch(`/api/rubrics?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setRubrics(data.rubrics || [])
        } else {
          console.error('Failed to fetch rubrics')
        }
      } catch (error) {
        console.error('Error fetching rubrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRubrics()
  }, [searchTerm, subjectFilter, gradeFilter])

  const handleView = (rubric: Rubric) => {
    setSelectedRubric(rubric)
    setShowPreview(true)
  }

  const handleEdit = (rubric: Rubric) => {
    startEditingRubric(rubric)
  }

  const handleDelete = async (rubricId: string) => {
    try {
      const response = await fetch(`/api/rubrics/${rubricId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setRubrics(prev => prev.filter(r => r.id !== rubricId))
      } else {
        alert('Error deleting rubric')
      }
    } catch (error) {
      console.error('Error deleting rubric:', error)
      alert('Error deleting rubric')
    }
  }

  const handleExport = async (rubric: Rubric, format: 'pdf' | 'word') => {
    try {
      const rubricData = typeof rubric.content === 'string' 
        ? JSON.parse(rubric.content) 
        : rubric.content

      const response = await fetch('/api/export/rubric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rubric: rubricData,
          format
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${rubric.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_rubric.${format === 'pdf' ? 'pdf' : 'doc'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert(`Error exporting to ${format.toUpperCase()}`)
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error)
      alert(`Error exporting to ${format.toUpperCase()}`)
    }
  }

  const handleCopy = (rubric: Rubric) => {
    const rubricData = typeof rubric.content === 'string' 
      ? JSON.parse(rubric.content) 
      : rubric.content

    const rubricText = generateRubricText(rubricData)
    navigator.clipboard.writeText(rubricText)
    alert('Rubric copied to clipboard!')
  }

  const generateRubricText = (rubricData: any) => {
    let text = `${rubricData.title}\n`
    text += `Subject: ${rubricData.subject} | Grade: ${rubricData.grade}\n`
    text += `Description: ${rubricData.description}\n\n`
    
    text += 'Performance Levels:\n'
    rubricData.performanceLevels.forEach((level: any) => {
      text += `- ${level.name} (${level.score} points): ${level.description}\n`
    })
    
    text += '\nCriteria:\n'
    rubricData.criteria.forEach((criterion: any, index: number) => {
      text += `${index + 1}. ${criterion.title} (Weight: ${criterion.weight}, Max Score: ${criterion.maxScore})\n`
      text += `   ${criterion.description}\n\n`
    })
    
    return text
  }

  // Generator functions
  const addCriterion = () => {
    const newCriterion: Criterion = {
      id: Date.now().toString(),
      title: '',
      description: '',
      weight: 1,
      maxScore: 4
    }
    setRubricForm(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion]
    }))
    setEditingCriterion(newCriterion)
  }

  const updateCriterion = (id: string, updates: Partial<Criterion>) => {
    setRubricForm(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  }

  const deleteCriterion = (id: string) => {
    setRubricForm(prev => ({
      ...prev,
      criteria: prev.criteria.filter(c => c.id !== id)
    }))
  }

  const updatePerformanceLevel = (id: string, updates: Partial<PerformanceLevel>) => {
    setRubricForm(prev => ({
      ...prev,
      performanceLevels: prev.performanceLevels.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  }

  const addPerformanceLevel = () => {
    const newLevel: PerformanceLevel = {
      id: Date.now().toString(),
      name: '',
      description: '',
      score: rubricForm.performanceLevels.length + 1,
      color: 'bg-gray-100 text-gray-800'
    }
    setRubricForm(prev => ({
      ...prev,
      performanceLevels: [...prev.performanceLevels, newLevel]
    }))
  }

  const deletePerformanceLevel = (id: string) => {
    if (rubricForm.performanceLevels.length <= 2) return
    setRubricForm(prev => ({
      ...prev,
      performanceLevels: prev.performanceLevels.filter(p => p.id !== id)
    }))
  }

  const calculateTotalPoints = () => {
    return rubricForm.criteria.reduce((total, criterion) => {
      return total + (criterion.maxScore * criterion.weight)
    }, 0)
  }

  const saveRubric = async () => {
    if (!rubricForm.title || !rubricForm.subject || !rubricForm.grade || rubricForm.criteria.length === 0) {
      alert('Please fill in all required fields and add at least one criterion.')
      return
    }

    setIsGenerating(true)
    try {
      const url = isEditing ? `/api/rubrics/${editingId}` : '/api/rubrics'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: rubricForm.title,
          description: rubricForm.description,
          subject: rubricForm.subject,
          grade: rubricForm.grade,
          totalPoints: rubricForm.totalPoints,
          performanceLevels: rubricForm.performanceLevels,
          criteria: rubricForm.criteria,
          metadata: {
            calculatedPoints: calculateTotalPoints(),
            updatedAt: new Date().toISOString()
          }
        })
      })

      if (response.ok) {
        alert(isEditing ? 'Rubric updated successfully!' : 'Rubric saved successfully!')
        
        if (!isEditing) {
          setRubricForm({
            title: '',
            description: '',
            subject: '',
            grade: '',
            totalPoints: 100,
            performanceLevels: [...defaultPerformanceLevels],
            criteria: []
          })
        }
        
        // Refresh the rubrics list
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (subjectFilter !== 'all') params.append('subject', subjectFilter)
        if (gradeFilter !== 'all') params.append('grade', gradeFilter)
        
        const refreshResponse = await fetch(`/api/rubrics?${params.toString()}`)
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setRubrics(data.rubrics || [])
        }
        
        setActiveTab('browse')
      } else {
        const error = await response.json()
        alert(`Error ${isEditing ? 'updating' : 'saving'} rubric: ${error.error}`)
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} rubric:`, error)
      alert(`Error ${isEditing ? 'updating' : 'saving'} rubric. Please try again.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateRubric = async () => {
    if (!rubricForm.title || !rubricForm.subject || !rubricForm.grade || rubricForm.criteria.length === 0) {
      alert('Please fill in all required fields and add at least one criterion.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-rubric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: rubricForm.subject,
          grade: rubricForm.grade,
          topic: rubricForm.title,
          description: rubricForm.description,
          performanceLevels: rubricForm.performanceLevels,
          criteria: rubricForm.criteria,
          totalPoints: rubricForm.totalPoints
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRubricForm(prev => ({
          ...prev,
          description: data.rubric.description || prev.description,
          criteria: data.rubric.criteria || prev.criteria,
          performanceLevels: data.rubric.performanceLevels || prev.performanceLevels
        }))
        alert('Rubric enhanced with AI! You can now save it.')
      }
    } catch (error) {
      console.error('Error generating rubric:', error)
      alert('Error generating rubric. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const startEditingRubric = (rubric: Rubric) => {
    const rubricData = typeof rubric.content === 'string' 
      ? JSON.parse(rubric.content) 
      : rubric.content

    setRubricForm({
      title: rubricData.title || rubric.title,
      description: rubricData.description || '',
      subject: rubric.subject,
      grade: rubric.grade,
      totalPoints: rubricData.totalPoints || 100,
      performanceLevels: rubricData.performanceLevels || [...defaultPerformanceLevels],
      criteria: rubricData.criteria || []
    })
    
    setIsEditing(true)
    setEditingId(rubric.id)
    setActiveTab('create')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading rubrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rubrics</h1>
          <p className="text-gray-600 mt-1">Browse existing rubrics or create new ones</p>
        </div>
        <Button 
          onClick={() => setActiveTab('create')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Rubric
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Rubrics</TabsTrigger>
          <TabsTrigger value="create">Create Rubric</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">

      {/* Search and Filter */}
      <Card className="bg-gradient-to-br from-white via-purple-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search rubrics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 rounded-md border-0 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 rounded-md border-0 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Grades</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="High School">High School</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rubrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rubrics.map((rubric) => {
          const rubricData = typeof rubric.content === 'string' 
            ? JSON.parse(rubric.content) 
            : rubric.content

          return (
            <Card key={rubric.id} className="bg-gradient-to-br from-white via-purple-50 to-blue-50 shadow-lg backdrop-blur-sm border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-800">
                      Rubric
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleView(rubric)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(rubric)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(rubric, 'pdf')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(rubric, 'word')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Word
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopy(rubric)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(rubric.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {rubric.title}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {rubric.subject} • {rubric.grade}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(rubric.createdAt).toLocaleDateString()}</span>
                  </div>
                  {rubricData && (
                    <>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>{rubricData.criteria?.length || 0} criteria</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>{rubricData.totalPoints || 100} total points</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {rubrics.length === 0 && (
        <Card className="bg-gradient-to-br from-white via-purple-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rubrics Yet</h3>
            <p className="text-gray-600 mb-6">Start creating assessment rubrics to get started.</p>
            <Link href="/teacher/rubric-generator">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rubric
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          {/* Create Rubric Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Rubric Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Enter the basic details for your rubric</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Rubric Title *</Label>
                      <Input
                        id="title"
                        value={rubricForm.title}
                        onChange={(e) => setRubricForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Essay Writing Rubric"
                        className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={rubricForm.subject}
                        onChange={(e) => setRubricForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="e.g., English, Mathematics"
                        className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade Level *</Label>
                      <Input
                        id="grade"
                        value={rubricForm.grade}
                        onChange={(e) => setRubricForm(prev => ({ ...prev, grade: e.target.value }))}
                        placeholder="e.g., Grade 7, High School"
                        className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalPoints">Total Points</Label>
                      <Input
                        id="totalPoints"
                        type="number"
                        value={rubricForm.totalPoints}
                        onChange={(e) => setRubricForm(prev => ({ ...prev, totalPoints: parseInt(e.target.value) || 100 }))}
                        className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500">
                        Calculated: {calculateTotalPoints()} points
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={rubricForm.description}
                      onChange={(e) => setRubricForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this rubric will assess..."
                      rows={3}
                      className="bg-white/70 backdrop-blur-sm border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Performance Levels */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Performance Levels
                      </CardTitle>
                      <CardDescription>Define the scoring levels for your rubric</CardDescription>
                    </div>
                    <Button
                      onClick={addPerformanceLevel}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Level
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rubricForm.performanceLevels.map((level, index) => (
                    <div key={level.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <Label>Level Name</Label>
                        <Input
                          value={level.name}
                          onChange={(e) => updatePerformanceLevel(level.id, { name: e.target.value })}
                          placeholder="e.g., Excellent"
                          className="bg-white border-0 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Score</Label>
                        <Input
                          type="number"
                          value={level.score}
                          onChange={(e) => updatePerformanceLevel(level.id, { score: parseInt(e.target.value) || 0 })}
                          className="bg-white border-0 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={level.description}
                          onChange={(e) => updatePerformanceLevel(level.id, { description: e.target.value })}
                          placeholder="e.g., Exceeds expectations"
                          className="bg-white border-0 shadow-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={() => deletePerformanceLevel(level.id)}
                          variant="outline"
                          size="sm"
                          disabled={rubricForm.performanceLevels.length <= 2}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Criteria */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-purple-600" />
                        Assessment Criteria
                      </CardTitle>
                      <CardDescription>Define what will be assessed in your rubric</CardDescription>
                    </div>
                    <Button
                      onClick={addCriterion}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Criterion
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rubricForm.criteria.map((criterion, index) => (
                    <div key={criterion.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Criterion {index + 1}</h4>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingCriterion(criterion)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteCriterion(criterion.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={criterion.title}
                            onChange={(e) => updateCriterion(criterion.id, { title: e.target.value })}
                            placeholder="e.g., Content Quality"
                            className="bg-white border-0 shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Weight</Label>
                          <Input
                            type="number"
                            value={criterion.weight}
                            onChange={(e) => updateCriterion(criterion.id, { weight: parseInt(e.target.value) || 1 })}
                            className="bg-white border-0 shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Description</Label>
                        <Textarea
                          value={criterion.description}
                          onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                          placeholder="Describe what this criterion assesses..."
                          rows={2}
                          className="bg-white border-0 shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
                  {rubricForm.criteria.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Edit3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No criteria added yet. Click "Add Criterion" to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Actions */}
            <div className="space-y-6">
              {/* Actions */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={saveRubric}
                    disabled={isGenerating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isGenerating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Rubric' : 'Save Rubric')}
                  </Button>
                  <Button
                    onClick={generateRubric}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full bg-white/70 backdrop-blur-sm border-0 shadow-sm hover:bg-white/90"
                  >
                    {isGenerating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    ) : (
                      <Brain className="w-4 h-4 mr-2" />
                    )}
                    {isGenerating ? 'Generating...' : 'Enhance with AI'}
                  </Button>
                </CardContent>
              </Card>

              {/* Rubric Summary */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Rubric Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manual Total:</span>
                    <span className="font-semibold">{rubricForm.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calculated Total:</span>
                    <span className="font-semibold">{calculateTotalPoints()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Performance Levels:</span>
                    <span className="font-semibold">{rubricForm.performanceLevels.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Criteria:</span>
                    <span className="font-semibold">{rubricForm.criteria.length}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <strong>Status:</strong> {rubricForm.criteria.length > 0 ? 'Ready to save' : 'Add criteria to continue'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Rubric Preview
            </DialogTitle>
            <DialogDescription>
              Preview your rubric before editing or exporting
            </DialogDescription>
          </DialogHeader>
          
          {selectedRubric && (
            <div className="space-y-6">
              {(() => {
                const rubricData = typeof selectedRubric.content === 'string' 
                  ? JSON.parse(selectedRubric.content) 
                  : selectedRubric.content

                return (
                  <>
                    {/* Rubric Header */}
                    <div className="text-center border-b border-gray-200 pb-4">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{rubricData.title}</h2>
                      <p className="text-gray-600">{rubricData.subject} • {rubricData.grade}</p>
                      {rubricData.description && (
                        <p className="text-gray-700 mt-2">{rubricData.description}</p>
                      )}
                    </div>

                    {/* Rubric Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border-0">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border-0 px-4 py-2 text-left font-semibold">Criteria</th>
                            {rubricData.performanceLevels?.map((level: any) => (
                              <th key={level.id} className="border-0 px-4 py-2 text-center font-semibold">
                                {level.name}
                                <br />
                                <span className="text-sm text-gray-600">({level.score} pts)</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rubricData.criteria?.map((criterion: any, index: number) => (
                            <tr key={criterion.id}>
                              <td className="border-0 px-4 py-2">
                                <div className="font-semibold">{criterion.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{criterion.description}</div>
                                <div className="text-xs text-gray-500 mt-1">Weight: {criterion.weight}</div>
                              </td>
                              {rubricData.performanceLevels?.map((level: any) => (
                                <td key={level.id} className="border-0 px-4 py-2 text-center">
                                  <div className="text-sm text-gray-700">
                                    {level.description}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Points */}
                    <div className="text-right text-lg font-semibold">
                      Total Points: {rubricData.totalPoints || 100}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Criterion Edit Modal */}
      <Dialog open={!!editingCriterion} onOpenChange={() => setEditingCriterion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Criterion</DialogTitle>
            <DialogDescription>
              Update the details for this assessment criterion
            </DialogDescription>
          </DialogHeader>
          
          {editingCriterion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingCriterion.title}
                  onChange={(e) => setEditingCriterion(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="e.g., Content Quality"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingCriterion.description}
                  onChange={(e) => setEditingCriterion(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Describe what this criterion assesses..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input
                    type="number"
                    value={editingCriterion.weight}
                    onChange={(e) => setEditingCriterion(prev => prev ? { ...prev, weight: parseInt(e.target.value) || 1 } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    value={editingCriterion.maxScore}
                    onChange={(e) => setEditingCriterion(prev => prev ? { ...prev, maxScore: parseInt(e.target.value) || 4 } : null)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingCriterion(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingCriterion) {
                      updateCriterion(editingCriterion.id, editingCriterion)
                      setEditingCriterion(null)
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
