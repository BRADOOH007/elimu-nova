import { prisma } from './prisma'

export async function seedMeetings() {
  try {
    // Get a school admin to use for meetings
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      include: { school: true }
    })

    if (!schoolAdmin) {
      console.log('No school admin found to seed meetings')
      return
    }

    // Create some sample meetings
    const now = new Date()
    const meetings = [
      {
        schoolId: schoolAdmin.schoolId,
        createdBy: schoolAdmin.userId,
        title: 'Weekly Staff Meeting',
        description: 'Regular weekly staff meeting to discuss school updates and upcoming events',
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        time: '09:00',
        duration: 60,
        location: 'Main Conference Room',
        status: 'SCHEDULED' as const,
        attendees: [
          { name: 'John Doe', role: 'Teacher', email: 'john@example.com' },
          { name: 'Jane Smith', role: 'Teacher', email: 'jane@example.com' }
        ]
      },
      {
        schoolId: schoolAdmin.schoolId,
        createdBy: schoolAdmin.userId,
        title: 'Parent-Teacher Conference',
        description: 'Individual parent-teacher conferences to discuss student progress',
        date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        time: '14:00',
        duration: 30,
        location: 'Classroom 101',
        status: 'SCHEDULED' as const,
        attendees: [
          { name: 'Parent A', role: 'Parent', email: 'parent@example.com' }
        ]
      },
      {
        schoolId: schoolAdmin.schoolId,
        createdBy: schoolAdmin.userId,
        title: 'Curriculum Planning Session',
        description: 'Planning session for next term curriculum and lesson plans',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        time: '10:30',
        duration: 90,
        location: 'Library',
        status: 'SCHEDULED' as const,
        attendees: [
          { name: 'Math Teacher', role: 'Teacher', email: 'math@example.com' },
          { name: 'Science Teacher', role: 'Teacher', email: 'science@example.com' }
        ]
      },
      {
        schoolId: schoolAdmin.schoolId,
        createdBy: schoolAdmin.userId,
        title: 'Emergency Staff Meeting',
        description: 'Urgent meeting to discuss safety protocols and emergency procedures',
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        time: '15:00',
        duration: 45,
        location: 'Main Hall',
        status: 'SCHEDULED' as const,
        attendees: [
          { name: 'All Staff', role: 'Staff', email: 'staff@example.com' }
        ]
      },
      {
        schoolId: schoolAdmin.schoolId,
        createdBy: schoolAdmin.userId,
        title: 'Student Assessment Review',
        description: 'Review of student assessments and grading policies',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        time: '11:00',
        duration: 75,
        location: 'Conference Room B',
        status: 'COMPLETED' as const,
        attendees: [
          { name: 'Assessment Team', role: 'Teachers', email: 'assessment@example.com' }
        ]
      }
    ]

    // Clear existing meetings for this school
    await prisma.meeting.deleteMany({
      where: {
        schoolId: schoolAdmin.schoolId
      }
    })

    // Create new meetings
    for (const meeting of meetings) {
      await prisma.meeting.create({
        data: meeting
      })
    }

    console.log(`Created ${meetings.length} sample meetings for school ${schoolAdmin.school.name}`)
  } catch (error) {
    console.error('Error seeding meetings:', error)
  }
}
