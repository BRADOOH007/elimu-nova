import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
;(async () => {
  const hash = await bcrypt.hash('Student123!', 12)
  await prisma.user.update({ where: { username: 'jayson.gitehi' }, data: { password: hash } })
  console.log('Password set for jayson.gitehi')
  // Verify
  const u = await prisma.user.findUnique({ where: { username: 'jayson.gitehi' }, select: { password: true } })
  const ok = await bcrypt.compare('Student123!', u.password)
  console.log('Verified:', ok)
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
