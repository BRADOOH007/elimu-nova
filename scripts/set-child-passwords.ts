import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const targets = ['maya.wilson', 'liam.wilson']
  for (const u of targets) {
    const user = await prisma.user.findUnique({ where: { username: u } })
    if (!user) { console.log(u + ': NOT FOUND'); continue }
    const hashed = await bcrypt.hash('Student123!', 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, isActive: true } })
    console.log(u + ': password set to Student123! isActive=true')
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
