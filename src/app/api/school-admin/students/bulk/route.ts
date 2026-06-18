import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await (prisma as any).schoolAdmin.findUnique({
      where: { userId: session.user.id },
      include: { school: true },
    })
    if (!admin) return NextResponse.json({ error: 'Not a school admin' }, { status: 403 })

    const { students, classId } = await request.json()
    // students: [{ firstName, lastName, email?, username?, grade?, className? }]

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No students provided' }, { status: 400 })
    }
    if (students.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 students per upload' }, { status: 400 })
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] }
    const defaultPassword = await bcrypt.hash('student1234', 10)

    for (const row of students) {
      try {
        const firstName = (row.firstName || row.first_name || '').trim()
        const lastName  = (row.lastName  || row.last_name  || '').trim()
        if (!firstName || !lastName) { results.errors.push(`Row missing name: ${JSON.stringify(row)}`); results.skipped++; continue }

        // Generate email if not provided
        const email = row.email
          ? row.email.trim().toLowerCase()
          : `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Math.random().toString(36).substring(2, 6)}@${admin.school.name.toLowerCase().replace(/\s+/g, '')}.student.local`

        // Check duplicate
        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) { results.skipped++; continue }

        const user = await prisma.user.create({
          data: {
            firstName,
            lastName,
            email,
            password: defaultPassword,
            role: 'STUDENT',
          },
        })

        await (prisma as any).student.create({
          data: {
            userId:   user.id,
            schoolId: admin.schoolId,
            classId:  classId || null,
          },
        })

        results.created++
      } catch (e: any) {
        results.errors.push(`${row.firstName} ${row.lastName}: ${e.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      ...results,
      message: `${results.created} students created, ${results.skipped} skipped`,
    })
  } catch (error) {
    console.error('[BULK_UPLOAD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
