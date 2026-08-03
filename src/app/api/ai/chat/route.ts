import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { stripLatex } from '@/lib/clean-ai-text'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'none' }, async (request, { user }) => {
    const { message, context, lessonContext, schemeContext, assignmentsContext, autoTeach, lessonContent, subject, topic, messages } = await request.json()

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

      // Fetch personal context for this student
      try {
        if (user?.role === 'STUDENT') {
          const student = await prisma.student.findUnique({
            where: { userId: user.id },
            include: {
              user: { select: { firstName: true, lastName: true } },
              class: { include: { teacher: true } }
            }
          })

          if (student) {
            // Student name
            contextInfo += `\n\nYou are talking to ${student.user.firstName} ${student.user.lastName}.`
            if (student.class) {
              contextInfo += ` They are in ${student.class.name || 'a class'}`
              if (student.class.grade) contextInfo += ` (Grade ${student.class.grade})`
              contextInfo += '.'
            }

            const [lessonPlans, sharedSchemes, recentSessions] = await Promise.all([
              prisma.lessonPlan.findMany({
                where: { teacherId: student.class?.teacherId, isShared: true },
                select: { title: true, subject: true, grade: true },
                take: 5
              }),
              prisma.sharedSchemeOfWork.findMany({
                where: { studentId: student.id } as any,
                include: { schemeOfWork: { select: { title: true, subject: true, grade: true } } },
                take: 3
              }),
              prisma.studySession.findMany({
                where: { studentId: student.id },
                orderBy: { createdAt: 'desc' },
                select: { subject: true, topic: true, duration: true },
                take: 5
              })
            ])

            if (lessonPlans.length > 0) {
              contextInfo += `\n\nTheir teacher has shared these lesson plans: ${lessonPlans.map(p => `${p.title} (${p.subject} ${p.grade})`).join(', ')}.`
            }
            if (sharedSchemes.length > 0) {
              contextInfo += `\n\nShared schemes of work: ${sharedSchemes.map(s => `${(s as any).schemeOfWork.title} (${(s as any).schemeOfWork.subject})`).join(', ')}`
            }
            if (recentSessions.length > 0) {
              const topics = [...new Set(recentSessions.map(s => s.topic).filter(Boolean))].slice(0, 3)
              const subjects = [...new Set(recentSessions.map(s => s.subject).filter(Boolean))].slice(0, 3)
              if (subjects.length > 0) contextInfo += `\n\nRecently studying: ${subjects.join(', ')}${topics.length > 0 ? ` — topics: ${topics.join(', ')}` : ''}.`
            }

            contextInfo += `\n\nUse the student's name naturally in conversation. Adapt your explanations to their level. Reference their recent study topics when relevant. Be encouraging and personal.`
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

      if (autoTeach && lessonContent) {
        const truncated = lessonContent.length > 4000 ? lessonContent.slice(0, 4000) + '\n\n[Content truncated]' : lessonContent
        systemPrompt = `You are an interactive AI Tutor for ElimuNova AI. Your role is to TEACH the following lesson on "${topic}" (${subject}) to a Kenyan student in a conversational, engaging way.
${contextInfo}

LESSON CONTENT:
${truncated}

Teaching rules:
1. Start by briefly summarising the key points from the notes above (2-3 sentences).
2. Then ask 5 multiple choice questions ONE AT A TIME. Wait for the student to answer before revealing the correct answer.
3. After each answer: tell them if they were correct, give a brief explanation, then move to the next question.
4. Each MCQ must have 4 options labelled A, B, C, D.
5. Use Kenyan examples and contexts.
6. Be encouraging — praise correct answers, gently correct wrong ones with a clearer explanation.
7. After all 5 questions, ask if they want to review any topic again or try more questions.
8. Stay educational — answer ANY question naturally, then gently guide back to learning`
      }
    }

    // ── Call AI through waterfall ─────────────────────────────────────────
    const chatMessages: { role: 'user' | 'system' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ]
    if (Array.isArray(messages)) {
      for (const m of messages) {
        const role = m.role === 'ai' ? 'assistant' as const : 'user' as const
        chatMessages.push({ role, content: m.content })
      }
    }
    chatMessages.push({ role: 'user', content: message })

    const detailed = await OpenAIService.generateTextDetailed(
      chatMessages,
      { maxTokens: autoTeach ? 1200 : 1000, temperature: autoTeach ? 0.75 : 0.7 }
    )

    return NextResponse.json({
      response: stripLatex(detailed.content),
      provider: detailed.provider,
      model: detailed.model,
      tokensUsed: detailed.tokensUsed,
      latencyMs: detailed.latencyMs,
    })

})
