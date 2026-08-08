"use client"

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, FileText, Loader2, CheckCircle, X, AlertCircle, Eye, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UploadPreviewProps {
  type: 'timetable' | 'calendar'
  onClose: () => void
  onSuccess: (count: number) => void
}

export default function UploadPreviewModal({ type, onClose, onSuccess }: UploadPreviewProps) {
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [replaceAll, setReplaceAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = async () => {
    if (!file && !textInput) { setError('Please select a file or paste calendar text'); return }
    setLoading(true); setError('')
    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      if (textInput) formData.append('text', textInput)
      formData.append('replaceAll', String(replaceAll))

      const endpoint = type === 'timetable'
        ? '/api/school-admin/upload-timetable'
        : '/api/school-admin/upload-calendar'

      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setPreview(data.preview || [])
        if (data.preview && data.preview.length > 0) {
          setStep('preview')
        } else {
          // Save directly
          toast({ title: 'Uploaded', description: `${data.count} entries saved` })
          onSuccess(data.count)
          onClose()
        }
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      if (textInput) formData.append('text', textInput)
      formData.append('replaceAll', 'true')

      const endpoint = type === 'timetable'
        ? '/api/school-admin/upload-timetable'
        : '/api/school-admin/upload-calendar'

      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Saved', description: `${data.count} entries imported` })
        onSuccess(data.count)
        onClose()
      }
    } catch { setError('Save failed') }
    finally { setLoading(false) }
  }

  const handleFileDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-slate-100 p-6">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              {type === 'timetable' ? <FileSpreadsheet className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Upload {type === 'timetable' ? 'Timetable' : 'Calendar'}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {type === 'timetable' ? 'Upload .xlsx timetable and auto-parse slots' : 'Upload .pdf calendar or paste event text'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
          {step === 'preview' ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Preview extracted data ({preview.length} entries):</p>
              <div className="max-h-60 overflow-y-auto space-y-1 bg-slate-50 rounded-xl p-3">
                {preview.slice(0, 15).map((item: any, i: number) => (
                  <div key={i} className="text-xs font-mono text-slate-700 p-1.5 bg-white rounded">
                    {item.grade || item.title} — {item.dayOfWeek || item.startDate?.split('T')[0]} — {item.subjectName || item.category}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFile(null); setTextInput(''); setStep('upload') }} className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">Cancel</button>
                <button onClick={handleSave} disabled={loading} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : <CheckCircle className="w-4 h-4 inline mr-1" />} Save to Database
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File upload zone */}
              <div onDragOver={e => e.preventDefault()} onDrop={handleFileDrop}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept={type === 'timetable' ? '.xlsx,.xls' : '.pdf'} className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">{file ? file.name : `Drop ${type === 'timetable' ? '.xlsx' : '.pdf'} file here or click to browse`}</p>
                <p className="text-xs text-slate-400 mt-1">{type === 'timetable' ? 'Supports .xlsx, .xls' : 'Supports .pdf'}</p>
              </div>

              {type === 'calendar' && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Or paste event text (one per line, dates in brackets):</p>
                  <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                    placeholder="Term 2 Opening — 4TH MAY 2026&#10;Mid-Term Break — 16TH-18TH JUNE 2026&#10;KPSEA Exams — 28TH OCT-1ST NOV 2026"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none" rows={4} />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={replaceAll} onChange={e => setReplaceAll(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                <span className="text-sm text-slate-600">Replace all existing entries</span>
              </label>

              {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg"><AlertCircle className="w-4 h-4" />{error}</div>}

              <button onClick={handleUpload} disabled={loading || (!file && !textInput)}
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Parsing...</> : <><Eye className="w-4 h-4" />Preview & Confirm</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
