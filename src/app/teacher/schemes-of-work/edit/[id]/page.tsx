'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const TERMS = ['Term 1', 'Term 2', 'Term 3']
const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','IRE','Agriculture','Physics','Chemistry','Biology','History','Geography','Business Studies','Computer Studies','Home Science','Art & Design']
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']

export default function EditSchemeOfWorkPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [title,   setTitle]   = useState('')
  const [subject, setSubject] = useState('')
  const [grade,   setGrade]   = useState('')
  const [term,    setTerm]    = useState('Term 1')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/schemes-of-work/${id}`)
      .then(r => r.json())
      .then(d => {
        const sw = d.schemeOfWork || d
        setTitle(sw.title || '')
        setSubject(sw.subject || '')
        setGrade(sw.grade || '')
        setTerm(sw.term || 'Term 1')
        const raw = sw.content
        setContent(typeof raw === 'string' ? raw : (raw?.generatedContent || JSON.stringify(raw, null, 2)))
      })
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load scheme of work' }))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const r = await fetch(`/api/schemes-of-work/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subject, grade, term, content: { generatedContent: content } }),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      toast({ title: '✅ Scheme of work updated!' })
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
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Scheme of Work</h1>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Scheme Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Scheme title" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Grade</label>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Term</label>
              <select value={term} onChange={e => setTerm(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Content</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={20}
              className="font-mono text-sm resize-none"
              placeholder="Scheme of work content…"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => router.back()} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 text-white"
            >
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
