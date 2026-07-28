import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const { studentIds, classIds } = await req.json()
  const contentId = params.id

  if ((!studentIds || studentIds.length === 0) && (!classIds || classIds.length === 0)) {
    return NextResponse.json(
      { error: 'At least one student or class must be selected for sharing' },
      { status: 400 }
    )
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

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

  await prisma.sharedAIContent.deleteMany({
    where: { contentId }
  })

  const sharingRecords = []

  if (studentIds && studentIds.length > 0) {
    for (const studentId of studentIds) {
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

  if (classIds && classIds.length > 0) {
    for (const classId of classIds) {
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

        const classStudents = await prisma.student.findMany({
          where: { classId }
        })

        for (const student of classStudents) {
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

  await prisma.aIGeneratedContent.update({
    where: { id: contentId },
    data: { isShared: true }
  })

  const totalSharedStudents = await prisma.sharedAIContent.count({
    where: { contentId }
  })

  const totalSharedClasses = await prisma.sharedAIContentWithClass.count({
    where: { contentId }
  })

  return NextResponse.json({
    message: 'Content shared successfully',
    summary: {
      totalStudents: totalSharedStudents,
      totalClasses: totalSharedClasses,
      sharingRecords: sharingRecords.length
    }
  })
})
