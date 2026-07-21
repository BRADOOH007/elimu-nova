'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Loader2, ArrowLeft, Save, Eye, Edit3, BookOpen, GraduationCap, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EditLessonPlanPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const [loading, setLoading]     = useState(true)
  const [saving,  setSaving]      = useState(false)
  const [title,   setTitle]       = useState('')
  const [subject, setSubject]     = useState('')
  const [grade,   setGrade]       = useState('')
  const [content, setContent]     = useState('')
  const [mode,    setMode]        = useState<'preview' | 'edit'>('preview')
  const [hasImageBank, setHasImageBank] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/lesson-plans/${id}`)
      .then(r => r.json())
      .then(d => {
        const lp = d.lessonPlan || d
        setTitle(lp.title || '')
        setSubject(lp.subject || '')
        setGrade(lp.grade || '')
        const raw = lp.content
        setContent(typeof raw === 'string' ? raw : (raw?.generatedContent || raw?.content || ''))
        setHasImageBank(lp.imageBankEnabled || false)
      })
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load lesson plan' }))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const r = await fetch(`/api/lesson-plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject, grade, content: { generatedContent: content } }),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      toast({ title: 'Lesson plan saved!' })
      router.push(`/teacher/lesson-plans/${id}`)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/lesson-plans/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Edit Lesson Plan</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={mode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setMode('preview')}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button variant={mode === 'edit' ? 'default' : 'outline'} size="sm" onClick={() => setMode('edit')}>
            <Edit3 className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" /> Save</>}
          </Button>
        </div>
      </div>

      {/* Meta Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white/80 border-slate-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-white/80 border-slate-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Grade</label>
              <Input value={grade} onChange={e => setGrade(e.target.value)} className="bg-white/80 border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="border-0 shadow">
        <CardContent className="p-6">
          {mode === 'edit' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700">Content (Markdown)</label>
                <Badge variant="outline" className="text-xs">.md</Badge>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={28}
                className="w-full font-mono text-sm border border-slate-200 rounded-xl p-4 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-slate-700">Lesson Preview</label>
                <Badge variant="secondary" className="text-xs">Rendered</Badge>
              </div>
              <div className="prose max-w-none">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
