import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTeacherContent() {
  try {
    console.log('🔍 Checking teacher content for larrymarongo7@gmail.com\n')

    // Find the teacher
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: {
          email: 'larrymarongo7@gmail.com'
        }
      },
      include: {
        user: true,
        lessonPlans: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        schemesOfWork: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        students: {
          include: {
            user: true,
            class: true
          }
        }
      }
    })

    if (!teacher) {
      console.log('❌ Teacher not found')
      return
    }

    console.log('✅ Teacher found:', teacher.user.name)
    console.log('   Email:', teacher.user.email)
    console.log('   Teacher ID:', teacher.id)
    console.log('\n📚 LESSON PLANS:')
    
    if (teacher.lessonPlans.length === 0) {
      console.log('   No lesson plans found')
    } else {
      teacher.lessonPlans.forEach((plan, index) => {
        console.log(`\n   ${index + 1}. ${plan.title}`)
        console.log(`      Subject: ${plan.subject}`)
        console.log(`      Grade: ${plan.gradeLevel}`)
        console.log(`      Created: ${plan.createdAt.toLocaleDateString()}`)
        console.log(`      ID: ${plan.id}`)
      })
    }

    console.log('\n📖 SCHEMES OF WORK:')
    
    if (teacher.schemesOfWork.length === 0) {
      console.log('   No schemes of work found')
    } else {
      teacher.schemesOfWork.forEach((scheme, index) => {
        console.log(`\n   ${index + 1}. ${scheme.title}`)
        console.log(`      Subject: ${scheme.subject}`)
        console.log(`      Grade: ${scheme.gradeLevel}`)
        console.log(`      Created: ${scheme.createdAt.toLocaleDateString()}`)
        console.log(`      ID: ${scheme.id}`)
      })
    }

    console.log('\n👨‍🎓 STUDENTS:')
    
    if (teacher.students.length === 0) {
      console.log('   No students found')
    } else {
      teacher.students.forEach((student, index) => {
        console.log(`\n   ${index + 1}. ${student.user.name}`)
        console.log(`      Email: ${student.user.email}`)
        console.log(`      Class: ${student.class?.name || 'No class'}`)
        console.log(`      Student ID: ${student.id}`)
      })
    }

    // Check what the AI tutor is currently showing
    console.log('\n🤖 CHECKING AI TUTOR CURRENT TASK:')
    
    if (teacher.students.length > 0) {
      const firstStudent = teacher.students[0]
      
      // Check recent tutor sessions
      const recentSessions = await prisma.tutorSession.findMany({
        where: {
          studentId: firstStudent.id
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      })

      if (recentSessions.length > 0) {
        console.log('\n   Recent tutor sessions:')
        recentSessions.forEach((session, index) => {
          console.log(`\n   ${index + 1}. Subject: ${session.subject}`)
          console.log(`      Topic: ${session.topic}`)
          console.log(`      Mode: ${session.mode}`)
          console.log(`      Lesson Plan ID: ${session.lessonPlanId || 'None'}`)
          console.log(`      Scheme ID: ${session.schemeOfWorkId || 'None'}`)
          console.log(`      Created: ${session.createdAt.toLocaleString()}`)
        })
      } else {
        console.log('   No tutor sessions found')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTeacherContent()
