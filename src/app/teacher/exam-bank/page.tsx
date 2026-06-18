'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Search, Plus, Trash2, Share2, RefreshCw, Filter, Download, Loader2, Database } from 'lucide-react'

interface Exam {
  id: string; title: string; subject: string; grade: string
  description: string; totalMarks: number; createdAt: string
  teacher: { user: { firstName: string; lastName: string } }
  metadata: any
}

const SUBJECTS = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies', 'CRE', 'IRE', 'Agriculture', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Business Studies', 'Computer Studies']
const GRADES   = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']
const TERMS    = ['Term 1', 'Term 2', 'Term 3']
const TYPES    = ['CAT', 'Mid-Term', 'End-Term', 'Mock', 'Holiday', 'Opener']

export default function ExamBankPage() {
  const [exams, setExams]         = useState<Exam[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [subject, setSubject]     = useState('')
  const [grade, setGrade]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating]   = useState(false)
  const [form, setForm]           = useState({ title: '', subject: '', grade: '', term: '', type: '', description: '' })

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)  params.set('search',  search)
    if (subject) params.set('subject', subject)
    if (grade)   params.set('grade',   grade)
    try {
      const res  = await fetch(`/api/exam-bank?${params}`)
      const data = await res.json()
      setExams(data.exams || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, subject, grade])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await fetch('/api/exam-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setShowCreate(false)
      setForm({ title: '', subject: '', grade: '', term: '', type: '', description: '' })
      await load()
    } finally { setCreating(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Remove from exam bank?')) return
    await fetch('/api/exam-bank', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setExams(prev => prev.filter(e => e.id !== id))
  }

  const useExam = async (exam: Exam) => {
    // Copy exam to assignments page
    const params = new URLSearchParams({
      fromBank: exam.id,
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
    })
    window.location.href = `/teacher/assignments?${params}`
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Exam Bank</h1>
            <p className="text-slate-500 text-sm">Save, reuse and share exams across terms</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all">
            <Plus className="h-4 w-4" /> Add to Bank
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..."
            className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={subject} onChange={e => setSubject(e.target.value)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={grade} onChange={e => setGrade(e.target.value)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Grades</option>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-blue-200 rounded-2xl p-5">
          <h3 className="font-bold text-slate-800 mb-4">Add Exam to Bank</h3>
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  placeholder="e.g. Mathematics Mid-Term Exam"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Subject *</label>
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Grade *</label>
                <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} required
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Term</label>
                <select value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select term</option>
                  {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Exam Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select type</option>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional notes"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={creating}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? 'Saving...' : 'Save to Bank'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Database className="h-14 w-14 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Exam bank is empty</p>
          <p className="text-slate-400 text-sm mt-1">Add exams here to reuse them across terms and classes</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{exam.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{exam.subject}</span>
                    <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">{exam.grade}</span>
                    {exam.metadata?.term && <span className="text-xs text-slate-400">{exam.metadata.term}</span>}
                    {exam.metadata?.type && <span className="text-xs text-slate-400">{exam.metadata.type}</span>}
                  </div>
                </div>
              </div>
              {exam.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{exam.description}</p>}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                <span>By {exam.teacher?.user ? `${exam.teacher.user.firstName} ${exam.teacher.user.lastName}` : 'You'}</span>
                <span>{fmtDate(exam.createdAt)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => useExam(exam)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <BookOpen className="h-3.5 w-3.5" /> Use Exam
                </button>
                <button onClick={() => remove(exam.id)}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
