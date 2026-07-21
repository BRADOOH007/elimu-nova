'use client'

import { useEffect, useState } from 'react'
import { ImageIcon, Loader2, Database, ExternalLink } from 'lucide-react'

interface BankImage {
  id: string
  url: string
  prompt: string
  topic: string
  subject?: string
  grade?: string
  usageCount: number
  createdAt: string
}

interface ImageBankDisplayProps {
  contextType: 'lesson_plan' | 'scheme_of_work' | 'presentation'
  contextId: string
  className?: string
  compact?: boolean
}

export default function ImageBankDisplay({ contextType, contextId, className = '', compact = false }: ImageBankDisplayProps) {
  const [images, setImages] = useState<BankImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!contextId) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/ai/images/context?contextType=${contextType}&contextId=${contextId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false))
  }, [contextType, contextId])

  if (loading) return (
    <div className={`flex items-center gap-2 text-sm text-slate-400 ${className}`}>
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Loading images...
    </div>
  )

  if (images.length === 0) return null

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Database className="h-3.5 w-3.5" />
          Attached Images ({images.length})
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map(img => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors"
            >
              <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Database className="h-4 w-4 text-blue-500" />
        Images from Shared Bank ({images.length})
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map(img => (
          <div key={img.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 transition-all">
            <a href={img.url} target="_blank" rel="noopener noreferrer" className="block">
              <div className="aspect-square bg-slate-50 flex items-center justify-center">
                <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-2.5 space-y-1">
                <p className="text-[10px] text-slate-600 line-clamp-2 leading-tight">{img.prompt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">{img.usageCount} uses</span>
                  <ExternalLink className="h-3 w-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
