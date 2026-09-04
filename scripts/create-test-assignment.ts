import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
;(async () => {
  // Get teacher
  const teacherUser = await prisma.user.findUnique({ where: { username: 'larry.marongo' } })
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } })
  
  // Get students
  const students = await prisma.student.findMany({ 
    where: { schoolId: teacher.schoolId }, 
    select: { id: true }
  })
  const studentIds = students.map(s => s.id)
  
  console.log('Creating assignment for', studentIds.length, 'students')
  
  // Create assignment with answer key
  const assignment = await prisma.assignment.create({
    data: {
      title: 'Whole Numbers Test',
      description: 'Test your understanding of whole numbers up to 100,000',
      content: JSON.stringify({
        questions: [
          { id: 1, type: 'multiple_choice', text: 'What is the place value of 5 in 53,241?', options: ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten Thousands'], marks: 2 },
          { id: 2, type: 'multiple_choice', text: 'Which number is greater: 45,678 or 45,768?', options: ['45,678', '45,768'], marks: 2 },
          { id: 3, type: 'short_answer', text: 'Write 72,456 in words', marks: 3 },
          { id: 4, type: 'true_false', text: 'Zero is a whole number', marks: 1 },
          { id: 5, type: 'short_answer', text: 'What is the smallest 5-digit number?', marks: 2 }
        ]
      }),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      teacherId: teacher.id,
      subject: 'Mathematics',
      grade: 'Grade 4',
      isTimed: true,
      timeLimit: 30,
      aiGradeable: true,
      answerKey: JSON.stringify({ "1": "Ten Thousands", "2": "45,768", "4": "True", "5": "10000" }),
      students: { connect: studentIds.map(id => ({ id })) }
    },
    include: { students: { include: { user: { select: { username: true } } } } }
  })
  
  console.log('Assignment created:', assignment.id)
  console.log('Title:', assignment.title)
  console.log('Students:', assignment.students.map(s => s.user.username).join(', '))
  console.log('Answer key:', assignment.answerKey)
  console.log('AI Gradeable:', assignment.aiGradeable)
  
  await prisma.$disconnect()
})().catch(e => { console.error(e); process.exit(1) })
