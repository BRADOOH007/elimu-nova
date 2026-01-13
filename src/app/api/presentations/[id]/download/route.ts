import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSimplePresentation } from '@/lib/simple-presentation-generator'

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

    // Parse the presentation data
    const presentationData = JSON.parse(presentation.content)

    console.log('Generating PowerPoint for presentation:', presentation.title)
    console.log('Slides count:', presentationData.slides?.length || 0)

    // Generate PowerPoint using the simple presentation generator
    const pptxBuffer = await generateSimplePresentation({
      title: presentation.title,
      slides: presentationData.slides || [],
      includeImages: true,
      theme: 'education'
    })

    // Return the PowerPoint file
    return new NextResponse(pptxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${presentation.title.replace(/[^a-z0-9]/gi, '_')}.pptx"`,
        'Content-Length': pptxBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating PowerPoint:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate PowerPoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}