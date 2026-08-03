import { prisma } from '@/lib/prisma'

// ── Adaptive mastery engine ────────────────────────────────────────────────
// Deterministic, LLM-free. Turns every graded result (exam / assignment /
// quiz) into live mastery signals: topic-level progress, per-unit mastery,
// per-skill mastery, and spaced-repetition scheduling. This is what makes the
// system "learn" continuously from real student work.

export type MasteryLevel = 'NOT_STARTED' | 'BEGINNER' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED'

export function getMasteryLevel(score: number): MasteryLevel {
  if (score >= 90) return 'MASTERED'
  if (score >= 70) return 'PROFICIENT'
  if (score >= 50) return 'DEVELOPING'
  if (score > 0) return 'BEGINNER'
  return 'NOT_STARTED'
}

export interface MasteryIngest {
  studentId: string
  classId?: string | null
  teacherId?: string | null
  subject: string
  topic: string
  unitName?: string
  grade: number            // 0-100 overall result
  totalQuestions: number
  correctAnswers: number
  skills?: Record<string, boolean>  // skillName -> was correct (per-question attribution)
}

export async function ingestMasteryFromResult(input: MasteryIngest) {
  const now = new Date()
  const {
    studentId, classId, teacherId, subject,
    topic, grade, totalQuestions, correctAnswers,
  } = input
  const unitName = input.unitName || topic

  const results: Record<string, unknown> = {}

  // ── 1. Topic-level progress (StudentProgress) with forgetting-curve decay ──
  let progress = await prisma.studentProgress.findFirst({
    where: { studentId, subject, topic },
    orderBy: { updatedAt: 'desc' },
  })

  if (progress) {
    const daysSince = progress.lastPracticedAt
      ? Math.floor((now.getTime() - progress.lastPracticedAt.getTime()) / 86400000)
      : 0
    const decay = daysSince > 1 && (progress.masteryScore || 0) > 0
      ? Math.min(Math.floor(daysSince * 2), 50)
      : 0

    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : grade
    // Blend: mastery moves 50% of the way toward this result's accuracy
    const blended = progress.masteryScore - decay + (accuracy - progress.masteryScore) * 0.5

    progress = await prisma.studentProgress.update({
      where: { id: progress.id },
      data: {
        masteryScore: Math.round(Math.max(0, Math.min(100, blended))),
        totalQuestions: { increment: totalQuestions },
        correctAnswers: { increment: correctAnswers },
        lastPracticedAt: now,
      },
    })
  } else {
    const initial = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : Math.round(grade)
    let progressTeacherId = teacherId || ''
    if (!progressTeacherId && classId) {
      const classInfo = await prisma.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      })
      progressTeacherId = classInfo?.teacherId || ''
    }
    progress = await prisma.studentProgress.create({
      data: {
        studentId,
        classId: classId || undefined,
        teacherId: progressTeacherId,
        subject,
        topic,
        masteryScore: Math.max(0, Math.min(100, initial)),
        totalQuestions,
        correctAnswers,
        lastPracticedAt: now,
      },
    })
  }
  results.progress = progress

  // ── 2. Unit-level mastery (UnitMastery) ─────────────────────────────────────
  const existingUnit = await prisma.unitMastery.findUnique({
    where: { studentId_subject_unitName: { studentId, subject, unitName } },
  })

  let unit
  if (existingUnit) {
    const newTotal = existingUnit.totalQuestions + totalQuestions
    const newCorrect = existingUnit.correctAnswers + correctAnswers
    const newMastery = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : existingUnit.masteryScore
    unit = await prisma.unitMastery.update({
      where: { id: existingUnit.id },
      data: {
        masteryScore: Math.max(0, Math.min(100, newMastery)),
        masteryLevel: getMasteryLevel(newMastery),
        totalQuestions: newTotal,
        correctAnswers: newCorrect,
        quizzesTaken: { increment: totalQuestions > 0 ? 1 : 0 },
        lastPracticedAt: now,
      },
    })
  } else {
    const initial = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : Math.round(grade)
    unit = await prisma.unitMastery.create({
      data: {
        studentId, subject, unitName,
        masteryScore: Math.max(0, Math.min(100, initial)),
        masteryLevel: getMasteryLevel(initial),
        totalQuestions,
        correctAnswers,
        quizzesTaken: totalQuestions > 0 ? 1 : 0,
        lastPracticedAt: now,
      },
    })
  }
  results.unit = unit

  // ── 3. Per-skill mastery (SkillMastery) ────────────────────────────────────
  if (input.skills) {
    const skillsUpdated: string[] = []
    for (const [skillName, correct] of Object.entries(input.skills)) {
      const existingSkill = await prisma.skillMastery.findUnique({
        where: { progressId_skillName: { progressId: progress.id, skillName } },
      })
      const delta = correct ? 8 : -5
      if (existingSkill) {
        await prisma.skillMastery.update({
          where: { id: existingSkill.id },
          data: {
            masteryScore: Math.max(0, Math.min(100, existingSkill.masteryScore + delta)),
            timesCorrect: { increment: correct ? 1 : 0 },
            timesTested: { increment: 1 },
            lastPracticedAt: now,
          },
        })
      } else {
        await prisma.skillMastery.create({
          data: {
            progressId: progress.id,
            skillName,
            skillCategory: 'knowledge',
            masteryScore: correct ? 8 : 0,
            timesCorrect: correct ? 1 : 0,
            timesTested: 1,
            lastPracticedAt: now,
          },
        })
      }
      skillsUpdated.push(skillName)
    }
    results.skillsUpdated = skillsUpdated
  }

  // ── 4. Spaced-repetition scheduling (ReviewSchedule) ───────────────────────
  const pass = grade >= 70
  const existingReview = await prisma.reviewSchedule.findUnique({
    where: { studentId_subject_topic: { studentId, subject, topic } },
  })

  if (!existingReview) {
    const intervalDays = pass ? 3 : 1
    const review = await prisma.reviewSchedule.create({
      data: {
        studentId, subject, topic, unitName,
        easeFactor: 2.5,
        intervalDays,
        repetitions: 0,
        nextReviewAt: new Date(now.getTime() + intervalDays * 86400000),
        quality: pass ? 4 : 2,
        totalReviews: 0,
      },
    })
    results.review = review
  } else if (!pass) {
    // Weak result: pull the next review sooner so the topic is revisited
    const sooner = new Date(now.getTime() + 86400000)
    if (!existingReview.nextReviewAt || existingReview.nextReviewAt > sooner) {
      const review = await prisma.reviewSchedule.update({
        where: { id: existingReview.id },
        data: { nextReviewAt: sooner, repetitions: 0, intervalDays: Math.min(existingReview.intervalDays, 1) },
      })
      results.review = review
    } else {
      results.review = existingReview
    }
  } else {
    results.review = existingReview
  }

  return results
}

