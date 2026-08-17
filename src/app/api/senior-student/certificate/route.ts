import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { GED_SUBJECTS, GED_READY_MASTERY, masteryToGEDScore } from '@/lib/constants/ged'

async function computeSubjectReadiness(seniorId: string) {
  const rows = await prisma.gEDSubjectProgress.findMany({ where: { seniorStudentId: seniorId } })
  const bySubject = new Map(rows.map((r) => [r.subject, r]))
  const results = GED_SUBJECTS.map((subject) => {
    const r = bySubject.get(subject)
    const ready = (r?.mastery ?? 0) >= GED_READY_MASTERY
    return { subject, mastery: r?.mastery ?? 0, isReady: ready, gedScore: masteryToGEDScore(r?.mastery ?? 0) }
  })
  return results
}

export const GET = route({ auth: 'SENIOR_STUDENT' }, async (_req, { user }) => {
  const senior = await prisma.seniorStudent.findUnique({
    where: { userId: user.id },
    include: { certificates: { orderBy: { awardedAt: 'desc' } } },
  })
  if (!senior) return NextResponse.json({ certificate: null, readiness: [] })

  const readiness = await computeSubjectReadiness(senior.id)
  const certificate = senior.certificates[0] ?? null

  return NextResponse.json({
    readiness,
    certificate: certificate
      ? {
          id: certificate.id,
          certNumber: certificate.certNumber,
          awardedAt: certificate.awardedAt,
          subjectScores: certificate.subjectScores,
          pdfUrl: certificate.pdfUrl,
        }
      : null,
  })
})

export const POST = route({ auth: 'SENIOR_STUDENT' }, async (_req, { user }) => {
  const senior = await prisma.seniorStudent.findUnique({
    where: { userId: user.id },
    include: { certificates: { orderBy: { awardedAt: 'desc' } } },
  })
  if (!senior) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const readiness = await computeSubjectReadiness(senior.id)
  const allReady = readiness.every((r) => r.isReady)

  if (!allReady) {
    const remaining = readiness.filter((r) => !r.isReady).map((r) => r.subject)
    return NextResponse.json(
      { error: 'Not yet GED-ready', ready: false, remaining },
      { status: 400 },
    )
  }

  // Already issued? return it.
  const existing = senior.certificates[0]
  if (existing) {
    return NextResponse.json({
      ready: true,
      certificate: {
        id: existing.id,
        certNumber: existing.certNumber,
        awardedAt: existing.awardedAt,
        subjectScores: existing.subjectScores,
        pdfUrl: existing.pdfUrl,
      },
    })
  }

  const certNumber = `GED-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const subjectScores = readiness.reduce(
    (acc, r) => ({ ...acc, [r.subject]: r.gedScore }),
    {} as Record<string, number>,
  )

  const certificate = await prisma.gEDCertificate.create({
    data: {
      seniorStudentId: senior.id,
      certNumber,
      subjectScores,
      status: 'ISSUED',
    },
  })

  await prisma.seniorStudent.update({
    where: { id: senior.id },
    data: { isGEDReady: true },
  })

  return NextResponse.json({
    ready: true,
    certificate: {
      id: certificate.id,
      certNumber: certificate.certNumber,
      awardedAt: certificate.awardedAt,
      subjectScores: certificate.subjectScores,
      pdfUrl: certificate.pdfUrl,
    },
  })
})
