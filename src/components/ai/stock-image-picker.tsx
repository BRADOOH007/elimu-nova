'use client'

import { useState, useEffect } from 'react'
import { Search, X, ImageIcon, Loader2, ExternalLink } from 'lucide-react'

export interface StockImage {
  id: string
  url: string
  thumbnailUrl: string
  source: 'unsplash' | 'wikimedia'
  license: string
  attribution: string
  pageUrl?: string
}

interface StockImagePickerProps {
  open: boolean
  onClose: () => void
  initialQuery: string
  onSelect: (url: string, image: StockImage) => void
}

export default function StockImagePicker({ open, onClose, initialQuery, onSelect }: StockImagePickerProps) {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<StockImage[]>([])
  const [source, setSource] = useState('')
  const [searching, setSearching] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setQuery(initialQuery)
      if (initialQuery.trim()) {
        search(initialQuery)
      } else {
        setImages([])
        setSource('')
      }
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuery])

  const search = async (q?: string) => {
    const term = (q ?? query).trim()
    if (!term) return
    setSearching(true)
    setError('')
    setImages([])
    setSource('')
    try {
      const res = await fetch(`/api/ai/images/search?q=${encodeURIComponent(term)}&limit=18`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setImages(data.images || [])
      setSource(data.source || '')
      if (!data.images?.length) setError('No images found. Try a different search term.')
    } catch (e: any) {
      setError(e.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const pick = async (image: StockImage) => {
    setImportingId(image.id)
    setError('')
    try {
      const res = await fetch('/api/ai/images/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image.url,
          prompt: query,
          topic: query,
          source: image.source,
          sourceUrl: image.pageUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.imageUrl) throw new Error(data.error || 'Import failed')
      onSelect(data.imageUrl, image)
      onClose()
    } catch (e: any) {
      setError(e.message || 'Failed to add image')
    } finally {
      setImportingId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Find Real Images</h2>
              <p className="text-xs text-slate-500">
                {source === 'unsplash' ? 'Searching Unsplash' : source === 'wikimedia' ? 'Searching Wikimedia Commons' : 'Freely-licensed images'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="e.g. photosynthesis diagram, water cycle, Nairobi skyline..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300"
              />
            </div>
            <button
              onClick={() => search()}
              disabled={searching || !query.trim()}
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl disabled:opacity-50 hover:shadow-md transition-all"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {searching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
              <span className="ml-3 text-sm text-slate-500">Searching for images...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">{error || 'Search to find images'}</p>
              <p className="text-xs text-slate-400 mt-1">Images are saved to your account and can be embedded in presentations</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map(img => (
                <button
                  key={img.id}
                  onClick={() => pick(img)}
                  disabled={importingId === img.id}
                  className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10 transition-all text-left disabled:opacity-60"
                >
                  <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center overflow-hidden">
                    <img
                      src={img.thumbnailUrl}
                      alt={query}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2.5 space-y-1">
                    <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{img.attribution}</p>
                    <span className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {img.license}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-rose-600/0 group-hover:bg-rose-600/5 transition-colors rounded-xl pointer-events-none" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-1 rounded-lg shadow flex items-center gap-1">
                      {importingId === img.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      {importingId === img.id ? 'Adding...' : 'Use This'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Unsplash (when configured) + Wikimedia Commons. Images are stored in your account — no external links after import.
          </p>
          {images.length > 0 && source === 'unsplash' && (
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 shrink-0"
            >
              Photos from Unsplash <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
