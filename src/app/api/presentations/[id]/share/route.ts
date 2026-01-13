import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Share a presentation with students or classes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { studentIds, classId } = await request.json()

    // Verify presentation exists and belongs to teacher
    const presentation = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: params.id,
        teacherId: teacher.id,
        type: 'POWERPOINT'
      }
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    let sharedCount = 0

    // Share with entire class if classId is provided
    if (classId) {
      // Verify teacher owns the class
      const classExists = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: teacher.id
        }
      })

      if (!classExists) {
        return NextResponse.json({ 
          error: 'Class not found or you do not have permission' 
        }, { status: 404 })
      }

      // Check if already shared with this class
      const existingShare = await prisma.sharedAIContentWithClass.findFirst({
        where: {
          contentId: params.id,
          classId: classId
        }
      })

      if (!existingShare) {
        await prisma.sharedAIContentWithClass.create({
          data: {
            contentId: params.id,
            classId: classId
          }
        })
        sharedCount++
      }
    }

    // Share with individual students if studentIds are provided
    if (studentIds && studentIds.length > 0) {
      for (const studentId of studentIds) {
        // Verify student exists and belongs to teacher's school
        const student = await prisma.student.findFirst({
          where: {
            id: studentId,
            schoolId: teacher.schoolId
          }
        })

        if (student) {
          // Check if already shared with this student
          const existingShare = await prisma.sharedAIContent.findFirst({
            where: {
              contentId: params.id,
              studentId: studentId
            }
          })

          if (!existingShare) {
            await prisma.sharedAIContent.create({
              data: {
                contentId: params.id,
                studentId: studentId
              }
            })
            sharedCount++
          }
        }
      }
    }

    // Update presentation to mark as shared
    if (sharedCount > 0) {
      await prisma.aIGeneratedContent.update({
        where: { id: params.id },
        data: { isShared: true }
      })
    }

    return NextResponse.json({
      success: true,
      sharedCount,
      message: `Presentation shared with ${sharedCount} ${sharedCount === 1 ? 'recipient' : 'recipients'}`
    })

  } catch (error) {
    console.error('Error sharing presentation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to share presentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET - Get sharing info for a presentation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const presentation = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: params.id,
        teacherId: teacher.id,
        type: 'POWERPOINT'
      },
      include: {
        sharedWithStudents: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        sharedWithClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      isShared: presentation.isShared,
      sharedWithStudents: presentation.sharedWithStudents.map(share => ({
        id: share.student.id,
        name: `${share.student.user.firstName} ${share.student.user.lastName}`,
        sharedAt: share.sharedAt
      })),
      sharedWithClasses: presentation.sharedWithClasses.map(share => ({
        id: share.class.id,
        name: share.class.name,
        sharedAt: share.sharedAt
      }))
    })

  } catch (error) {
    console.error('Error getting sharing info:', error)
    return NextResponse.json(
      { error: 'Failed to get sharing info' },
      { status: 500 }
    )
  }
}