import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
;(async () => {
  const a = await prisma.assignment.findUnique({ where: { id: 'cmsnlb0fm0001oe9scqkm4y5q' } })
  console.log('content length:', a.content?.length)
  console.log(a.content?.slice(0, 3000))
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
