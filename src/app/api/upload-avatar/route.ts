import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { supabaseAdmin, BUCKETS } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export const POST = route({ skipSubscriptionCheck: true }, async (req, { user }) => {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be less than 5MB' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Storage service not configured' }, { status: 500 })
  }

  const bucket = BUCKETS.AVATARS

  // Ensure the bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const bucketExists = buckets?.some((b: any) => b.name === bucket)
  if (!bucketExists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5 * 1024 * 1024,
    })
    if (createError) {
      console.error('Bucket creation error:', createError)
      return NextResponse.json({ error: `Storage setup failed: ${createError.message}` }, { status: 500 })
    }
  }

  const ext = file.name.split('.').pop() || 'png'
  const path = `${user.id}_${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('Supabase upload error:', uploadError)
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  const publicUrl = urlData.publicUrl

  // Save avatar URL to user profile immediately
  await prisma.user.update({
    where: { id: user.id },
    data: { avatar: publicUrl },
  })

  return NextResponse.json({ url: publicUrl })
})
