'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  FileText,
  BookOpen,
  Target,
  Clock,
  Plus,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SchemeOfWorkContent {
  generatedContent: string;
  objectives?: string[];
  topics?: string[];
  duration?: number;
}

interface SchemeOfWork {
  id: string
  title: string
  subject: string
  grade: string
  term: string
  content: SchemeOfWorkContent
  duration?: number
  objectives?: string
  createdAt: string
  updatedAt: string
}

export default function EditSchemeOfWorkPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schemeOfWork, setSchemeOfWork] = useState<SchemeOfWork | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    term: '',
    duration: 12,
    objectives: [''],
    topics: [''],
    generatedContent: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchSchemeOfWork(params.id as string)
    }
  }, [params.id])

  const fetchSchemeOfWork = async (id: string) => {
    try {
      const response = await fetch(`/api/schemes-of-work/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSchemeOfWork(data)
        
        // Populate form data
        setFormData({
          title: data.title || '',
          subject: data.subject || '',
          grade: data.grade || '',
          term: data.term || '',
          duration: data.duration || data.content?.duration || 12,
          objectives: data.content?.objectives || data.objectives?.split('\n') || [''],
          topics: data.content?.topics || [''],
          generatedContent: data.content?.generatedContent || ''
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load scheme of work",
        })
        router.push('/teacher/schemes-of-work')
      }
    } catch (error) {
      console.error('Error fetching scheme of work:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error occurred",
      })
      router.push('/teacher/schemes-of-work')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objectives]
    newObjectives[index] = value
    setFormData(prev => ({ ...prev, objectives: newObjectives }))
  }

  const addObjective = () => {
    setFormData(prev => ({ ...prev, objectives: [...prev.objectives, ''] }))
  }

  const removeObjective = (index: number) => {
    if (formData.objectives.length > 1) {
      const newObjectives = formData.objectives.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, objectives: newObjectives }))
    }
  }

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...formData.topics]
    newTopics[index] = value
    setFormData(prev => ({ ...prev, topics: newTopics }))
  }

  const addTopic = () => {
    setFormData(prev => ({ ...prev, topics: [...prev.topics, ''] }))
  }

  const removeTopic = (index: number) => {
    if (formData.topics.length > 1) {
      const newTopics = formData.topics.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, topics: newTopics }))
    }
  }

  const handleSave = async () => {
    if (!schemeOfWork) return

    setSaving(true)
    try {
      const response = await fetch(`/api/schemes-of-work/${schemeOfWork.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          subject: formData.subject,
          grade: formData.grade,
          term: formData.term,
          duration: formData.duration,
          content: {
            generatedContent: formData.generatedContent,
            objectives: formData.objectives.filter(obj => obj.trim()),
            topics: formData.topics.filter(topic => topic.trim()),
            duration: formData.duration
          }
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Scheme of work updated successfully!",
          variant: "success",
        })
        router.push('/teacher/schemes-of-work')
      } else {
        const errorData = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: errorData.error || "Failed to update scheme of work",
        })
      }
    } catch (error) {
      console.error('Error updating scheme of work:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error occurred",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!schemeOfWork) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Scheme of work not found</h3>
        <Button onClick={() => router.push('/teacher/schemes-of-work')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Schemes
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/teacher/schemes-of-work')}
            className="bg-white/70 hover:bg-white/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Edit Scheme of Work
              </span>
            </h1>
            <p className="text-gray-600">Update your scheme of work details and content</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Basic Information */}
      <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Update the basic details of your scheme of work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter scheme title"
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Mathematics, Science"
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                placeholder="e.g., Grade 8"
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm"
              />
            </div>
            <div>
              <Label htmlFor="term">Term</Label>
              <select
                id="term"
                name="term"
                value={formData.term}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border-0 bg-white/70 backdrop-blur-sm px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                max="52"
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Learning Objectives
          </CardTitle>
          <CardDescription>
            Define the key learning objectives for this scheme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.objectives.map((objective, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={objective}
                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                placeholder={`Learning objective ${index + 1}`}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm"
              />
              {formData.objectives.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeObjective(index)}
                  className="bg-red-50 hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addObjective}
            className="bg-white/70 hover:bg-white/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Objective
          </Button>
        </CardContent>
      </Card>

      {/* Topics */}
      <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Topics
          </CardTitle>
          <CardDescription>
            List the main topics to be covered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.topics.map((topic, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={topic}
                onChange={(e) => handleTopicChange(index, e.target.value)}
                placeholder={`Topic ${index + 1}`}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-sm"
              />
              {formData.topics.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeTopic(index)}
                  className="bg-red-50 hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addTopic}
            className="bg-white/70 hover:bg-white/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Topic
          </Button>
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Scheme Content
          </CardTitle>
          <CardDescription>
            Edit the detailed content of your scheme of work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            name="generatedContent"
            value={formData.generatedContent}
            onChange={handleInputChange}
            placeholder="Enter the detailed scheme of work content..."
            rows={20}
            className="bg-white/70 backdrop-blur-sm border-0 shadow-sm resize-none"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => router.push('/teacher/schemes-of-work')}
          className="bg-white/70 hover:bg-white/90"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}