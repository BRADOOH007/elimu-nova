import { Client } from 'pg'
import { to, from } from 'pg-copy-streams'
;(async () => {
  const src = new Client({ connectionString: process.env.DATABASE_URL })
  const dst = new Client({ connectionString: process.env.BACKUP_DATABASE_URL })
  await src.connect(); await dst.connect()
  const t0 = Date.now()
  const cols = (await src.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='schools' ORDER BY ordinal_position`)).rows.map((c: any) => `"${c.column_name}"`).join(', ')
  const out = src.query(to(`COPY "schools" (${cols}) TO STDOUT`))
  const into = dst.query(from(`COPY "schools" (${cols}) FROM STDIN`))
  await new Promise((res, rej) => { out.pipe(into); into.on('end', res); into.on('error', rej); out.on('error', rej) })
  const c = await dst.query('SELECT count(*)::int AS c FROM schools')
  console.log('COPY ok, schools =', c.rows[0].c, `${Date.now()-t0}ms`)
  await src.end(); await dst.end()
})().catch(e => { console.error('FATAL', e); process.exit(1) })
