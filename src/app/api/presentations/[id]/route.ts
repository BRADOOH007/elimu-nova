import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get a specific presentation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const presentation = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: params.id,
        teacherId: teacher.id,
        type: 'POWERPOINT'
      }
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    // Parse the content JSON
    const presentationData = JSON.parse(presentation.content)

    return NextResponse.json({
      success: true,
      presentation: {
        id: presentation.id,
        title: presentation.title,
        subject: presentation.subject,
        grade: presentation.grade,
        topic: presentation.topic,
        ...presentationData,
        isShared: presentation.isShared,
        createdAt: presentation.createdAt,
        updatedAt: presentation.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching presentation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presentation' },
      { status: 500 }
    )
  }
}

// PUT - Update a presentation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { title, slides, subject, grade, topic, duration, difficulty } = await request.json()

    // Verify presentation exists and belongs to teacher
    const existingPresentation = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: params.id,
        teacherId: teacher.id,
        type: 'POWERPOINT'
      }
    })

    if (!existingPresentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    // Update presentation data
    const updatedPresentationData = {
      title,
      subject,
      grade,
      topic,
      duration,
      difficulty,
      slides,
      slideCount: slides.length,
      metadata: {
        generatedAt: JSON.parse(existingPresentation.content).metadata?.generatedAt,
        updatedAt: new Date().toISOString(),
        slideCount: slides.length,
        duration,
        difficulty,
        hasImages: slides.some((slide: any) => slide.imagePrompt || slide.imageDescription)
      }
    }

    const updatedPresentation = await prisma.aIGeneratedContent.update({
      where: { id: params.id },
      data: {
        title,
        content: JSON.stringify(updatedPresentationData),
        subject,
        grade,
        topic,
        metadata: updatedPresentationData.metadata
      }
    })

    return NextResponse.json({
      success: true,
      presentation: {
        id: updatedPresentation.id,
        title: updatedPresentation.title,
        subject: updatedPresentation.subject,
        grade: updatedPresentation.grade,
        topic: updatedPresentation.topic,
        ...updatedPresentationData,
        isShared: updatedPresentation.isShared,
        createdAt: updatedPresentation.createdAt,
        updatedAt: updatedPresentation.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating presentation:', error)
    return NextResponse.json(
      { error: 'Failed to update presentation' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a presentation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify presentation exists and belongs to teacher
    const presentation = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: params.id,
        teacherId: teacher.id,
        type: 'POWERPOINT'
      }
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    await prisma.aIGeneratedContent.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Presentation deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting presentation:', error)
    return NextResponse.json(
      { error: 'Failed to delete presentation' },
      { status: 500 }
    )
  }
}