// ── Daily maintenance (called by /api/cron/adaptive-learning) ──────────────
export async function runAdaptiveMaintenance() {
  const now = new Date()
  const stats = { decayed: 0, leveled: 0, scheduled: 0 }

  // Apply forgetting-curve decay to topic progress not touched in >1 day
  const stale = await prisma.studentProgress.findMany({
    where: { lastPracticedAt: { lt: new Date(now.getTime() - 24 * 3600000) } },
    select: { id: true, masteryScore: true, lastPracticedAt: true },
  })
  for (const p of stale) {
    if ((p.masteryScore || 0) <= 0) continue
    const days = Math.floor((now.getTime() - (p.lastPracticedAt?.getTime() || now.getTime())) / 86400000)
    if (days < 1) continue
    const decay = Math.min(Math.floor(days * 2), 50)
    const next = Math.max(0, p.masteryScore - decay)
    if (next === p.masteryScore) continue
    await prisma.studentProgress.update({
      where: { id: p.id },
      data: { masteryScore: next },
    })
    stats.decayed++
  }

  // Recompute mastery levels for all units
  const units = await prisma.unitMastery.findMany({
    select: { id: true, masteryScore: true, totalQuestions: true, correctAnswers: true, masteryLevel: true },
  })
  for (const u of units) {
    const score = u.totalQuestions > 0 ? Math.round((u.correctAnswers / u.totalQuestions) * 100) : u.masteryScore
    const level = getMasteryLevel(score)
    if (level !== u.masteryLevel || score !== u.masteryScore) {
      await prisma.unitMastery.update({
        where: { id: u.id },
        data: { masteryScore: score, masteryLevel: level },
      })
      stats.leveled++
    }
  }

  // Ensure spaced-repetition schedules exist for active topics with no schedule
  const progresses = await prisma.studentProgress.findMany({
    where: { lastPracticedAt: { not: null } },
    select: { id: true, studentId: true, subject: true, topic: true, masteryScore: true, lastPracticedAt: true },
  })
  for (const p of progresses) {
    const exists = await prisma.reviewSchedule.findUnique({
      where: { studentId_subject_topic: { studentId: p.studentId, subject: p.subject, topic: p.topic } },
      select: { id: true },
    })
    if (exists) continue
    const pass = (p.masteryScore || 0) >= 70
    const intervalDays = pass ? 3 : 1
    await prisma.reviewSchedule.create({
      data: {
        studentId: p.studentId,
        subject: p.subject,
        topic: p.topic,
        easeFactor: 2.5,
        intervalDays,
        repetitions: 0,
        nextReviewAt: new Date((p.lastPracticedAt?.getTime() || now.getTime()) + intervalDays * 86400000),
        quality: pass ? 4 : 2,
        totalReviews: 0,
      },
    })
    stats.scheduled++
  }

  return stats
}
