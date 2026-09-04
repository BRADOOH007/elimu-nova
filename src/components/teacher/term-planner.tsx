'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar, BookOpen, Loader2, Download, Plus, CheckCircle2, FileText, GraduationCap,
} from 'lucide-react'

interface KICDRow {
  id: string
  week: number
  lesson: number
  strand: string
  subStrand: string
  learningOutcomes: string[]
  learningExperiences: string[]
  keyInquiryQuestions: string[]
  resources: string[]
  assessment: string | null
}

const GRADES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9']
const TERMS = [1, 2, 3]
export const TERM_SUBJECTS = [
  'Mathematics', 'English', 'Kiswahili', 'Science and Technology', 'Integrated Science',
  'Social Studies', 'CRE', 'Creative Arts', 'Agriculture and Nutrition',
  'Physical and Health Education', 'Pre-Tech Studies', 'Mathematical Activities',
  'Language Activities', 'Creative Activities', 'Environmental Activities',
]

export function TermPlanner() {
  const { toast } = useToast()
  const [grade, setGrade] = useState('Grade 4')
  const [subject, setSubject] = useState('Mathematics')
  const [term, setTerm] = useState(3)
  const [rows, setRows] = useState<KICDRow[]>([])
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchScheme = useCallback(async (g: string, s: string, t: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/kicd/scheme?grade=${encodeURIComponent(g)}&subject=${encodeURIComponent(s)}&term=${t}`)
      const data = await res.json()
      if (res.ok) {
        setRows(data.rows || [])
        setExists(!!data.exists)
      }
    } catch {
      toast({ variant: 'destructive', title: 'Could not load scheme' })
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { fetchScheme(grade, subject, term) }, [grade, subject, term, fetchScheme])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/kicd/scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, subject, term }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setRows(data.rows || [])
      setExists(true)
      toast({ title: 'Scheme ready', description: `${data.count} lessons generated for ${subject} ${grade} Term ${term}` })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Generation failed', description: e.message })
    } finally { setGenerating(false) }
  }

  const download = () => {
    if (!rows.length) return
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${subject} ${grade} Term ${term} Scheme of Work</title><style>
      body{font-family:Arial,sans-serif;margin:30px;color:#111}
      h1{font-size:20px;text-align:center;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1a8f5a;padding-bottom:8px}
      .meta{text-align:center;color:#555;font-size:13px;margin-bottom:18px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#1a8f5a;color:#fff;padding:8px;text-align:left;border:1px solid #999}
      td{padding:7px;border:1px solid #ccc;vertical-align:top}
      tr:nth-child(even){background:#f5f7f5}
    </style></head><body>
    <h1>Scheme of Work</h1>
    <p class="meta">${subject} · ${grade} · Term ${term} · ElimuNova AI</p>
    <table><thead><tr><th>WK</th><th>LSN</th><th>Strand</th><th>Sub-Strand</th><th>Learning Outcomes</th><th>Key Inquiry Questions</th><th>Resources</th></tr></thead><tbody>`
    for (const r of rows) {
      html += `<tr><td>${r.week}</td><td>${r.lesson}</td><td>${r.strand}</td><td>${r.subStrand}</td><td>${r.learningOutcomes.join('; ')}</td><td>${r.keyInquiryQuestions.join('; ')}</td><td>${r.resources.join(', ')}</td></tr>`
    }
    html += `</tbody></table></body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${subject}_${grade}_Term${term}_Scheme.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalWeeks = new Set(rows.map(r => r.week)).size

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TERM_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Term</Label>
              <Select value={String(term)} onValueChange={v => setTerm(parseInt(v, 10))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TERMS.map(t => <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex gap-2 w-full">
                <Button onClick={generate} disabled={generating || loading} className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600">
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {exists ? 'Regenerate' : 'Generate Term'}
                </Button>
                <Button variant="outline" onClick={download} disabled={!rows.length} className="bg-white">
                  <Download className="h-4 w-4 mr-1" /> Print
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Lessons', value: rows.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Weeks', value: totalWeeks, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Subject', value: subject, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Status', value: exists ? 'Ready' : 'Not generated', icon: CheckCircle2, color: exists ? 'text-green-600' : 'text-amber-600', bg: exists ? 'bg-green-50' : 'bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-100 bg-white p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="font-bold text-slate-900 truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scheme table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            {subject} · {grade} · Term {term}
          </CardTitle>
          <CardDescription>{rows.length} lessons across {totalWeeks} weeks</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No scheme yet</p>
              <p className="text-sm">Select a class above and click <span className="font-semibold text-emerald-600">Generate Term</span></p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-12">WK</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-12">LSN</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Strand</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sub-Strand</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Learning Outcomes</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Resources</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-2.5 text-center font-semibold text-slate-400">{r.week}</td>
                      <td className="px-3 py-2.5 text-center text-slate-500">{r.lesson}</td>
                      <td className="px-3 py-2.5">{r.strand}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{r.subStrand}</td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-[360px]">
                        <ul className="list-disc list-inside space-y-0.5">
                          {r.learningOutcomes.slice(0, 3).map((o, i) => <li key={i} className="text-xs">{o}</li>)}
                        </ul>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[200px]">{r.resources.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
