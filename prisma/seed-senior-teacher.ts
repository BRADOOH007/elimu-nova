import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const p = new PrismaClient()
  const hashed = await bcrypt.hash('password123', 12)
  const user = await p.user.upsert({
    where: { email: 'instructor@elimunova.ai' },
    update: {},
    create: {
      email: 'instructor@elimunova.ai',
      password: hashed,
      firstName: 'Grace',
      lastName: 'Instructor',
      username: 'grace.instructor',
      role: 'SENIOR_TEACHER',
      isActive: true,
    },
  })
  await p.seniorTeacher.upsert({
    where: { userId: user.id },
    update: { specialties: ['Mathematical Reasoning', 'Computer Literacy'] },
    create: { userId: user.id, specialties: ['Mathematical Reasoning', 'Computer Literacy'] },
  })
  console.log('✅ Demo senior teacher ready: instructor@elimunova.ai / password123')
  await p.$disconnect()
}

main().catch((e) => { console.error(e.message); process.exit(1) })
