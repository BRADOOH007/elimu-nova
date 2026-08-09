'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE','Agriculture','Physics','Chemistry','Biology','History','Geography','Business Studies','Computer Studies','Home Science','Art & Design']
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Calendar,
  Clock,
  Target,
  BookOpen,
  Activity,
  FileText
} from 'lucide-react'

interface Topic {
  id?: string
  title: string
  description: string
  weekNumber: number
  lessonNumber: number
  objectives: string[]
  activities: string[]
  resources: string[]
  assessment: string
  duration: number
}

interface SchemeOfWorkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
  isEditing?: boolean
}

export default function SchemeOfWorkModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEditing = false
}: SchemeOfWorkModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    term: '',
    duration: 12,
    objectives: ''
  })

  const [topics, setTopics] = useState<Topic[]>([])
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        subject: initialData.subject || '',
        grade: initialData.grade || '',
        term: initialData.term || '',
        duration: initialData.duration || 12,
        objectives: initialData.objectives || ''
      })
      setTopics(initialData.topics || [])
    }
  }, [initialData])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTopic = () => {
    const newTopic: Topic = {
      title: '',
      description: '',
      weekNumber: 1,
      lessonNumber: 1,
      objectives: [],
      activities: [],
      resources: [],
      assessment: '',
      duration: 40
    }
    setEditingTopic(newTopic)
    setIsTopicModalOpen(true)
  }

  const editTopic = (topic: Topic) => {
    setEditingTopic({ ...topic })
    setIsTopicModalOpen(true)
  }

  const deleteTopic = (topicId: string) => {
    setTopics(prev => prev.filter(topic => topic.id !== topicId))
  }

  const saveTopic = (topicData: Topic) => {
    if (editingTopic?.id) {
      // Update existing topic
      setTopics(prev => prev.map(topic => 
        topic.id === editingTopic.id ? { ...topicData, id: editingTopic.id } : topic
      ))
    } else {
      // Add new topic
      const newTopic = { ...topicData, id: Date.now().toString() }
      setTopics(prev => [...prev, newTopic])
    }
    setEditingTopic(null)
    setIsTopicModalOpen(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        topics: topics.map(topic => ({
          title: topic.title,
          description: topic.description,
          weekNumber: topic.weekNumber,
          lessonNumber: topic.lessonNumber,
          objectives: topic.objectives,
          activities: topic.activities,
          resources: topic.resources,
          assessment: topic.assessment,
          duration: topic.duration
        }))
      }
      await onSave(dataToSave)
      onClose()
    } catch (error) {
      console.error('Error saving scheme of work:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupTopicsByWeek = () => {
    return topics.reduce((acc, topic) => {
      const week = topic.weekNumber.toString()
      if (!acc[week]) {
        acc[week] = []
      }
      acc[week].push(topic)
      return acc
    }, {} as Record<string, Topic[]>)
  }

  const topicsByWeek = groupTopicsByWeek()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Scheme of Work' : 'Create New Scheme of Work'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update your scheme of work details and topics.' : 'Create a comprehensive scheme of work with weekly lessons and topics.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-6 mt-1">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Scheme of work title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select subject</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Grade Level</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select grade</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Term</label>
                    <Select value={formData.term} onValueChange={(value) => handleInputChange('term', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                        <SelectItem value="Full Year">Full Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration (weeks)</label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      min="1"
                      max="52"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Learning Objectives</label>
                  <Textarea
                    value={formData.objectives}
                    onChange={(e) => handleInputChange('objectives', e.target.value)}
                    placeholder="Enter learning objectives separated by semicolons (;)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Topics Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Weekly Topics & Lessons
                  </CardTitle>
                  <Button onClick={addTopic} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Topic
                  </Button>
                </div>
                <CardDescription>
                  Organize your lessons by week and topic. Each topic can have multiple objectives, activities, and resources.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No topics added yet. Click "Add Topic" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(topicsByWeek).map(([week, weekTopics]) => (
                      <div key={week} className="border rounded-lg">
                        <div className="bg-blue-50 px-4 py-2 border-b">
                          <h3 className="font-semibold text-blue-900">Week {week}</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {weekTopics.map((topic, index) => (
                            <div key={topic.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">Lesson {topic.lessonNumber}</Badge>
                                  <span className="font-medium">{topic.title}</span>
                                  <span className="text-sm text-gray-500">({topic.duration} min)</span>
                                </div>
                                {topic.description && (
                                  <p className="text-sm text-gray-600">{topic.description}</p>
                                )}
                                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                  {topic.objectives.length > 0 && (
                                    <span>{topic.objectives.length} objectives</span>
                                  )}
                                  {topic.activities.length > 0 && (
                                    <span>{topic.activities.length} activities</span>
                                  )}
                                  {topic.resources.length > 0 && (
                                    <span>{topic.resources.length} resources</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editTopic(topic)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteTopic(topic.id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="px-5 py-2.5 text-sm font-medium">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="px-5 py-2.5 text-sm font-medium">
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topic Modal */}
      <TopicModal
        isOpen={isTopicModalOpen}
        onClose={() => {
          setEditingTopic(null)
          setIsTopicModalOpen(false)
        }}
        onSave={saveTopic}
        topic={editingTopic}
        isEditing={!!editingTopic?.id}
      />
    </>
  )
}

// Topic Modal Component
interface TopicModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (topic: Topic) => void
  topic: Topic | null
  isEditing: boolean
}

function TopicModal({ isOpen, onClose, onSave, topic, isEditing }: TopicModalProps) {
  const [formData, setFormData] = useState<Topic>({
    title: '',
    description: '',
    weekNumber: 1,
    lessonNumber: 1,
    objectives: [],
    activities: [],
    resources: [],
    assessment: '',
    duration: 40
  })

  const [newObjective, setNewObjective] = useState('')
  const [newActivity, setNewActivity] = useState('')
  const [newResource, setNewResource] = useState('')

  useEffect(() => {
    if (topic) {
      setFormData({ ...topic })
    }
  }, [topic])

  const handleInputChange = (field: keyof Topic, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective.trim()]
      }))
      setNewObjective('')
    }
  }

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }))
  }

  const addActivity = () => {
    if (newActivity.trim()) {
      setFormData(prev => ({
        ...prev,
        activities: [...prev.activities, newActivity.trim()]
      }))
      setNewActivity('')
    }
  }

  const removeActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }))
  }

  const addResource = () => {
    if (newResource.trim()) {
      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, newResource.trim()]
      }))
      setNewResource('')
    }
  }

  const removeResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    if (formData.title.trim()) {
      onSave(formData)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Topic' : 'Add New Topic'}
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Topic Title</label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter topic title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                min="1"
                max="180"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Week Number</label>
              <Input
                type="number"
                value={formData.weekNumber}
                onChange={(e) => handleInputChange('weekNumber', parseInt(e.target.value))}
                min="1"
                max="52"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Lesson Number</label>
              <Input
                type="number"
                value={formData.lessonNumber}
                onChange={(e) => handleInputChange('lessonNumber', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the topic"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Learning Objectives</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add learning objective"
                  onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                />
                <Button onClick={addObjective} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {formData.objectives.map((objective, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{objective}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeObjective(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Activities</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Add activity"
                  onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                />
                <Button onClick={addActivity} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {formData.activities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{activity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeActivity(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Resources</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newResource}
                  onChange={(e) => setNewResource(e.target.value)}
                  placeholder="Add resource"
                  onKeyPress={(e) => e.key === 'Enter' && addResource()}
                />
                <Button onClick={addResource} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {formData.resources.map((resource, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{resource}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeResource(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Assessment</label>
            <Textarea
              value={formData.assessment}
              onChange={(e) => handleInputChange('assessment', e.target.value)}
              placeholder="Assessment methods for this topic"
              rows={2}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="px-5 py-2.5 text-sm font-medium">
            Cancel
          </Button>
          <Button onClick={handleSave} className="px-5 py-2.5 text-sm font-medium">
            {isEditing ? 'Update' : 'Add'} Topic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
