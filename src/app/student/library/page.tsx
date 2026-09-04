'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Search, BookOpen, Headphones, Star, Loader2,
  TrendingUp, ChevronRight, Library, SlidersHorizontal, Clock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookCover } from '@/components/ui/book-cover'

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

interface ProgressItem {
  id: string
  bookId: string
  progressPct: number
  completed: boolean
  book: { id: string; title: string; author: string | null; coverUrl: string | null; category: string; readingLevel: string | null; language: string }
}

const AGE_CATEGORIES = [
  { key: '', label: 'All Books', icon: '📚' },
  { key: 'Beginner', label: 'Early Readers', icon: '🌟', desc: 'Ages 4–6' },
  { key: 'Beginner-Intermediate', label: 'Chapter Books', icon: '📖', desc: 'Ages 7–9' },
  { key: 'Intermediate', label: 'Middle Grade', icon: '🔭', desc: 'Ages 10–12' },
  { key: 'Advanced', label: 'Young Adult', icon: '🎓', desc: 'Ages 13+' },
] as const

function gradeToAgeCategory(grade: number): string {
  if (grade <= 3) return 'Beginner'
  if (grade <= 6) return 'Intermediate'
  return 'Advanced'
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

export default function StudentLibraryPage() {
  const { data: session } = useSession()
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [featured, setFeatured] = useState<Book[]>([])
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ todayMinutes: number; totalMinutes: number; streak: number }>({ todayMinutes: 0, totalMinutes: 0, streak: 0 })
  const [activeAgeCategory, setActiveAgeCategory] = useState('')

  useEffect(() => {
    fetch('/api/user-preferences').then(r => r.json()).then(d => {
      const g = parseInt(d.grade || '0', 10)
      if (g > 0) setActiveAgeCategory(gradeToAgeCategory(g))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/library/reading-log').then(r => r.json()).then(d => setStats(d)).catch(() => {})
  }, [])

  const load = useCallback(async (query = '', category = '', readingLevel?: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (category) params.set('category', category)
      if (readingLevel) params.set('readingLevel', readingLevel)
      params.set('limit', '60')
      const res = await fetch(`/api/library?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load library')
      setBooks(data.books || [])
      setCategories(data.categories || [])
      // Use first 12 results as featured if no search term
      if (!query && !category) {
        setFeatured((data.books || []).slice(0, 12))
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load library')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadExtras = useCallback(async (readingLevel?: string) => {
    try {
      // Only load progress — featured now comes from main load
      const progRes = await fetch('/api/library/progress')
      if (progRes.ok) {
        const prog = await progRes.json()
        setProgress((prog.progress || []).filter((p: ProgressItem) => !p.completed))
      }
    } catch {
      // Non-critical extras — silently ignore
    }
  }, [])

  useEffect(() => { loadExtras(activeAgeCategory || undefined) }, [loadExtras, activeAgeCategory])

  useEffect(() => {
    // Increase debounce to 500ms — library calls are heavy (Open Library + DB)
    const t = setTimeout(() => load(search, activeCategory, activeAgeCategory || undefined), 500)
    return () => clearTimeout(t)
  }, [search, activeCategory, activeAgeCategory, load])

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Library className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Library</h1>
            <p className="text-sm text-slate-500">Read or listen — pick up where you left off</p>
          </div>
        </div>
        {(stats.streak > 0 || stats.totalMinutes > 0) && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              <Clock className="h-3.5 w-3.5" /> {stats.todayMinutes} min today
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium">
              🔥 {stats.streak} day streak
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium">{stats.totalMinutes} min total</span>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search books by title, author, or subject..."
          className="pl-10 h-12 bg-white shadow-sm"
        />
      </div>

      {progress.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <h2 className="font-bold text-slate-800">Continue reading</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {progress.map(p => (
              <Link key={p.id} href={`/student/library/${p.bookId}`}
                className="shrink-0 w-64 bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-24 bg-gradient-to-br ${coverGradient(p.book.category)} flex items-center justify-center`}>
                  <BookOpen className="h-8 w-8 text-white/80" />
                </div>
                <div className="p-3 space-y-2">
                  <p className="font-semibold text-sm text-slate-800 truncate">{p.book.title}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, p.progressPct)}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">{Math.round(p.progressPct)}% read</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <h2 className="font-bold text-slate-800">Featured books</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {featured.map(b => (
              <Link key={b.id} href={`/student/library/${b.id}`}
                className="shrink-0 w-44 group">
                <div className="h-40 w-full">
                  <BookCover
                    title={b.title}
                    author={b.author}
                    category={b.category}
                    coverUrl={b.coverUrl}
                    fallbackClassName="h-40"
                    rounded="rounded-2xl"
                  />
                </div>
                <p className="mt-2 font-semibold text-sm text-slate-800 line-clamp-1">{b.title}</p>
                <p className="text-xs text-slate-400 truncate">{b.author || b.category}</p>
                {b.rating.count > 0 && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {b.rating.average?.toFixed(1)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
          {AGE_CATEGORIES.map(ac => (
            <button key={ac.key}
              onClick={() => setActiveAgeCategory(ac.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeAgeCategory === ac.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <span className="mr-1">{ac.icon}</span>{ac.label}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Subjects:</span>
            <button
              onClick={() => setActiveCategory('')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${activeCategory === '' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${activeCategory === c ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No books found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map(b => (
              <Link key={b.id} href={`/student/library/${b.id}`}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative aspect-[3/4]">
                  <BookCover
                    title={b.title}
                    author={b.author}
                    category={b.category}
                    coverUrl={b.coverUrl}
                    fallbackClassName="aspect-[3/4]"
                    rounded="rounded-none"
                  />
                  {b.readingLevel && (
                    <Badge className="absolute top-2 left-2 z-10 bg-white/90 text-slate-700 border-0 text-[10px]">
                      {b.readingLevel}
                    </Badge>
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  <p className="font-semibold text-sm text-slate-800 line-clamp-1">{b.title}</p>
                  <p className="text-xs text-slate-400 truncate">{b.author || b.category}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                      {b.rating.count > 0
                        ? <><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{b.rating.average?.toFixed(1)} <span className="text-slate-300">({b.rating.count})</span></>
                        : <span className="text-slate-300">No ratings</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <BookOpen className="h-3.5 w-3.5 group-hover:text-blue-500" />
                      <Headphones className="h-3.5 w-3.5 group-hover:text-purple-500" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
