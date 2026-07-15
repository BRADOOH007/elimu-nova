import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, rows } = await request.json()
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
    }

    // Get teacher/school context
    let teacherId: string | null = null
    let schoolId: string | null = null

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } })
    if (teacher) {
      teacherId = teacher.id
      schoolId = teacher.schoolId
    } else {
      const schoolAdmin = await (prisma as any).schoolAdmin.findUnique({ where: { userId: session.user.id } })
      if (schoolAdmin) schoolId = schoolAdmin.schoolId
    }

    let success = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      try {
        const r = rows[i]
        switch (type) {
          case 'students': {
            if (!schoolId) throw new Error('No school context')
            await prisma.student.create({
              data: {
                schoolId,
                user: {
                  create: {
                    firstName: r.firstName || r.name || '',
                    lastName: r.lastName || '',
                    email: r.email || `student${Date.now()}${i}@temp.edu`,
                    role: 'STUDENT',
                  },
                },
              } as any,
            })
            break
          }
          case 'teachers': {
            if (!schoolId) throw new Error('No school context')
            await prisma.teacher.create({
              data: {
                schoolId,
                user: {
                  create: {
                    firstName: r.firstName || r.name || '',
                    lastName: r.lastName || '',
                    email: r.email || `teacher${Date.now()}${i}@temp.edu`,
                    role: 'TEACHER',
                  },
                },
              } as any,
            })
            break
          }
          case 'classes': {
            if (!schoolId) throw new Error('No school context')
            if (!teacherId) throw new Error('Teacher context required for class creation')
            await prisma.class.create({
              data: {
                name: r.name,
                grade: r.grade || '',
                subject: r.subject || '',
                schoolId,
                teacherId,
              } as any,
            })
            break
          }
          case 'assignments': {
            if (!teacherId) throw new Error('Teacher context required')
            await prisma.assignment.create({
              data: {
                title: r.title,
                description: r.description || '',
                content: r.content || '{}',
                subject: r.subject || '',
                grade: r.grade || '',
                teacherId,
                schoolId: schoolId || '',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              } as any,
            })
            break
          }
          default:
            throw new Error(`Unknown type: ${type}`)
        }
        success++
      } catch (e: any) {
        errors.push({ row: i + 2, error: e.message || 'Import failed' })
      }
    }

    return NextResponse.json({ success, failed: errors.length, errors })
  } catch (error) {
    console.error('[CSV_IMPORT_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
