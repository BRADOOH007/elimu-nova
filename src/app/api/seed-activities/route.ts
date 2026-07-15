import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findUnique({
      where: { userId: session.user.id }
    })

    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Create sample activities
    const sampleActivities = [
      {
        schoolId: schoolAdmin.schoolId,
        userId: session.user.id,
        type: 'TEACHER_ENROLLED' as ActivityType,
        action: 'Teacher Enrolled',
        description: 'A new teacher has been enrolled in the system',
        metadata: { teacherName: 'John Doe', department: 'Mathematics' }
      },
      {
        schoolId: schoolAdmin.schoolId,
        userId: session.user.id,
        type: 'STUDENT_ENROLLED' as ActivityType,
        action: 'Student Enrolled',
        description: 'A new student has been enrolled in the system',
        metadata: { studentName: 'Jane Smith', grade: '10th Grade' }
      },
      {
        schoolId: schoolAdmin.schoolId,
        userId: session.user.id,
        type: 'CLASS_CREATED' as ActivityType,
        action: 'Class Created',
        description: 'A new class has been created',
        metadata: { className: 'Mathematics 101', subject: 'Mathematics' }
      },
      {
        schoolId: schoolAdmin.schoolId,
        userId: session.user.id,
        type: 'USER_LOGIN' as ActivityType,
        action: 'User Login',
        description: 'User logged into the system',
        metadata: { loginTime: new Date().toISOString() }
      },
      {
        schoolId: schoolAdmin.schoolId,
        userId: session.user.id,
        type: 'SETTINGS_UPDATED' as ActivityType,
        action: 'Settings Updated',
        description: 'School settings have been updated',
        metadata: { settingType: 'General', updatedBy: session.user.name }
      }
    ]

    // Create activities
    const createdActivities = await prisma.activity.createMany({
      data: sampleActivities
    })

    return NextResponse.json({
      message: 'Sample activities created successfully',
      count: createdActivities.count
    })

  } catch (error) {
    console.error('Error creating sample activities:', error)
    return NextResponse.json(
      { error: 'Failed to create sample activities' },
      { status: 500 }
    )
  }
}