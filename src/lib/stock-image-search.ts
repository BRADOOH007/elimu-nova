/**
 * Stock image search for presentations and diagrams.
 *
 * Sources (in priority order):
 *   1. Unsplash API   — used when UNSPLASH_ACCESS_KEY is set in .env.local
 *   2. Wikimedia Commons — keyless public API, always available as fallback
 */

export interface StockImage {
  id: string
  url: string
  thumbnailUrl: string
  source: 'unsplash' | 'wikimedia'
  license: string
  attribution: string
  pageUrl?: string
}

interface SearchResult {
  images: StockImage[]
  source: string
}

const BITMAP_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

/**
 * Search Unsplash for photos matching the query.
 * Returns null when no API key is configured or the request fails.
 */
async function searchUnsplash(query: string, limit: number): Promise<StockImage[] | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null

  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('per_page', String(limit))

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${key}` },
    })
    if (!res.ok) {
      console.warn('[StockImage] Unsplash search failed:', res.status)
      return null
    }

    const data = await res.json()
    if (!Array.isArray(data.results)) return null

    return data.results
      .filter((r: any) => r?.urls?.regular && r?.urls?.small)
      .map((r: any) => ({
        id:           r.id,
        url:          r.urls.regular,
        thumbnailUrl: r.urls.small,
        source:       'unsplash' as const,
        license:      'Unsplash License',
        attribution:  `Photo by ${r.user?.name || 'Unknown'} on Unsplash`,
        pageUrl:      r.links?.html || undefined,
      }))
  } catch (e) {
    console.warn('[StockImage] Unsplash error:', e)
    return null
  }
}

/**
 * Search Wikimedia Commons for freely-licensed images.
 * Keyless public API; filters out SVG/vector files for reliable embedding.
 */
async function searchWikimedia(query: string, limit: number): Promise<StockImage[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', `filetype:bitmap ${query}`)
  url.searchParams.set('gsrnamespace', '6')
  url.searchParams.set('gsrlimit', String(limit))
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|mime|extmetadata')
  url.searchParams.set('iiurlwidth', '480')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Wikimedia search failed: ${res.status}`)

  const data = await res.json()
  const pages: any = data?.query?.pages || {}
  const images: StockImage[] = []

  const pageIds = Object.keys(pages).sort(
    (a, b) => (pages[a].index || 0) - (pages[b].index || 0)
  )

  for (const id of pageIds) {
    const page = pages[id]
    const info = page?.imageinfo?.[0]
    if (!info?.url || !info?.thumburl) continue
    if (!BITMAP_MIMES.has(info.mime)) continue

    const meta = info.extmetadata || {}
    const get = (k: string) => (meta[k]?.value ? String(meta[k].value).replace(/<[^>]*>/g, '').trim() : '')

    images.push({
      id:           `wm-${id}`,
      url:          info.url,
      thumbnailUrl: info.thumburl,
      source:       'wikimedia',
      license:      get('LicenseShortName') || get('License') || 'CC / Public Domain',
      attribution:  get('Artist') ? `Image: ${get('Artist')}` : `Wikimedia Commons: ${page.title}`,
      pageUrl:      `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/^File:/, 'File:'))}`,
    })
  }

  return images
}

/**
 * Search stock images across available sources.
 * Unsplash (if configured) is tried first, then Wikimedia Commons.
 */
export async function searchStockImages(query: string, limit = 12): Promise<SearchResult> {
  const trimmed = query.trim()
  if (!trimmed) return { images: [], source: 'none' }

  const unsplash = await searchUnsplash(trimmed, limit)
  if (unsplash && unsplash.length > 0) {
    return { images: unsplash, source: 'unsplash' }
  }

  try {
    const wikimedia = await searchWikimedia(trimmed, limit)
    return { images: wikimedia, source: 'wikimedia' }
  } catch (e) {
    console.error('[StockImage] Wikimedia search error:', e)
    return { images: [], source: 'none' }
  }
}
