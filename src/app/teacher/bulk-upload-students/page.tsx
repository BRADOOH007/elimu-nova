"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Download, Users, CheckCircle, XCircle, Copy, FileSpreadsheet, Table as TableIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface StudentResult {
  name: string
  email: string
  password: string
  status: 'created' | 'skipped'
  reason?: string
}

interface UploadResponse {
  created: number
  skipped: number
  total: number
  results: StudentResult[]
}

export default function BulkUploadStudentsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [response, setResponse] = useState<UploadResponse | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setResponse(null)
    try {
      const csvText = await file.text()
      const res = await fetch('/api/teacher/bulk-upload-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      })
      const data = await res.json()
      if (res.ok) {
        setResponse(data)
        toast({ title: `${data.created} students created`, description: `${data.skipped} skipped, ${data.total} total` })
      } else {
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally { setUploading(false) }
  }

  const downloadTemplate = () => {
    const csv = `firstName,lastName,email,phone,grade,admission\nJohn,Doe,john.doe@example.com,0712345678,Grade 7,ADM001\nJane,Smith,,0798765432,Grade 7,ADM002`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'student-upload-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCredentials = () => {
    if (!response) return
    const created = response.results.filter(r => r.status === 'created')
    const csv = `Name,Email,Password\n${created.map(r => `${r.name},${r.email},${r.password}`).join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'student-credentials.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const copyAllCredentials = async () => {
    if (!response) return
    const created = response.results.filter(r => r.status === 'created')
    const text = created.map(r => `${r.name}\t${r.email}\t${r.password}`).join('\n')
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copied!', description: `${created.length} credentials copied to clipboard` })
  }

  const created = response?.results.filter(r => r.status === 'created') || []
  const failed = response?.results.filter(r => r.status === 'skipped') || []

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Upload className="w-6 h-6 text-blue-600" /> Bulk Upload Students
        </h1>
        <p className="text-sm text-gray-500">Upload multiple students at once using a CSV file. Smart detection handles most formats.</p>
      </div>

      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={downloadTemplate} className="text-sm">
              <Download className="w-4 h-4 mr-2" /> Template
            </Button>
            <span className="text-xs text-gray-400">Headers: firstName, lastName, email, phone, grade, admission</span>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
            onClick={() => !file && fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
            {file ? (
              <div className="space-y-2">
                <FileSpreadsheet className="w-10 h-10 text-green-500 mx-auto" />
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB &middot; {response ? `${response.total} rows` : 'ready'}</p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setFile(null); setResponse(null) }} className="text-xs">
                    Change
                  </Button>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUpload() }} disabled={uploading} className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                    {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                    Upload
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-medium text-gray-700">Drop a CSV file here or click to browse</p>
                <p className="text-xs text-gray-400">Headers auto-detected. Supports firstName/lastName, name, email, phone, grade, admission</p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="flex items-center gap-3 justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Processing students...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {response && (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 space-y-5">
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-green-100 text-green-800 border border-green-200 text-sm px-3 py-1.5">
                <CheckCircle className="w-4 h-4 mr-1.5" /> {response.created} Created
              </Badge>
              {response.skipped > 0 && (
                <Badge className="bg-red-100 text-red-800 border border-red-200 text-sm px-3 py-1.5">
                  <XCircle className="w-4 h-4 mr-1.5" /> {response.skipped} Skipped
                </Badge>
              )}
              <Badge variant="outline" className="text-gray-600 text-sm px-3 py-1.5">
                <Users className="w-4 h-4 mr-1.5" /> {response.total} Total
              </Badge>
            </div>

            {/* Actions */}
            {created.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={downloadCredentials} className="text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Credentials
                </Button>
                <Button size="sm" variant="outline" onClick={copyAllCredentials} className="text-xs">
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy All
                </Button>
              </div>
            )}

            {/* Created Students */}
            {created.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Created Students
                </h3>
                <div className="rounded-lg border border-gray-200 overflow-hidden max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-gray-600">#</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Email</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Password</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {created.map((r, i) => (
                        <TableRow key={i} className="hover:bg-gray-50">
                          <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
                          <TableCell className="text-sm font-medium text-gray-900">{r.name}</TableCell>
                          <TableCell className="text-sm font-mono text-gray-600">{r.email}</TableCell>
                          <TableCell>
                            <code className="text-sm font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                              {r.password}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Failed */}
            {failed.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" /> Skipped Rows
                </h3>
                <div className="rounded-lg border border-red-200 bg-red-50/30 overflow-hidden max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-red-50">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-red-700">Row</TableHead>
                        <TableHead className="text-xs font-semibold text-red-700">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-red-700">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failed.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
                          <TableCell className="text-sm text-gray-900">{r.name}</TableCell>
                          <TableCell className="text-sm text-red-600">{r.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
