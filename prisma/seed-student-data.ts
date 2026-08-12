/* eslint-disable */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding student dashboard data...')

  // Find Rael Wanjiku (the student we found earlier)
  const raelStudent = await prisma.student.findFirst({
    where: {
      user: {
        firstName: 'Rael',
        lastName: 'Wanjiku'
      }
    },
    include: {
      user: true,
      school: true,
      teacher: {
        include: {
          user: true
        }
      }
    }
  })

  if (!raelStudent) {
    console.log('❌ Rael Wanjiku not found. Please ensure the student exists.')
    return
  }

  console.log(`✅ Found student: ${raelStudent.user.firstName} ${raelStudent.user.lastName}`)

  // Create sample assignments
  const assignments = await Promise.all([
    prisma.assignment.create({
      data: {
        title: 'Mathematics Problem Set - Algebra',
        description: 'Solve the following algebraic equations and show your work',
        content: JSON.stringify({
          problems: [
            'Solve for x: 2x + 5 = 13',
            'Simplify: 3(x + 2) - 2(x - 1)',
            'Find the slope of the line passing through (2, 3) and (4, 7)'
          ]
        }),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        teacherId: raelStudent.teacherId ?? "",
        students: {
          connect: { id: raelStudent.id }
        }
      }
    }),
    prisma.assignment.create({
      data: {
        title: 'Science Lab Report - Photosynthesis',
        description: 'Write a lab report on the photosynthesis experiment conducted in class',
        content: JSON.stringify({
          requirements: [
            'Hypothesis',
            'Materials and Methods',
            'Results and Observations',
            'Conclusion'
          ]
        }),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        teacherId: raelStudent.teacherId ?? "",
        students: {
          connect: { id: raelStudent.id }
        }
      }
    }),
    prisma.assignment.create({
      data: {
        title: 'English Essay - Creative Writing',
        description: 'Write a 500-word creative story on the topic "A Day in the Future"',
        content: JSON.stringify({
          requirements: [
            '500 words minimum',
            'Creative and original',
            'Proper grammar and spelling',
            'Clear narrative structure'
          ]
        }),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
        teacherId: raelStudent.teacherId ?? "",
        students: {
          connect: { id: raelStudent.id }
        }
      }
    })
  ])

  // Create submissions for some assignments
  await prisma.submission.create({
    data: {
      content: JSON.stringify({
        answers: [
          'x = 4',
          'x + 8',
          'slope = 2'
        ]
      }),
      grade: 85,
      feedback: 'Good work! Make sure to show all steps clearly.',
      status: 'GRADED',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      studentId: raelStudent.id,
      assignmentId: assignments[0].id
    }
  })

  await prisma.submission.create({
    data: {
      content: JSON.stringify({
        report: 'The photosynthesis experiment showed that plants produce oxygen when exposed to light...'
      }),
      grade: 92,
      feedback: 'Excellent report! Very detailed observations and analysis.',
      status: 'GRADED',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      studentId: raelStudent.id,
      assignmentId: assignments[1].id
    }
  })

  // Create study sessions
  const studySessions = await Promise.all([
    prisma.studySession.create({
      data: {
        studentId: raelStudent.id,
        subject: 'Mathematics',
        topic: 'Algebra',
        duration: 45, // 45 minutes
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        notes: 'Worked on solving linear equations. Need to practice more with fractions.'
      }
    }),
    prisma.studySession.create({
      data: {
        studentId: raelStudent.id,
        subject: 'Science',
        topic: 'Photosynthesis',
        duration: 60, // 60 minutes
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        notes: 'Reviewed the process of photosynthesis and prepared for lab report.'
      }
    }),
    prisma.studySession.create({
      data: {
        studentId: raelStudent.id,
        subject: 'English',
        topic: 'Creative Writing',
        duration: 30, // 30 minutes
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        endTime: new Date(Date.now() - 3 * 60 * 60 * 1000 + 30 * 60 * 1000),
        notes: 'Started brainstorming ideas for the creative writing assignment.'
      }
    })
  ])

  // Create AI tutor sessions
  const aiTutorSessions = await Promise.all([
    prisma.aITutorSession.create({
      data: {
        studentId: raelStudent.id,
        sessionType: 'assignment_help',
        subject: 'Mathematics',
        topic: 'Algebra',
        question: 'I\'m having trouble solving 2x + 5 = 13. Can you help me understand the steps?',
        response: 'Of course! Let me break down the steps to solve 2x + 5 = 13:\n\n1. First, we need to isolate the variable x by getting rid of the constant term (5)\n2. Subtract 5 from both sides: 2x + 5 - 5 = 13 - 5\n3. This gives us: 2x = 8\n4. Now, to solve for x, divide both sides by 2: 2x ÷ 2 = 8 ÷ 2\n5. Therefore: x = 4\n\nYou can verify this by substituting x = 4 back into the original equation: 2(4) + 5 = 8 + 5 = 13 ✓',
        context: JSON.stringify({
          currentAssignment: 'Mathematics Problem Set - Algebra',
          recentStudySessions: ['Algebra review session']
        }),
        rating: 5,
        isHelpful: true
      }
    }),
    prisma.aITutorSession.create({
      data: {
        studentId: raelStudent.id,
        sessionType: 'lesson',
        subject: 'Science',
        topic: 'Photosynthesis',
        question: 'Can you explain photosynthesis in simple terms?',
        response: 'Photosynthesis is like a plant\'s kitchen! Here\'s how it works:\n\n1. Plants take in sunlight (energy), water from their roots, and carbon dioxide from the air\n2. Using these ingredients, they make their own food (glucose) and release oxygen as a byproduct\n3. The chemical equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\nThink of it as plants "cooking" their food using sunlight as the stove! This process is crucial because it produces the oxygen we breathe and removes carbon dioxide from the atmosphere.',
        context: JSON.stringify({
          currentAssignment: 'Science Lab Report - Photosynthesis',
          grade: 'Grade 9'
        }),
        rating: 4,
        isHelpful: true
      }
    }),
    prisma.aITutorSession.create({
      data: {
        studentId: raelStudent.id,
        sessionType: 'progress_review',
        subject: null,
        topic: null,
        question: 'How am I doing overall? Any areas I should focus on?',
        response: 'Based on your recent activity, you\'re doing great! Here\'s what I\'ve noticed:\n\n✅ **Strengths:**\n- Consistent study sessions (45-60 minutes each)\n- Good grades on recent assignments (85% in Math, 92% in Science)\n- Proactive in asking for help when needed\n\n📈 **Areas to focus on:**\n- Complete your overdue English essay\n- Practice more algebra problems with fractions\n- Consider setting up a study schedule to avoid last-minute work\n\nKeep up the excellent work! You\'re showing great initiative in your learning.',
        context: JSON.stringify({
          recentGrades: [85, 92],
          studyTime: '2.25 hours this week',
          pendingAssignments: 1
        }),
        rating: 5,
        isHelpful: true
      }
    })
  ])

  // Create or update student analytics
  const totalStudyTime = studySessions.reduce((total, session) => total + session.duration, 0)
  const averageGrade = (85 + 92) / 2 // Average of the two graded assignments

  await prisma.studentAnalytics.upsert({
    where: { studentId: raelStudent.id },
    update: {
      totalStudyTime,
      averageGrade,
      completedAssignments: 2,
      pendingAssignments: 1,
      overdueAssignments: 1,
      lastActiveDate: new Date(),
      streakDays: 3,
      longestStreak: 5,
      weeklyGoal: 300, // 5 hours per week
      monthlyGoal: 1200 // 20 hours per month
    },
    create: {
      studentId: raelStudent.id,
      totalStudyTime,
      averageGrade,
      completedAssignments: 2,
      pendingAssignments: 1,
      overdueAssignments: 1,
      lastActiveDate: new Date(),
      streakDays: 3,
      longestStreak: 5,
      weeklyGoal: 300,
      monthlyGoal: 1200
    }
  })

  // Create some schedules for upcoming lessons
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await Promise.all([
    prisma.schedule.create({
      data: {
        schoolId: raelStudent.schoolId ?? "",
        teacherId: raelStudent.teacherId ?? "",
        title: 'Mathematics Class',
        description: 'Algebra Basics and Problem Solving',
        subject: 'Mathematics',
        grade: 'Grade 9',
        startTime: new Date(tomorrow.setHours(9, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
        location: 'Room 101',
        type: 'CLASS',
        status: 'SCHEDULED'
      }
    }),
    prisma.schedule.create({
      data: {
        schoolId: raelStudent.schoolId ?? "",
        teacherId: raelStudent.teacherId ?? "",
        title: 'Science Class',
        description: 'Photosynthesis and Plant Biology',
        subject: 'Science',
        grade: 'Grade 9',
        startTime: new Date(tomorrow.setHours(10, 30, 0, 0)),
        endTime: new Date(tomorrow.setHours(11, 30, 0, 0)),
        location: 'Lab 2',
        type: 'CLASS',
        status: 'SCHEDULED'
      }
    }),
    prisma.schedule.create({
      data: {
        schoolId: raelStudent.schoolId ?? "",
        teacherId: raelStudent.teacherId ?? "",
        title: 'English Class',
        description: 'Creative Writing Workshop',
        subject: 'English',
        grade: 'Grade 9',
        startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
        location: 'Room 203',
        type: 'CLASS',
        status: 'SCHEDULED'
      }
    })
  ])

  console.log('✅ Student dashboard data seeded successfully!')
  console.log(`📊 Created ${assignments.length} assignments`)
  console.log(`📚 Created ${studySessions.length} study sessions`)
  console.log(`🤖 Created ${aiTutorSessions.length} AI tutor sessions`)
  console.log(`📈 Updated student analytics`)
  console.log(`📅 Created upcoming lessons`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
