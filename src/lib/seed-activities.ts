import { prisma } from './prisma'

export async function seedActivities() {
  try {
    // Get a teacher to use for activities
    const teacher = await prisma.teacher.findFirst({
      include: { user: true }
    })

    if (!teacher || !teacher.schoolId) {
      console.log('No teacher found to seed activities')
      return
    }

    // Create some sample activities
    const activities = [
      {
        schoolId: teacher.schoolId,
        userId: teacher.userId,
        type: 'OTHER' as const,
        action: 'Lesson Plan Created',
        description: 'Created lesson plan "Introduction to Algebra" for Mathematics',
        metadata: { 
          lessonPlanTitle: 'Introduction to Algebra', 
          subject: 'Mathematics',
          activityType: 'lesson_plan'
        }
      },
      {
        schoolId: teacher.schoolId,
        userId: teacher.userId,
        type: 'OTHER' as const,
        action: 'Scheme of Work Created',
        description: 'Created scheme of work "Grade 8 Mathematics Term 1" for Mathematics',
        metadata: { 
          schemeTitle: 'Grade 8 Mathematics Term 1', 
          subject: 'Mathematics',
          activityType: 'scheme_of_work'
        }
      },
      {
        schoolId: teacher.schoolId,
        userId: teacher.userId,
        type: 'STUDENT_ENROLLED' as const,
        action: 'Student Enrolled',
        description: 'New student John Doe has been enrolled in class 8A',
        metadata: { 
          studentName: 'John Doe',
          className: '8A'
        }
      },
      {
        schoolId: teacher.schoolId,
        userId: teacher.userId,
        type: 'MEETING_SCHEDULED' as const,
        action: 'Meeting Scheduled',
        description: 'Meeting "Parent-Teacher Conference" scheduled for 2024-01-15',
        metadata: { 
          meetingTitle: 'Parent-Teacher Conference',
          date: '2024-01-15'
        }
      },
      {
        schoolId: teacher.schoolId,
        userId: teacher.userId,
        type: 'OTHER' as const,
        action: 'Assignment Created',
        description: 'Created assignment "Algebra Practice Problems" for Mathematics',
        metadata: { 
          assignmentTitle: 'Algebra Practice Problems',
          subject: 'Mathematics',
          activityType: 'assignment'
        }
      }
    ]

    // Clear existing activities for this teacher
    await prisma.activity.deleteMany({
      where: {
        schoolId: teacher.schoolId,
        userId: teacher.userId
      }
    })

    // Create new activities
    for (const activity of activities) {
      await prisma.activity.create({
        data: activity
      })
    }

    console.log(`Created ${activities.length} sample activities for teacher ${teacher.user.firstName} ${teacher.user.lastName}`)
  } catch (error) {
    console.error('Error seeding activities:', error)
  }
}
