'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Plus, Trash2, Save, RotateCcw, Sun, BookOpen, Clock, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import UploadPreviewModal from '@/components/modals/upload-preview-modal'

interface TermBreak {
  name: string
  start: string
  end: string
}

interface TermHoliday {
  name: string
  date: string
}

interface Term {
  id?: string
  term: number
  termName: string
  startDate: string
  endDate: string
  weeksCount: number
  breaks: TermBreak[]
  holidays: TermHoliday[]
  isOpening: boolean
}

const TERM_COLORS = ['from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-purple-500 to-purple-600']
const TERM_ICONS = ['📚', '🌱', '🎓']

export default function AcademicCalendarPage() {
  const [terms, setTerms] = useState<Term[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => { fetchCalendar() }, [year])

  const fetchCalendar = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academic-calendar?year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setTerms(data.terms || [])
      }
    } catch (e) {
      console.error('Failed to fetch calendar:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/academic-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, terms }),
      })
      if (res.ok) {
        toast({ title: 'Calendar saved successfully', variant: 'success' })
        fetchCalendar()
      } else {
        const err = await res.json()
        toast({ variant: 'destructive', title: 'Failed to save', description: err.error })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  const updateTerm = (index: number, field: string, value: any) => {
    setTerms(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
  }

  const addBreak = (termIndex: number) => {
    setTerms(prev => prev.map((t, i) => i === termIndex ? {
      ...t,
      breaks: [...t.breaks, { name: 'Break', start: '', end: '' }]
    } : t))
  }

  const updateBreak = (termIndex: number, breakIndex: number, field: string, value: string) => {
    setTerms(prev => prev.map((t, i) => i === termIndex ? {
      ...t,
      breaks: t.breaks.map((b, j) => j === breakIndex ? { ...b, [field]: value } : b)
    } : t))
  }

  const removeBreak = (termIndex: number, breakIndex: number) => {
    setTerms(prev => prev.map((t, i) => i === termIndex ? {
      ...t,
      breaks: t.breaks.filter((_, j) => j !== breakIndex)
    } : t))
  }

  const addHoliday = (termIndex: number) => {
    setTerms(prev => prev.map((t, i) => i === termIndex ? {
      ...t,
      holidays: [...t.holidays, { name: 'Holiday', date: '' }]
    } : t))
  }

  const updateHoliday = (termIndex: number, holidayIndex: number, field: string, value: string) => {
    setTerms(prev => prev.map((t, i) => i === termIndex ? {
      ...t,
      holidays: t.holidays.map((h, j) => j === holidayIndex ? { ...h, [field]: value } : h)
    } : t))
  }

  const removeHoliday = (termIndex: number, holidayIndex: number) => {
    setTerms(prev => prev.map((t, i) => i === termIndex ? {
      ...t,
      holidays: t.holidays.filter((_, j) => j !== holidayIndex)
    } : t))
  }

  const resetToDefaults = () => {
    const defaults: Term[] = [
      {
        term: 1, termName: 'Term 1',
        startDate: `${year}-01-05`, endDate: `${year}-04-04`,
        weeksCount: 13,
        breaks: [{ name: 'Half-term', start: `${year}-02-23`, end: `${year}-02-27` }],
        holidays: [{ name: "New Year's Day", date: `${year}-01-01` }],
        isOpening: true,
      },
      {
        term: 2, termName: 'Term 2',
        startDate: `${year}-04-28`, endDate: `${year}-07-25`,
        weeksCount: 13,
        breaks: [{ name: 'Half-term', start: `${year}-06-02`, end: `${year}-06-06` }],
        holidays: [
          { name: 'Labour Day', date: `${year}-05-01` },
          { name: 'Madaraka Day', date: `${year}-06-01` },
        ],
        isOpening: false,
      },
      {
        term: 3, termName: 'Term 3',
        startDate: `${year}-09-02`, endDate: `${year}-11-01`,
        weeksCount: 11,
        breaks: [{ name: 'Half-term', start: `${year}-10-13`, end: `${year}-10-17` }],
        holidays: [
          { name: "Heroes' Day", date: `${year}-10-20` },
          { name: 'Jamhuri Day', date: `${year}-12-12` },
          { name: 'Christmas', date: `${year}-12-25` },
          { name: 'Boxing Day', date: `${year}-12-26` },
        ],
        isOpening: false,
      },
    ]
    setTerms(defaults)
  }

  const totalWeeks = terms.reduce((sum, t) => sum + (t.weeksCount || 0), 0)
  const totalLessons = totalWeeks * 5

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Academic Calendar</h1>
          <p className="text-slate-500 text-sm">Manage term dates, breaks, and holidays for Kenya schools</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <span className="text-lg font-bold text-slate-700 w-16 text-center">{year}</span>
            <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>
              <RotateCcw className="w-4 h-4 rotate-180" />
            </Button>
          </div>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />Reset to Kenya Defaults
          </Button>
          <Button onClick={() => setUploadOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Upload className="w-4 h-4 mr-2" />Upload Calendar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Calendar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white"><Calendar className="w-5 h-5" /></div>
            <div><p className="text-xs text-blue-600">Terms</p><p className="text-2xl font-bold text-blue-800">{terms.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><Clock className="w-5 h-5" /></div>
            <div><p className="text-xs text-emerald-600">Total Weeks</p><p className="text-2xl font-bold text-emerald-800">{totalWeeks}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white"><BookOpen className="w-5 h-5" /></div>
            <div><p className="text-xs text-purple-600">Est. Lessons</p><p className="text-2xl font-bold text-purple-800">{totalLessons}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white"><Sun className="w-5 h-5" /></div>
            <div><p className="text-xs text-amber-600">Holidays</p><p className="text-2xl font-bold text-amber-800">{terms.reduce((sum, t) => sum + t.holidays.length, 0)}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Terms */}
      {terms.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No Calendar Set</h3>
            <p className="text-slate-400 mb-4">Click &quot;Reset to Kenya Defaults&quot; to auto-populate the standard Kenya school calendar</p>
            <Button onClick={resetToDefaults} className="bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />Load Kenya Defaults
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {terms.map((term, i) => (
            <Card key={i} className="border-0 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${TERM_COLORS[i]} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{TERM_ICONS[i]}</span>
                    <div>
                      <h3 className="font-bold text-lg">{term.termName}</h3>
                      <p className="text-white/80 text-sm">{term.weeksCount} weeks</p>
                    </div>
                  </div>
                  {term.isOpening && <Badge className="bg-white/20 text-white border-0">Opening Term</Badge>}
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                {/* Term Name */}
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Term Name</label>
                  <Input value={term.termName} onChange={e => updateTerm(i, 'termName', e.target.value)} className="h-9 text-sm" />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
                    <Input type="date" value={term.startDate?.split('T')[0] || ''} onChange={e => updateTerm(i, 'startDate', e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
                    <Input type="date" value={term.endDate?.split('T')[0] || ''} onChange={e => updateTerm(i, 'endDate', e.target.value)} className="h-9 text-sm" />
                  </div>
                </div>

                {/* Weeks */}
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Weeks Count</label>
                  <Input type="number" value={term.weeksCount} onChange={e => updateTerm(i, 'weeksCount', parseInt(e.target.value) || 0)} min={1} max={20} className="h-9 text-sm w-24" />
                </div>

                {/* Breaks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-500">Breaks</label>
                    <Button variant="ghost" size="sm" onClick={() => addBreak(i)} className="h-6 text-xs"><Plus className="w-3 h-3 mr-1" />Add</Button>
                  </div>
                  {term.breaks.map((b, j) => (
                    <div key={j} className="flex gap-2 mb-2 items-center">
                      <Input value={b.name} onChange={e => updateBreak(i, j, 'name', e.target.value)} className="h-8 text-xs flex-1" placeholder="Name" />
                      <Input type="date" value={b.start?.split('T')[0] || ''} onChange={e => updateBreak(i, j, 'start', e.target.value)} className="h-8 text-xs" />
                      <Input type="date" value={b.end?.split('T')[0] || ''} onChange={e => updateBreak(i, j, 'end', e.target.value)} className="h-8 text-xs" />
                      <Button variant="ghost" size="sm" onClick={() => removeBreak(i, j)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>

                {/* Holidays */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-500">Holidays</label>
                    <Button variant="ghost" size="sm" onClick={() => addHoliday(i)} className="h-6 text-xs"><Plus className="w-3 h-3 mr-1" />Add</Button>
                  </div>
                  {term.holidays.map((h, j) => (
                    <div key={j} className="flex gap-2 mb-2 items-center">
                      <Input value={h.name} onChange={e => updateHoliday(i, j, 'name', e.target.value)} className="h-8 text-xs flex-1" placeholder="Name" />
                      <Input type="date" value={h.date?.split('T')[0] || ''} onChange={e => updateHoliday(i, j, 'date', e.target.value)} className="h-8 text-xs" />
                      <Button variant="ghost" size="sm" onClick={() => removeHoliday(i, j)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>

                {/* Opening Term Toggle */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input type="checkbox" checked={term.isOpening} onChange={e => updateTerm(i, 'isOpening', e.target.checked)} className="rounded" />
                  <label className="text-xs text-slate-600">This is the opening term</label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {uploadOpen && <UploadPreviewModal type="calendar" onClose={() => setUploadOpen(false)} onSuccess={() => { fetchCalendar(); setUploadOpen(false) }} />}
    </div>
  )
}
