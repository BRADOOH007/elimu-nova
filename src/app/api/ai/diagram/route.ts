import { NextResponse } from 'next/server'
import EducationalDiagramService from '@/lib/educational-diagram-service'
import ImageStorageService from '@/lib/image-storage-service'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (request, { user }) => {
    const body = await request.json()
    const { topic, grade, curriculum, type, size, quality } = body

    // Validate required fields
    if (!topic || !grade || !curriculum || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, grade, curriculum, type' },
        { status: 400 }
      )
    }

    // Validate curriculum
    if (!['CBC', 'IGCSE'].includes(curriculum)) {
      return NextResponse.json(
        { error: 'Invalid curriculum. Must be CBC or IGCSE' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['biology', 'geography', 'physics', 'chemistry', 'mathematics', 'general']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate size if provided
    if (size && !['512x512', '1024x1024', '1536x1024', '1024x1536'].includes(size)) {
      return NextResponse.json(
        { error: 'Invalid size. Must be 512x512, 1024x1024, 1536x1024, or 1024x1536' },
        { status: 400 }
      )
    }

    // Validate quality if provided
    if (quality && !['standard', 'hd'].includes(quality)) {
      return NextResponse.json(
        { error: 'Invalid quality. Must be standard or hd' },
        { status: 400 }
      )
    }

    console.log(`Generating educational diagram: ${topic} (${type}) for ${grade} ${curriculum} at ${size || '1024x1024'}`)

    // Generate the diagram
    const diagram = await EducationalDiagramService.generateDiagram({
      topic,
      grade,
      curriculum,
      type,
      size,
      quality
    })

    // Save the image to storage
    const sizeMapping = {
      '512x512': 'SMALL_512',
      '1024x1024': 'MEDIUM_1024',
      '1536x1024': 'LARGE_1536',
      '1024x1536': 'PORTRAIT_1024'
    } as const

    const savedImage = await ImageStorageService.saveAIImage({
      imageUrl: diagram.image_url,
      topic,
      prompt: `Educational diagram: ${topic} for ${grade} ${curriculum} curriculum (${type})`,
      type: 'DIAGRAM',
      size: sizeMapping[size as keyof typeof sizeMapping] || 'MEDIUM_1024',
      quality: quality || 'standard',
      userId: user.id,
      studentId: user.role === 'STUDENT' ? user.studentId : undefined,
      teacherId: user.role === 'TEACHER' ? user.teacherId : undefined,
      schoolId: user.schoolAdminId ? user.schoolAdminId : undefined,
      classId: body.classId,
      metadata: {
        labels: diagram.labels,
        curriculum,
        grade,
        subject: type,
        generatedAt: new Date().toISOString()
      }
    })

    // Track usage
    await ImageStorageService.trackImageUsage(
      savedImage.id,
      user.id,
      'generation',
      'diagram_generator'
    )

    // Return the diagram with the stored image URL
    return NextResponse.json({
      ...diagram,
      image_url: savedImage.storedUrl, // Use stored URL instead of temporary OpenAI URL
      saved_image: {
        id: savedImage.id,
        filename: savedImage.filename,
        fileSize: savedImage.fileSize,
        dimensions: savedImage.dimensions
      }
    })

})
