'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, File } from 'lucide-react'

interface UploadedDoc {
  name: string
  url: string
  docType: string
}

interface DocumentUploadButtonProps {
  docType: 'lesson-plan' | 'scheme-of-work' | 'curriculum' | 'general'
  label?: string
  onUploaded?: (doc: UploadedDoc) => void
}

export default function DocumentUploadButton({
  docType,
  label,
  onUploaded,
}: DocumentUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<UploadedDoc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const buttonLabel = label || (
    docType === 'lesson-plan' ? 'Upload Lesson Plan' :
    docType === 'scheme-of-work' ? 'Upload Scheme of Work' :
    docType === 'curriculum' ? 'Upload Curriculum' :
    'Upload Document'
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setUploaded(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docType', docType)

      const res = await fetch('/api/teacher/upload-document', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      const doc: UploadedDoc = { name: data.name, url: data.url, docType: data.docType }
      setUploaded(doc)
      onUploaded?.(doc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="bg-white border-dashed border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 transition-colors"
      >
        <Upload className="w-4 h-4 mr-2" />
        {buttonLabel}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {buttonLabel}
            </DialogTitle>
            <DialogDescription>
              Upload your existing document and the AI will use it as context when generating lesson plans, schemes of work, assignments, and curriculum content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Upload area */}
            <label className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors
              ${uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-blue-600 font-medium">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Click to choose a file</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, Word (.doc/.docx), text, or image — up to 20MB</p>
                  </div>
                </>
              )}
            </label>

            {/* Success */}
            {uploaded && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">Uploaded successfully</p>
                  <p className="text-sm text-green-700 truncate">{uploaded.name}</p>
                  <p className="text-xs text-green-600 mt-1">
                    The AI will now use this document as context when you generate content.
                  </p>
                </div>
                <button onClick={() => setUploaded(null)} className="text-green-400 hover:text-green-600 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Upload failed</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-1">How this works</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Upload your existing {docType.replace('-', ' ')} document</li>
                <li>• The AI reads and understands your curriculum structure</li>
                <li>• When you generate new content, it follows your document's format and topics</li>
                <li>• Works great for national curriculum, school schemes, and custom formats</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {uploaded ? 'Done' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
