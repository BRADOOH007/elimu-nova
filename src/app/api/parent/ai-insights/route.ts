import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'PARENT' }, async (req, { user }) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
                class: { select: { name: true, grade: true } },
                analytics: true,
                studentProgress: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  include: { skillMastery: { orderBy: { masteryScore: 'asc' }, take: 10 } },
                },
                submissions: {
                  orderBy: { submittedAt: 'desc' },
                  take: 10,
                  include: { assignment: { select: { title: true, subject: true } } },
                },
                unitMasteries: { orderBy: { masteryScore: 'asc' }, take: 10 },
              },
            },
          },
        },
      },
    })

    if (!parent) return NextResponse.json({ insights: [], actionPlans: [], riskAlerts: [] })

    const insights: any[] = []
    const actionPlans: any[] = []
    const riskAlerts: any[] = []

    for (const ps of parent.students) {
      const student = ps.student
      if (!student) continue
      const childName = `${student.user.firstName} ${student.user.lastName}`
      const grade = student.analytics?.averageGrade ?? null
      const pending = student.analytics?.pendingAssignments ?? 0
      const streak = student.analytics?.streakDays ?? 0
      const progress = student.studentProgress?.[0]
      const mastery = progress?.masteryScore ?? 0
      const skillMastery = progress?.skillMastery || []

      // 1. At-Risk Detection
      const isAtRisk = (grade !== null && grade < 50) || pending > 5 || (mastery > 0 && mastery < 40)
      if (isAtRisk) {
        const reasons: string[] = []
        if (grade !== null && grade < 50) reasons.push(`Average grade is ${grade}%`)
        if (pending > 5) reasons.push(`${pending} overdue assignments`)
        if (mastery > 0 && mastery < 40) reasons.push(`Low skill mastery (${Math.round(mastery)}%)`)
        riskAlerts.push({
          childName,
          studentId: student.id,
          severity: grade !== null && grade < 30 ? 'critical' : 'warning',
          title: `${childName} may need support`,
          message: reasons.join('. ') + '. Consider discussing with their teacher.',
          reasons,
        })
      }

      // 2. Strengths & Weaknesses
      const strongSkills = skillMastery.filter((s: any) => s.masteryScore >= 80)
      const weakSkills = skillMastery.filter((s: any) => s.masteryScore < 50 && s.timesTested >= 3)

      if (strongSkills.length > 0) {
        insights.push({
          childName,
          studentId: student.id,
          type: 'strength',
          title: `${childName}'s Strengths`,
          message: `Strong in: ${strongSkills.slice(0, 3).map((s: any) => s.skillName).join(', ')}.`,
          suggestion: 'Encourage them to help peers or explore advanced topics in these areas.',
        })
      }

      if (weakSkills.length > 0) {
        insights.push({
          childName,
          studentId: student.id,
          type: 'weakness',
          title: `${childName} Needs Practice`,
          message: `Needs improvement in: ${weakSkills.slice(0, 3).map((s: any) => s.skillName).join(', ')}.`,
          suggestion: 'Suggest 15-20 minutes of daily practice on these topics. Use the AI Tutor for guided help.',
        })

        // 3. Home Action Plan
        actionPlans.push({
          childName,
          studentId: student.id,
          title: `Practice Plan for ${childName}`,
          items: weakSkills.slice(0, 3).map((s: any) => ({
            skill: s.skillName,
            action: `Spend 15 minutes daily on ${s.skillName}`,
            resource: 'Use the AI Tutor in Practice mode for guided exercises',
            timeframe: '2 weeks',
          })),
        })
      }

      // 4. Study Habit Insights
      if (streak === 0 && pending === 0 && (grade ?? 0) >= 70) {
        insights.push({
          childName,
          studentId: student.id,
          type: 'habit',
          title: `${childName} Hasn't Studied Recently`,
          message: `No study streak despite good grades (${grade}%). Maintaining consistency is key.`,
          suggestion: 'Encourage a daily 20-minute study routine to build lasting habits.',
        })
      }

      if (streak >= 7) {
        insights.push({
          childName,
          studentId: student.id,
          type: 'habit',
          title: `${childName} Has a ${streak}-Day Study Streak!`,
          message: 'Consistent studying is building strong foundations.',
          suggestion: 'Celebrate this achievement! Consider a small reward to reinforce the habit.',
        })
      }

      // 5. Recent Performance Trend
      const recentGrades = (student.submissions || [])
        .filter((s: any) => s.grade !== null && s.grade !== undefined)
        .slice(0, 5)
      if (recentGrades.length >= 3) {
        const avg = Math.round(recentGrades.reduce((s: number, g: any) => s + (g.grade || 0), 0) / recentGrades.length)
        const earlier = (student.submissions || [])
          .filter((s: any) => s.grade !== null)
          .slice(5, 10)
        if (earlier.length >= 3) {
          const prevAvg = Math.round(earlier.reduce((s: number, g: any) => s + (g.grade || 0), 0) / earlier.length)
          const diff = avg - prevAvg
          if (diff >= 10) {
            insights.push({
              childName,
              studentId: student.id,
              type: 'trend',
              title: `${childName} Is Improving!`,
              message: `Recent grades average ${avg}%, up from ${prevAvg}% — a ${diff}% improvement.`,
              suggestion: 'Keep encouraging them. Consider discussing what study methods are working.',
            })
          } else if (diff <= -10) {
            insights.push({
              childName,
              studentId: student.id,
              type: 'trend',
              title: `${childName}'s Grades Have Dipped`,
              message: `Recent grades average ${avg}%, down from ${prevAvg}%.`,
              suggestion: 'Talk to your child about any challenges they are facing. Consider reaching out to their teacher.',
            })
          }
        }
      }
    }

    // Sort risk alerts by severity
    riskAlerts.sort((a: any, b: any) => (a.severity === 'critical' ? -1 : 1))

    return NextResponse.json({
      insights: insights.slice(0, 15),
      actionPlans: actionPlans.slice(0, 5),
      riskAlerts: riskAlerts.slice(0, 10),
      summary: {
        totalChildren: parent.students.length,
        atRisk: riskAlerts.filter((r: any) => r.severity === 'critical').length,
        warnings: riskAlerts.filter((r: any) => r.severity === 'warning').length,
        strengths: insights.filter((i: any) => i.type === 'strength').length,
      },
    })
  } catch (error) {
    console.error('[Parent AI Insights] Error:', error)
    return NextResponse.json({ insights: [], actionPlans: [], riskAlerts: [], summary: { totalChildren: 0, atRisk: 0, warnings: 0, strengths: 0 } })
  }
})
