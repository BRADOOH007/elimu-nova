import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { supabaseAdmin, BUCKETS, ensureBucket } from '@/lib/supabase'
import { saveFileLocally } from '@/lib/local-storage'
import { PDFParse } from 'pdf-parse'
import * as mammoth from 'mammoth'
import { storeDocumentInLibrary } from '@/lib/document-processor'
import { ingestDocument } from '@/lib/rag-pipeline'

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
const BUCKET = BUCKETS.TEACHER_DOCUMENTS

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
      await ensureBucket(BUCKET, {
        public: true,
        allowedMimeTypes: ALLOWED_TYPES,
        fileSizeLimit: MAX_SIZE_MB * 1024 * 1024,
      })

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

    // Extract FULL text content — no truncation
    let extractedText: string | null = null
    if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8')
    } else if (file.type === 'application/pdf') {
      try {
        const pdf = new PDFParse({ data: buffer })
        const result = await pdf.getText({})
        extractedText = result.text
      } catch (parseErr) {
        console.warn('PDF text extraction failed:', parseErr)
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      try {
        const { value } = await mammoth.extractRawText({ buffer })
        extractedText = value
      } catch (parseErr) {
        console.warn('Word document extraction failed:', parseErr)
      }
    }

    // Auto-detect grade and subject from filename or form data
    const manualGrade = (formData.get('grade') as string) || ''
    const manualSubject = (formData.get('subject') as string) || ''
    const { grade, subject } = extractGradeSubject(file.name, manualGrade, manualSubject, extractedText || '')

    let documentId: string | null = null
    if (extractedText && extractedText.length > 50) {
      // Store in the permanent Document Library — never overwrites
      documentId = await storeDocumentInLibrary(
        extractedText,
        file.name,
        grade,
        subject,
        undefined,
        publicUrl
      )

      // Chunk and embed for RAG — runs in background, don't block response
      ingestDocument(documentId, extractedText, { grade, subject, title: file.name, source: publicUrl })
        .then(count => console.log(`[Upload] Indexed ${count} chunks for document ${documentId}`))
        .catch(e => console.warn('[Upload] Embedding failed:', e))
    }

    // Also keep the teacher template updated (backward compat)
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (teacher && extractedText) {
      const updateData: any = {}
      const templateText = extractedText.slice(0, 8000)
      if (docType === 'lesson-plan')       updateData.lessonPlanTemplate = templateText
      if (docType === 'scheme-of-work')    updateData.schemeOfWorkTemplate = templateText
      if (docType === 'exam')              updateData.examTemplate = templateText
      if (docType === 'assignment' || docType === 'general') updateData.assignmentTemplate = templateText
      if (docType === 'curriculum')        updateData.curriculumTemplate = templateText
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
      grade,
      subject,
      documentId,
      extractedText: extractedText?.slice(0, 200),
      message: 'Document uploaded and indexed for AI knowledge base.',
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    )
  }
})

function extractGradeSubject(
  filename: string,
  manualGrade: string,
  manualSubject: string,
  content: string
): { grade: string; subject: string } {
  let grade = manualGrade
  let subject = manualSubject

  if (!grade) {
    const gradeMatch = content.match(/grade\s*(\d{1,2})/i) || filename.match(/grade\s*(\d{1,2})/i)
    if (gradeMatch) grade = `Grade ${gradeMatch[1]}`
    const formMatch = content.match(/form\s*(\d{1,2})/i) || filename.match(/form\s*(\d{1,2})/i)
    if (formMatch) grade = `Form ${formMatch[1]}`
  }

  if (!subject) {
    const subjects = ['Mathematics', 'English', 'Kiswahili', 'Science', 'Social Studies',
      'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Agriculture',
      'Business Studies', 'Computer Studies', 'CRE', 'Home Science', 'Music']
    for (const s of subjects) {
      if (content.toLowerCase().includes(s.toLowerCase()) ||
          filename.toLowerCase().includes(s.toLowerCase())) {
        subject = s
        break
      }
    }
  }

  return {
    grade: grade || 'General',
    subject: subject || 'General',
  }
}
