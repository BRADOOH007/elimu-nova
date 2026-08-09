import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    where: { deletedAt: null },
    take: 15,
    select: {
      id: true,
      classId: true,
      teacherId: true,
      class: { select: { id: true, name: true, teacherId: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  })
  console.log('=== STUDENTS (class vs teacher) ===')
  for (const s of students) {
    console.log(`${s.user.firstName} ${s.user.lastName} | student.teacherId=${s.teacherId ?? 'NULL'} | class=${s.class?.name ?? 'NONE'} | class.teacherId=${s.class?.teacherId ?? 'NULL'}`)
  }

  const classes = await prisma.class.findMany({
    where: { deletedAt: null },
    take: 10,
    select: { id: true, name: true, teacherId: true, _count: { select: { students: true } } },
  })
  console.log('\n=== CLASSES ===')
  for (const c of classes) {
    console.log(`${c.name} | teacherId=${c.teacherId ?? 'NULL'} | students=${c._count.students}`)
  }

  const teachers = await prisma.teacher.findMany({
    take: 10,
    select: { id: true, schoolId: true, user: { select: { firstName: true, lastName: true, email: true, role: true } } },
  })
  console.log('\n=== TEACHERS ===')
  for (const t of teachers) {
    console.log(`${t.user.firstName} ${t.user.lastName} | ${t.user.email} | role=${t.user.role} | schoolId=${t.schoolId ?? 'NULL'}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
