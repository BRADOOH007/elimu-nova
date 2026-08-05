import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { generateUsername, generatePassword } from '@/lib/bulk-import'
import bcrypt from 'bcryptjs'

export const POST = route({ auth: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (req, { user }) => {
  try {
    const { teachers, schoolId: requestSchool } = await req.json()

    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json({ error: 'No teachers to import' }, { status: 400 })
    }

    if (teachers.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 teachers per batch' }, { status: 400 })
    }

    let schoolId = requestSchool
    if (!schoolId && user.role === 'SCHOOL_ADMIN') {
      const admin = await prisma.schoolAdmin.findFirst({
        where: { userId: user.id },
        select: { schoolId: true }
      })
      if (!admin?.schoolId) {
        return NextResponse.json({ error: 'Could not determine school' }, { status: 400 })
      }
      schoolId = admin.schoolId
    }

    const results: Array<{
      firstName: string
      lastName: string
      email: string
      username: string
      password: string
      status: 'created' | 'exists' | 'error'
      error?: string
    }> = []

    let created = 0
    let skipped = 0

    for (const row of teachers) {
      try {
        const firstName = (row.firstName || row.firstname || row.FirstName || '').trim()
        const lastName = (row.lastName || row.lastname || row.LastName || '').trim()
        const email = (row.email || row.Email || '').trim()

        if (!firstName || !lastName) {
          results.push({ firstName, lastName, email, username: '', password: '', status: 'error', error: 'Missing name' })
          continue
        }

        let username = generateUsername(firstName, lastName)
        let suffix = 0
        while (await prisma.user.findUnique({ where: { username } })) {
          suffix++
          username = generateUsername(firstName, lastName, String(suffix))
        }

        const plainPwd = generatePassword()
        const hashedPwd = await bcrypt.hash(plainPwd, 12)

        const createdUser = await prisma.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: {
              username,
              firstName,
              lastName,
              email: email || undefined,
              password: hashedPwd,
              role: 'TEACHER',
              schoolId,
            } as any,
          })

          await tx.teacher.create({
            data: {
              userId: u.id,
              schoolId,
              subjects: [],
              qualification: '',
              experience: '',
            } as any,
          })

          return u
        })

        results.push({ firstName, lastName, email, username, password: plainPwd, status: 'created' })
        created++
      } catch (e: any) {
        results.push({
          firstName: row.firstName || '',
          lastName: row.lastName || '',
          email: row.email || '',
          username: '',
          password: '',
          status: 'error',
          error: e.message || 'Failed to create'
        })
      }
    }

    return NextResponse.json({
      success: true,
      total: teachers.length,
      created,
      skipped,
      failed: teachers.length - created,
      results,
    })

  } catch (error) {
    console.error('[BulkTeacherImport] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
