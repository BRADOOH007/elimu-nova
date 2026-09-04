import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  const tables = await p.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  let total = 0
  for (const t of tables) {
    const n = t.tablename.replace(/^_/, '')
    try {
      const r = await p.$queryRawUnsafe(`SELECT count(*)::int AS c FROM "${t.tablename}"`)
      const c = (r as { c: number }[])[0].c
      total += c
      if (c > 0) console.log(`${c.toString().padStart(6)}  ${t.tablename}`)
    } catch (e) {
      console.log(`   ERR ${t.tablename}: ${(e as Error).message.slice(0, 80)}`)
    }
  }
  console.log(`\nTOTAL ROWS: ${total}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => p.$disconnect())
