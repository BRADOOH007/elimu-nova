"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, BookOpen, Search, Play, Clock, GraduationCap, CheckCircle, Lock, ChevronRight, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface CurriculumLesson {
  id: string; title: string; content?: any; objectives: string[]
  duration?: number; order: number; isCompleted: boolean
  substrand?: { name: string; strand?: { name: string; curriculum?: { name: string } } }
}

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<CurriculumLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null)
  const [activeTab, setActiveTab] = useState("browse")
  const [markingComplete, setMarkingComplete] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/student/lessons?period=all')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const all = data.lessons || data.courses?.flatMap?.((c: any) => c.lessons) || []
        setLessons(all)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = lessons.filter(l =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.objectives?.some((o: string) => o.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-blue-600" /> My Lessons</h1>
        <p className="text-sm text-gray-600">Browse and study curriculum-aligned lessons</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lessons..." className="pl-10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="lesson">Lesson Content</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500">No lessons available yet</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(lesson => (
                <Card key={lesson.id} className={`border-0 shadow cursor-pointer hover:shadow-lg transition-shadow ${selectedLesson?.id === lesson.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => { setSelectedLesson(lesson); setActiveTab('lesson') }}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-xs">Lesson {lesson.order}</Badge>
                      {lesson.isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    {lesson.objectives?.length > 0 && (
                      <ul className="text-xs text-gray-500 space-y-1">
                        {lesson.objectives.slice(0, 2).map((o: string, i: number) => (
                          <li key={i} className="flex items-start gap-1"><ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />{o}</li>
                        ))}
                        {lesson.objectives.length > 2 && <li className="text-blue-500">+{lesson.objectives.length - 2} more</li>}
                      </ul>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" />{lesson.duration || 30}min</span>
                      <Button size="sm" className="bg-blue-600"><Play className="w-3 h-3 mr-1" /> Start</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lesson">
          {selectedLesson ? (
            <Card className="border-0 shadow">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Badge variant="outline">Lesson {selectedLesson.order}</Badge>
                    {selectedLesson.duration && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{selectedLesson.duration}min</Badge>}
                    {selectedLesson.isCompleted && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>}
                  </div>
                  <h2 className="text-xl font-bold">{selectedLesson.title}</h2>
                </div>

                {selectedLesson.objectives?.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Learning Objectives</h3>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                      {selectedLesson.objectives.map((o: string, i: number) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="prose max-w-none">
                  <MarkdownRenderer content={
                    typeof selectedLesson.content === 'string' ? selectedLesson.content :
                    selectedLesson.content?.markdown || selectedLesson.content?.content ||
                    JSON.stringify(selectedLesson.content, null, 2)
                  } />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setActiveTab('browse')}>Back to Lessons</Button>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={markingComplete === selectedLesson.id || selectedLesson.isCompleted}
                    onClick={async () => {
                      if (!selectedLesson) return
                      setMarkingComplete(selectedLesson.id)
                      try {
                        const res = await fetch(`/api/student/lessons/${selectedLesson.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isCompleted: true })
                        })
                        if (res.ok) {
                          setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, isCompleted: true } : l))
                          setSelectedLesson(prev => prev ? { ...prev, isCompleted: true } : null)
                          toast({ title: 'Lesson marked as complete!' })
                        } else toast({ title: 'Failed to mark complete', variant: 'destructive' })
                      } catch { toast({ title: 'Error', variant: 'destructive' }) }
                      finally { setMarkingComplete(null) }
                    }}>
                    {markingComplete === selectedLesson.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : selectedLesson.isCompleted ? <Sparkles className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    {selectedLesson.isCompleted ? 'Completed' : 'Mark as Complete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-8 text-center text-gray-500">Select a lesson to view its content</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
