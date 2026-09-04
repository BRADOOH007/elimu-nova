import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { decryptPassword } from '../src/lib/password-encryption'

const prisma = new PrismaClient()

async function main() {
  const usernames = ['maya.wilson', 'liam.wilson', 'emma.davis', 'noah.davis', 'emma.davis.msm7uzr01', 'aj.chuck', 'oj.simpson', 'willy.amon', 'zara.hassan', 'don.huska']
  for (const u of usernames) {
    const user = await prisma.user.findUnique({ where: { username: u }, select: { id: true, username: true, address: true } })
    if (!user) { console.log(u + ': NOT FOUND'); continue }
    const pwd = decryptPassword(user.address || '')
    console.log(u + ': userId=' + user.id + ' password=' + (pwd || '(none encrypted)'))
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
