import { Client } from 'pg'

const MAIN_URL = process.env.DATABASE_URL || ''
const BACKUP_URL = process.env.BACKUP_DATABASE_URL || ''
const log = (m: string) => console.log(m)

async function topoSort(src: Client): Promise<string[]> {
  const tables = await src.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`)
  const names = tables.rows.map(r => r.tablename)

  const fks = await src.query<{ child: string; parent: string }>(
    `SELECT tc.table_name AS child, ccu.table_name AS parent
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'`)

  const set = new Set(names)
  const visited = new Map<string, boolean>()
  const order: string[] = []

  function visit(t: string, stack: Set<string>) {
    if (visited.has(t)) return
    if (stack.has(t)) return
    stack.add(t)
    for (const fk of fks.rows) if (fk.child === t && set.has(fk.parent)) visit(fk.parent, stack)
    stack.delete(t)
    visited.set(t, true)
    order.push(t)
  }
  for (const t of names) visit(t, new Set())
  for (const t of names) if (!order.includes(t)) order.push(t)
  return order
}

async function copyTable(src: Client, dst: Client, table: string): Promise<number> {
  const cols = await src.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [table])
  const columnNames = cols.rows.map(c => `"${c.column_name}"`).join(', ')

  // Row-major (arrays) with raw string parser so bytea/timestamps/json round-trip verbatim
  const selectQ = `SELECT ${columnNames} FROM "${table}"`
  const res = await src.query({ text: selectQ, rowMode: 'array', types: { getTypeParser: () => (v: string) => v } })
  const rows = res.rows as unknown[][]
  if (rows.length === 0) return 0

  const colsN = cols.rows.length
  const CHUNK = 100
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK)
    const values: unknown[] = []
    const placeholders: string[] = []
    for (let r = 0; r < batch.length; r++) {
      const rowPlaceholders: string[] = []
      for (let c = 0; c < colsN; c++) {
        values.push(batch[r][c] ?? null)
        rowPlaceholders.push(`$${values.length}`)
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`)
    }
    const insertQ = `INSERT INTO "${table}" (${columnNames}) VALUES ${placeholders.join(', ')}`
    await dst.query(insertQ, values)
  }
  return rows.length
}

async function main() {
  if (!MAIN_URL || !BACKUP_URL) { log('Both DATABASE_URL and BACKUP_DATABASE_URL required'); process.exit(1) }
  const src = new Client({ connectionString: MAIN_URL })
  const dst = new Client({ connectionString: BACKUP_URL })
  await src.connect()
  await dst.connect()
  log('Connected to both databases')

  const order = await topoSort(src)
  log(`Copying ${order.length} tables in FK-safe order`)

  // Reset target so the script is re-runnable
  const reset = order.map(t => `"${t}"`).join(', ')
  await dst.query(`TRUNCATE ${reset} RESTART IDENTITY CASCADE`).catch(e => log(`WARN truncate: ${(e as Error).message.slice(0, 150)}`))

  const counts: { table: string; rows: number }[] = []
  const failed: string[] = []

  for (const table of order) {
    try {
      const rows = await copyTable(src, dst, table)
      counts.push({ table, rows })
      if (rows > 0) log(`${table}: +${rows}`)
    } catch (e) {
      failed.push(table)
      log(`${table}: FAILED — ${(e as Error).message.slice(0, 200)}`)
    }
  }

  log('\n=== BACKUP COMPLETE ===')
  const withRows = counts.filter(c => c.rows > 0)
  log(`Tables with data: ${withRows.length}/${order.length}, total rows: ${withRows.reduce((s, c) => s + c.rows, 0)}`)
  if (failed.length) log(`FAILED TABLES (${failed.length}): ${failed.join(', ')}`)
  await src.end()
  await dst.end()
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
