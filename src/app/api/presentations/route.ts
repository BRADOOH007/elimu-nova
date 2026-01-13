import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all presentations for the current teacher
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
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

  } catch (error) {
    console.error('Error fetching presentations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presentations' },
      { status: 500 }
    )
  }
}