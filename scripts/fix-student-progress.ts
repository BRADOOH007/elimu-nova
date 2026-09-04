import { Client } from 'pg'
async function main(){
  const dst = new Client({ connectionString: process.env.BACKUP_DATABASE_URL })
  const src = new Client({ connectionString: process.env.DATABASE_URL })
  await src.connect(); await dst.connect()
  await dst.query(`ALTER TABLE "student_progress" ALTER COLUMN "teacherId" DROP NOT NULL`)
  console.log('backup column made nullable')
  const cols = await src.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='student_progress' ORDER BY ordinal_position`)
  const columnNames = cols.rows.map(c => `"${c.column_name}"`).join(', ')
  const res = await src.query({ text: `SELECT ${columnNames} FROM "student_progress"`, rowMode: 'array', types: { getTypeParser: () => (v:string)=>v } })
  const rows = res.rows as unknown[][]
  const colsN = cols.rows.length
  const CHUNK = 100
  for (let i=0;i<rows.length;i+=CHUNK){
    const batch = rows.slice(i,i+CHUNK)
    const values: unknown[] = []
    const placeholders: string[] = []
    for (let r=0;r<batch.length;r++){
      const ph: string[] = []
      for (let c=0;c<colsN;c++){ values.push(batch[r][c] ?? null); ph.push(`$${values.length}`) }
      placeholders.push(`(${ph.join(', ')})`)
    }
    await dst.query(`INSERT INTO "student_progress" (${columnNames}) VALUES ${placeholders.join(', ')}`, values)
  }
  console.log(`copied ${rows.length} student_progress rows`)
  const c = await dst.query(`SELECT count(*)::int AS c FROM "student_progress"`)
  console.log('backup student_progress count:', c.rows[0].c)
  await src.end(); await dst.end()
}
main().catch(e=>{console.error(e);process.exit(1)})
