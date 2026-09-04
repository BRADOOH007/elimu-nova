'use client'

/**
 * BookCover
 * Renders a book cover image with a graceful fallback. If the cover URL is
 * missing or fails to load (broken/expired/external link), it shows a themed
 * gradient with the book title and a book icon instead — so the library never
 * displays broken images.
 */

import { useState } from 'react'
import { BookOpen } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  Stories: 'from-pink-500 to-rose-400',
  Science: 'from-emerald-500 to-teal-400',
  Mathematics: 'from-blue-500 to-indigo-400',
  History: 'from-amber-500 to-orange-400',
  Geography: 'from-cyan-500 to-sky-400',
  Language: 'from-violet-500 to-purple-400',
  'Stories & Fiction': 'from-rose-500 to-pink-400',
  'Religious Education': 'from-amber-500 to-yellow-400',
  Agriculture: 'from-lime-500 to-green-400',
  Business: 'from-slate-500 to-slate-400',
  'Creative Arts': 'from-fuchsia-500 to-purple-400',
}

export function coverGradient(category: string): string {
  return CATEGORY_COLORS[category] || 'from-slate-500 to-slate-400'
}

interface BookCoverProps {
  title: string
  author?: string | null
  category?: string
  coverUrl?: string | null
  className?: string
  /** gradient classes applied to the fallback (already includes aspect/size) */
  fallbackClassName?: string
  rounded?: string
}

export function BookCover({
  title,
  author,
  category = 'General',
  coverUrl,
  className = '',
  fallbackClassName = '',
  rounded = 'rounded-2xl',
}: BookCoverProps) {
  const [failed, setFailed] = useState(false)
  const showImg = !!coverUrl && !failed

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl!}
          alt={title}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${coverGradient(category)} p-3 text-center ${fallbackClassName}`}>
          <BookOpen className="h-8 w-8 text-white/90" aria-hidden />
          <p className="line-clamp-3 text-sm font-bold text-white leading-tight">{title}</p>
          {author && <p className="line-clamp-1 text-[11px] text-white/70">{author}</p>}
        </div>
      )}
    </div>
  )
}

export default BookCover
