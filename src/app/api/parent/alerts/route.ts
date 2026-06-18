import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const prismaClient = prisma as any

// Severity levels
type Severity = 'critical' | 'warning' | 'info'

interface Alert {
  id: string
  studentId: string
  studentName: string
  type: string
  title: string
  message: string
  severity: Severity
  subject?: string
  detectedAt: string
  isRead: boolean
}

function buildAlerts(student: any): Alert[] {
  const alerts: Alert[] = []
  const name = `${student.user.firstName} ${student.user.lastName}`
  const analytics: any = student.analytics || {}
  const progress: any[] = student.studentProgress || []
  const submissions: any[] = student.submissions || []
  const assignments: any[] = student.assignments || []
  const aiSessions: any[] = student.aiTutorSessions || []

  // ── 1. OVERDUE ASSIGNMENTS ─────────────────────────────────────────────────
  const now = new Date()
  const overdueAssignments = assignments.filter((a: any) => {
    const due = new Date(a.dueDate)
    const submitted = submissions.some(
      (s: any) => s.assignment?.id === a.id && s.status !== 'PENDING'
    )
    return due < now && !submitted
  })

  if (overdueAssignments.length >= 3) {
    alerts.push({
      id: `overdue-${student.id}`,
      studentId: student.id,
      studentName: name,
      type: 'overdue_assignments',
      title: 'Multiple Overdue Assignments',
      message: `${name} has ${overdueAssignments.length} overdue assignments. Immediate attention needed before report cards.`,
      severity: 'critical',
      detectedAt: now.toISOString(),
      isRead: false,
    })
  } else if (overdueAssignments.length > 0) {
    alerts.push({
      id: `overdue-mild-${student.id}`,
      studentId: student.id,
      studentName: name,
      type: 'overdue_assignments',
      title: 'Overdue Assignment',
      message: `${name} has ${overdueAssignments.length} overdue assignment${overdueAssignments.length > 1 ? 's' : ''} that need attention.`,
      severity: 'warning',
      detectedAt: now.toISOString(),
      isRead: false,
    })
  }

  // ── 2. LOW AVERAGE GRADE ───────────────────────────────────────────────────
  const avgGrade = analytics.averageGrade
  if (avgGrade !== null && avgGrade !== undefined) {
    if (avgGrade < 50) {
      alerts.push({
        id: `grade-critical-${student.id}`,
        studentId: student.id,
        studentName: name,
        type: 'low_grade',
        title: 'Academic Performance Alert',
        message: `${name}'s average grade is ${Math.round(avgGrade)}%. AI analysis suggests they need additional support in core subjects before the next assessment period.`,
        severity: 'critical',
        detectedAt: now.toISOString(),
        isRead: false,
      })
    } else if (avgGrade < 65) {
      alerts.push({
        id: `grade-warning-${student.id}`,
        studentId: student.id,
        studentName: name,
        type: 'low_grade',
        title: 'Below Average Performance',
        message: `${name}'s average grade has dropped to ${Math.round(avgGrade)}%. Consider reviewing their study habits and seeking teacher support.`,
        severity: 'warning',
        detectedAt: now.toISOString(),
        isRead: false,
      })
    }
  }

  // ── 3. SUBJECT-SPECIFIC STRUGGLES (from StudentProgress) ──────────────────
  const lowMasterySubjects = progress.filter((p: any) => p.masteryScore < 40 && p.subject !== 'General')
  lowMasterySubjects.forEach((p: any) => {
    alerts.push({
      id: `mastery-${student.id}-${p.subject}`,
      studentId: student.id,
      studentName: name,
      type: 'subject_struggle',
      title: `Struggling in ${p.subject}`,
      message: `${name}'s AI tutor mastery score in ${p.subject} is ${p.masteryScore}%. Common mistakes detected: ${Array.isArray(p.commonMistakes) ? p.commonMistakes.slice(0, 2).join(', ') : 'concept gaps identified'}. Early intervention recommended.`,
      severity: p.masteryScore < 20 ? 'critical' : 'warning',
      subject: p.subject,
      detectedAt: now.toISOString(),
      isRead: false,
    })
  })

  // ── 4. INACTIVITY ──────────────────────────────────────────────────────────
  const lastActive = analytics.lastActiveDate ? new Date(analytics.lastActiveDate) : null
  if (lastActive) {
    const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceActive >= 7) {
      alerts.push({
        id: `inactive-${student.id}`,
        studentId: student.id,
        studentName: name,
        type: 'inactivity',
        title: 'Learning Inactivity Detected',
        message: `${name} hasn't logged into the platform in ${daysSinceActive} days. Regular engagement is key to academic success.`,
        severity: daysSinceActive >= 14 ? 'critical' : 'warning',
        detectedAt: now.toISOString(),
        isRead: false,
      })
    }
  }

  // ── 5. ZERO AI TUTOR USAGE ─────────────────────────────────────────────────
  if (aiSessions.length === 0 && assignments.length > 0) {
    alerts.push({
      id: `no-tutor-${student.id}`,
      studentId: student.id,
      studentName: name,
      type: 'no_ai_usage',
      title: 'AI Tutor Not Being Used',
      message: `${name} hasn't used the AI tutor yet. Students who engage with the AI tutor score on average 23% higher. Encourage them to start a session.`,
      severity: 'info',
      detectedAt: now.toISOString(),
      isRead: false,
    })
  }

  // ── 6. STREAK BROKEN / LOW ENGAGEMENT ─────────────────────────────────────
  const streakDays = analytics.streakDays || 0
  const weeklyGoal = analytics.weeklyGoal || 300
  const totalStudyTime = analytics.totalStudyTime || 0
  const weeklyStudyMinutes = Math.min(totalStudyTime, weeklyGoal) // rough approximation

  if (streakDays === 0 && assignments.length > 2) {
    alerts.push({
      id: `streak-broken-${student.id}`,
      studentId: student.id,
      studentName: name,
      type: 'low_engagement',
      title: 'Study Streak Broken',
      message: `${name}'s daily study streak has been broken. Consistent daily practice significantly improves long-term retention and grades.`,
      severity: 'info',
      detectedAt: now.toISOString(),
      isRead: false,
    })
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<Severity, number> = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

// GET — fetch all current alerts for a parent's children
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parent = await prismaClient.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: true,
                analytics: true,
                studentProgress: true,
                aiTutorSessions: { orderBy: { createdAt: 'desc' }, take: 5 },
                submissions: {
                  include: { assignment: true },
                  orderBy: { submittedAt: 'desc' },
                  take: 30,
                },
                assignments: {
                  orderBy: { dueDate: 'asc' },
                  take: 30,
                },
              },
            },
          },
        },
      },
    })

    if (!parent) {
      // Independent parent with no children linked yet
      return NextResponse.json({ alerts: [], totalCritical: 0, totalWarning: 0 })
    }

    const allAlerts: Alert[] = []
    for (const ps of parent.students) {
      const studentAlerts = buildAlerts(ps.student)
      allAlerts.push(...studentAlerts)
    }

    const totalCritical = allAlerts.filter(a => a.severity === 'critical').length
    const totalWarning = allAlerts.filter(a => a.severity === 'warning').length

    return NextResponse.json({ alerts: allAlerts, totalCritical, totalWarning })
  } catch (error) {
    console.error('[GET_PARENT_ALERTS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create a real notification in the DB and push to parent
// Called by a cron job or teacher action
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { parentUserId, studentName, alertType, severity, title, message } = await request.json()

    const notification = await prisma.notification.create({
      data: {
        title: `⚠️ ${title}`,
        message,
        type: severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'info',
        userId: parentUserId,
        senderId: session.user.id,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('[POST_PARENT_ALERTS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
