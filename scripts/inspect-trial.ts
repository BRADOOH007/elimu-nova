import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Parents
  const parents = await prisma.parent.findMany({
    include: {
      user: { select: { id: true, username: true, firstName: true, lastName: true, role: true, isActive: true } },
      students: { include: { student: { include: { user: { select: { username: true, isActive: true } } } } } },
    },
  })

  for (const p of parents) {
    console.log(`\n=== PARENT: ${p.user.firstName} ${p.user.lastName} (@${p.user.username}) id=${p.id} userId=${p.userId} active=${p.user.isActive}`)
    const subs = await prisma.subscription.findMany({ where: { userId: p.userId }, orderBy: { createdAt: 'desc' } })
    for (const s of subs) {
      console.log(`   SUB: status=${s.status} type=${s.type} isTrial=${s.isTrial} start=${s.startDate?.toISOString()} end=${s.endDate?.toISOString()} amt=${s.amount}`)
    }
    for (const link of p.students) {
      const st = link.student
      console.log(`   CHILD: ${st.user.username} (${st.user.isActive ? 'active' : 'INACTIVE'}) studentId=${st.id} schoolId=${st.schoolId || 'none'} linkedAt=${link.createdAt?.toISOString()}`)
      const ssub = await prisma.subscription.findMany({ where: { userId: st.userId }, orderBy: { createdAt: 'desc' } })
      for (const s of ssub) console.log(`      CHILDSUB: status=${s.status} type=${s.type} isTrial=${s.isTrial} end=${s.endDate?.toISOString()}`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
