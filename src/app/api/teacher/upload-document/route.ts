import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { supabaseAdmin } from '@/lib/supabase'
import { saveFileLocally } from '@/lib/local-storage'
import { PDFParse } from 'pdf-parse'
import * as mammoth from 'mammoth'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
]

const MAX_SIZE_MB = 20
const BUCKET = 'teacher-documents'

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
  try {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Failed to parse upload data' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    const docType = (formData.get('docType') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Accepted: PDF, Word (.doc/.docx), plain text, images' },
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

    // Upload to Supabase Storage
    const path = `${user.id}/${docType}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    let publicUrl: string
    if (!supabaseAdmin) {
      const localUrl = await saveFileLocally(BUCKET, path, buffer)
      if (!localUrl) {
        return NextResponse.json({ error: 'Upload failed: could not save file' }, { status: 500 })
      }
      publicUrl = localUrl
    } else {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: true })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        return NextResponse.json({ error: `Failed to upload document: ${uploadError.message}` }, { status: 500 })
      }

      const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(uploadData.path)
      publicUrl = urlData.publicUrl
    }

    // Extract text content for AI context
    let extractedText: string | null = null
    if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8').slice(0, 8000)
    } else if (file.type === 'application/pdf') {
      try {
        const pdf = new PDFParse({ data: buffer })
        const result = await pdf.getText({})
        extractedText = result.text.slice(0, 8000)
      } catch (parseErr) {
        console.warn('PDF text extraction failed:', parseErr)
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      try {
        const { value } = await mammoth.extractRawText({ buffer })
        extractedText = value.slice(0, 8000)
      } catch (parseErr) {
        console.warn('Word document extraction failed:', parseErr)
      }
    }

    // Store extracted text in teacher record for AI context
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (teacher && extractedText) {
      const updateData: any = {}
      if (docType === 'lesson-plan')       updateData.lessonPlanTemplate = extractedText
      if (docType === 'scheme-of-work')    updateData.schemeOfWorkTemplate = extractedText
      if (docType === 'exam')              updateData.examTemplate = extractedText
      if (docType === 'assignment' || docType === 'general') updateData.assignmentTemplate = extractedText
      if (docType === 'curriculum')        updateData.curriculumTemplate = extractedText
      if (Object.keys(updateData).length > 0) {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: updateData,
        })
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: file.name,
      type: file.type,
      docType,
      extractedText,
      message: `${docType === 'lesson-plan' ? 'Lesson plan' : docType === 'scheme-of-work' ? 'Scheme of work' : 'Document'} uploaded. AI will use this as context when generating content.`
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    )
  }
})
