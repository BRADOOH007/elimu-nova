import { PrismaClient } from '@prisma/client'

const BACKUP_URL = process.env.BACKUP_DATABASE_URL || ''

async function inspect(name: string, url: string) {
  const p = new PrismaClient({ datasources: { db: { url } } })
  try {
    const t0 = Date.now()
    await p.$queryRaw`SELECT 1`
    const tables = await p.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename`
    console.log(`\n=== ${name} === OK (${Date.now() - t0}ms)`)
    console.log(`tables (${tables.length}): ${tables.map(t => t.tablename).join(', ')}`)
  } catch (e) {
    console.log(`\n=== ${name} === ERROR: ${(e as Error).message}`)
  } finally {
    await p.$disconnect()
  }
}

async function main() {
  console.log('BACKUP_URL provided:', BACKUP_URL ? 'yes' : 'NO')
  if (!BACKUP_URL) return
  await inspect('MAIN (DATABASE_URL)', process.env.DATABASE_URL || '')
  await inspect('BACKUP', BACKUP_URL)
}

main()
