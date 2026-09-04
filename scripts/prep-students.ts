import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
;(async () => {
  // Get a student from the assignment
  const assignment = await prisma.assignment.findUnique({
    where: { id: 'cmsnlb0fm0001oe9scqkm4y5q' },
    include: { 
      students: { 
        include: { user: { select: { id: true, username: true, email: true, password: true } } },
        take: 3
      }
    }
  })
  
  console.log('Assignment students:')
  for (const s of assignment.students.slice(0, 3)) {
    console.log(`  ${s.user.username} | id: ${s.user.id} | studentId: ${s.id} | hasPassword: ${!!s.user.password}`)
    // Set password if not set
    if (!s.user.password) {
      const hash = await bcrypt.hash('Student123!', 12)
      await prisma.user.update({ where: { id: s.user.id }, data: { password: hash } })
      console.log(`    → Password set to Student123!`)
    }
  }
  
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
