import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
;(async () => {
  const a = await prisma.assignment.findUnique({ where: { id: 'cmsnlb0fm0001oe9scqkm4y5q' } })
  console.log('=== ASSIGNMENT ===')
  console.log('title:', a.title)
  console.log('type:', a.type)
  console.log('answerKey:', a.answerKey)
  console.log('questions (first 2500 chars):')
  console.log(JSON.stringify(a.questions, null, 2)?.slice(0, 2500))
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
