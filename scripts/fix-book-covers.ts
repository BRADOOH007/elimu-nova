/**
 * One-time script: upload all existing book covers to Cloudinary.
 * For books with external URLs → re-upload to Cloudinary.
 * For books with null covers → search Gutendex/Open Library, upload to Cloudinary.
 *
 * Usage: npx tsx scripts/fix-book-covers.ts
 */

import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'

const prisma = new PrismaClient()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const OPENLIB_SEARCH = 'https://openlibrary.org/search.json'
const OPENLIB_COVERS = 'https://covers.openlibrary.org/b/id'
const USER_AGENT = 'ElimuNova/1.0 (contact@elimunova.com)'
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

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
    console.error(`  Cloudinary upload failed: ${e.message}`)
    return null
  }
}

async function findCoverFromOpenLibrary(title: string, author: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      q: title,
      limit: '3',
      fields: 'cover_i,isbn',
    })
    const res = await fetch(`${OPENLIB_SEARCH}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return null
    const data = await res.json()
    for (const doc of data.docs || []) {
      if (doc.cover_i) {
        return `${OPENLIB_COVERS}/${doc.cover_i}-L.jpg`
      }
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

async function main() {
  // Phase 1: Books with external URLs — re-upload to Cloudinary
  const extBooks = await prisma.book.findMany({
    where: { coverUrl: { not: null, not: { startsWith: 'https://res.cloudinary.com' } } },
    select: { id: true, title: true, author: true, coverUrl: true },
  })
  console.log(`Phase 1: ${extBooks.length} books with external covers\n`)

  let uploaded = 0
  let failed = 0

  for (const book of extBooks) {
    if (!book.coverUrl) continue
    process.stdout.write(`  ${book.title.substring(0, 50)}...`)
    const cloudUrl = await uploadToCloudinary(book.coverUrl, book.title)
    if (cloudUrl) {
      await prisma.book.update({ where: { id: book.id }, data: { coverUrl: cloudUrl } })
      console.log(` ✅`)
      uploaded++
    } else {
      console.log(` ❌`)
      failed++
    }
    await sleep(500)
  }

  // Phase 2: Books with null covers — search Open Library and upload
  const nullBooks = await prisma.book.findMany({
    where: { coverUrl: null },
    select: { id: true, title: true, author: true },
  })
  console.log(`\nPhase 2: ${nullBooks.length} books without covers\n`)

  for (const book of nullBooks) {
    process.stdout.write(`  ${book.title.substring(0, 50)}...`)
    const externalUrl = await findCoverFromOpenLibrary(book.title, book.author || '')
    if (!externalUrl) {
      console.log(` ⏭️  (no cover found)`)
      continue
    }
    await sleep(300)
    const cloudUrl = await uploadToCloudinary(externalUrl, book.title)
    if (cloudUrl) {
      await prisma.book.update({ where: { id: book.id }, data: { coverUrl: cloudUrl } })
      console.log(` ✅`)
      uploaded++
    } else {
      console.log(` ❌`)
      failed++
    }
    await sleep(500)
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Failed: ${failed}`)

  // Final stats
  const total = await prisma.book.count()
  const noCover = await prisma.book.count({ where: { coverUrl: null } })
  const cloudinaryCount = await prisma.book.count({ where: { coverUrl: { startsWith: 'https://res.cloudinary.com' } } })
  console.log(`\nFinal: ${total} books | ${cloudinaryCount} Cloudinary | ${noCover} still null`)

  await prisma['$disconnect']()
}

main().catch(console.error)
