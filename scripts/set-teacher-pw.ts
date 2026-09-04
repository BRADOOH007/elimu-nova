import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
;(async () => {
  const hash = await bcrypt.hash('Teacher123!', 12)
  const u = await prisma.user.update({ 
    where: { username: 'larry.marongo' }, 
    data: { password: hash } 
  })
  console.log(`Password set for ${u.username} (${u.email})`)
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
