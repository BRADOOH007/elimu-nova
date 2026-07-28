import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'none' }, async (req, { params }) => {
  const { token } = params

  const content = await prisma.aIGeneratedContent.findFirst({
    where: {
      shareToken: token,
      visibility: { in: ['link', 'public'] }
    },
    include: {
      teacher: {
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      }
    }
  })

  if (!content) {
    return NextResponse.json(
      { error: 'Presentation not found or sharing is disabled' },
      { status: 404 }
    )
  }

  let parsedContent
  try {
    parsedContent = JSON.parse(content.content)
  } catch {
    parsedContent = { slides: [], title: content.title }
  }

  return NextResponse.json({
    success: true,
    presentation: {
      id: content.id,
      title: content.title,
      subject: content.subject,
      grade: content.grade,
      topic: content.topic,
      teacherName: `${content.teacher.user.firstName} ${content.teacher.user.lastName}`,
      ...parsedContent,
      createdAt: content.createdAt.toISOString()
    }
  })
})
