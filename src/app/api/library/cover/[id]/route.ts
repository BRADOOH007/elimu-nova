import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const COVER_CACHE_SECONDS = 60 * 60 * 24 * 30 // 30 days

/**
 * GET /api/library/cover/[id]
 * Proxies a book cover from the external source (Open Library, Gutendex, etc.)
 * with long-lived CDN/cache headers so browsers and Vercel edge cache it.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const book = await prisma.book.findUnique({
      where: { id },
      select: { coverUrl: true },
    })

    if (!book?.coverUrl) {
      return new NextResponse(null, { status: 404 })
    }

    const upstream = await fetch(book.coverUrl, {
      headers: { 'User-Agent': 'ElimuNova/1.0' },
    })

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const body = await upstream.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${COVER_CACHE_SECONDS}, s-maxage=${COVER_CACHE_SECONDS}, stale-while-revalidate=${COVER_CACHE_SECONDS}`,
        'CDN-Cache-Control': `public, max-age=${COVER_CACHE_SECONDS}`,
        'Vercel-CDN-Cache-Control': `public, max-age=${COVER_CACHE_SECONDS}`,
      },
    })
  } catch (e) {
    console.warn('[cover-proxy] Error:', e)
    return new NextResponse(null, { status: 500 })
  }
}
