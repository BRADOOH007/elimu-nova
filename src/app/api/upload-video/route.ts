import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { supabaseAdmin, BUCKETS, ensureBucket } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
const MAX_SIZE = 500 * 1024 * 1024 // 500MB

export const POST = route({ auth: ['TEACHER'] }, async (req, { user }) => {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({
      error: `Invalid file type: ${file.type}. Allowed: mp4, webm, ogg, mov, avi`
    }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be less than 500MB' }, { status: 400 })
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
  }

  const bucket = BUCKETS.VIDEOS
  const ext = file.name.split('.').pop() || 'mp4'
  const path = `${teacher.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (supabaseAdmin) {
    await ensureBucket(bucket, {
      public: true,
      allowedMimeTypes: ALLOWED_TYPES,
      fileSizeLimit: MAX_SIZE,
    })

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Video upload error:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({
      url: urlData.publicUrl,
      provider: 'upload',
      name: file.name,
      size: file.size,
      type: file.type,
    })
  }

  // Fallback: save locally
  const { saveFileLocally } = await import('@/lib/local-storage')
  const localUrl = await saveFileLocally(bucket, path, buffer)
  if (!localUrl) {
    return NextResponse.json({ error: 'Upload failed: could not save file' }, { status: 500 })
  }

  return NextResponse.json({
    url: localUrl,
    provider: 'upload',
    name: file.name,
    size: file.size,
    type: file.type,
  })
})
