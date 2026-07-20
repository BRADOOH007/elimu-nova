import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
try {
  const count = await p.user.count()
  console.log('Total users:', count)
  const teachers = await p.user.findMany({ where: { role: 'TEACHER' }, select: { email: true, firstName: true, lastName: true, role: true } })
  console.log('Teachers:', JSON.stringify(teachers, null, 2))
  const students = await p.user.findMany({ where: { role: 'STUDENT' }, select: { email: true, firstName: true, lastName: true, role: true }, take: 3 })
  console.log('Students (first 3):', JSON.stringify(students, null, 2))
} finally {
  await p.$disconnect()
}
