import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const presentations = await prisma.aIGeneratedContent.findMany({
    where: {
      teacherId: teacher.id,
      type: 'POWERPOINT'
    },
    orderBy: {
      updatedAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      subject: true,
      grade: true,
      topic: true,
      metadata: true,
      isShared: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return NextResponse.json({
    success: true,
    presentations: presentations.map(p => ({
      ...p,
      slideCount: (p.metadata as any)?.slideCount || 0,
      duration: (p.metadata as any)?.duration || 0,
      difficulty: (p.metadata as any)?.difficulty || 'medium'
    }))
  })
})
