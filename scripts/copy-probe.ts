import { Client, Query } from 'pg'

async function main() {
  const src = new Client({ connectionString: process.env.DATABASE_URL })
  const dst = new Client({ connectionString: process.env.BACKUP_DATABASE_URL })
  await src.connect()
  await dst.connect()

  const table = 'packages'
  const chunks: Buffer[] = []
  const outQ = new Query(`COPY "${table}" TO STDOUT`)
  outQ.on('row', (r: unknown) => console.log('row event:', JSON.stringify(r).slice(0, 120)))
  outQ.on('data', (c: Buffer | string) => { chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)); console.log('data chunk len', chunks[chunks.length - 1].length) })
  outQ.on('end', () => console.log('OUT END'))
  outQ.on('error', (e: Error) => console.log('OUT ERR', e.message))
  src.query(outQ)

  await new Promise<void>(resolve => outQ.on('end', () => resolve()))

  const payload = Buffer.concat(chunks)
  console.log('payload bytes:', payload.length)

  const inQ = new Query(`COPY "${table}" FROM STDIN`)
  inQ.on('end', () => console.log('IN END'))
  inQ.on('error', (e: Error) => console.log('IN ERR', e.message))
  dst.query(inQ)
  inQ.write(payload)
  inQ.end()
  await new Promise<void>(resolve => inQ.on('end', () => resolve()))

  const c = await dst.query(`SELECT count(*)::int AS c FROM "${table}"`)
  console.log('target count:', c.rows[0].c)
  await src.end(); await dst.end()
}
main().catch(e => { console.error('FATAL', e); process.exit(1) })
