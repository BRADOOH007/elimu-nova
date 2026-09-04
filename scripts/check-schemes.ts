import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
;(async () => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: (await prisma.user.findUnique({ where: { username: 'larry.marongo' } })).id } })
  const schemes = await prisma.schemeOfWork.findMany({ 
    where: { teacherId: teacher.id }, 
    orderBy: { createdAt: 'desc' }, 
    take: 3,
    select: { id: true, title: true, subject: true, grade: true, term: true, createdAt: true, content: true }
  })
  console.log('Schemes found:', schemes.length)
  for (const s of schemes) {
    console.log(`  ${s.id} | ${s.title} | ${s.subject} ${s.grade} ${s.term} | ${s.createdAt?.toISOString()} | content: ${s.content?.length || 0} chars`)
  }
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
