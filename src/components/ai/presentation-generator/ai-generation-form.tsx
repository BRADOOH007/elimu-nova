'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'

interface AIGenerationFormProps {
  subject: string
  grade: string
  topic: string
  duration: number
  slideCount: number
  difficulty: string
  isGenerating: boolean
  onSubjectChange: (value: string) => void
  onGradeChange: (value: string) => void
  onTopicChange: (value: string) => void
  onDurationChange: (value: number) => void
  onSlideCountChange: (value: number) => void
  onDifficultyChange: (value: string) => void
  onGenerate: () => void
}

export function AIGenerationForm({
  subject, grade, topic, duration, slideCount, difficulty, isGenerating,
  onSubjectChange, onGradeChange, onTopicChange,
  onDurationChange, onSlideCountChange, onDifficultyChange,
  onGenerate,
}: AIGenerationFormProps) {
  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border">
      <h3 className="font-semibold text-gray-900 mb-4">AI Presentation Generator</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="e.g., Mathematics, Science, History"
            className="border-purple-200 focus:border-purple-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">Grade Level</Label>
          <Input
            id="grade"
            value={grade}
            onChange={(e) => onGradeChange(e.target.value)}
            placeholder="e.g., Grade 5, High School, University"
            className="border-purple-200 focus:border-purple-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="e.g., Photosynthesis, World War II, Algebra"
            className="border-purple-200 focus:border-purple-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={difficulty} onValueChange={onDifficultyChange}>
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
            onChange={(e) => onDurationChange(parseInt(e.target.value) || 45)}
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
            onChange={(e) => onSlideCountChange(parseInt(e.target.value) || 8)}
            min="3"
            max="20"
            className="border-purple-200 focus:border-purple-400"
          />
        </div>
      </div>

      <Button
        onClick={onGenerate}
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
  )
}
