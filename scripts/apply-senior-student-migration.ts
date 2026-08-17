/* eslint-disable */
// Applies prisma/migrations/20260815000001_add_senior_student/migration.sql
// directly against DATABASE_URL (additive, autocommit). Used because the
// project's migration history is out of order, so `prisma migrate` cannot
// rebuild the shadow DB. Run: npx tsx scripts/apply-senior-student-migration.ts
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const sql = readFileSync(
    join(__dirname, '..', 'prisma', 'migrations', '20260815000001_add_senior_student', 'migration.sql'),
    'utf8',
  )

  const client = new Client({ connectionString: url })
  await client.connect()

  // Split into individual statements (safe: no semicolons inside literals).
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.split('\n').every((l) => l.trim().startsWith('--') || l.trim() === ''))

  for (const stmt of statements) {
    try {
      await client.query(stmt)
    } catch (e: any) {
      // Ignore "already exists" style errors for idempotent re-runs.
      const msg = String(e?.message || e)
      if (/already exists|duplicate key/i.test(msg)) {
        console.log('SKIP (already applied):', stmt.split('\n')[0].slice(0, 80))
      } else {
        throw e
      }
    }
  }

  console.log(`Applied ${statements.length} statements to senior-student schema.`)
  await client.end()
}

main().catch((e) => {
  console.error('Migration apply failed:', e.message || e)
  process.exit(1)
})
