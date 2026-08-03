import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { searchStockImages } from '@/lib/stock-image-search'

export const GET = route({}, async (request) => {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10) || 12, 24)

  if (!q.trim()) {
    return NextResponse.json({ images: [], source: 'none', error: 'Query required' }, { status: 400 })
  }

  const result = await searchStockImages(q, limit)
  return NextResponse.json(result)
})
