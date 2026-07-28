import { prisma } from './prisma'
import { callAI } from './ai-provider'
import { whatsappService } from './whatsapp-service'
import { logger } from './logger'

export interface CheckInResponse {
  studentId: string
  mood: number
  energy: number
  stress: number
  sleep: number
  social: number
  concerns?: string
  openness: number
}

export const CHECKIN_QUESTIONS = [
  { key: 'mood', question: 'How would you rate your mood this week? (1-5, where 1 is very low and 5 is very happy)', min: 1, max: 5 },
  { key: 'energy', question: 'How is your energy level? (1-5, where 1 is exhausted and 5 is full of energy)', min: 1, max: 5 },
  { key: 'stress', question: 'How stressed have you been feeling? (1-5, where 1 is not stressed at all and 5 is extremely stressed)', min: 1, max: 5 },
  { key: 'sleep', question: 'How has your sleep been? (1-5, where 1 is very poor and 5 is excellent)', min: 1, max: 5 },
  { key: 'social', question: 'How connected do you feel to others? (1-5, where 1 is very isolated and 5 is very connected)', min: 1, max: 5 },
  { key: 'openness', question: 'How open are you to sharing more today? (1-5)', min: 1, max: 5 },
]

export class MentalHealthService {
  async getQuestions() {
    return CHECKIN_QUESTIONS
  }

  async submitCheckIn(studentId: string, responses: CheckInResponse) {
    const flags = this.evaluateFlags(responses)
    const score = this.calculateWellbeing(responses)
    const aiInsight = await this.generateInsight(responses, flags)

    const checkin = await prisma.wellnessCheckIn.create({
      data: {
        studentId,
        mood: responses.mood,
        energy: responses.energy,
        stress: responses.stress,
        sleep: responses.sleep,
        social: responses.social,
        openness: responses.openness,
        concerns: responses.concerns || null,
        score,
        flags,
        aiInsight,
      },
    })

    if (flags.length > 0) {
      await this.triggerAlerts(studentId, responses, flags, score)
    }

    return { checkin, score, flags, aiInsight }
  }

  private calculateWellbeing(r: CheckInResponse): number {
    const positive = (r.mood + r.energy + (6 - r.stress) + r.sleep + r.social) / 5
    return Math.round((positive / 5) * 100)
  }

  private evaluateFlags(r: CheckInResponse): string[] {
    const flags: string[] = []
    if (r.mood <= 2) flags.push('LOW_MOOD')
    if (r.stress >= 4) flags.push('HIGH_STRESS')
    if (r.sleep <= 2) flags.push('SLEEP_ISSUE')
    if (r.social <= 2) flags.push('SOCIAL_ISOLATION')
    if (r.energy <= 2) flags.push('LOW_ENERGY')

    const crisisScore = (r.mood <= 1 && r.stress >= 5)
    if (crisisScore) flags.push('CRITICAL')
    else if (flags.length >= 2) flags.push('ATTENTION')
    return flags
  }

  private async generateInsight(r: CheckInResponse, flags: string[]): Promise<string> {
    const hasConcerns = r.concerns && r.concerns.trim().length > 0
    const prompt = `You are a supportive school wellness coach. A student checked in:
- Mood: ${r.mood}/5
- Energy: ${r.energy}/5
- Stress: ${r.stress}/5
- Sleep: ${r.sleep}/5
- Social: ${r.social}/5
${hasConcerns ? `- Concerns: ${r.concerns}` : ''}
- Flags: ${flags.join(', ') || 'All good'}

Write 2-3 encouraging sentences. Be warm. If flags exist, gently suggest talking to a trusted adult. Keep under 80 words.`

    try {
      const result = await callAI({ messages: [{ role: 'user', content: prompt }], maxTokens: 150 })
      return result.content || 'Thank you for sharing. Remember, it is okay to ask for help when you need it.'
    } catch {
      return 'Thank you for sharing. Remember, it is okay to ask for help when you need it.'
    }
  }

  private async triggerAlerts(studentId: string, r: CheckInResponse, flags: string[], score: number) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true, teacher: { include: { user: true } } },
      })
      if (!student) return

      if (student.teacher?.userId) {
        await prisma.notification.create({
          data: {
            title: flags.includes('CRITICAL') ? '🧠 Critical Wellness Alert' : '🧠 Wellness Check Flagged',
            message: `${student.user.firstName} ${student.user.lastName}: ${flags.join(', ')}. Score: ${score}%.`,
            type: flags.includes('CRITICAL') ? 'error' : 'warning',
            userId: student.teacher.userId,
            targetRole: 'TEACHER',
          },
        })
      }

      if (flags.includes('CRITICAL')) {
        const parentLinks = await prisma.parentStudent.findMany({
          where: { studentId },
          include: { parent: { include: { user: true } } },
        })
        for (const ps of parentLinks) {
          if (ps.parent.user.phone) {
            await whatsappService.sendParentAlert(
              ps.parent.id,
              '💚 Wellness — Needs Attention',
              `${student.user.firstName} needs support. Please check in with them.`
            )
          }
        }
      }
    } catch (error) {
      logger.error('[MentalHealth] triggerAlerts failed', error)
    }
  }

  async getStudentHistory(studentId: string, limit = 10) {
    return prisma.wellnessCheckIn.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getAtRiskStudents(schoolId: string) {
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const recentCheckins = await prisma.wellnessCheckIn.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      include: { student: { include: { user: true, school: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const latest: Record<string, typeof recentCheckins[0]> = {}
    for (const c of recentCheckins) {
      if (c.student.schoolId !== schoolId) continue
      if (!latest[c.studentId] || c.createdAt > latest[c.studentId].createdAt) {
        latest[c.studentId] = c
      }
    }

    return Object.values(latest)
      .filter(c => c.flags.length > 0)
      .map(c => ({
        studentId: c.studentId,
        studentName: `${c.student.user.firstName} ${c.student.user.lastName}`,
        score: c.score,
        flags: c.flags,
        lastCheckin: c.createdAt,
      }))
      .sort((a, b) => a.score - b.score)
  }
}

export const mentalHealthService = new MentalHealthService()
