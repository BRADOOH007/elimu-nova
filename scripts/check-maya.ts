import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
;(async () => {
  const u = await prisma.user.findUnique({ where: { username: 'maya.wilson' } })
  if (!u) { console.log('USER NOT FOUND'); process.exit(1) }
  console.log('id:', u.id)
  console.log('username:', u.username, '| email:', u.email, '| role:', u.role)
  console.log('isActive:', u.isActive, '| loginAttempts:', u.loginAttempts, '| lockedUntil:', u.lockedUntil)
  console.log('password set:', !!u.password)
  const ok = await bcrypt.compare('Student123!', u.password || '')
  console.log('bcrypt Student123! match:', ok)
  const attempts = ['Student123!', 'student123!', 'Student123', 'student123']
  const last = await prisma.securityLog.findMany({ where: { userId: u.id, eventType: { in: ['LOGIN_FAILED','LOGIN_SUCCESS','ACCOUNT_LOCKED'] } }, orderBy: { createdAt: 'desc' }, take: 5 })
  console.log('--- recent security logs ---')
  for (const l of last) console.log(`${l.createdAt?.toISOString()} ${l.eventType} ${l.description}`)
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
