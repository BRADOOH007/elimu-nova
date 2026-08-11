import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export const POST = route({ auth: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] }, async (req, { user }) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const bytes = Buffer.from(await file.arrayBuffer())
    
    // Validate: max 5MB, image only
    if (bytes.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 5MB' }, { status: 400 })
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    if (!['png','jpg','jpeg','gif','webp'].includes(ext)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Save to public/uploads/avatars/
    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    await mkdir(dir, { recursive: true })
    
    const filename = `avatar_${user.id}_${crypto.randomBytes(4).toString('hex')}.${ext}`
    const filepath = path.join(dir, filename)
    await writeFile(filepath, bytes)

    const url = `/uploads/avatars/${filename}`

    // Update user avatar
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: url },
    })

    return NextResponse.json({ url })
  } catch (e: any) {
    console.error('Avatar upload error:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
})
