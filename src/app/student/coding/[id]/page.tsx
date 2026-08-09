"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Code2, Globe, Gamepad2, Brain, Play, ExternalLink, Sparkles } from "lucide-react"
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { CodePlayground } from '@/components/coding/code-playground'
import { HopeAITutorDrawer } from '@/components/ai-tutor-drawer'

interface CodingLesson {
  id: number; title: string; description: string; difficulty: string
  content: string; practiceUrl?: string
  starterCode?: { html?: string; css?: string; js?: string }
}

const SCRATCH_LESSONS: CodingLesson[] = [
  { id: 1, title: 'Moving Sprites', description: 'Learn to move characters on screen', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use the **move 10 steps** block inside a **when green flag clicked** event.' },
  { id: 2, title: 'Events & Inputs', description: 'React to keyboard and mouse input', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use **when [space] key pressed** blocks to respond to keyboard input.' },
  { id: 3, title: 'Loops & Repetition', description: 'Use loops to repeat actions', difficulty: 'Beginner', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'The **repeat 10** block runs code a fixed number of times.' },
  { id: 4, title: 'Conditionals & Logic', description: 'Make decisions with if/else', difficulty: 'Intermediate', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Use **if <condition> then** to run code only when something is true.' },
  { id: 5, title: 'Variables & Score', description: 'Store and use data', difficulty: 'Intermediate', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Create a variable called **score**.' },
  { id: 6, title: 'Build a Game', description: 'Combine everything to make a game', difficulty: 'Advanced', practiceUrl: 'https://scratch.mit.edu/projects/editor/', content: 'Combine sprites, events, loops, conditionals and variables to build a complete game.' },
]

const trackLessons: Record<string, CodingLesson[]> = {
  scratch: SCRATCH_LESSONS,
  web: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1, title: ['Your First HTML Page', 'Styling with CSS', 'JavaScript Basics', 'Variables & Functions', 'DOM Manipulation', 'Build a Calculator'][i],
    description: ['Build a webpage from scratch', 'Make your page look great', 'Make your page interactive', 'Store data and reuse code', 'Change the page with JavaScript', 'A complete mini-project'][i],
    difficulty: i < 3 ? 'Beginner' : i < 5 ? 'Intermediate' : 'Advanced',
    content: 'Interactive coding lesson with live playground.',
    starterCode: { html: '<h1>Hello!</h1>', css: 'body { font-family: Arial; }', js: '// Your code here' }
  })),
  'ai-kids': Array.from({ length: 5 }, (_, i) => ({
    id: i + 1, title: ['What is AI?', 'How Machines Learn', 'Image Recognition', 'AI Ethics', 'Build an AI Project'][i],
    description: ['Understand artificial intelligence', 'Training and patterns', 'Teaching AI to see', 'Responsible AI use', 'Create your own AI'][i],
    difficulty: i < 2 ? 'Beginner' : i < 4 ? 'Intermediate' : 'Advanced',
    content: 'Learn about artificial intelligence concepts.',
  })),
}

export default function StudentCodingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const [track, setTrack] = useState<string>("")
  const [lessonId, setLessonId] = useState(1)
  const [showDrawer, setShowDrawer] = useState(false)

  useEffect(() => {
    // Parse query params from the id: track-lessonId format
    const parts = id?.split('-') || []
    if (parts.length >= 2) {
      setTrack(parts[0])
      setLessonId(parseInt(parts[1]) || 1)
    } else {
      setTrack('web')
      setLessonId(1)
    }
  }, [id])

  const lessons = trackLessons[track] || trackLessons.web
  const lesson = lessons.find(l => l.id === lessonId) || lessons[0]
  if (!lesson) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>

  const trackIcons: Record<string, any> = { scratch: Gamepad2, web: Globe, 'ai-kids': Brain }
  const TrackIcon = trackIcons[track] || Code2

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/student/coding')}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-2">
          {lessons.map(l => (
            <Button key={l.id} size="sm" variant={l.id === lessonId ? 'default' : 'outline'}
              onClick={() => setLessonId(l.id)}>{l.id}</Button>
          ))}
          <Button size="sm" onClick={() => setShowDrawer(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white ml-2">
            <Sparkles className="w-4 h-4 mr-2" /> Ask Hope
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrackIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{lesson.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Badge variant="outline">{lesson.difficulty}</Badge>
                  <span>{lesson.description}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="content">
        <TabsList className="w-full overflow-x-auto flex gap-1.5 px-2">
          <TabsTrigger value="content" className="shrink-0 whitespace-nowrap"><Code2 className="w-4 h-4 mr-2" />Lesson</TabsTrigger>
          <TabsTrigger value="playground" className="shrink-0 whitespace-nowrap"><Play className="w-4 h-4 mr-2" />Playground</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card className="border-0 shadow">
            <CardContent className="p-6">
              <div className="prose max-w-none">
                <MarkdownRenderer content={lesson.content} />
              </div>
              {lesson.practiceUrl && (
                <Button variant="outline" className="mt-4" onClick={() => window.open(lesson.practiceUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Practice Editor
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playground">
          {lesson.starterCode ? (
            <CodePlayground
              files={[
                { name: 'index.html', language: 'html', content: lesson.starterCode.html || '' },
                { name: 'style.css', language: 'css', content: lesson.starterCode.css || '' },
                { name: 'script.js', language: 'javascript', content: lesson.starterCode.js || '' },
              ]}
            />
          ) : (
            <Card><CardContent className="p-8 text-center text-gray-500">No interactive playground for this lesson</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      <HopeAITutorDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        studentName=""
        currentSubject="Programming"
        currentTopic={lesson.title}
        initialPrompt={`I'm learning "${lesson.title}" (${lesson.description}, ${lesson.difficulty}). Can you help me understand this coding lesson?`}
      />
    </div>
  )
}
