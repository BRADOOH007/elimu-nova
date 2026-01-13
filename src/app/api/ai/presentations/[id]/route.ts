import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const presentation = await prisma.aIGeneratedContent.findUnique({
      where: {
        id: params.id,
        type: 'POWERPOINT'
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    // Check access permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has access to this presentation
    const hasAccess = await checkPresentationAccess(presentation.id, user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse content
    let parsedContent
    try {
      parsedContent = typeof presentation.content === 'string' 
        ? JSON.parse(presentation.content) 
        : presentation.content
    } catch (error) {
      console.error('Error parsing presentation content:', error)
      parsedContent = { slides: [], pptxUrl: null }
    }

    return NextResponse.json({
      id: presentation.id,
      title: presentation.title,
      topic: presentation.topic,
      subject: presentation.subject,
      grade: presentation.grade,
      pptxUrl: parsedContent.pptxUrl,
      slides: parsedContent.slides || [],
      metadata: {
        ...presentation.metadata,
        ...parsedContent.metadata
      },
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
      teacher: presentation.teacher ? {
        name: `${presentation.teacher.user.firstName} ${presentation.teacher.user.lastName}`,
        email: presentation.teacher.user.email
      } : null
    })

  } catch (error) {
    console.error('Error fetching presentation:', error)
    return NextResponse.json({
      error: 'Failed to fetch presentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const presentation = await prisma.aIGeneratedContent.findUnique({
      where: {
        id: params.id,
        type: 'POWERPOINT'
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    // Check if user owns this presentation
    if (presentation.teacher?.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse content to get file paths
    let parsedContent
    try {
      parsedContent = typeof presentation.content === 'string' 
        ? JSON.parse(presentation.content) 
        : presentation.content
    } catch (error) {
      console.error('Error parsing presentation content:', error)
      parsedContent = { slides: [], pptxUrl: null }
    }

    // Delete files from filesystem
    const filesToDelete: string[] = []

    // Add PPTX file
    if (parsedContent.pptxUrl) {
      const pptxPath = path.join(process.cwd(), 'public', parsedContent.pptxUrl.replace(/^\//, ''))
      filesToDelete.push(pptxPath)
    }

    // Add image files
    if (parsedContent.slides) {
      parsedContent.slides.forEach((slide: any) => {
        if (slide.imageUrl) {
          const imagePath = path.join(process.cwd(), 'public', slide.imageUrl.replace(/^\//, ''))
          filesToDelete.push(imagePath)
        }
      })
    }

    // Delete files
    const deletePromises = filesToDelete.map(async (filePath) => {
      try {
        if (existsSync(filePath)) {
          await unlink(filePath)
          console.log('Deleted file:', filePath)
        }
      } catch (error) {
        console.error('Error deleting file:', filePath, error)
      }
    })

    await Promise.all(deletePromises)

    // Delete from database
    await prisma.aIGeneratedContent.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Presentation deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting presentation:', error)
    return NextResponse.json({
      error: 'Failed to delete presentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to check if user has access to presentation
async function checkPresentationAccess(presentationId: string, userId: string): Promise<boolean> {
  try {
    const presentation = await prisma.aIGeneratedContent.findUnique({
      where: { id: presentationId },
      include: {
        teacher: true,
        sharedWithStudents: {
          include: {
            student: true
          }
        }
      }
    })

    if (!presentation) return false

    // Check if user is the teacher who created it
    if (presentation.teacher?.userId === userId) return true

    // Check if user is a student with access
    const student = await prisma.student.findUnique({
      where: { userId }
    })

    if (student) {
      // Check if presentation is shared with this student
      const isShared = presentation.sharedWithStudents.some(
        shared => shared.student.userId === userId
      )
      if (isShared) return true

      // Check if student belongs to the teacher who created the presentation
      if (presentation.teacher) {
        const teacherStudent = await prisma.student.findFirst({
          where: {
            id: student.id,
            teacher: {
              id: presentation.teacher.id
            }
          }
        })
        if (teacherStudent) return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking presentation access:', error)
    return false
  }
}