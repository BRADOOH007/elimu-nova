import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// GET — fetch skill prerequisites (read-only)
export const GET = route({ auth: 'none' }, async (request) => {
  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject') || 'Mathematics'

  const prerequisites = await prisma.skillPrerequisite.findMany({
    where: { subject },
    orderBy: { order: 'asc' },
  })

  // If no prerequisites exist, return empty — don't auto-seed on read
  return NextResponse.json({ prerequisites })
})

// POST — seed prerequisites (teacher/super_admin only)
export const POST = route({ auth: ['TEACHER', 'SUPER_ADMIN'] }, async (request) => {
  const { subject, defaults } = await request.json()

  if (!subject || !defaults || !Array.isArray(defaults)) {
    return NextResponse.json({ error: 'subject and defaults array required' }, { status: 400 })
  }

  const created = await prisma.skillPrerequisite.createMany({
    data: defaults.map((d: any) => ({
      skillName: d.skillName,
      subject,
      prerequisiteName: d.prerequisiteName,
      prerequisiteType: d.prerequisiteType || 'required',
      order: d.order || 0,
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({ created: created.count })
})
