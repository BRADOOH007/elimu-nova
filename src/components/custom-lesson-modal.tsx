'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, BookOpen, Clock, Target } from 'lucide-react'
import { COMPREHENSIVE_SUBJECTS } from '@/lib/subjects'

interface CustomLessonModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (data: CustomLessonData) => void
  isGenerating: boolean
}

interface CustomLessonData {
  subject: string
  topic: string
  duration: number
  difficulty: string
  learningStyle: string
  description?: string
}

// Subjects will be fetched from the database

const difficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
]

const learningStyles = [
  { value: 'visual', label: 'Visual (Diagrams, Charts, Videos)' },
  { value: 'kinesthetic', label: 'Kinesthetic (Hands-on, Interactive)' },
  { value: 'auditory', label: 'Auditory (Listening, Discussion)' }
]

export default function CustomLessonModal({ isOpen, onClose, onGenerate, isGenerating }: CustomLessonModalProps) {
  const [subjects, setSubjects] = useState<string[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [formData, setFormData] = useState<CustomLessonData>({
    subject: '',
    topic: '',
    duration: 45,
    difficulty: 'intermediate',
    learningStyle: 'visual',
    description: ''
  })

  // Fetch subjects from database
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true)
      try {
        const response = await fetch('/api/subjects')
        if (response.ok) {
          const data = await response.json()
          setSubjects(data.subjects || [])
        } else {
          console.error('Failed to fetch subjects')
          // Fallback to comprehensive subjects
          setSubjects(COMPREHENSIVE_SUBJECTS)
        }
      } catch (error) {
        console.error('Error fetching subjects:', error)
        // Fallback to comprehensive subjects
        setSubjects(COMPREHENSIVE_SUBJECTS)
      } finally {
        setLoadingSubjects(false)
      }
    }

    if (isOpen) {
      fetchSubjects()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.subject && formData.topic) {
      onGenerate(formData)
    }
  }

  const handleClose = () => {
    setFormData({
      subject: '',
      topic: '',
      duration: 45,
      difficulty: 'intermediate',
      learningStyle: 'visual',
      description: ''
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Generate Custom AI Lesson
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                  disabled={loadingSubjects}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSubjects ? "Loading subjects..." : "Select subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingSubjects && (
                  <p className="text-xs text-gray-500">Loading subjects from your school&apos;s curriculum...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Quadratic Equations"
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="120"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 45 }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(diff => (
                      <SelectItem key={diff.value} value={diff.value}>
                        {diff.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningStyle">Learning Style</Label>
              <Select
                value={formData.learningStyle}
                onValueChange={(value) => setFormData(prev => ({ ...prev, learningStyle: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {learningStyles.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what you want to learn or any specific requirements..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Target className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-700">
                AI will create a personalized lesson based on your preferences and learning style.
              </p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isGenerating}
              className="px-5 py-2.5 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.subject || !formData.topic || isGenerating}
              className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Generate Lesson
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
