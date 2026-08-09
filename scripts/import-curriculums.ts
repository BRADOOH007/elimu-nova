/**
 * CBC Curriculum Importer CLI
 * ============================================================
 * Reads a JSON manifest of Google Drive links to curriculum design
 * PDFs and imports each into the Curriculum -> Strand -> Substrand
 * tables (idempotent upsert per grade/subject/term).
 *
 * Manifest file shape (curriculum-links.json at project root):
 * {
 *   "links": [
 *     { "url": "https://drive.google.com/file/d/.../view",
 *       "grade": "PP1",
 *       "subject": "Language Activities",
 *       "term": 1,                 // optional
 *       "name": "CBC PP1 Language" // optional
 *     }
 *   ]
 * }
 *
 * Run with:  npx tsx scripts/import-curriculums.ts [path-to-json]
 * (defaults to curriculum-links.json in the project root)
 */
import { readFileSync } from 'fs'
import path from 'path'
import { importCurriculumFromLink } from '@/lib/curriculum-importer'

interface LinkEntry {
  url: string
  grade: string
  subject: string
  term?: number | null
  name?: string
  description?: string
}

async function main() {
  const manifestPath = path.resolve(process.argv[2] || 'curriculum-links.json')

  let manifest: { links: LinkEntry[] }
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  } catch (err) {
    console.error(`✗ Could not read manifest at ${manifestPath}:`, err instanceof Error ? err.message : err)
    process.exit(1)
  }

  const links = Array.isArray(manifest?.links) ? manifest.links : []
  if (links.length === 0) {
    console.error('✗ No "links" array found in the manifest. Add entries with url/grade/subject.')
    process.exit(1)
  }

  console.log(`Importing ${links.length} curriculum document(s)...\n`)

  let ok = 0
  let failed = 0
  for (let i = 0; i < links.length; i++) {
    const entry = links[i]
    if (!entry?.url || !entry.grade || !entry.subject) {
      console.warn(`[${i + 1}/${links.length}] SKIP — missing url/grade/subject:`, JSON.stringify(entry))
      failed++
      continue
    }
    const label = `${entry.grade} · ${entry.subject}`
    try {
      console.log(`[${i + 1}/${links.length}] Importing ${label} ...`)
      const result = await importCurriculumFromLink({
        url: entry.url,
        grade: entry.grade,
        subject: entry.subject,
        term: entry.term ?? null,
        name: entry.name,
        description: entry.description,
      })
      console.log(
        `   ✓ ${label} → ${result.strandCount} strands / ${result.substrandCount} substrands ` +
        `(AI: ${result.parsedWithAI ? 'yes' : 'fallback'}, text: ${result.textLength} chars)`
      )
      ok++
    } catch (err) {
      failed++
      console.error(`   ✗ ${label} FAILED: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`\nDone. ${ok} imported, ${failed} failed.`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
