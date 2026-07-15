import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentIds, classIds } = await request.json()
    const contentId = (await params).id

    // Validate input
    if ((!studentIds || studentIds.length === 0) && (!classIds || classIds.length === 0)) {
      return NextResponse.json(
        { error: 'At least one student or class must be selected for sharing' },
        { status: 400 }
      )
    }

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Verify the content exists and belongs to the teacher
    const content = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: contentId,
        teacherId: teacher.id
      }
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found or access denied' },
        { status: 404 }
      )
    }

    // Remove existing sharing records for this content
    await prisma.sharedAIContent.deleteMany({
      where: { contentId }
    })

    const sharingRecords = []

    // Share with individual students
    if (studentIds && studentIds.length > 0) {
      for (const studentId of studentIds) {
        // Verify student exists and belongs to teacher's school
        const student = await prisma.student.findFirst({
          where: {
            id: studentId,
            school: {
              teachers: {
                some: { id: teacher.id }
              }
            }
          }
        })

        if (student) {
          const sharedRecord = await prisma.sharedAIContent.create({
            data: {
              contentId,
              studentId,
              sharedAt: new Date()
            }
          })
          sharingRecords.push(sharedRecord)
        }
      }
    }

    // Share with classes
    if (classIds && classIds.length > 0) {
      for (const classId of classIds) {
        // Verify class exists and belongs to teacher's school
        const schoolClass = await prisma.class.findFirst({
          where: {
            id: classId,
            school: {
              teachers: {
                some: { id: teacher.id }
              }
            }
          }
        })

        if (schoolClass) {
          const sharedRecord = await prisma.sharedAIContentWithClass.create({
            data: {
              contentId,
              classId,
              sharedAt: new Date()
            }
          })
          sharingRecords.push(sharedRecord)

          // Also share with all students in the class
          const classStudents = await prisma.student.findMany({
            where: { classId }
          })

          for (const student of classStudents) {
            // Check if already shared individually to avoid duplicates
            const existingShare = await prisma.sharedAIContent.findFirst({
              where: {
                contentId,
                studentId: student.id
              }
            })

            if (!existingShare) {
              const studentSharedRecord = await prisma.sharedAIContent.create({
                data: {
                  contentId,
                  studentId: student.id,
                  sharedAt: new Date()
                }
              })
              sharingRecords.push(studentSharedRecord)
            }
          }
        }
      }
    }

    // Update the content to mark as shared
    await prisma.aIGeneratedContent.update({
      where: { id: contentId },
      data: { isShared: true }
    })

    // Get sharing summary
    const totalSharedStudents = await prisma.sharedAIContent.count({
      where: {
        contentId
      }
    })

    const totalSharedClasses = await prisma.sharedAIContentWithClass.count({
      where: {
        contentId
      }
    })

    return NextResponse.json({
      message: 'Content shared successfully',
      summary: {
        totalStudents: totalSharedStudents,
        totalClasses: totalSharedClasses,
        sharingRecords: sharingRecords.length
      }
    })

  } catch (error) {
    console.error('Error sharing content:', error)
    return NextResponse.json(
      { error: 'Failed to share content' },
      { status: 500 }
    )
  }
}