import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { importStudents } from '@/lib/bulk-import'

export const POST = route({ auth: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {
  try {
    const { csvText, classId, grade } = await req.json()
    if (!csvText?.trim()) return NextResponse.json({ error: 'csvText is required' }, { status: 400 })

    // Resolve school
    let schoolId: string | undefined
    let teacherId: string | undefined

    if (user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } })
      if (!teacher) return NextResponse.json({ error: 'Teacher record not found' }, { status: 404 })
      schoolId = teacher.schoolId ?? undefined
      teacherId = teacher.id
    } else if (user.role === 'SCHOOL_ADMIN') {
      const admin = await prisma.schoolAdmin.findUnique({ where: { userId: user.id } })
      if (!admin) return NextResponse.json({ error: 'School admin record not found' }, { status: 404 })
      schoolId = admin.schoolId ?? undefined
    }

    if (!schoolId) return NextResponse.json({ error: 'Could not resolve school' }, { status: 400 })

    const summary = await importStudents(csvText, schoolId, teacherId, classId || null, grade)

    return NextResponse.json(summary)
  } catch (e: any) {
    console.error('[BULK_UPLOAD]', e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
})
