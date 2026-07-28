'use client'


import { useToast } from '@/hooks/use-toast'
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
  Eye,
  Save,
  Brain,
  AlertCircle,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { RubricsGrid } from './components/rubric-card'
import { PerformanceLevelsEditor, CriteriaList, CriterionEditDialog } from './components/rubric-form-editors'
import { RubricPreviewDialog } from './components/rubric-preview-dialog'

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
  const { toast } = useToast()
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
        toast({ variant:'destructive', title:'Failed to delete rubric' })
      }
    } catch (error) {
      console.error('Error deleting rubric:', error)
      toast({ variant:'destructive', title:'Failed to delete rubric' })
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
        toast({ variant:"destructive", title:"Export failed" })
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error)
      toast({ variant:"destructive", title:"Export failed" })
    }
  }

  const handleCopy = (rubric: Rubric) => {
    const rubricData = typeof rubric.content === 'string' 
      ? JSON.parse(rubric.content) 
      : rubric.content

    const rubricText = generateRubricText(rubricData)
    navigator.clipboard.writeText(rubricText)
    toast({ title:'📋 Copied to clipboard!' })
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
      toast({ variant:'destructive', title:'Fill in all required fields' })
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
        toast({ title: isEditing ? "✅ Rubric updated!" : "✅ Rubric saved!" })
        
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
        toast({ variant:"destructive", title:"Operation failed" })
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} rubric:`, error)
      toast({ variant:"destructive", title:"Operation failed" })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateRubric = async () => {
    if (!rubricForm.title || !rubricForm.subject || !rubricForm.grade || rubricForm.criteria.length === 0) {
      toast({ variant:'destructive', title:'Fill in all required fields' })
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
        toast({ title:'✅ Rubric enhanced with AI!' })
      }
    } catch (error) {
      console.error('Error generating rubric:', error)
      toast({ variant:'destructive', title:'Failed to enhance rubric' })
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

      <RubricsGrid
        rubrics={rubrics}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExport={handleExport}
        onCopy={handleCopy}
      />

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

              <PerformanceLevelsEditor
                levels={rubricForm.performanceLevels}
                onUpdate={updatePerformanceLevel}
                onAdd={addPerformanceLevel}
                onDelete={deletePerformanceLevel}
              />

              <CriteriaList
                criteria={rubricForm.criteria}
                onUpdate={updateCriterion}
                onDelete={deleteCriterion}
                onAdd={addCriterion}
                onEdit={(c) => setEditingCriterion(c)}
              />
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

      <RubricPreviewDialog open={showPreview} onOpenChange={setShowPreview} rubric={selectedRubric} />

      <CriterionEditDialog
        criterion={editingCriterion}
        onUpdate={(id, updates) => {
          setEditingCriterion(prev => prev ? { ...prev, ...updates } : null)
        }}
        onSave={(c) => {
          updateCriterion(c.id, c)
          setEditingCriterion(null)
        }}
        onCancel={() => setEditingCriterion(null)}
      />
    </div>
  )
}
