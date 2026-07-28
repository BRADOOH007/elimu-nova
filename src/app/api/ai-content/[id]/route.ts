import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { params }) => {
  const content = await prisma.aIGeneratedContent.findUnique({
    where: { id: params.id },
    include: {
      teacher: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      sharedWithStudents: {
        include: {
          student: {
            select: {
              id: true,
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
              name: true,
              grade: true
            }
          }
        }
      },
      _count: {
        select: {
          sharedWithStudents: true,
          sharedWithClasses: true
        }
      }
    }
  })

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    content
  })
})

export const PUT = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const { title, content, subject, grade, topic, metadata } = await req.json()

  const existingContent = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id
    }
  })

  if (!existingContent) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  const updatedContent = await prisma.aIGeneratedContent.update({
    where: { id: params.id },
    data: {
      title: title || existingContent.title,
      content: content || existingContent.content,
      subject: subject || existingContent.subject,
      grade: grade || existingContent.grade,
      topic: topic || existingContent.topic,
      metadata: metadata || existingContent.metadata
    },
    include: {
      _count: {
        select: {
          sharedWithStudents: true,
          sharedWithClasses: true
        }
      }
    }
  })

  return NextResponse.json({
    success: true,
    content: updatedContent
  })
})

export const DELETE = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const existingContent = await prisma.aIGeneratedContent.findFirst({
    where: {
      id: params.id,
      teacherId: teacher.id
    }
  })

  if (!existingContent) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  await prisma.aIGeneratedContent.delete({
    where: { id: params.id }
  })

  return NextResponse.json({
    success: true,
    message: 'Content deleted successfully'
  })
})
