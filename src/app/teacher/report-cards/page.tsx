'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { FileText, Loader2, Download, Search, GraduationCap } from 'lucide-react'

interface Student {
  id: string
  firstName: string
  lastName: string
  class?: { name: string; grade: string }
}

export default function ReportCardsPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [term, setTerm] = useState('1')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/teacher/students')
      .then(r => r.json())
      .then(d => setStudents(d.students || []))
      .finally(() => setLoading(false))
  }, [])

  const generate = async (studentId: string) => {
    setGenerating(studentId)
    try {
      const res = await fetch('/api/cbc/report-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, term: parseInt(term), year: parseInt(year) }),
      })
      if (!res.ok) throw new Error('Failed to generate')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_card_${studentId}_term${term}_${year}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Downloaded', description: 'Report card PDF generated' })
    } catch {
      toast({ title: 'Error', description: 'Failed to generate report card', variant: 'destructive' })
    } finally {
      setGenerating(null)
    }
  }

  const filtered = students.filter(s =>
    !search || `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-100"><GraduationCap className="h-5 w-5 text-blue-600" /></div>
        <div><h1 className="text-xl font-bold text-slate-800">CBC Report Cards</h1><p className="text-sm text-slate-500">Generate competency-based progress reports</p></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <Select value={term} onValueChange={setTerm}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Term 1</SelectItem>
            <SelectItem value="2">Term 2</SelectItem>
            <SelectItem value="3">Term 3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setSelectedStudent('all')} className="text-xs">
          <Download className="h-3.5 w-3.5 mr-1" /> Generate All
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-slate-400">{s.class?.name || '—'} · Grade {s.class?.grade || '—'}</p>
                </div>
              </div>
              <Button onClick={() => generate(s.id)} disabled={generating === s.id} size="sm" className="bg-blue-600 hover:bg-blue-700">
                {generating === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                {generating === s.id ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No students found</p>}
        </div>
      )}
    </div>
  )
}
