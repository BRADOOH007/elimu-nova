"use client"

import { useState } from 'react'
import { AdminModal, AdminModalFooter, AdminFormField, adminInputClass } from "@/components/ui/admin-modal"
import { FileText, Loader2, CheckCircle, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface GenerateReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportType: string
  reportTitle: string
}

const GRADE_OPTIONS = ['PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
const TERM_OPTIONS = ['Term 1', 'Term 2', 'Term 3']
const FORMAT_OPTIONS = [
  { value: 'PDF', label: 'PDF Document (.pdf)' },
  { value: 'XLSX', label: 'Spreadsheet (.xlsx)' },
  { value: 'CSV', label: 'CSV File (.csv)' },
]

export default function GenerateReportModal({ isOpen, onClose, reportType, reportTitle }: GenerateReportModalProps) {
  const [form, setForm] = useState({ grade: '', stream: '', term: 'Term 1', year: String(new Date().getFullYear()), format: 'PDF', aiInsights: false })
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')
  const { toast } = useToast()

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/school-admin/reports/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, reportType }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.downloadUrl) {
          setDownloadUrl(data.downloadUrl)
        } else {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          setDownloadUrl(url)
          const a = document.createElement('a'); a.href = url; a.download = `${reportTitle.replace(/\s+/g,'_')}_${form.term}_${form.year}.${form.format.toLowerCase()}`; a.click()
          toast({ title: 'Generated', description: 'Report downloaded successfully' })
          onClose()
        }
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed', variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', description: 'Network error', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <AdminModal open={isOpen} onClose={onClose} title="Generate Report" subtitle={reportTitle} icon={<FileText />} size="md"
      footer={downloadUrl ? (
        <div className="flex gap-2 w-full justify-end">
          <a href={downloadUrl} download className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Again
          </a>
          <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">Close</button>
        </div>
      ) : (
        <AdminModalFooter onCancel={onClose} submitLabel="Generate Report" loading={loading} onSubmit={handleGenerate} type="button" />
      )}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <AdminFormField label="Target Grade" htmlFor="gen-grade">
            <select id="gen-grade" value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} className={adminInputClass}>
              <option value="">All Grades</option>
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </AdminFormField>
          <AdminFormField label="Stream (Optional)" htmlFor="gen-stream">
            <input id="gen-stream" type="text" autoComplete="off" placeholder="e.g., Blue, East"
              value={form.stream} onChange={e => setForm(p => ({ ...p, stream: e.target.value }))} className={adminInputClass} />
          </AdminFormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AdminFormField label="Academic Term" htmlFor="gen-term">
            <select id="gen-term" value={form.term} onChange={e => setForm(p => ({ ...p, term: e.target.value }))} className={adminInputClass}>
              {TERM_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </AdminFormField>
          <AdminFormField label="Year" htmlFor="gen-year">
            <input id="gen-year" type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} className={adminInputClass} />
          </AdminFormField>
        </div>
        <AdminFormField label="Export Format" htmlFor="gen-format">
          <div className="grid grid-cols-3 gap-2">
            {FORMAT_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, format: opt.value }))}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${form.format === opt.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </AdminFormField>
        <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100">
          <div>
            <span className="text-sm font-medium text-slate-700">Include AI Insights</span>
            <p className="text-xs text-slate-500 mt-0.5">Auto-generate strengths & improvement areas narrative</p>
          </div>
          <button type="button" role="switch" aria-checked={form.aiInsights}
            onClick={() => setForm(p => ({ ...p, aiInsights: !p.aiInsights }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.aiInsights ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition transform ${form.aiInsights ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>
        {loading && (
          <div className="text-center py-4 text-sm text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Generating {reportTitle}... this may take a moment
          </div>
        )}
        {downloadUrl && (
          <div className="text-center py-4 text-sm text-emerald-600 bg-emerald-50 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> Report generated successfully
          </div>
        )}
      </div>
    </AdminModal>
  )
}
