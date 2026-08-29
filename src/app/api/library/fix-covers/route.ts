import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const dynamic = 'force-dynamic'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const OPENLIB_SEARCH = 'https://openlibrary.org/search.json'
const OPENLIB_COVERS = 'https://covers.openlibrary.org/b/id'
const USER_AGENT = 'ElimuNova/1.0 (contact@elimunova.com)'

async function uploadToCloudinary(imageUrl: string, bookTitle: string): Promise<string | null> {
  try {
    const slug = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'elimunova/library_covers',
      public_id: slug,
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto',
      fetch_format: 'auto',
      overwrite: true,
      timeout: 30000,
    })
    return result.secure_url
  } catch (e: any) {
    console.error('[fix-covers] Cloudinary upload failed:', e.message)
    return null
  }
}

async function findCoverFromOpenLibrary(title: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ q: title, limit: '3', fields: 'cover_i,isbn' })
    const res = await fetch(`${OPENLIB_SEARCH}?${params}`, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) return null
    const data = await res.json()
    for (const doc of data.docs || []) {
      if (doc.cover_i) return `${OPENLIB_COVERS}/${doc.cover_i}-L.jpg`
      if (doc.isbn?.length > 0) {
        const isbn = doc.isbn.find((s: string) => s.length === 13) || doc.isbn[0]
        return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      }
    }
    return null
  } catch {
    return null
  }
}

export const POST = route({ auth: ['SUPER_ADMIN'] }, async () => {
  const results = { uploaded: 0, failed: 0, skipped: 0, total: 0, details: [] as string[] }

  // Phase 1: Books with external (non-Cloudinary) cover URLs
  const extBooks = await prisma.book.findMany({
    where: {
      AND: [
        { coverUrl: { not: null } },
        { coverUrl: { not: { startsWith: 'https://res.cloudinary.com' } } },
      ],
    },
    select: { id: true, title: true, coverUrl: true },
  })

  // Phase 2: Books with null covers — search Open Library
  const nullBooks = await prisma.book.findMany({
    where: { coverUrl: null },
    select: { id: true, title: true },
  })

  results.total = extBooks.length + nullBooks.length

  for (const book of extBooks) {
    if (!book.coverUrl) continue
    const cloudUrl = await uploadToCloudinary(book.coverUrl, book.title)
    if (cloudUrl) {
      await prisma.book.update({ where: { id: book.id }, data: { coverUrl: cloudUrl } })
      results.uploaded++
      results.details.push(`✅ ${book.title.substring(0, 50)}`)
    } else {
      results.failed++
      results.details.push(`❌ ${book.title.substring(0, 50)}`)
    }
    await sleep(500)
  }

  for (const book of nullBooks) {
    const externalUrl = await findCoverFromOpenLibrary(book.title)
    if (!externalUrl) {
      results.skipped++
      results.details.push(`⏭️ ${book.title.substring(0, 50)} (no cover found)`)
      continue
    }
    await sleep(300)
    const cloudUrl = await uploadToCloudinary(externalUrl, book.title)
    if (cloudUrl) {
      await prisma.book.update({ where: { id: book.id }, data: { coverUrl: cloudUrl } })
      results.uploaded++
      results.details.push(`✅ ${book.title.substring(0, 50)}`)
    } else {
      results.failed++
      results.details.push(`❌ ${book.title.substring(0, 50)}`)
    }
    await sleep(500)
  }

  return NextResponse.json(results)
})
