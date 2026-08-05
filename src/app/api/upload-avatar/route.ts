import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { supabaseAdmin, BUCKETS, ensureBucket } from '@/lib/supabase'
import { saveFileLocally, removeFileLocally } from '@/lib/local-storage'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const POST = route({ auth: ['TEACHER', 'STUDENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PARENT'], skipSubscriptionCheck: true }, async (req, { user }) => {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File must be JPEG, PNG, GIF, or WebP' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be less than 5MB' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    const ext = file.name.split('.').pop() || 'png'
    const localPath = `${user.id}_${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const localUrl = await saveFileLocally(BUCKETS.AVATARS, localPath, buffer)
    if (!localUrl) {
      return NextResponse.json({ error: 'Upload failed: could not save file' }, { status: 500 })
    }

    // Save avatar URL to user profile
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true }
    })

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: localUrl },
      })
      // Clean up old local avatar
      if (currentUser?.avatar?.startsWith('/uploads/')) {
        await removeFileLocally(currentUser.avatar)
      }
    } catch (dbError) {
      await removeFileLocally(localUrl)
      console.error('Failed to save avatar URL:', dbError)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ url: localUrl })
  }

  const bucket = BUCKETS.AVATARS

  // Ensure the bucket exists
  await ensureBucket(bucket, {
    public: true,
    allowedMimeTypes: ALLOWED_TYPES,
    fileSizeLimit: 5 * 1024 * 1024,
  })

  // Get current avatar to delete old file
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { avatar: true }
  })

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

  try {
    // Save avatar URL to user profile
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: publicUrl },
    })

    // Delete old avatar file (after successful DB update)
    if (currentUser?.avatar && currentUser.avatar.includes(bucket)) {
      try {
        const oldPath = currentUser.avatar.split(`${bucket}/`).pop()?.split('?')[0]
        if (oldPath && oldPath !== path) {
          await supabaseAdmin.storage.from(bucket).remove([oldPath])
        }
      } catch { /* non-critical cleanup */ }
    }
  } catch (dbError) {
    // DB update failed — clean up the uploaded file
    try {
      await supabaseAdmin.storage.from(bucket).remove([path])
    } catch { /* best effort cleanup */ }
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
})
