'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Search, BookOpen, Loader2, X, ArrowLeft, Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Book {
  id: string
  title: string
  author: string | null
  description: string | null
  coverUrl: string | null
  category: string
  subjects: string[]
  gradeMin: number | null
  gradeMax: number | null
  language: string
  readingLevel: string | null
  isFeatured: boolean
  viewCount: number
  source: string
  createdAt: string
  rating: { average: number | null; count: number }
}

interface BookDetail extends Book {
  content?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Stories: 'from-pink-500 to-rose-400',
  Science: 'from-emerald-500 to-teal-400',
  Mathematics: 'from-blue-500 to-indigo-400',
  History: 'from-amber-500 to-orange-400',
  Geography: 'from-cyan-500 to-sky-400',
  Language: 'from-violet-500 to-purple-400',
  General: 'from-slate-500 to-slate-400',
}

function coverGradient(category: string): string {
  return CATEGORY_COLORS[category] || 'from-slate-500 to-slate-400'
}

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error('Request failed')
  return r.json()
}

export default function SeniorLibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [featured, setFeatured] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<BookDetail | null>(null)
  const [readerLoading, setReaderLoading] = useState(false)
  const [related, setRelated] = useState<Book[]>([])

  const loadBooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: '40' })
      if (search.trim()) params.set('search', search.trim())
      if (category) params.set('category', category)
      const data = await fetcher(`/api/library?${params.toString()}`)
      setBooks(data.books || [])
      setCategories(data.categories || [])
    } catch {
      setError('Unable to load the library. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  useEffect(() => {
    fetcher('/api/library?featured=1&limit=6')
      .then((d) => setFeatured(d.books || []))
      .catch(() => {})
  }, [])

  const openBook = async (id: string) => {
    setSelected(null)
    setReaderLoading(true)
    setRelated([])
    try {
      const [detail, relatedData] = await Promise.all([
        fetcher(`/api/library/${id}`),
        fetcher(`/api/library/${id}/related`).catch(() => ({ books: [] })),
      ])
      setSelected(detail.book)
      setRelated(relatedData.books || [])
    } catch {
      setError('Unable to open this book.')
    } finally {
      setReaderLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 text-white rounded-2xl p-5 md:p-7 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-emerald-200" />
          <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Learning Library</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Reading Library</h1>
        <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
          Explore books to strengthen your reading skills �?�— a key part of Reasoning Through
          Language Arts and everyday life. Read at your own pace.
        </p>
        <div className="mt-4 max-w-md">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or subject..."
              className="pl-9 bg-white/90 border-0"
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
            category === '' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          All Books
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(category === c ? '' : c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              category === c ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      {/* Featured */}
      {!search && !category && featured.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-emerald-600" /> Featured Reads
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featured.map((b) => (
              <button
                key={b.id}
                onClick={() => openBook(b.id)}
                className="group text-left"
              >
                <div className={`aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-gradient-to-br ${coverGradient(b.category)}`}>
                  {b.coverUrl ? (
                    <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-white/80">{b.title[0]}</div>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-1.5 line-clamp-2 leading-tight">{b.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* All books */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-3">
          {search || category ? 'Search Results' : 'All Books'}
          {books.length > 0 && <span className="text-sm font-normal text-slate-400 ml-2">({books.length})</span>}
        </h2>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 text-sm py-10 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading books...
          </div>
        ) : books.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No books found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((b) => (
              <button key={b.id} onClick={() => openBook(b.id)} className="group text-left">
                <div className={`aspect-[2/3] rounded-xl overflow-hidden shadow-md bg-gradient-to-br ${coverGradient(b.category)}`}>
                  {b.coverUrl ? (
                    <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-white/80">{b.title[0]}</div>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-2 line-clamp-2 leading-tight group-hover:text-emerald-700">{b.title}</p>
                {b.author && <p className="text-xs text-slate-400 line-clamp-1">{b.author}</p>}
                <div className="mt-1">
                  <Badge className="text-[10px] bg-slate-100 text-slate-500">{b.category}</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Reader modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 md:p-8" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-3xl bg-white max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <button
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Library
                </button>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex gap-5">
                  <div className={`w-32 h-48 shrink-0 rounded-lg overflow-hidden shadow bg-gradient-to-br ${coverGradient(selected.category)}`}>
                    {selected.coverUrl ? (
                      <img src={selected.coverUrl} alt={selected.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-white/80">{selected.title[0]}</div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{selected.title}</h2>
                    {selected.author && <p className="text-sm text-slate-500 mt-1">by {selected.author}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{selected.category}</Badge>
                      {selected.readingLevel && <Badge className="bg-slate-100 text-slate-500">{selected.readingLevel}</Badge>}
                      {selected.source === 'ai-generated' && <Badge className="bg-teal-50 text-teal-700 border-teal-200">ElimuNova Original</Badge>}
                    </div>
                    {selected.description && (
                      <p className="text-sm text-slate-600 mt-3">{selected.description}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-5 pt-5">
                  {readerLoading ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" /> Opening book...
                    </div>
                  ) : selected.content ? (
                    <article className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                      {selected.content}
                    </article>
                  ) : (
                    <p className="text-sm text-slate-400">No preview is available for this title yet.</p>
                  )}
                </div>

                {related.length > 0 && (
                  <div className="border-t border-slate-100 mt-5 pt-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">You may also like</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {related.map((r) => (
                        <button key={r.id} onClick={() => openBook(r.id)} className="text-left">
                          <div className={`aspect-[2/3] rounded-lg overflow-hidden shadow bg-gradient-to-br ${coverGradient(r.category)}`}>
                            {r.coverUrl ? (
                              <img src={r.coverUrl} alt={r.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl text-white/80">{r.title[0]}</div>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-slate-600 mt-1 line-clamp-2">{r.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
