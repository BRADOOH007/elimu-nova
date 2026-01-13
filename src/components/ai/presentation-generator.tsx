'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Presentation, Download, Loader2, Sparkles, Plus, Trash2, Edit, Save, X, FileText, Calendar, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface Slide {
  id?: string
  title: string
  content: string[]
  imagePrompt?: string
  imageDescription?: string
  image?: string // Add image data URI field
  layout: 'title' | 'content' | 'image' | 'split'
  order?: number
}

interface SavedPresentation {
  id: string
  title: string
  subject: string
  grade: string
  topic: string
  slideCount: number
  duration: number
  difficulty: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

export default function PresentationGenerator() {
  const [title, setTitle] = useState('')
  const [slides, setSlides] = useState<Slide[]>([
    { title: '', content: [''], layout: 'content' }
  ])
  const [generateImages, setGenerateImages] = useState(false)
  const [imageStyle, setImageStyle] = useState('educational')
  const [theme, setTheme] = useState('education')
  const [isGenerating, setIsGenerating] = useState(false)

  // AI Generation states
  const [aiMode, setAiMode] = useState(false)
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(45)
  const [slideCount, setSlideCount] = useState(8)
  const [difficulty, setDifficulty] = useState('medium')

  // Saved presentations states
  const [savedPresentations, setSavedPresentations] = useState<SavedPresentation[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [editingPresentation, setEditingPresentation] = useState<string | null>(null)
  const [loadingPresentations, setLoadingPresentations] = useState(false)

  // Sharing states
  const [showShareModal, setShowShareModal] = useState(false)
  const [presentationToShare, setPresentationToShare] = useState<SavedPresentation | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [isSharing, setIsSharing] = useState(false)

  // Load saved presentations on component mount
  useEffect(() => {
    loadSavedPresentations()
    loadStudentsAndClasses()
  }, [])

  const loadStudentsAndClasses = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch('/api/teacher/students'),
        fetch('/api/teacher/classes')
      ])

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(studentsData.students || [])
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData.classes || [])
      }
    } catch (error) {
      console.error('Error loading students and classes:', error)
    }
  }

  const loadSavedPresentations = async () => {
    try {
      setLoadingPresentations(true)
      const response = await fetch('/api/presentations')
      if (response.ok) {
        const data = await response.json()
        setSavedPresentations(data.presentations || [])
      }
    } catch (error) {
      console.error('Error loading presentations:', error)
    } finally {
      setLoadingPresentations(false)
    }
  }

  const loadPresentation = async (presentationId: string) => {
    try {
      setIsGenerating(true)
      const response = await fetch(`/api/presentations/${presentationId}`)
      if (response.ok) {
        const data = await response.json()
        const presentation = data.presentation
        
        // Load presentation data into the form
        setTitle(presentation.title)
        setSubject(presentation.subject)
        setGrade(presentation.grade)
        setTopic(presentation.topic)
        setDuration(presentation.duration || 45)
        setDifficulty(presentation.difficulty || 'medium')
        setSlides(presentation.slides || [])
        setGenerateImages(true) // Enable images for loaded presentations
        setEditingPresentation(presentationId)
        setAiMode(false) // Switch to manual mode for editing
        setShowSaved(false) // Hide saved presentations list
        
        toast.success('Presentation loaded successfully!')
      } else {
        toast.error('Failed to load presentation')
      }
    } catch (error) {
      console.error('Error loading presentation:', error)
      toast.error('Failed to load presentation')
    } finally {
      setIsGenerating(false)
    }
  }

  const savePresentation = async () => {
    if (!editingPresentation) return

    try {
      setIsGenerating(true)
      const response = await fetch(`/api/presentations/${editingPresentation}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slides,
          subject,
          grade,
          topic,
          duration,
          difficulty
        }),
      })

      if (response.ok) {
        toast.success('Presentation saved successfully!')
        loadSavedPresentations() // Refresh the list
      } else {
        toast.error('Failed to save presentation')
      }
    } catch (error) {
      console.error('Error saving presentation:', error)
      toast.error('Failed to save presentation')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadPresentation = async (presentationId: string, presentationTitle: string) => {
    try {
      setIsGenerating(true)
      const response = await fetch(`/api/presentations/${presentationId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${presentationTitle.replace(/[^a-z0-9]/gi, '_')}.pptx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast.success('Presentation downloaded successfully!')
      } else {
        toast.error('Failed to download presentation')
      }
    } catch (error) {
      console.error('Error downloading presentation:', error)
      toast.error('Failed to download presentation')
    } finally {
      setIsGenerating(false)
    }
  }

  const deletePresentation = async (presentationId: string) => {
    if (!confirm('Are you sure you want to delete this presentation?')) return

    try {
      const response = await fetch(`/api/presentations/${presentationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Presentation deleted successfully!')
        loadSavedPresentations() // Refresh the list
        if (editingPresentation === presentationId) {
          // Clear the form if we're editing the deleted presentation
          setEditingPresentation(null)
          setTitle('')
          setSlides([{ title: '', content: [''], layout: 'content' }])
        }
      } else {
        toast.error('Failed to delete presentation')
      }
    } catch (error) {
      console.error('Error deleting presentation:', error)
      toast.error('Failed to delete presentation')
    }
  }

  const startNewPresentation = () => {
    setEditingPresentation(null)
    setTitle('')
    setSubject('')
    setGrade('')
    setTopic('')
    setDuration(45)
    setDifficulty('medium')
    setSlides([{ title: '', content: [''], layout: 'content' }])
    setGenerateImages(false)
    setAiMode(false)
    setShowSaved(false)
  }

  const handleSharePresentation = (presentation: SavedPresentation) => {
    setPresentationToShare(presentation)
    setSelectedStudents([])
    setSelectedClass('')
    setShowShareModal(true)
  }

  const sharePresentation = async () => {
    if (!presentationToShare) return

    try {
      setIsSharing(true)
      const response = await fetch(`/api/presentations/${presentationToShare.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          classId: selectedClass && selectedClass !== 'none' ? selectedClass : null
        }),
      })

      if (response.ok) {
        toast.success('Presentation shared successfully!')
        setShowShareModal(false)
        setPresentationToShare(null)
        setSelectedStudents([])
        setSelectedClass('')
      } else {
        toast.error('Failed to share presentation')
      }
    } catch (error) {
      console.error('Error sharing presentation:', error)
      toast.error('Failed to share presentation')
    } finally {
      setIsSharing(false)
    }
  }

  const generateImageForSlide = async (slideIndex: number) => {
    const slide = slides[slideIndex]
    const prompt = slide.imagePrompt || slide.imageDescription || `Educational illustration for ${slide.title}`
    
    if (!prompt.trim()) {
      toast.error('Please add an image prompt first')
      return
    }

    try {
      setIsGenerating(true)
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          size: 'medium',
          type: 'educational'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      
      if (data.success && data.imageUrl) {
        // Update the slide with the generated image
        const newSlides = [...slides]
        newSlides[slideIndex] = { 
          ...newSlides[slideIndex], 
          image: data.imageUrl 
        }
        setSlides(newSlides)
        toast.success('Image generated successfully!')
      } else {
        throw new Error('Invalid response from image generation')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error('Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const addSlide = () => {
    setSlides([...slides, { title: '', content: [''], layout: 'content' }])
  }

  const removeSlide = (index: number) => {
    if (slides.length > 1) {
      setSlides(slides.filter((_, i) => i !== index))
    }
  }

  const updateSlide = (index: number, field: keyof Slide, value: any) => {
    const newSlides = [...slides]
    newSlides[index] = { ...newSlides[index], [field]: value }
    setSlides(newSlides)
  }

  const addContentPoint = (slideIndex: number) => {
    const newSlides = [...slides]
    newSlides[slideIndex].content.push('')
    setSlides(newSlides)
  }

  const updateContentPoint = (slideIndex: number, pointIndex: number, value: string) => {
    const newSlides = [...slides]
    newSlides[slideIndex].content[pointIndex] = value
    setSlides(newSlides)
  }

  const removeContentPoint = (slideIndex: number, pointIndex: number) => {
    const newSlides = [...slides]
    if (newSlides[slideIndex].content.length > 1) {
      newSlides[slideIndex].content.splice(pointIndex, 1)
      setSlides(newSlides)
    }
  }

  const handleAIGenerate = async () => {
    if (!subject.trim() || !grade.trim() || !topic.trim()) {
      toast.error('Please fill in subject, grade, and topic for AI generation')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/generate-simple-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          grade,
          topic,
          duration,
          slideCount,
          difficulty
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.details || errorData.error || 'Failed to generate AI presentation')
      }

      const data = await response.json()
      
      if (data.success && data.presentation) {
        if (!data.presentation.slides || data.presentation.slides.length === 0) {
          throw new Error('AI generated content but no slides were created. Please try again.')
        }
        
        // Convert AI slides to our format with automatic image generation
        const aiSlides = data.presentation.slides.map((slide: any, index: number) => ({
          id: `slide-${index}`, // Add ID for image mapping
          title: slide.title || '',
          content: Array.isArray(slide.content) ? slide.content.filter((c: string) => c.trim()) : [slide.content || ''].filter((c: string) => c.trim()),
          layout: 'split' as const, // Use split layout to enable images
          imagePrompt: slide.imageDescription || `Educational illustration for ${slide.title}`,
          imageDescription: slide.imageDescription || `Educational illustration for ${slide.title}`,
          image: slide.image || '', // Include any generated images
          order: index + 1
        }))

        // Filter out empty slides
        const validSlides = aiSlides.filter((slide: any) => 
          slide.title.trim() || slide.content.some((c: string) => c.trim())
        )

        if (validSlides.length === 0) {
          throw new Error('AI generated content but no valid slides were created. Please try again with different parameters.')
        }

        // Update the form with AI-generated content
        setTitle(data.presentation.title)
        setSlides(validSlides)
        
        // Automatically enable image generation for AI presentations
        setGenerateImages(true)
        setImageStyle('educational') // Set appropriate style for educational content
        
        setAiMode(false) // Switch back to manual mode to show the generated slides
        
        // If a presentation was saved, set it as editing
        if (data.presentationId) {
          setEditingPresentation(data.presentationId)
          loadSavedPresentations() // Refresh the saved presentations list
        }
        
        toast.success(`AI generated ${validSlides.length} slides with automatic image generation! ${data.presentationId ? 'Presentation saved to your library.' : 'You can now generate the PowerPoint.'}`)
      } else {
        throw new Error('Invalid response from AI generation')
      }

    } catch (error) {
      console.error('Error generating AI presentation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI presentation'
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a presentation title')
      return
    }

    const validSlides = slides.filter(s => s.title.trim() && s.content.some(c => c.trim()))
    
    if (validSlides.length === 0) {
      toast.error('Please add at least one slide with content')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/generate-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slides: validSlides.map((slide, index) => ({
            ...slide,
            id: slide.id || `slide-${index}`, // Ensure each slide has an ID
            order: index + 1
          })),
          generateImages,
          imageStyle,
          theme
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.details || errorData.error || 'Failed to generate presentation')
      }

      // Check if response is JSON (AI content) or binary (PowerPoint file)
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        // AI-generated content response
        const data = await response.json()
        toast.success(`AI presentation generated with ${data.slideCount || validSlides.length} slides!`)
      } else {
        // PowerPoint file response
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.pptx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast.success('Presentation generated and downloaded!')
      }

    } catch (error) {
      console.error('Error generating presentation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate presentation'
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Presentation className="w-5 h-5 text-blue-600" />
                <span>AI Presentation Generator</span>
              </CardTitle>
              <CardDescription>
                Create professional presentations with AI-generated content and images
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowSaved(!showSaved)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>My Presentations ({savedPresentations.length})</span>
              </Button>
              {editingPresentation && (
                <Button
                  onClick={startNewPresentation}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Presentation</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Saved Presentations List */}
        {showSaved && (
          <CardContent className="border-t bg-gray-50">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Saved Presentations</h3>
              
              {loadingPresentations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading presentations...</span>
                </div>
              ) : savedPresentations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Presentation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No presentations saved yet</p>
                  <p className="text-sm">Create your first AI presentation to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPresentations.map((presentation) => (
                    <Card key={presentation.id} className="bg-white border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 truncate">{presentation.title}</h4>
                            <p className="text-sm text-gray-600">{presentation.subject} • {presentation.grade}</p>
                            <p className="text-xs text-gray-500">{presentation.slideCount} slides • {presentation.duration} min</p>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>Updated {new Date(presentation.updatedAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              onClick={() => loadPresentation(presentation.id)}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              disabled={isGenerating}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleSharePresentation(presentation)}
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                              disabled={isGenerating}
                            >
                              <Share2 className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => downloadPresentation(presentation.id, presentation.title)}
                              size="sm"
                              variant="outline"
                              disabled={isGenerating}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => deletePresentation(presentation.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              disabled={isGenerating}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="space-y-6 pt-6">
          {/* Editing indicator */}
          {editingPresentation && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Editing Presentation</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={savePresentation}
                  size="sm"
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save Changes
                </Button>
                <Button
                  onClick={startNewPresentation}
                  size="sm"
                  variant="outline"
                  disabled={isGenerating}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {/* AI Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div>
              <h3 className="font-semibold text-gray-900">Generation Mode</h3>
              <p className="text-sm text-gray-600">
                {aiMode ? 'Let AI create the entire presentation for you' : 'Manually create slides or use AI-generated content'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${!aiMode ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>Manual</span>
              <Switch
                checked={aiMode}
                onCheckedChange={setAiMode}
                className="data-[state=checked]:bg-purple-600"
              />
              <span className={`text-sm ${aiMode ? 'font-semibold text-purple-600' : 'text-gray-500'}`}>AI</span>
            </div>
          </div>

          {aiMode ? (
            /* AI Generation Form */
            <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-4">AI Presentation Generator</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Mathematics, Science, History"
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade Level</Label>
                  <Input
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., Grade 5, High School, University"
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Photosynthesis, World War II, Algebra"
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-400">
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
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 45)}
                    min="15"
                    max="120"
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slideCount">Number of Slides</Label>
                  <Input
                    id="slideCount"
                    type="number"
                    value={slideCount}
                    onChange={(e) => setSlideCount(parseInt(e.target.value) || 8)}
                    min="3"
                    max="20"
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>

              <Button
                onClick={handleAIGenerate}
                disabled={isGenerating || !subject.trim() || !grade.trim() || !topic.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating AI Presentation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Presentation
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Manual Mode - Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Presentation Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your presentation title"
                  disabled={isGenerating}
                />
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="colorful">Colorful</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Image Style</Label>
                  <Select value={imageStyle} onValueChange={setImageStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="diagram">Diagram</SelectItem>
                      <SelectItem value="natural">Natural</SelectItem>
                      <SelectItem value="vivid">Vivid</SelectItem>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Generate Images</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Switch
                      checked={generateImages}
                      onCheckedChange={setGenerateImages}
                    />
                    <span className="text-sm text-gray-600">
                      {generateImages ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Slides */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Slides</h3>
                  <Button
                    onClick={addSlide}
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slide
                  </Button>
                </div>

                {slides.map((slide, slideIndex) => (
                  <Card key={slideIndex} className="bg-gradient-to-br from-gray-50 to-white border-0 shadow-md">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Slide {slideIndex + 1}</h4>
                        {slides.length > 1 && (
                          <Button
                            onClick={() => removeSlide(slideIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={isGenerating}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Slide Title</Label>
                        <Input
                          value={slide.title}
                          onChange={(e) => updateSlide(slideIndex, 'title', e.target.value)}
                          placeholder="Enter slide title"
                          disabled={isGenerating}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Layout</Label>
                        <Select
                          value={slide.layout}
                          onValueChange={(value) => updateSlide(slideIndex, 'layout', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="title">Title Slide</SelectItem>
                            <SelectItem value="content">Content</SelectItem>
                            <SelectItem value="image">Image Focus</SelectItem>
                            <SelectItem value="split">Split (Text + Image)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Content Points</Label>
                          <Button
                            onClick={() => addContentPoint(slideIndex)}
                            variant="ghost"
                            size="sm"
                            disabled={isGenerating}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Point
                          </Button>
                        </div>
                        {slide.content.map((point, pointIndex) => (
                          <div key={pointIndex} className="flex items-center space-x-2">
                            <Input
                              value={point}
                              onChange={(e) => updateContentPoint(slideIndex, pointIndex, e.target.value)}
                              placeholder={`Content point ${pointIndex + 1}`}
                              disabled={isGenerating}
                            />
                            {slide.content.length > 1 && (
                              <Button
                                onClick={() => removeContentPoint(slideIndex, pointIndex)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={isGenerating}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {generateImages && (slide.layout === 'image' || slide.layout === 'split') && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Image Prompt</Label>
                            <Textarea
                              value={slide.imagePrompt || slide.imageDescription || ''}
                              onChange={(e) => updateSlide(slideIndex, 'imagePrompt', e.target.value)}
                              placeholder="Describe the image you want to generate..."
                              disabled={isGenerating}
                              className="min-h-[80px]"
                            />
                            <div className="flex items-start space-x-2 text-xs text-gray-500">
                              <Sparkles className="w-3 h-3 mt-0.5 text-purple-500" />
                              <div>
                                <p className="font-medium">AI Image Generation Tips:</p>
                                <ul className="list-disc list-inside space-y-1 mt-1">
                                  <li>Be specific about colors, objects, and style</li>
                                  <li>Include educational context (e.g., "for grade 5 students")</li>
                                  <li>Mention if you want diagrams, illustrations, or photos</li>
                                  <li>Leave empty to auto-generate from slide title</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Image Generation and Display */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Generated Image</Label>
                              <Button
                                onClick={() => generateImageForSlide(slideIndex)}
                                size="sm"
                                variant="outline"
                                disabled={isGenerating || !slide.imagePrompt?.trim() && !slide.imageDescription?.trim()}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Generate Image
                              </Button>
                            </div>
                            
                            {slide.image ? (
                              <div className="relative">
                                <img
                                  src={slide.image}
                                  alt={`Generated image for ${slide.title}`}
                                  className="w-full max-w-md h-48 object-cover rounded-lg border shadow-sm"
                                />
                                <Button
                                  onClick={() => updateSlide(slideIndex, 'image', '')}
                                  size="sm"
                                  variant="outline"
                                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="w-full max-w-md h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-sm">No image generated yet</p>
                                  <p className="text-xs">Click "Generate Image" to create one</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Generate/Save Button */}
              <div className="flex space-x-4">
                {editingPresentation && (
                  <Button
                    onClick={savePresentation}
                    disabled={isGenerating || !title.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !title.trim()}
                  className={`${editingPresentation ? 'flex-1' : 'w-full'} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating PowerPoint...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {editingPresentation ? 'Download PowerPoint' : 'Generate PowerPoint'}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {isGenerating && generateImages && (
            <p className="text-sm text-amber-600 text-center">
              ⚠️ Image generation may take 1-2 minutes per slide
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sharing Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Presentation</DialogTitle>
            <DialogDescription>
              Share "{presentationToShare?.title}" with your students
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Share with entire class */}
            <div className="space-y-2">
              <Label>Share with Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No class selected</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Share with individual students */}
            <div className="space-y-2">
              <Label>Or Share with Individual Students</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                {students.length === 0 ? (
                  <p className="text-sm text-gray-500">No students found</p>
                ) : (
                  students.map((student: any) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, student.id])
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                          }
                        }}
                      />
                      <Label htmlFor={student.id} className="text-sm">
                        {student.user?.firstName} {student.user?.lastName}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={() => setShowShareModal(false)}
                variant="outline"
                className="flex-1"
                disabled={isSharing}
              >
                Cancel
              </Button>
              <Button
                onClick={sharePresentation}
                disabled={isSharing || (!selectedClass || selectedClass === 'none') && selectedStudents.length === 0}
                className="flex-1"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}