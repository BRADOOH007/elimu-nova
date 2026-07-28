import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      classes: true
    }
  } as any) as any

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Get presentations shared directly with the student
  const directSharesRaw = await prisma.sharedAIContent.findMany({
    where: {
      studentId: student.id
    },
    include: {
      content: {
        include: {
          teacher: {
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
      }
    }
  })
  const directShares = directSharesRaw.filter(s => s.content?.type === 'POWERPOINT') as any

  // Get presentations shared with student's classes
  const classIds = student.classes.map((cls: any) => cls.id)
  const classSharesRaw = await prisma.sharedAIContentWithClass.findMany({
    where: {
      classId: {
        in: classIds
      }
    },
    include: {
      content: {
        include: {
          teacher: {
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
      }
    }
  })
  const classShares = classSharesRaw.filter(s => s.content?.type === 'POWERPOINT') as any

  // Combine and deduplicate presentations
  const allShares = [
    ...directShares.map((share: any) => ({
      ...share,
      shareType: 'direct' as const
    })),
    ...classShares.map((share: any) => ({
      ...share,
      shareType: 'class' as const
    }))
  ]

  // Remove duplicates and filter out null content
  const uniquePresentations = new Map()

  for (const share of allShares) {
    if (share.content && !uniquePresentations.has(share.content.id)) {
      const presentationData = JSON.parse(share.content.content)

      uniquePresentations.set(share.content.id, {
        id: share.content.id,
        title: share.content.title,
        subject: share.content.subject,
        grade: share.content.grade,
        topic: share.content.topic,
        slideCount: presentationData.slideCount || presentationData.slides?.length || 0,
        duration: presentationData.duration || 45,
        teacherName: `${share.content.teacher.user.firstName} ${share.content.teacher.user.lastName}`,
        sharedAt: share.sharedAt,
        createdAt: share.content.createdAt,
        shareType: share.shareType
      })
    }
  }

  const presentations = Array.from(uniquePresentations.values())
    .sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime())

  return NextResponse.json({
    success: true,
    presentations
  })
})
