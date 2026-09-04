import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
;(async () => {
  const teachers = await prisma.teacher.findMany({ 
    include: { user: { select: { username: true, email: true, isActive: true, password: true } } }, 
    take: 3 
  })
  for (const t of teachers) {
    console.log(`Teacher: ${t.user.username} | ${t.user.email} | active: ${t.user.isActive} | schoolId: ${t.schoolId} | hasPassword: ${!!t.user.password}`)
  }
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
