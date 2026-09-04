import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  const m = await import('@prisma/client')
  const p: any = new m.PrismaClient()
  const r: any = await p.systemSettings.findUnique({ where: { key: 'ai_provider_groq_key' } })
  const hexLen = r.value.split('.')[2].length
  console.log('groq plaintext length implied:', hexLen / 2, '(56=single, 113=both keys)')
  await p.$disconnect()
}
main()
