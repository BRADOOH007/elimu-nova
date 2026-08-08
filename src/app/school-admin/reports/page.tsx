'use client'

import { useState, useEffect } from 'react'
import {
  Search, Download, FileText, FileSpreadsheet, Users, ClipboardCheck,
  CreditCard, Clock, BarChart3, BookOpen, GraduationCap, UserCheck,
  AlertTriangle, Trash2, Eye, RefreshCw, Plus, ArrowUpRight, Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { confirmToast } from '@/lib/confirm-toast'
import GenerateReportModal from '@/components/modals/generate-report-modal'

const TEMPLATES = [
  { id: 'broadsheet',  title: 'CBC Formative Assessment Broadsheet',  desc: 'Full grid of EE, ME, AE, BE scores across all learning areas per grade stream.', formats: 'PDF, XLSX',  icon: BarChart3,   color: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  { id: 'report-cards', title: 'Termly Student Progress Report Cards', desc: 'Bulk batch KICD report cards with teacher remarks and parent signature lines.',    formats: 'Zip (PDFs)',  icon: BookOpen,    color: 'from-emerald-500 to-teal-500',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { id: 'teacher-audit',title: 'Teacher Grading & Assessment Audit',   desc: 'Completed vs. pending rubric entries per teacher and learning area.',            formats: 'PDF, CSV',   icon: ClipboardCheck, color: 'from-amber-500 to-orange-500',  bg: 'bg-amber-50', text: 'text-amber-700' },
  { id: 'attendance',  title: 'Student Attendance & Discipline Summary',desc: 'Class-by-class roll call, absenteeism flags, and behaviour tracking.',          formats: 'PDF, XLSX',  icon: UserCheck,   color: 'from-sky-500 to-cyan-500',     bg: 'bg-sky-50', text: 'text-sky-700' },
  { id: 'financial',   title: 'Financial Fee Collections & Balances',   desc: 'Termly fee statement, outstanding balances per grade, M-Pesa receipt log.',    formats: 'PDF, XLSX',  icon: CreditCard,  color: 'from-rose-500 to-pink-500',    bg: 'bg-rose-50', text: 'text-rose-700' },
]

const CATEGORIES = [
  { id: 'academic',   label: 'Academic & CBC',   icon: BarChart3 },
  { id: 'student',    label: 'Student & Class',   icon: Users },
  { id: 'teacher',    label: 'Teacher Audits',    icon: ClipboardCheck },
  { id: 'financial',  label: 'Financial & Ops',   icon: CreditCard },
  { id: 'archive',    label: 'Generated Archive', icon: Clock },
]

const TERMS = ['All Terms', 'Term 1', 'Term 2', 'Term 3']
const GRADES = ['All Classes', 'PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']

interface ArchivedReport {
  id: string; title: string; type: string; status: string; createdAt: string
  generatedByUser?: { firstName: string; lastName: string }
}

export default function ReportsPage() {
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('All Terms')
  const [grade, setGrade] = useState('All Classes')
  const [activeTab, setActiveTab] = useState('academic')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState({ type: '', title: '' })
  const [archive, setArchive] = useState<ArchivedReport[]>([])
  const [loadingArchive, setLoadingArchive] = useState(true)
  const { toast } = useToast()

  useEffect(() => { fetchArchive() }, [])

  const fetchArchive = async () => {
    setLoadingArchive(true)
    try {
      const res = await fetch('/api/school-admin/reports?limit=50')
      if (res.ok) setArchive((await res.json()).reports || [])
    } catch {} finally { setLoadingArchive(false) }
  }

  const handleDelete = async (id: string) => {
    if (!(await confirmToast({ title: 'Delete this report?' }))) return
    try {
      await fetch(`/api/school-admin/reports/${id}`, { method: 'DELETE' })
      setArchive(prev => prev.filter(r => r.id !== id))
      toast({ title: 'Deleted', description: 'Report removed' })
    } catch { toast({ title: 'Error', description: 'Failed', variant: 'destructive' }) }
  }

  const openModal = (type: string, title: string) => { setModalType({ type, title }); setModalOpen(true) }

  const filteredArchive = archive.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reporting Suite</h1>
          <p className="text-sm text-slate-500 mt-1">Generate CBC-compliant academic, financial, and operational reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openModal('batch', 'Batch Report Generation')}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> Batch PDF Generation
          </button>
          <button onClick={() => toast({ title: 'Coming Soon', description: 'Excel export will be available in the next update' })}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Export to Excel
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search templates & generated reports..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition" />
        </div>
        <select value={term} onChange={e => setTerm(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
          {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={grade} onChange={e => setGrade(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none">
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === cat.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            <cat.icon className="w-3.5 h-3.5" /> {cat.label}
          </button>
        ))}
      </div>

      {/* Template Cards Grid */}
      {activeTab !== 'archive' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.filter(t => {
            if (activeTab === 'academic') return t.id === 'broadsheet' || t.id === 'report-cards'
            if (activeTab === 'student') return t.id === 'attendance' || t.id === 'report-cards'
            if (activeTab === 'teacher') return t.id === 'teacher-audit'
            if (activeTab === 'financial') return t.id === 'financial'
            return true
          }).map(t => (
            <div key={t.id} className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition group`}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.color}`} />
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.bg} ${t.text}`}>
                    <t.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{t.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{t.formats}</span>
                  <button onClick={() => openModal(t.id, t.title)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition bg-gradient-to-r ${t.color} text-white hover:opacity-90 shadow-sm flex items-center gap-1.5 group-hover:scale-105`}>
                    <Plus className="w-3 h-3" /> Generate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Archive Table */}
      {activeTab === 'archive' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Generated Archive</h2>
              <p className="text-xs text-slate-500">Previously generated reports — click to download</p>
            </div>
            <button onClick={fetchArchive} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          {loadingArchive ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : filteredArchive.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No reports generated yet</p>
              <p className="text-xs text-slate-400 mt-1">Generate a report from the templates above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-500"><th className="py-3 px-5">Report Name</th><th className="py-3 px-5">Category</th><th className="py-3 px-5">Generated</th><th className="py-3 px-5">Format</th><th className="py-3 px-5">By</th><th className="py-3 px-5 text-right">Actions</th></tr></thead>
                <tbody>
                  {filteredArchive.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 font-medium text-slate-800">{r.title}</td>
                      <td className="py-3 px-5 text-slate-500">{r.type?.toLowerCase()}</td>
                      <td className="py-3 px-5 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-5">
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-indigo-100 text-indigo-700">PDF</span>
                      </td>
                      <td className="py-3 px-5 text-slate-500">{r.generatedByUser ? `${r.generatedByUser.firstName} ${r.generatedByUser.lastName}` : 'System'}</td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a href={`/api/school-admin/reports/${r.id}/download?format=PDF`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"><Download className="w-4 h-4" /></a>
                          <button onClick={() => window.open(`/api/school-admin/reports/${r.id}/download?format=PDF`, '_blank')}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalOpen && <GenerateReportModal isOpen={modalOpen} onClose={() => { setModalOpen(false); fetchArchive() }} reportType={modalType.type} reportTitle={modalType.title} />}
    </div>
  )
}
