'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, ImageIcon, Loader2, BookOpen, GraduationCap, Filter } from 'lucide-react'

interface BankImage {
  id: string
  url: string
  thumbnailUrl: string
  prompt: string
  topic: string
  subject?: string
  grade?: string
  type: string
  teacherName?: string
  usageCount: number
  createdAt: string
}

interface ImagePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (image: BankImage) => void
  subject?: string
  grade?: string
}

export default function ImagePicker({ open, onClose, onSelect, subject: initialSubject, grade: initialGrade }: ImagePickerProps) {
  const [images, setImages] = useState<BankImage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState(initialSubject || '')
  const [grade, setGrade] = useState(initialGrade || '')
  const [topic, setTopic] = useState('')
  const [searchPrompt, setSearchPrompt] = useState('')
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [availableGrades, setAvailableGrades] = useState<string[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 12

  const fetchImages = useCallback(async (reset = false) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (subject) params.set('subject', subject)
    if (grade) params.set('grade', grade)
    if (topic) params.set('topic', topic)
    if (searchPrompt) params.set('prompt', searchPrompt)
    params.set('limit', String(limit))
    params.set('offset', String(reset ? 0 : offset))

    try {
      const res = await fetch(`/api/ai/images/bank?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (reset) {
        setImages(data.images)
      } else {
        setImages(prev => [...prev, ...data.images])
      }
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch (e) {
      console.error('Failed to fetch image bank:', e)
    } finally {
      setLoading(false)
    }
  }, [subject, grade, topic, searchPrompt, offset])

  const fetchFacets = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/images/bank/facets')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setAvailableSubjects(data.subjects || [])
      setAvailableGrades(data.grades || [])
    } catch (e) {
      console.error('Failed to fetch facets:', e)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setOffset(0)
      fetchImages(true)
      fetchFacets()
    }
  }, [open, fetchImages, fetchFacets])

  useEffect(() => {
    setOffset(0)
    fetchImages(true)
  }, [subject, grade, topic, searchPrompt, fetchImages])

  const handleLoadMore = () => {
    setOffset(prev => prev + limit)
  }

  useEffect(() => {
    if (offset > 0) fetchImages()
  }, [offset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Shared Image Bank</h2>
              <p className="text-xs text-slate-500">{total} images available</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by prompt text..."
              value={searchPrompt}
              onChange={e => setSearchPrompt(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              Filters:
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Subjects</option>
                {availableSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Grades</option>
                {availableGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Topic..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 w-32 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {(subject || grade || topic || searchPrompt) && (
              <button
                onClick={() => { setSubject(''); setGrade(''); setTopic(''); setSearchPrompt('') }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && images.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-3 text-sm text-slate-500">Loading images...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">No images found</p>
              <p className="text-xs text-slate-400 mt-1">Try different filters or generate new images</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => onSelect(img)}
                    className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-left"
                  >
                    <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={img.thumbnailUrl}
                        alt={img.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-[11px] font-medium text-slate-700 line-clamp-2 leading-tight">{img.prompt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {img.subject && img.grade ? `${img.subject} · ${img.grade}` : img.subject || img.grade || ''}
                        </span>
                        <span className="text-[10px] text-blue-500 font-medium">{img.usageCount} uses</span>
                      </div>
                      {img.teacherName && (
                        <p className="text-[10px] text-slate-400">by {img.teacherName}</p>
                      )}
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors rounded-xl pointer-events-none" />
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-lg shadow">
                        Use This
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                    Load More ({total - images.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-400">
            Images are shared across all teachers in your school. Reusing images saves AI credits.
          </p>
        </div>
      </div>
    </div>
  )
}
