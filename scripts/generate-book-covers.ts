/**
 * One-time script: generate self-hosted SVG cover art for published books
 * missing a cover, and persist the relative URL in book.coverUrl.
 *
 * Usage: npx tsx scripts/generate-book-covers.ts
 * (loads env from .env.local via dotenv)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Stories: ['#ec4899', '#fb7185'],
  Science: ['#10b981', '#2dd4bf'],
  Mathematics: ['#3b82f6', '#818cf8'],
  History: ['#f59e0b', '#fb923c'],
  Geography: ['#06b6d4', '#38bdf8'],
  Language: ['#8b5cf6', '#a78bfa'],
  General: ['#64748b', '#94a3b8'],
}

const CATEGORY_ICONS: Record<string, string> = {
  Stories: '✦',
  Science: '◈',
  Mathematics: '∑',
  History: '⚜',
  Geography: '◎',
  Language: '✒',
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapTitle(title: string, max = 22): string[] {
  const words = title.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur)
      cur = w
    } else {
      cur = (cur + ' ' + w).trim()
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function makeSvg(title: string, author: string, category: string): string {
  const [c1, c2] = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.General
  const icon = CATEGORY_ICONS[category] || '✦'
  const lines = wrapTitle(title)
  const lineH = lines.length > 3 ? 66 : 74
  const startY = 330 - ((lines.length - 1) * lineH) / 2
  const titleBlock = lines
    .map((ln, i) => {
      const y = startY + i * lineH
      const fs = ln.length > 18 ? 46 : ln.length > 12 ? 54 : 62
      return `<text x="210" y="${y}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fs}" font-weight="bold" fill="#ffffff" >${esc(ln)}</text>`
    })
    .join('\n  ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="600" viewBox="0 0 420 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="420" height="600" fill="url(#bg)"/>
  <rect x="26" y="0" width="14" height="600" fill="rgba(0,0,0,0.18)"/>
  <rect x="380" y="0" width="14" height="600" fill="rgba(255,255,255,0.18)"/>
  <rect x="58" y="40" width="304" height="520" rx="8" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
  <text x="210" y="120" text-anchor="middle" font-size="72">${icon}</text>
  <text x="210" y="160" text-anchor="middle" font-family="Georgia, serif" font-size="22" letter-spacing="4" fill="rgba(255,255,255,0.85)">ELIMU NOVA</text>
  <line x1="130" y1="178" x2="290" y2="178" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
  ${titleBlock}
  <text x="210" y="505" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-style="italic" fill="rgba(255,255,255,0.9)">${esc(author)}</text>
</svg>`
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 46)
}

async function main() {
  const books = await prisma.book.findMany({ where: { coverUrl: null }, select: { id: true, title: true, author: true, category: true } })
  console.log(`Books missing covers to process: ${books.length}`)

  const coversDir = path.resolve(process.cwd(), 'public', 'covers')
  fs.mkdirSync(coversDir, { recursive: true })

  let done = 0
  for (const b of books) {
    const slug = `${slugify(b.title)}_${b.id.slice(-6)}`
    const filename = `${slug}.svg`
    const svg = makeSvg(b.title, b.author || 'ElimuNova', b.category)
    fs.writeFileSync(path.join(coversDir, filename), svg, 'utf8')

    await prisma.book.update({ where: { id: b.id }, data: { coverUrl: `/covers/${filename}` } })
    console.log(`  + ${b.title} -> /covers/${filename}`)
    done++
  }

  console.log(`\nDone. Generated ${done} covers.`)
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) }).finally(() => prisma.$disconnect())
