import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { importStudents, parseCSVLine, detectHeaders, ImportRow } from '@/lib/bulk-import'

// Accept CSV text string OR JSON array of student objects
export const POST = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user }) => {
  const admin = await prisma.schoolAdmin.findUnique({
    where: { userId: user.id },
    include: { school: true },
  })
  if (!admin) return NextResponse.json({ error: 'School admin not found' }, { status: 403 })

  const body = await req.json()

  // Branch: CSV text path
  if (body.csvText) {
    const summary = await importStudents(body.csvText, admin.schoolId, undefined, body.classId || null, body.grade)
    return NextResponse.json(summary)
  }

  // Branch: JSON array path (backward compatible)
  const { students: rawStudents, classId } = body
  if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
    return NextResponse.json({ error: 'Provide csvText or a students array' }, { status: 400 })
  }
  if (rawStudents.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 students per upload' }, { status: 400 })
  }

  const results: { name: string; email: string; username?: string; password: string; status: 'created' | 'skipped'; reason?: string }[] = []
  let created = 0, skipped = 0

  for (const row of rawStudents) {
    const firstName = (row.firstName || row.first_name || '').trim()
    const lastName  = (row.lastName || row.last_name || '').trim()

    if (!firstName || !lastName) {
      skipped++
      results.push({ name: `${firstName || '?'} ${lastName || '?'}`, email: '', password: '', status: 'skipped', reason: 'Missing name' })
      continue
    }

    try {
      const { email, password, username } = await (await import('@/lib/bulk-import')).createStudentUser(
        { firstName, lastName, email: row.email || '', phone: row.phone || '', grade: row.grade || '', raw: '' } as ImportRow,
        admin.schoolId,
        undefined,
        classId || null,
      )
      created++
      results.push({ name: `${firstName} ${lastName}`, email, username, password, status: 'created' })
    } catch (e: any) {
      skipped++
      results.push({ name: `${firstName} ${lastName}`, email: '', password: '', status: 'skipped', reason: e.message?.slice(0, 80) })
    }
  }

  return NextResponse.json({
    created,
    skipped,
    total: rawStudents.length,
    results,
    message: `${created} created, ${skipped} skipped`,
  })
})
