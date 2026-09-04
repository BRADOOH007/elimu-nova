import { Client } from 'pg'

async function tableCounts(c: Client): Promise<Map<string, number>> {
  const tables = await c.query<{ tablename: string }>(`SELECT tablename FROM pg_tables WHERE schemaname='public'`)
  const map = new Map<string, number>()
  for (const t of tables.rows) {
    try {
      const r = await c.query(`SELECT count(*)::int AS c FROM "${t.tablename}"`)
      map.set(t.tablename, r.rows[0].c)
    } catch { map.set(t.tablename, -1) }
  }
  return map
}

async function main() {
  const src = new Client({ connectionString: process.env.DATABASE_URL })
  const dst = new Client({ connectionString: process.env.BACKUP_DATABASE_URL })
  await src.connect(); await dst.connect()
  const a = await tableCounts(src)
  const b = await tableCounts(dst)
  let mismatch = 0
  for (const [t, ca] of a) {
    const cb = b.get(t) ?? -2
    const mark = ca === cb ? 'OK ' : 'DIFF'
    if (ca !== cb) mismatch++
    if (ca !== cb) console.log(`${mark} ${t}: main=${ca} backup=${cb}`)
  }
  const totalA = [...a.values()].reduce((s, v) => s + Math.max(0, v), 0)
  const totalB = [...b.values()].reduce((s, v) => s + Math.max(0, v), 0)
  console.log(`\nMAIN total rows: ${totalA}`)
  console.log(`BACKUP total rows: ${totalB}`)
  console.log(mismatch === 0 ? 'VERIFIED: all tables match' : `MISMATCHES: ${mismatch}`)
  await src.end(); await dst.end()
}
main().catch(e => { console.error('FATAL', e); process.exit(1) })
