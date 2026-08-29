import { Client } from 'pg'
import { to as copyTo, from as copyFrom } from 'pg-copy-streams'
import { pipeline } from 'stream/promises'

export interface BackupStats {
  tables: number
  tablesWithData: number
  totalRows: number
  failures: string[]
  durationMs: number
}

function log(m: string) {
  console.log(`[db-backup] ${m}`)
}

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

// If the source column is nullable but the target column is NOT NULL, relax the
// target so inserts never violate constraints (schema drift safety).
async function syncColumnNullability(src: Client, dst: Client, table: string): Promise<void> {
  const q = `SELECT column_name, is_nullable FROM information_schema.columns
             WHERE table_schema='public' AND table_name=$1`
  const [srcCols, dstCols] = await Promise.all([src.query(q, [table]), dst.query(q, [table])])
  const dstNullable = new Map(dstCols.rows.map((r: { column_name: string; is_nullable: string }) => [r.column_name, r.is_nullable === 'YES']))
  for (const c of srcCols.rows as { column_name: string; is_nullable: string }[]) {
    if (c.is_nullable === 'YES' && dstNullable.get(c.column_name) === false) {
      await dst.query(`ALTER TABLE "${table}" ALTER COLUMN "${c.column_name}" DROP NOT NULL`)
      log(`${table}.${c.column_name}: dropped NOT NULL (drift fix)`)
    }
  }
}

async function copyTable(src: Client, dst: Client, table: string, columnNames: string, rows: number): Promise<void> {
  if (rows === 0) return

  const out = src.query(copyTo(`COPY "${table}" (${columnNames}) TO STDOUT`))
  const into = dst.query(copyFrom(`COPY "${table}" (${columnNames}) FROM STDIN`))
  await pipeline(out, into)
}

export async function runDbBackup(mainUrl?: string, backupUrl?: string): Promise<BackupStats> {
  const start = Date.now()
  const MAIN_URL = mainUrl || process.env.DATABASE_URL || ''
  const BACKUP_URL = backupUrl || process.env.BACKUP_DATABASE_URL || ''
  if (!MAIN_URL || !BACKUP_URL) throw new Error('DATABASE_URL and BACKUP_DATABASE_URL are required')

  const src = new Client({ connectionString: MAIN_URL })
  const dst = new Client({ connectionString: BACKUP_URL })
  await src.connect()
  await dst.connect()
  log('Connected to both databases')

  const order = await topoSort(src)
  log(`Copying ${order.length} tables in FK-safe order`)

  // Batch metadata: all column names + all row counts in 2 queries instead of 2/table.
  const colRes = await src.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema='public' ORDER BY table_name, ordinal_position`)
  const colsByTable = new Map<string, string[]>()
  for (const c of colRes.rows) {
    const arr = colsByTable.get(c.table_name) || []
    arr.push(`"${c.column_name}"`)
    colsByTable.set(c.table_name, arr)
  }
  const countRes = await src.query<{ table_name: string; c: string }>(
    `SELECT table_name, (xpath('/row/c/text()', query_to_xml('SELECT count(*) AS c FROM "' || table_name || '"', false, true, '')))[1]::text::int AS c
     FROM information_schema.tables WHERE table_schema='public'`)
  const counts = new Map(countRes.rows.map(r => [r.table_name, r.c]))

  const stats: BackupStats = { tables: order.length, tablesWithData: 0, totalRows: 0, failures: [], durationMs: 0 }

  await dst.query('BEGIN')
  try {
    // Reset target so the script is re-runnable; wrap in a transaction so a
    // mid-way failure rolls back and leaves the previous backup intact.
    const reset = order.map(t => `"${t}"`).join(', ')
    await dst.query(`TRUNCATE ${reset} RESTART IDENTITY CASCADE`)

    for (const table of order) {
      try {
        await syncColumnNullability(src, dst, table)
        const rows = parseInt(counts.get(table) || '0', 10)
        await copyTable(src, dst, table, (colsByTable.get(table) || []).join(', '), rows)
        stats.totalRows += rows
        if (rows > 0) { stats.tablesWithData++; log(`${table}: +${rows}`) }
      } catch (e) {
        stats.failures.push(table)
        log(`${table}: FAILED — ${(e as Error).message.slice(0, 200)}`)
      }
    }
    await dst.query('COMMIT')
  } catch (e) {
    await dst.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    await src.end()
    await dst.end()
  }

  stats.durationMs = Date.now() - start
  log(`BACKUP COMPLETE — tables with data: ${stats.tablesWithData}/${stats.tables}, total rows: ${stats.totalRows}, ${stats.durationMs}ms`)
  if (stats.failures.length) log(`FAILED TABLES (${stats.failures.length}): ${stats.failures.join(', ')}`)
  return stats
}
