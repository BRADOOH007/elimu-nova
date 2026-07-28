"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  BookOpen, 
  Save,
  Loader2,
  CheckCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StudySession {
  id: string
  subject: string
  topic: string | null
  duration: number
  startTime: string
  endTime: string
  notes: string | null
}

interface StudySessionTrackerProps {
  onSessionComplete?: (session: StudySession) => void
}

export function StudySessionTracker({ onSessionComplete }: StudySessionTrackerProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [pausedTime, setPausedTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        if (startTime) {
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pausedTime
          setElapsedTime(elapsed)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, isPaused, startTime, pausedTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (!subject.trim()) {
      toast({ title: "Please enter a subject before starting" })
      return
    }

    setIsActive(true)
    setStartTime(new Date())
    setPausedTime(0)
    setElapsedTime(0)
  }

  const handlePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false)
    } else {
      // Pause
      setIsPaused(true)
    }
  }

  const handleStop = async () => {
    if (!isActive || !startTime) return

    setIsSaving(true)
    
    try {
      const endTime = new Date()
      const duration = Math.floor(elapsedTime / 60) // Convert to minutes
      
      const sessionData = {
        subject: subject.trim(),
        topic: topic.trim() || null,
        duration,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: notes.trim() || null
      }

      const response = await fetch('/api/student/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      })

      if (!response.ok) {
        throw new Error('Failed to save study session')
      }

      const result = await response.json()
      
      // Reset the tracker
      setIsActive(false)
      setIsPaused(false)
      setStartTime(null)
      setPausedTime(0)
      setElapsedTime(0)
      setSubject("")
      setTopic("")
      setNotes("")

      // Notify parent component
      if (onSessionComplete) {
        onSessionComplete(result.studySession)
      }

    } catch (error) {
      console.error('Error saving study session:', error)
      toast({ title: 'Failed to save study session. Please try again.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
      <CardHeader>
        <CardTitle className="edugenius-text-gradient-blue">Study Session Tracker</CardTitle>
        <CardDescription>Track your study time and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject and Topic Input */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Mathematics, Science"
              disabled={isActive}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic (Optional)
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Algebra, Photosynthesis"
              disabled={isActive}
            />
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
            {formatTime(elapsedTime)}
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            {isActive ? (isPaused ? 'Paused' : 'Studying...') : 'Ready to start'}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!isActive ? (
            <Button 
              onClick={handleStart}
              disabled={!subject.trim()}
              className="edugenius-button"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Studying
            </Button>
          ) : (
            <>
              <Button 
                onClick={handlePause}
                variant="outline"
                className="edugenius-glass"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button 
                onClick={handleStop}
                disabled={isSaving}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop & Save
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did you study? Any insights or difficulties?"
            rows={3}
            disabled={isActive}
          />
        </div>

        {/* Session Summary */}
        {isActive && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-900">Current Session</span>
            </div>
            <div className="text-sm text-blue-800">
              <p><strong>Subject:</strong> {subject}</p>
              {topic && <p><strong>Topic:</strong> {topic}</p>}
              <p><strong>Started:</strong> {startTime?.toLocaleTimeString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
