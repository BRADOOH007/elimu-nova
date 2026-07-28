import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: { user: true }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const { studentIds, classId } = await req.json()

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

  if (classId) {
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

  if (studentIds && studentIds.length > 0) {
    for (const studentId of studentIds) {
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolId: teacher.schoolId
        }
      })

      if (student) {
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
})

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
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
})
