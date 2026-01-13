import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        classes: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get presentations shared directly with the student
    const directShares = await prisma.sharedAIContent.findMany({
      where: {
        studentId: student.id
      },
      include: {
        content: {
          where: {
            type: 'POWERPOINT'
          },
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

    // Get presentations shared with student's classes
    const classIds = student.classes.map(cls => cls.id)
    const classShares = await prisma.sharedAIContentWithClass.findMany({
      where: {
        classId: {
          in: classIds
        }
      },
      include: {
        content: {
          where: {
            type: 'POWERPOINT'
          },
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

    // Combine and deduplicate presentations
    const allShares = [
      ...directShares.map(share => ({
        ...share,
        shareType: 'direct' as const
      })),
      ...classShares.map(share => ({
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

  } catch (error) {
    console.error('Error fetching shared presentations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch shared presentations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}