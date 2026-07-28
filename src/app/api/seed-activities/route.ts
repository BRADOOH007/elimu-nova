import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id }
  })

  if (!schoolAdmin) {
    return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
  }

  const sampleActivities = [
    {
      schoolId: schoolAdmin.schoolId,
      userId: user.id,
      type: 'TEACHER_ENROLLED' as ActivityType,
      action: 'Teacher Enrolled',
      description: 'A new teacher has been enrolled in the system',
      metadata: { teacherName: 'John Doe', department: 'Mathematics' }
    },
    {
      schoolId: schoolAdmin.schoolId,
      userId: user.id,
      type: 'STUDENT_ENROLLED' as ActivityType,
      action: 'Student Enrolled',
      description: 'A new student has been enrolled in the system',
      metadata: { studentName: 'Jane Smith', grade: '10th Grade' }
    },
    {
      schoolId: schoolAdmin.schoolId,
      userId: user.id,
      type: 'CLASS_CREATED' as ActivityType,
      action: 'Class Created',
      description: 'A new class has been created',
      metadata: { className: 'Mathematics 101', subject: 'Mathematics' }
    },
    {
      schoolId: schoolAdmin.schoolId,
      userId: user.id,
      type: 'USER_LOGIN' as ActivityType,
      action: 'User Login',
      description: 'User logged into the system',
      metadata: { loginTime: new Date().toISOString() }
    },
    {
      schoolId: schoolAdmin.schoolId,
      userId: user.id,
      type: 'SETTINGS_UPDATED' as ActivityType,
      action: 'Settings Updated',
      description: 'School settings have been updated',
      metadata: { settingType: 'General', updatedBy: user.name }
    }
  ]

  const createdActivities = await prisma.activity.createMany({
    data: sampleActivities
  })

  return NextResponse.json({
    message: 'Sample activities created successfully',
    count: createdActivities.count
  })
})
