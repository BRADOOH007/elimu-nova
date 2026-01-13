import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'

// GET - Fetch specific resource
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Fetch resource
    const resource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        studentId: student.id,
        isPublic: true
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        lessonPlan: {
          select: {
            id: true,
            title: true,
            subject: true
          }
        }
      }
    })

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    return NextResponse.json({ resource })

  } catch (error) {
    console.error('Error fetching resource:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch resource', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update resource
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, tags, metadata } = body

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Check if resource exists and belongs to student
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        studentId: student.id
      }
    })

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Update resource
    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        title: title || existingResource.title,
        content: content || existingResource.content,
        tags: tags || existingResource.tags,
        metadata: metadata || existingResource.metadata,
        updatedAt: new Date()
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        lessonPlan: {
          select: {
            id: true,
            title: true,
            subject: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      resource
    })

  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ 
      error: 'Failed to update resource', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Check if resource exists and belongs to student
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        studentId: student.id
      }
    })

    if (!existingResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Delete resource
    await prisma.resource.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ 
      error: 'Failed to delete resource', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
