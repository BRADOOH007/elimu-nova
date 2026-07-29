'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Presentation, Download, Loader2, Plus, Trash2, Edit, Save, X, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { confirmToast } from '@/lib/confirm-toast'
import { AIGenerationForm } from './presentation-generator/ai-generation-form'
import { SavedPresentationsList } from './presentation-generator/saved-presentations-list'
import { SlideCard } from './presentation-generator/slide-card'
import { ShareModal } from './presentation-generator/share-modal'

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
    if (!(await confirmToast({ title: 'Are you sure you want to delete this presentation?', variant: 'destructive' }))) return

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
        const isPlaceholder = data.source === 'placeholder' || data.imageUrl.startsWith('data:image/svg+xml')
        const newSlides = [...slides]
        newSlides[slideIndex] = {
          ...newSlides[slideIndex],
          image: isPlaceholder ? '' : data.imageUrl
        }
        setSlides(newSlides)
        if (isPlaceholder) {
          toast.error('AI image generation unavailable — use search links below')
        } else {
          toast.success('Image generated successfully!')
        }
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
          <SavedPresentationsList
            savedPresentations={savedPresentations}
            loadingPresentations={loadingPresentations}
            isGenerating={isGenerating}
            onEdit={loadPresentation}
            onShare={handleSharePresentation}
            onDownload={downloadPresentation}
            onDelete={deletePresentation}
          />
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
            <AIGenerationForm
              subject={subject}
              grade={grade}
              topic={topic}
              duration={duration}
              slideCount={slideCount}
              difficulty={difficulty}
              isGenerating={isGenerating}
              onSubjectChange={setSubject}
              onGradeChange={setGrade}
              onTopicChange={setTopic}
              onDurationChange={setDuration}
              onSlideCountChange={setSlideCount}
              onDifficultyChange={setDifficulty}
              onGenerate={handleAIGenerate}
            />
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
                  <SlideCard
                    key={slideIndex}
                    slide={slide}
                    slideIndex={slideIndex}
                    totalSlides={slides.length}
                    isGenerating={isGenerating}
                    generateImagesEnabled={generateImages}
                    onUpdateSlide={updateSlide}
                    onRemoveSlide={removeSlide}
                    onAddContentPoint={addContentPoint}
                    onUpdateContentPoint={updateContentPoint}
                    onRemoveContentPoint={removeContentPoint}
                    onGenerateImage={generateImageForSlide}
                  />
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

      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        presentationToShare={presentationToShare}
        students={students}
        classes={classes}
        selectedStudents={selectedStudents}
        selectedClass={selectedClass}
        isSharing={isSharing}
        onSelectedStudentsChange={setSelectedStudents}
        onSelectedClassChange={setSelectedClass}
        onShare={sharePresentation}
      />
    </div>
  )
}