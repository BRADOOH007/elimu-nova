import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { GED_SUBJECTS } from '@/lib/constants/ged'

// Senior teachers see all senior (adult) learners and their GED progress.
export const GET = route({ auth: 'SENIOR_TEACHER' }, async (_req, { user }) => {
  const teacher = await prisma.seniorTeacher.findUnique({ where: { userId: user.id } })
  if (!teacher) return NextResponse.json({ error: 'Senior teacher not found' }, { status: 404 })

  const seniors = await prisma.seniorStudent.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } },
      gedSubjectProgress: true,
      certificates: { select: { id: true, certNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const subs = await prisma.subscription.findMany({
    where: { userId: { in: seniors.map((s) => s.userId) } },
    select: { userId: true, status: true },
  })
  const statusByUser = new Map(subs.map((x) => [x.userId, x.status]))

  const learners = seniors.map((s) => {
    const progress = GED_SUBJECTS.map((subject) => {
      const p = s.gedSubjectProgress.find((x) => x.subject === subject)
      return { subject, mastery: p?.mastery ?? 0, isReady: p?.isReady ?? false }
    })
    const readyCount = progress.filter((p) => p.isReady).length
    const avgMastery = progress.length > 0 ? Math.round(progress.reduce((sum, p) => sum + p.mastery, 0) / progress.length) : 0

    return {
      id: s.id,
      userId: s.user.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      ageBracket: s.ageBracket,
      priorEducation: s.priorEducation,
      approvalStatus: s.approvalStatus,
      subscriptionStatus: statusByUser.get(s.userId) ?? null,
      isGEDReady: s.isGEDReady,
      hasCertificate: s.certificates.length > 0,
      readySubjects: readyCount,
      avgMastery,
      progress,
      joinedAt: s.user.createdAt,
    }
  })

  return NextResponse.json({ learners })
})
