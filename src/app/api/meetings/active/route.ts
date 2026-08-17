import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ meetings: [] })

  const userId = session.user.id
  const userRole = session.user.role
  const now = new Date()

  // Find meetings: SCHEDULED, starts within 15 mins OR already live, not ended yet
  // Also: SCHEDULED, starting today (for the day's banner preview)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  // Get user's school
  let schoolId: string | null = null
  if (userRole === 'SCHOOL_ADMIN') {
    const admin = await prisma.schoolAdmin.findUnique({ where: { userId } })
    schoolId = admin?.schoolId || null
  } else if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId } })
    schoolId = teacher?.schoolId || null
  } else if (userRole === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } })
    schoolId = student?.schoolId || null
  } else if (userRole === 'PARENT') {
    const parent = await prisma.parent.findUnique({ where: { userId } })
    schoolId = parent?.schoolId || null
  }
  if (!schoolId) return NextResponse.json({ meetings: [] })

  // Get user's grade for filtering
  let userGrade: string | null = null
  if (userRole === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId }, include: { class: true } })
    userGrade = student?.class?.grade || null
  } else if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId } })
    userGrade = teacher?.gradeLevels?.[0] || null
  }

  // Fetch meetings from the school
  const allMeetings = await (prisma as any).meeting.findMany({
    where: {
      schoolId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      date: { gte: today, lt: tomorrow },
    },
    orderBy: { date: 'asc' },
    take: 20,
  })

  // Filter by targeting
  const filtered = allMeetings.filter((m: any) => {
    const targets = m.targetRoles || []
    const grades = m.targetGrades || []
    const userIds = m.targetUserIds || []

    // No targeting = everyone sees it
    if (targets.length === 0 && grades.length === 0 && userIds.length === 0) return true

    // Check if user is explicitly targeted
    if (userIds.includes(userId)) return true

    // Check if user's role is targeted
    if (targets.length > 0 && !targets.includes(userRole)) return false

    // Check if user's grade matches
    if (grades.length > 0 && userGrade && !grades.includes(userGrade)) return false

    return true
  })

  const formatted = filtered.map((m: any) => ({
    id: m.id, title: m.title, description: m.description,
    meetingType: m.meetingType || 'IN_PERSON', videoLink: m.videoLink || m.zoomJoinUrl,
    date: m.date instanceof Date ? m.date.toISOString().split('T')[0] : String(m.date).split('T')[0],
    time: m.time, duration: m.duration, status: m.status,
  }))

  return NextResponse.json({ meetings: formatted })
}
