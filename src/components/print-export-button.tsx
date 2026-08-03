'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

interface PrintExportButtonProps {
  /** API endpoint to POST to for export (e.g., /api/export/lesson-plan) */
  exportUrl?: string
  /** JSON body to send with the export request */
  exportBody?: Record<string, any>
  /** Fallback: just call window.print() */
  usePrintFallback?: boolean
  /** Label text */
  label?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function PrintExportButton({
  exportUrl,
  exportBody,
  usePrintFallback,
  label = 'Export PDF',
  variant = 'outline',
  size = 'sm',
}: PrintExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (usePrintFallback) {
      window.print()
      return
    }

    if (!exportUrl) return

    setLoading(true)
    try {
      const res = await fetch(exportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportBody || {}),
      })

      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        // Try to extract filename from Content-Disposition
        const disposition = res.headers.get('content-disposition') || ''
        let fileName = ''
        const fnMatch = disposition.match(/filename="?([^";]+)"?/i)
        if (fnMatch) fileName = fnMatch[1]

        if (contentType.includes('application/pdf')) {
          // PDF: trigger direct download
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName || 'export.pdf'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        } else if (contentType.includes('application/msword') || contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml')) {
          // Word docs: trigger direct download
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName || 'export.doc'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        } else if (contentType.includes('text/html')) {
          // HTML: download as .html file instead of opening a new tab
          const html = await res.text()
          const blob = new Blob([html], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName || 'export.html'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        } else if (contentType.includes('application/vnd.openxmlformats-officedocument.presentationml') || contentType.includes('application/octet-stream')) {
          // PPTX: trigger download
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName || 'export.pptx'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        } else {
          // JSON response
          const data = await res.json()
          if (data.url) window.open(data.url, '_blank')
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Export failed' }))
        console.error('Export error:', err.error)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
      {loading ? 'Exporting...' : label}
    </Button>
  )
}
