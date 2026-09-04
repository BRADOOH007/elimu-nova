'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search, BookOpen, Loader2, Sparkles,
} from 'lucide-react'
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
          Explore books to strengthen your reading skills — a key part of Reasoning Through
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
              <Link
                key={b.id}
                href={`/senior-student/library/${b.id}`}
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
              </Link>
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
              <Link key={b.id} href={`/senior-student/library/${b.id}`} className="group text-left">
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
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
