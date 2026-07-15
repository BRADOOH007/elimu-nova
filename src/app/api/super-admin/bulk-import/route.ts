import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, rows } = await request.json()
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
    }

    let success = 0
    const errors: { row: number; error: string }[] = []

    if (type === 'schools') {
      for (let i = 0; i < rows.length; i++) {
        try {
          const r = rows[i]
          await prisma.school.create({
            data: {
              name: r.name,
              email: r.email,
              address: r.address || '',
              phone: r.phone || '',
            },
          })
          success++
        } catch (e: any) {
          errors.push({ row: i + 2, error: e.message || 'Failed to create school' })
        }
      }
    } else if (type === 'users') {
      for (let i = 0; i < rows.length; i++) {
        try {
          const r = rows[i]
          // Find school by code or name
          const school = r.schoolCode
            ? await prisma.school.findFirst({ where: { id: r.schoolCode } })
            : null

          await prisma.user.create({
            data: {
              firstName: r.firstName || r.name,
              lastName: r.lastName || '',
              email: r.email,
              role: (r.role || 'TEACHER').toUpperCase(),
              schoolId: school?.id || null,
            } as any,
          })
          success++
        } catch (e: any) {
          errors.push({ row: i + 2, error: e.message || 'Failed to create user' })
        }
      }
    } else {
      return NextResponse.json({ error: `Unknown import type: ${type}` }, { status: 400 })
    }

    return NextResponse.json({ success, failed: errors.length, errors })
  } catch (error) {
    console.error('[BULK_IMPORT_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
