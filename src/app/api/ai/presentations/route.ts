import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const teacherId = searchParams.get('teacherId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build where clause based on user role and filters
    let whereClause: any = {
      type: 'POWERPOINT'
    }

    if (studentId) {
      // If studentId is specified, filter by that student (for teachers viewing student work)
      whereClause.teacher = {
        students: {
          some: { id: studentId }
        }
      }
    } else if (teacherId) {
      // If teacherId is specified, filter by that teacher
      whereClause.teacherId = teacherId
    } else {
      // Default: show user's own presentations
      const student = await prisma.student.findUnique({
        where: { userId: user.id }
      })

      if (student) {
        // Student: show presentations shared with them or created by their teachers
        whereClause = {
          type: 'POWERPOINT',
          OR: [
            {
              teacher: {
                students: {
                  some: { id: student.id }
                }
              }
            },
            {
              sharedWithStudents: {
                some: { studentId: student.id }
              }
            }
          ]
        }
      } else {
        // Teacher: show their own presentations
        const teacher = await prisma.teacher.findUnique({
          where: { userId: user.id }
        })

        if (teacher) {
          whereClause.teacherId = teacher.id
        } else {
          return NextResponse.json({ error: 'User role not found' }, { status: 404 })
        }
      }
    }

    // Fetch presentations
    const presentations = await prisma.aIGeneratedContent.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        topic: true,
        subject: true,
        grade: true,
        content: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Parse and format presentations
    const formattedPresentations = presentations.map(presentation => {
      let parsedContent
      let pptxUrl = null
      let slideCount = 0
      let hasImages = false

      try {
        parsedContent = typeof presentation.content === 'string' 
          ? JSON.parse(presentation.content) 
          : presentation.content

        pptxUrl = parsedContent.pptxUrl || null
        slideCount = parsedContent.slides?.length || 0
        hasImages = parsedContent.metadata?.hasImages || false
      } catch (error) {
        console.error('Error parsing presentation content:', error)
      }

      return {
        id: presentation.id,
        title: presentation.title,
        topic: presentation.topic,
        subject: presentation.subject,
        grade: presentation.grade,
        pptxUrl,
        slideCount,
        hasImages,
        createdAt: presentation.createdAt,
        updatedAt: presentation.updatedAt,
        teacher: presentation.teacher ? {
          name: `${presentation.teacher.user.firstName} ${presentation.teacher.user.lastName}`
        } : null,
        metadata: presentation.metadata
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.aIGeneratedContent.count({
      where: whereClause
    })

    return NextResponse.json({
      presentations: formattedPresentations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error fetching presentations:', error)
    return NextResponse.json({
      error: 'Failed to fetch presentations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}