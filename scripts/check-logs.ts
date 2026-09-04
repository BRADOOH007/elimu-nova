import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
;(async () => {
  const u = await prisma.user.findUnique({ where: { username: 'maya.wilson' } })
  if (!u) { console.log('USER NOT FOUND'); process.exit(1) }
  const logs = await prisma.securityLog.findMany({ 
    where: { userId: u.id, createdAt: { gt: new Date(Date.now() - 3600000) } }, 
    orderBy: { createdAt: 'desc' }, take: 10 
  })
  console.log('Recent logs (last hour):')
  for (const l of logs) console.log(`${l.createdAt?.toISOString()} ${l.eventType} ${l.description?.slice(0,120)}`)
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
