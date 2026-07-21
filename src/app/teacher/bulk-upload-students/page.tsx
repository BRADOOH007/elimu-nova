"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Download, Users, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface UploadResult {
  success: boolean
  student?: { name: string; email: string; password: string }
  error?: string
  row?: number
}

export default function BulkUploadStudentsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<UploadResult[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setResults(null)
    try {
      const csvText = await file.text()
      const res = await fetch('/api/teacher/bulk-upload-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data.results || [])
        toast({ title: `Uploaded ${data.created || 0} students` })
      } else {
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally { setUploading(false) }
  }

  const downloadTemplate = () => {
    const csv = `firstName,lastName,email,phone,classId\nJohn,Doe,john.doe@example.com,0712345678,class-id-here\nJane,Smith,jane.smith@example.com,0798765432,class-id-here`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'student-upload-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const successCount = results?.filter(r => r.success).length || 0
  const failCount = results?.filter(r => !r.success).length || 0

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Upload className="w-6 h-6 text-blue-600" /> Bulk Upload Students</h1>
        <p className="text-sm text-gray-600">Upload multiple students at once using a CSV file</p>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" /> Download CSV Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
            {file ? (
              <div className="space-y-2">
                <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                <Button size="sm" variant="outline" onClick={() => { setFile(null); setResults(null) }}>Change File</Button>
              </div>
            ) : (
              <div className="space-y-2 cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Upload className="w-12 h-12 text-blue-400 mx-auto" />
                <p className="font-medium text-blue-600">Click or drop a CSV file here</p>
                <p className="text-sm text-gray-500">CSV format with headers: firstName, lastName, email, phone, classId</p>
              </div>
            )}
          </div>

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? 'Uploading...' : 'Upload Students'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="border-0 shadow">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Badge className="bg-green-100 text-green-800 text-sm"><CheckCircle className="w-4 h-4 mr-1" /> {successCount} Success</Badge>
              {failCount > 0 && <Badge className="bg-red-100 text-red-800 text-sm"><XCircle className="w-4 h-4 mr-1" /> {failCount} Failed</Badge>}
            </div>

            {failCount > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.filter(r => !r.success).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.row || '?'}</TableCell>
                      <TableCell className="text-red-600">{r.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {successCount > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="font-medium text-green-800 mb-2">Generated credentials for new students:</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.filter(r => r.success).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.student?.name}</TableCell>
                        <TableCell className="font-mono text-sm">{r.student?.email}</TableCell>
                        <TableCell className="font-mono text-sm text-amber-600">{r.student?.password}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
