import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
]

const MAX_SIZE_MB = 20

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Failed to parse upload data' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    const docType = (formData.get('docType') as string) || 'general'
    // docType can be: 'lesson-plan', 'scheme-of-work', 'curriculum', 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted: PDF, Word (.doc/.docx), plain text, images` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_MB}MB` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const isImage = file.type.startsWith('image/')

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `elimunova/teacher-documents/${docType}`,
          resource_type: isImage ? 'image' : 'raw',
          public_id: `teacher_${session.user.id}_${docType}_${Date.now()}`,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(buffer)
    })

    // For text files, extract the content so AI can use it directly
    let extractedText: string | null = null
    if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8').slice(0, 8000) // limit to 8k chars for context
    }

    // Store the document reference in SystemSettings so AI can retrieve it per teacher
    // We use teacher's userId as a namespace key
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (teacher) {
      // Store document metadata for AI context retrieval
      const contextKey = `teacher_doc_${teacher.id}_${docType}`
      const contextValue = JSON.stringify({
        url: uploadResult.secure_url,
        name: file.name,
        type: file.type,
        docType,
        uploadedAt: new Date().toISOString(),
        extractedText: extractedText || null,
      })

      await prisma.userPreference.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
        },
        update: {}
      })
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      name: file.name,
      type: file.type,
      docType,
      extractedText: extractedText ? extractedText.slice(0, 500) + '...' : null,
      message: `${docType === 'lesson-plan' ? 'Lesson plan' : docType === 'scheme-of-work' ? 'Scheme of work' : 'Document'} uploaded. AI will use this as context when generating content.`
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    )
  }
}
