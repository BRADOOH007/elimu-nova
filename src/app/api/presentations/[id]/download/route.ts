import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { generateSimplePresentation } from '@/lib/simple-presentation-generator'

export const GET = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
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

  const presentationData = JSON.parse(presentation.content)

  console.log('Generating PowerPoint for presentation:', presentation.title)
  console.log('Slides count:', presentationData.slides?.length || 0)

  const pptxBuffer = await generateSimplePresentation({
    title: presentation.title,
    slides: presentationData.slides || [],
    includeImages: true,
  })

  const uint8 = new Uint8Array(pptxBuffer.buffer, pptxBuffer.byteOffset, pptxBuffer.byteLength)
  return new NextResponse(uint8 as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${presentation.title.replace(/[^a-z0-9]/gi, '_')}.pptx"`,
      'Content-Length': pptxBuffer.length.toString()
    }
  })
})
