import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimitAI, getIP } from '@/lib/rate-limit'
import { OpenAIService } from '@/lib/openai-service'
import { stripLatex } from '@/lib/clean-ai-text'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const identifier = session?.user?.id || getIP(request)
    const rl = await rateLimitAI(identifier)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${rl.resetInSec}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.resetInSec) } }
      )
    }

    const { message, context, lessonContext, schemeContext, assignmentsContext } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ── Build system prompt based on context ──────────────────────────────
    let systemPrompt = `You are Hope, an AI teaching assistant for ElimuNova AI. You help teachers and students with education in Kenya. Be helpful, practical, and encouraging. Respond in English unless asked about Kiswahili.`

    if (context === 'teacher_assistant') {
      systemPrompt = `You are Hope, an AI teaching assistant for ElimuNova AI. You help Kenyan teachers with:
1. Lesson Planning — Create detailed, engaging CBC-aligned lesson plans
2. Curriculum Development — Structure curricula and learning objectives  
3. Assessment Ideas — Suggest creative, CBC-appropriate assessments
4. Student Engagement — Make learning interactive and practical
5. Differentiation — Adapt content for different learning styles
6. Classroom Management — Positive learning environment strategies

Be practical, actionable, and encouraging. Reference CBC competencies and Kenyan education context.`

    } else if (context === 'student_tutor') {
      let contextInfo = ''

      // Fetch shared materials for this student
      try {
        if (session?.user?.role === 'STUDENT') {
          const student = await prisma.student.findUnique({
            where: { userId: session.user.id },
            include: { class: { include: { teacher: true } } }
          })

          if (student) {
            const [lessonPlans, sharedSchemes] = await Promise.all([
              prisma.lessonPlan.findMany({
                where: { teacherId: student.class?.teacherId, isShared: true },
                select: { title: true, subject: true, grade: true },
                take: 5
              }),
              prisma.sharedSchemeOfWork.findMany({
                where: { studentId: student.id } as any,
                include: { schemeOfWork: { select: { title: true, subject: true, grade: true } } },
                take: 3
              })
            ])

            if (lessonPlans.length > 0) {
              contextInfo += `\n\nYour teacher has shared these lesson plans: ${lessonPlans.map(p => `${p.title} (${p.subject} ${p.grade})`).join(', ')}.`
            }
            if (sharedSchemes.length > 0) {
              contextInfo += `\n\nShared schemes of work: ${sharedSchemes.map(s => `${(s as any).schemeOfWork.title} (${(s as any).schemeOfWork.subject})`).join(', ')}.`
            }
          }
        }
      } catch (e) {
        console.error('Error fetching student context:', e)
      }

      // Inject lesson/scheme/assignment context if provided
      if (lessonContext?.lessonPlan) {
        const { title, subject, grade, content } = lessonContext.lessonPlan
        contextInfo += `\n\nCURRENT LESSON: "${title}" — ${subject}, ${grade}.\nContent summary: ${(content?.generatedContent || '').slice(0, 400)}`
      }
      if (schemeContext?.schemeOfWork) {
        const { title, subject, grade } = schemeContext.schemeOfWork
        contextInfo += `\n\nCURRENT SCHEME: "${title}" — ${subject}, ${grade}.`
      }
      if (assignmentsContext?.assignments?.length) {
        const names = assignmentsContext.assignments.slice(0, 3).map((a: any) => a.title).join(', ')
        contextInfo += `\n\nACTIVE ASSIGNMENTS: ${names}.`
      }

      systemPrompt = `You are an AI Tutor for ElimuNova AI, helping Kenyan students learn and understand subjects.

You are patient, encouraging, clear, and interactive. You:
- Explain concepts simply with local Kenyan examples
- Ask questions to check understanding  
- Give step-by-step guidance for problems
- Help with homework, exam prep, and study strategies
- Adapt to the student's level
- Are friendly and supportive
${contextInfo}`
    }

    // ── Call AI through waterfall ─────────────────────────────────────────
    const response = await OpenAIService.generateText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: message },
      ],
      { maxTokens: 1000, temperature: 0.7 }
    )

    return NextResponse.json({ response: stripLatex(response) })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({
      response: "I'm having a brief technical issue. Please try again in a moment.",
      error: 'AI service temporarily unavailable'
    }, { status: 500 })
  }
}
