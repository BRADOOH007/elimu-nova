import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route, apiLogger } from '@/lib/api-middleware'

const log = apiLogger('student/recommendations')
export const dynamic = 'force-dynamic'

export const GET = route({ auth: 'STUDENT' }, async (req, { user }) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const submissions = await prisma.submission.findMany({
      where: { studentId: student.id, grade: { not: null } },
      include: { assignment: { select: { title: true, subject: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    })

    const weakSubjects: string[] = []
    const strongSubjects: string[] = []
    const subjectGrades: Record<string, number[]> = {}
    for (const s of submissions) {
      const subj = s.assignment.subject || 'General'
      if (!subjectGrades[subj]) subjectGrades[subj] = []
      subjectGrades[subj].push(s.grade || 0)
    }
    for (const [subj, grades] of Object.entries(subjectGrades)) {
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length
      if (avg < 60) weakSubjects.push(subj)
      else if (avg >= 75) strongSubjects.push(subj)
    }

    const recommendations: { type: string; title: string; description: string; action: string; href: string }[] = []

    const recentSubmissions = submissions.slice(0, 5)
    const recentAvg = recentSubmissions.length > 0
      ? recentSubmissions.reduce((s, sub) => s + (sub.grade || 0), 0) / recentSubmissions.length
      : 0

    if (recentAvg < 50) {
      recommendations.push({
        type: 'danger', title: 'AI Tutor Recommended',
        description: 'Your recent grades suggest you could benefit from extra help',
        action: 'Chat with AI Tutor', href: '/student/ai-tutor',
      })
    }

    if (weakSubjects.length > 0) {
      recommendations.push({
        type: 'warning', title: 'Focus Areas',
        description: `Strengthen your ${weakSubjects.slice(0, 2).join(' and ')} skills`,
        action: 'Start Practicing', href: '/student/learn',
      })
    }

    if (strongSubjects.length > 0 && weakSubjects.length === 0) {
      recommendations.push({
        type: 'success', title: 'Excell in your strengths!',
        description: `You're doing great in ${strongSubjects.slice(0, 2).join(' and ')}`,
        action: 'Advanced Topics', href: '/student/learn',
      })
    }

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const weeklyCount = await prisma.studySession.count({
      where: { studentId: student.id, startTime: { gte: weekStart } }
    })
    if (weeklyCount < 3 && submissions.length > 0) {
      recommendations.push({
        type: 'info', title: 'Study Consistency',
        description: `Only ${weeklyCount} study session${weeklyCount === 1 ? '' : 's'} this week. Try to study daily`,
        action: 'View Schedule', href: '/student/schedule',
      })
    }

    const pendingCount = await prisma.submission.count({
      where: { studentId: student.id, grade: null, status: 'PENDING' }
    })
    if (pendingCount > 0) {
      recommendations.push({
        type: 'info', title: 'Pending Work',
        description: `You have ${pendingCount} unsubmitted assignment${pendingCount > 1 ? 's' : ''}`,
        action: 'View Assignments', href: '/student/assignments',
      })
    }

    // ── Adaptive signals ──────────────────────────────────────────────
    // Due spaced-repetition reviews
    const dueReviews = await prisma.reviewSchedule.findMany({
      where: { studentId: student.id, nextReviewAt: { lte: new Date() } },
      orderBy: { nextReviewAt: 'asc' },
      take: 5,
    })
    if (dueReviews.length > 0) {
      const topics = dueReviews.slice(0, 2).map(r => r.topic).join(' and ')
      recommendations.push({
        type: 'info', title: 'Reviews Due',
        description: `${dueReviews.length} topic${dueReviews.length > 1 ? 's' : ''} due for review: ${topics}. Spaced review locks in learning.`,
        action: 'Start Reviewing', href: '/student/learn',
      })
    }

    // Weak skills (below mastery 50) from per-skill tracking
    const progressRow = await prisma.studentProgress.findFirst({
      where: { studentId: student.id },
      orderBy: { updatedAt: 'desc' },
      include: { skillMastery: { orderBy: { masteryScore: 'asc' }, take: 5 } },
    })
    const weakSkills = (progressRow?.skillMastery || []).filter(s => s.masteryScore < 50)
    if (weakSkills.length > 0) {
      const skills = weakSkills.slice(0, 2).map(s => s.skillName).join(' and ')
      recommendations.push({
        type: 'warning', title: 'Adaptive Focus: Weak Skills',
        description: `Mastery engine flagged: ${skills}. Targeted practice will boost these fast.`,
        action: 'Personalized Practice', href: '/student/ai-tutor',
      })
    }

    // Adaptive difficulty recommendation from recent performance
    const adaptive = await prisma.studentProgress.findFirst({
      where: { studentId: student.id, preferredDifficulty: { not: 'medium' } },
      orderBy: { updatedAt: 'desc' },
      select: { preferredDifficulty: true },
    })
    if (adaptive) {
      const isHard = adaptive.preferredDifficulty === 'hard'
      const isEasy = adaptive.preferredDifficulty === 'easy'
      if (isHard) {
        recommendations.push({
          type: 'success', title: 'Adaptive Boost',
          description: 'Your performance is strong. The system bumped you to harder questions to keep you challenged.',
          action: 'Try Harder Practice', href: '/student/learn',
        })
      } else if (isEasy) {
        recommendations.push({
          type: 'warning', title: 'Adaptive Support',
          description: 'Recent results suggest easing difficulty for a confidence boost before advancing.',
          action: 'Review Foundations', href: '/student/ai-tutor',
        })
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success', title: 'Great Progress!',
        description: 'Keep up the good work. Try exploring new topics or coding',
        action: 'Explore Curriculum', href: '/student/curriculum',
      })
    }

    return NextResponse.json({ recommendations })
  } catch (error) {
    log.error('Error fetching recommendations:', error)
    return NextResponse.json({ recommendations: [] })
  }
})
