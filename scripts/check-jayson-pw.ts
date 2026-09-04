import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
;(async () => {
  const u = await prisma.user.findUnique({ where: { username: 'jayson.gitehi' }, select: { password: true, isActive: true } })
  console.log('isActive:', u.isActive, '| hasPassword:', !!u.password)
  const ok = await bcrypt.compare('Student123!', u.password || '')
  console.log('Student123! matches:', ok)
  // Try common passwords
  const passwords = ['password', 'Password123!', 'student', 'Student123', 'jayson', 'Jayson123!']
  for (const p of passwords) {
    const m = await bcrypt.compare(p, u.password || '')
    if (m) console.log(`Password match: ${p}`)
  }
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
