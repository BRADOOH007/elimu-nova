'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EditLessonPlanPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [title,   setTitle]     = useState('')
  const [subject, setSubject]   = useState('')
  const [grade,   setGrade]     = useState('')
  const [content, setContent]   = useState('')

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
        setContent(typeof raw === 'string' ? raw : (raw?.generatedContent || raw?.content || JSON.stringify(raw, null, 2)))
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
      toast({ title: '✅ Lesson plan updated!' })
      router.push('/teacher/lesson-plans')
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
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Lesson Plan</h1>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Lesson Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Lesson title" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Grade</label>
              <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. Grade 7" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Content</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={20}
              className="font-mono text-sm resize-none"
              placeholder="Lesson plan content…"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => router.back()} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white"
            >
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
