import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const users = await p.user.findMany({
    where: { email: { in: ['admin@elimunova.ai', 'admin@demoschool.edu', 'teacher@demoschool.edu', 'student@demoschool.edu'] } },
    select: { email: true, role: true }
  })
  console.log(JSON.stringify(users, null, 2))
  console.log('Total users:', await p.user.count())
}
main().catch(console.error).finally(() => p.$disconnect())
