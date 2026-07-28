'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertTriangle, Download, Loader2, Users, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props {
  isOpen:   boolean
  onClose:  () => void
  onSuccess: (count: number) => void
  classes?: { id: string; name: string; grade: string }[]
}

interface ParsedStudent { firstName: string; lastName: string; email?: string; grade?: string }

interface StudentResult {
  name: string; email: string; username?: string; password: string; status: 'created' | 'skipped'; reason?: string
}

interface UploadResponse {
  created: number; skipped: number; total: number; results: StudentResult[]; message?: string
}

export default function BulkStudentUploadModal({ isOpen, onClose, onSuccess, classes = [] }: Props) {
  const [step, setStep]           = useState<'upload' | 'preview' | 'done'>('upload')
  const [parsed, setParsed]       = useState<ParsedStudent[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [uploading, setUploading] = useState(false)
  const [response, setResponse]   = useState<UploadResponse | null>(null)
  const [error, setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  if (!isOpen) return null

  const parseCSV = (text: string): ParsedStudent[] => {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
    const getCol  = (row: string[], names: string[]) => {
      const idx = headers.findIndex(h => names.some(n => h.includes(n)))
      return idx >= 0 ? (row[idx] || '').trim().replace(/"/g, '') : ''
    }

    return lines.slice(1).map(line => {
      const cols = line.split(',')
      const firstName = getCol(cols, ['first', 'fname']) || getCol(cols, ['name'])?.split(' ')[0] || ''
      const lastName  = getCol(cols, ['last', 'surname', 'lname']) || getCol(cols, ['name'])?.split(' ').slice(1).join(' ') || ''
      const email     = getCol(cols, ['email', 'mail'])
      const grade     = getCol(cols, ['grade', 'class', 'level', 'form'])
      return { firstName, lastName, email: email || undefined, grade: grade || undefined }
    }).filter(s => s.firstName)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (!file.name.endsWith('.csv')) { setError('Please upload a CSV file'); return }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const students = parseCSV(text)
      if (students.length === 0) { setError('No valid students found. Check your CSV format.'); return }
      if (students.length > 500) { setError('Maximum 500 students per upload'); return }
      setParsed(students)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const upload = async () => {
    setUploading(true)
    try {
      const res  = await fetch('/api/school-admin/students/bulk', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ students: parsed, classId: selectedClass || null }),
      })
      const data: UploadResponse = await res.json()
      setResponse(data)
      setStep('done')
      if (data.created > 0) onSuccess(data.created)
    } catch {
      setError('Upload failed. Please try again.')
    } finally { setUploading(false) }
  }

  const downloadTemplate = () => {
    const csv = 'firstName,lastName,email,grade\nJohn,Doe,john.doe@school.com,Grade 7\nJane,Smith,,Grade 8'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'student_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCredentials = () => {
    if (!response) return
    const created = response.results.filter(r => r.status === 'created')
    const csv = `Name,Username,Email,Password\n${created.map(r => `${r.name},${r.username || ''},${r.email},${r.password}`).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'student-credentials.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => { setStep('upload'); setParsed([]); setResponse(null); setError(''); if (fileRef.current) fileRef.current.value = '' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Bulk Student Upload</h2>
              <p className="text-xs text-slate-400">Import up to 500 students from a CSV file</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1 — Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Upload a CSV with columns: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">firstName, lastName, email, grade</code></p>
                <button onClick={downloadTemplate} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Download className="h-3 w-3" /> Template
                </button>
              </div>

              <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Click to upload CSV</p>
                <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              </label>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {classes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign to class (optional)</label>
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">No class assignment</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{parsed.length} students ready to import</p>
                <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-700">Change file</button>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {['#', 'First Name', 'Last Name', 'Email', 'Grade'].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.slice(0, 50).map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{s.firstName}</td>
                        <td className="px-3 py-2 text-slate-700">{s.lastName}</td>
                        <td className="px-3 py-2 text-slate-500">{s.email || <span className="text-slate-300">auto-generated</span>}</td>
                        <td className="px-3 py-2 text-slate-500">{s.grade || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 50 && (
                  <p className="text-center text-xs text-slate-400 py-2">...and {parsed.length - 50} more</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 h-11 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Back
                </button>
                <button onClick={upload} disabled={uploading}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Import {parsed.length} Students</>}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Done */}
          {step === 'done' && response && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{response.created} students imported!</p>
                {response.skipped > 0 && <p className="text-sm text-slate-500 mt-1">{response.skipped} skipped</p>}
              </div>

              {/* Show credentials for created students */}
              {response.results.filter(r => r.status === 'created').length > 0 && (
                <div className="text-left">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Generated Credentials</p>
                    <button
                      onClick={downloadCredentials}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> Download CSV
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Name</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Username</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500">Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {response.results.filter(r => r.status === 'created').map((r, i) => (
                          <tr key={i} className="hover:bg-white">
                            <td className="px-3 py-1.5 font-medium text-slate-800">{r.name}</td>
                            <td className="px-3 py-1.5 text-slate-500 font-mono">@{r.username || r.email.replace('@student.local', '')}</td>
                            <td className="px-3 py-1.5">
                              <code className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                {r.password}
                              </code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {response.results.filter(r => r.status === 'skipped').length > 0 && (
                <div className="text-left bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 max-h-32 overflow-y-auto">
                  {response.results.filter(r => r.status === 'skipped').slice(0, 10).map((r, i) => (
                    <p key={i} className="mb-1">{r.name}: {r.reason}</p>
                  ))}
                </div>
              )}

              <button onClick={onClose}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
