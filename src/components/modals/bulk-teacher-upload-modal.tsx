'use client'

import { useState, useRef } from 'react'
import { Upload, Download, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'

interface ImportResult {
  firstName: string; lastName: string; email: string
  username: string; password: string
  status: 'created' | 'exists' | 'error'
  error?: string
}

interface BulkTeacherUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (count: number) => void
}

export default function BulkTeacherUploadModal({ isOpen, onClose, onSuccess }: BulkTeacherUploadModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload')
  const [csvText, setCsvText] = useState('')
  const [parsedRows, setParsedRows] = useState<Array<Record<string, string>>>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [showCredentials, setShowCredentials] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const downloadTemplate = () => {
    const csv = 'firstName,lastName,email\nJohn,Wanjiku,john@school.ac.ke\nJane,Kamau,jane@school.ac.ke'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'teacher_upload_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvText(text)
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return
      const headerRow = lines[0].split(',').map(h => h.trim().toLowerCase())
      const requiredHeaders = ['firstname', 'lastname', 'email']
      const hasRequired = requiredHeaders.every(h => headerRow.some(hdr => hdr.includes(h)))
      if (!hasRequired) {
        setHeaders(headerRow)
        setParsedRows([])
        return
      }
      setHeaders(headerRow)
      const rows = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        const row: Record<string, string> = {}
        headerRow.forEach((h, i) => { row[h] = values[i]?.trim() || '' })
        return row
      }).filter(r => r.firstname || r.lastname || Object.values(r).some(v => v))
      setParsedRows(rows)
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      const teachers = parsedRows.map(r => ({
        firstName: r.firstname || '',
        lastName: r.lastname || '',
        email: r.email || '',
      }))
      const res = await fetch('/api/school-admin/teachers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachers }),
      })
      const data = await res.json()
      setResults(data.results || [])
      setStep('results')
      onSuccess?.(data.created || 0)
    } catch (e) {
      console.error('Upload failed:', e)
    } finally { setUploading(false) }
  }

  const copyCredentials = () => {
    const text = results.filter(r => r.status === 'created')
      .map(r => `${r.firstName} ${r.lastName},${r.email},${r.username},${r.password}`)
      .join('\n')
    navigator.clipboard.writeText(`Name,Email,Username,Password\n${text}`).catch(() => {})
  }

  const downloadCredentials = () => {
    const text = results.filter(r => r.status === 'created')
      .map(r => `${r.firstName} ${r.lastName},${r.email},${r.username},${r.password}`)
      .join('\n')
    const blob = new Blob([`Name,Email,Username,Password\n${text}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'teacher_credentials.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setStep('upload')
    setCsvText('')
    setParsedRows([])
    setResults([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white border-0 shadow-2xl p-0">
        <DialogHeader className="border-b border-slate-200">
          <DialogTitle className="text-lg font-bold text-slate-900">Bulk Upload Teachers</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">Import teachers from a CSV file (max 500 per batch)</DialogDescription>
        </DialogHeader>

        <DialogBody className="mt-1">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">CSV Format</p>
                <p className="text-xs text-blue-600">Upload a CSV file with columns: <code className="bg-blue-100 px-1 rounded">firstName</code>, <code className="bg-blue-100 px-1 rounded">lastName</code>, <code className="bg-blue-100 px-1 rounded">email</code>. Max 500 teachers per batch.</p>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
                <Upload className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-600">Drag and drop a CSV file, or click to browse</p>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choose File</Button>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-3.5 w-3.5 mr-1.5" />Download Template</Button>
                </div>
              </div>

              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">{parsedRows.length} teachers found</p>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>{headers.map(h => <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            {headers.map(h => <td key={h} className="px-3 py-1.5 text-slate-700">{r[h] || '-'}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedRows.length > 10 && <p className="text-xs text-slate-400 text-center py-2">... and {parsedRows.length - 10} more</p>}
                  </div>
                  <Button onClick={handleUpload} disabled={uploading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {uploading ? 'Importing...' : `Import ${parsedRows.length} Teachers`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{results.filter(r => r.status === 'created').length}</p>
                  <p className="text-xs text-green-600">Created</p>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{results.filter(r => r.status === 'error').length}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>

              <button onClick={() => setShowCredentials(!showCredentials)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Teacher Credentials {showCredentials ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {showCredentials && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copyCredentials} className="text-xs">Copy All</Button>
                    <Button size="sm" variant="outline" onClick={downloadCredentials} className="text-xs"><Download className="h-3 w-3 mr-1" />Download</Button>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2">Name</th>
                          <th className="text-left px-3 py-2">Email</th>
                          <th className="text-left px-3 py-2">Username</th>
                          <th className="text-left px-3 py-2">Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.filter(r => r.status === 'created').map((r, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 font-medium">{r.firstName} {r.lastName}</td>
                            <td className="px-3 py-1.5 text-slate-500">{r.email || '-'}</td>
                            <td className="px-3 py-1.5 font-mono text-blue-600">{r.username}</td>
                            <td className="px-3 py-1.5 font-mono text-green-700">{r.password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button onClick={handleClose} className="w-full">Done</Button>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current); current = '' }
    else current += ch
  }
  result.push(current)
  return result
}
