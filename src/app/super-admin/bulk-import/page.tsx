'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  ArrowLeft,
  Building2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ImportRow {
  row: number
  name: string
  email: string
  code?: string
  address?: string
  phone?: string
  status: 'pending' | 'valid' | 'error'
  errors: string[]
}

export default function BulkImportPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importType, setImportType] = useState('schools')
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; error: string }[] } | null>(null)

  const downloadTemplate = () => {
    const headers = importType === 'schools'
      ? ['name', 'email', 'code', 'address', 'phone', 'city', 'country']
      : ['firstName', 'lastName', 'email', 'role', 'schoolCode']
    const csv = [headers.join(','), ''].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${importType}_template.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        alert('CSV must have a header row and at least one data row.')
        return
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const rows: ImportRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim())
        const row: ImportRow = {
          row: i + 1,
          name: vals[0] || '',
          email: vals[1] || '',
          code: vals[2] || undefined,
          address: vals[3] || undefined,
          phone: vals[4] || undefined,
          status: 'valid',
          errors: [],
        }
        if (!row.name) { row.errors.push('Name is required'); row.status = 'error' }
        if (!row.email) { row.errors.push('Email is required'); row.status = 'error' }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) { row.errors.push('Invalid email format'); row.status = 'error' }
        rows.push(row)
      }
      setParsedRows(rows)
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  const runImport = async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/super-admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          rows: parsedRows.filter(r => r.status === 'valid').map(r => ({
            name: r.name, email: r.email, code: r.code, address: r.address, phone: r.phone,
          })),
        }),
      })
      const data = await res.json()
      setImportResult(data)
      if (data.success > 0) setParsedRows([])
    } catch {
      alert('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsedRows.filter(r => r.status === 'valid').length
  const errorCount = parsedRows.filter(r => r.status === 'error').length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-4 w-4 text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bulk Import</h1>
            <p className="text-slate-500 text-sm">Import schools or users via CSV</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Settings</CardTitle>
          <CardDescription>Choose the type of data to import and upload your CSV file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Import Type</Label>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schools">Schools</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="mt-5">
              <Download className="h-4 w-4 mr-2" /> Download Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">Drop CSV file here or click to browse</p>
            <p className="text-sm text-slate-400 mt-1">Download the template above for the correct format</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Select File
            </Button>
          </div>
        </CardContent>
      </Card>

      {parsedRows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview ({parsedRows.length} rows)</CardTitle>
                <CardDescription>
                  <span className="text-green-600">{validCount} valid</span>
                  {errorCount > 0 && <span className="text-red-600 ml-2">{errorCount} with errors</span>}
                </CardDescription>
              </div>
              <Button onClick={runImport} disabled={importing || validCount === 0} className="edugenius-button">
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {importing ? 'Importing...' : `Import ${validCount} Records`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map(r => (
                    <TableRow key={r.row} className={r.status === 'error' ? 'bg-red-50' : ''}>
                      <TableCell className="text-xs text-slate-400">{r.row}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className="text-sm text-slate-500">{r.code || '-'}</TableCell>
                      <TableCell>
                        {r.status === 'valid' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {r.errors.map((e, i) => (
                          <p key={i} className="text-xs text-red-600">{e}</p>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{importResult.success}</p>
                <p className="text-sm text-green-600">Imported</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{importResult.failed}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-sm text-red-600 space-y-1">
                {importResult.errors.map((e, i) => (
                  <p key={i}>Row {e.row}: {e.error}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-medium text-slate-700 ${className || ''}`}>{children}</p>
}
