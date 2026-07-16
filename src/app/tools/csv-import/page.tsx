'use client'

import { useToast } from '@/hooks/use-toast'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Loader2,
  FileSpreadsheet,
  Database,
} from 'lucide-react'

const IMPORT_TYPES = [
  { value: 'students', label: 'Students', requiredHeaders: ['firstName', 'lastName', 'email', 'grade'] },
  { value: 'teachers', label: 'Teachers', requiredHeaders: ['firstName', 'lastName', 'email', 'subject'] },
  { value: 'classes', label: 'Classes', requiredHeaders: ['name', 'grade', 'subject'] },
  { value: 'assignments', label: 'Assignments', requiredHeaders: ['title', 'subject', 'grade'] },
]

interface ParsedRow {
  row: number
  data: Record<string, string>
  status: 'valid' | 'error'
  errors: string[]
}

export default function CsvImportPage() {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importType, setImportType] = useState(IMPORT_TYPES[0].value)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: { row: number; error: string }[] } | null>(null)

  const currentType = IMPORT_TYPES.find(t => t.value === importType)!

  const downloadTemplate = () => {
    const headers = currentType.requiredHeaders
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
        toast({ variant:'destructive', title:'Invalid CSV', description:'Must have a header row and at least one data row.' })
        return
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const rows: ParsedRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim())
        const data: Record<string, string> = {}
        const errors: string[] = []
        headers.forEach((h, hi) => { data[h] = vals[hi] || '' })
        // Validate required fields
        for (const req of currentType.requiredHeaders) {
          if (!data[req.toLowerCase()]) {
            errors.push(`Missing required field: ${req}`)
          }
        }
        rows.push({ row: i + 1, data, status: errors.length > 0 ? 'error' : 'valid', errors })
      }
      setParsedRows(rows)
      setResult(null)
    }
    reader.readAsText(file)
  }

  const runImport = async () => {
    setImporting(true)
    try {
      const res = await fetch(`/api/tools/csv-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          rows: parsedRows.filter(r => r.status === 'valid').map(r => r.data),
        }),
      })
      const data = await res.json()
      setResult(data)
      if (data.success > 0) setParsedRows([])
    } catch {
      toast({ variant:'destructive', title:'Import failed' })
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsedRows.filter(r => r.status === 'valid').length
  const errorCount = parsedRows.filter(r => r.status === 'error').length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
          <Database className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CSV Data Import</h1>
          <p className="text-slate-500 text-sm">Import students, teachers, classes, or assignments via CSV</p>
        </div>
      </div>

      {/* Import Config */}
      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
          <CardDescription>Select data type and upload CSV.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Data Type</p>
              <Select value={importType} onValueChange={v => { setImportType(v); setParsedRows([]); setResult(null) }}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPORT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="mt-5">
              <Download className="h-4 w-4 mr-2" /> Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">Drop CSV or click to browse</p>
            <p className="text-sm text-slate-400 mt-1">Required headers: {currentType.requiredHeaders.join(', ')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedRows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview ({parsedRows.length} rows)</CardTitle>
                <CardDescription>
                  <span className="text-green-600">{validCount} valid</span>
                  {errorCount > 0 && <span className="text-red-600 ml-2">{errorCount} errors</span>}
                </CardDescription>
              </div>
              <Button onClick={runImport} disabled={importing || validCount === 0}>
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
                    {currentType.requiredHeaders.map(h => <TableHead key={h}>{h}</TableHead>)}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map(r => (
                    <TableRow key={r.row} className={r.status === 'error' ? 'bg-red-50' : ''}>
                      <TableCell className="text-xs text-slate-400">{r.row}</TableCell>
                      {currentType.requiredHeaders.map(h => (
                        <TableCell key={h}>{r.data[h.toLowerCase()] || '-'}</TableCell>
                      ))}
                      <TableCell>
                        {r.status === 'valid' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600">{r.errors[0]}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{result.success}</p>
                <p className="text-sm text-green-600">Imported</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="text-sm text-red-600 space-y-1">
                {result.errors.map((e, i) => <p key={i}>Row {e.row}: {e.error}</p>)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
