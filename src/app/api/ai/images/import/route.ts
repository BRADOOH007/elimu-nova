import { NextResponse } from 'next/server'
import ImageStorageService from '@/lib/image-storage-service'
import { route } from '@/lib/api-middleware'

/**
 * POST /api/ai/images/import
 *
 * Downloads a stock image (Unsplash / Wikimedia) and persists it to
 * Supabase Storage (ai-images bucket) with a database record so it can
 * be embedded in presentations and browsed in the gallery.
 *
 * Body: { imageUrl, prompt, topic, source?, sourceUrl?, subject?, grade? }
 */
export const POST = route({}, async (request, { user }) => {
  const body = await request.json()
  const { imageUrl, prompt, topic, source, sourceUrl, subject, grade } = body

  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }

  const title = (topic || prompt || 'Imported image').slice(0, 120)

  const saved = await ImageStorageService.saveAIImage({
    imageUrl,
    topic: title,
    prompt: prompt || title,
    type: 'ILLUSTRATION',
    size: 'MEDIUM_1024',
    quality: 'standard',
    userId: user.id,
    studentId: user.role === 'STUDENT' ? user.studentId : undefined,
    teacherId: user.role === 'TEACHER' ? user.teacherId : undefined,
    schoolId: user.schoolAdminId ? user.schoolAdminId : undefined,
    metadata: {
      imported: true,
      source: source || 'web',
      sourceUrl: sourceUrl || null,
      subject: subject || null,
      grade: grade || null,
      importedAt: new Date().toISOString(),
    },
  })

  return NextResponse.json({
    success: true,
    imageUrl: saved.storedUrl,
    id: saved.id,
    filename: saved.filename,
  })
})
