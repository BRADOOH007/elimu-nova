import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
;(async () => {
  const s = await prisma.schemeOfWork.findUnique({ 
    where: { id: 'cmsnkflo8000rjr04qsg5rzh3' },
    select: { id: true, title: true, subject: true, grade: true, term: true, content: true, createdAt: true }
  })
  console.log(`Title: ${s.title}`)
  console.log(`Subject: ${s.subject} | Grade: ${s.grade} | Term: ${s.term}`)
  console.log(`Created: ${s.createdAt?.toISOString()}`)
  console.log(`Content length: ${s.content?.length || 0} chars`)
  console.log('\n--- First 800 chars ---')
  console.log(s.content?.slice(0, 800))
  console.log('\n--- Last 400 chars ---')
  console.log(s.content?.slice(-400))
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
