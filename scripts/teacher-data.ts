import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
;(async () => {
  // Get teacher
  const teacher = await prisma.teacher.findUnique({ 
    where: { userId: (await prisma.user.findUnique({ where: { username: 'larry.marongo' } })).id },
    select: { id: true, schoolId: true }
  })
  console.log('Teacher ID:', teacher.id, '| School:', teacher.schoolId)

  // Get students in teacher's school
  const students = await prisma.student.findMany({ 
    where: { schoolId: teacher.schoolId }, 
    include: { user: { select: { username: true, firstName: true, lastName: true } } },
    take: 5
  })
  console.log('\nStudents:', students.length)
  for (const s of students) console.log(`  ${s.user.username} (${s.user.firstName} ${s.user.lastName}) | id: ${s.id}`)

  // Get classes
  const classes = await prisma.class.findMany({ 
    where: { schoolId: teacher.schoolId }, 
    include: { students: true },
    take: 3
  })
  console.log('\nClasses:', classes.length)
  for (const c of classes) console.log(`  ${c.name} | ${c.students?.length || 0} students | id: ${c.id}`)

  // Existing assignments
  const assignments = await prisma.assignment.findMany({ 
    where: { teacherId: teacher.id }, 
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log('\nAssignments:', assignments.length)
  for (const a of assignments) console.log(`  ${a.title} | type: ${a.type} | submissions: ${a._count.submissions} | id: ${a.id}`)

  // Existing exams
  const exams = await prisma.examSession.findMany({ 
    where: { teacherId: teacher.id }, 
    include: { _count: { select: { violations: true } } },
    orderBy: { createdAt: 'desc' },
    take: 3
  })
  console.log('\nExam Sessions:', exams.length)
  for (const e of exams) console.log(`  ${e.title || e.subject} | status: ${e.status} | violations: ${e._count.violations} | id: ${e.id}`)

  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
