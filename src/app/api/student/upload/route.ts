import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { supabaseAdmin, BUCKETS, ensureBucket } from '@/lib/supabase'
import { saveFileLocally } from '@/lib/local-storage'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const MAX_SIZE_MB = 10
const BUCKET = BUCKETS.STUDENT_SUBMISSIONS

export const POST = route({ auth: 'STUDENT' }, async (req, { user }) => {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Failed to parse form data. Make sure you are sending multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type "${file.type}" not allowed. Accepted: images, PDF, Word docs, text files` },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_SIZE_MB}MB` },
      { status: 400 }
    )
  }

  if (!supabaseAdmin) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const localPath = `submissions/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const localUrl = await saveFileLocally(BUCKET, localPath, buffer)
    if (!localUrl) {
      return NextResponse.json({ error: 'Upload failed: could not save file' }, { status: 500 })
    }
    return NextResponse.json({
      url: localUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const path = `submissions/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

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
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(uploadData.path)

  return NextResponse.json({
    url: urlData.publicUrl,
    name: file.name,
    type: file.type,
    size: file.size,
  })
})
