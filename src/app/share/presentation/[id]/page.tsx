'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

const SECTION_STYLES: Record<string, { badge: string; bullet: string; bg: string; border: string }> = {
  introduction: {
    badge: 'bg-blue-100 text-blue-800',
    bullet: 'bg-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  body: {
    badge: 'bg-emerald-100 text-emerald-800',
    bullet: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  conclusion: {
    badge: 'bg-violet-100 text-violet-800',
    bullet: 'bg-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
}

interface Slide {
  id?: string
  title: string
  content: string[]
  image?: string
  layout?: string
  section?: string
  speakerNotes?: string
  imagePrompt?: string
  order?: number
  slideNumber?: number
}

interface PresentationData {
  id: string
  title: string
  subject: string
  grade: string
  topic: string
  teacherName: string
  slides: Slide[]
  slideCount: number
  duration: number
  difficulty: string
  metadata?: { generatedAt?: string }
  createdAt: string
}

export default function SharedPresentationPage() {
  const params = useParams()
  const id = params?.id as string

  const [data, setData] = useState<PresentationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slideIdx, setSlideIdx] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/share/presentation/${id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.presentation)
        else setError(res.error || 'Failed to load presentation')
      })
      .catch(() => setError('Failed to load presentation'))
      .finally(() => setLoading(false))
  }, [id])

  const prev = useCallback(() => setSlideIdx(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setSlideIdx(i => Math.min((data?.slides.length ?? 1) - 1, i + 1)), [data?.slides.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading presentation...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Presentation Unavailable</h2>
            <p className="text-gray-500 text-sm mb-6">{error || 'This presentation could not be found.'}</p>
            <Link href="/">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const slide = data.slides[slideIdx]
  const total = data.slides.length
  const section = slide?.section && SECTION_STYLES[slide.section] ? SECTION_STYLES[slide.section] : null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Logo size="sm" variant="white" />
          <div className="h-6 w-px bg-gray-200" />
          <div>
            <h1 className="text-sm font-semibold text-gray-900 truncate max-w-md">{data.title}</h1>
            <p className="text-xs text-gray-500">{data.subject} &middot; {data.grade} &middot; {data.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>by {data.teacherName}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl">
          <Card className={`bg-white shadow-xl border ${section?.border || 'border-gray-200'}`}>
            <CardContent className="p-0">
              <div className={`px-6 py-3 ${section?.bg || 'bg-gray-50'} border-b ${section?.border || 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono">{slideIdx + 1} / {total}</span>
                  {section && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${section.badge}`}>{slide.section}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {data.difficulty && <span className="capitalize">{data.difficulty}</span>}
                  {data.duration && <span>&middot; {data.duration} min</span>}
                </div>
              </div>

              <div className="p-8 md:p-12 min-h-[400px] flex flex-col">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{slide?.title}</h2>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
                  <ul className="space-y-3">
                    {slide?.content?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-base md:text-lg text-gray-700 leading-relaxed">
                        <span className={`mt-2 w-2 h-2 rounded-full ${section?.bullet || 'bg-gray-400'} shrink-0`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {slide?.image && (
                    <div className="shrink-0">
                      <img src={slide.image} alt="" className="w-64 rounded-lg border border-gray-200 shadow-sm object-cover" />
                    </div>
                  )}
                </div>
                {slide?.speakerNotes && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                    <p className="text-sm text-amber-800">{slide.speakerNotes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="sm" onClick={prev} disabled={slideIdx === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-gray-400 font-mono">{slideIdx + 1} / {total}</span>
            <Button variant="outline" size="sm" onClick={next} disabled={slideIdx === total - 1}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-3 text-center text-xs text-gray-400 shrink-0">
        Powered by ElimuNova AI
      </footer>
    </div>
  )
}
