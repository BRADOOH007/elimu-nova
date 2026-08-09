import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/openai-service'
import { stripLatex } from '@/lib/clean-ai-text'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'none' }, async (request, { user }) => {
  const { message, subject, topic, hints = [], messages = [] } = await request.json()

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // Build student context
  let contextInfo = ''
  try {
    if (user?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          user: { select: { firstName: true, lastName: true } },
          class: true,
        },
      })
      if (student) {
        contextInfo += `\n\nStudent: ${student.user.firstName} ${student.user.lastName}`
        if (student.class?.name) contextInfo += ` in ${student.class.name}`
      }
    }
  } catch { /* continue without context */ }

  const systemPrompt = `You are a Socratic Tutor for ElimuNova AI. Your role is to help students understand "${topic || 'this topic'}" in ${subject || 'the subject'} by asking guiding questions — NOT by giving answers directly.

SOCRATIC METHOD RULES:
1. NEVER give the answer directly. Instead, ask a guiding question that leads the student toward the answer.
2. Break complex problems into smaller, manageable steps.
3. If the student is wrong, don't say "wrong" — ask "What do you think would happen if...?" or "Can you check that step again?"
4. If the student is stuck, give a small hint (a concept, not the answer), then ask another guiding question.
5. Praise reasoning and effort, not just correct answers.
6. When the student reaches the correct answer through their own reasoning, celebrate it and explain WHY it's correct.
7. Use relatable local examples and contexts where possible.
8. Keep responses concise (2-4 sentences max per response).
9. After 3-4 guiding questions, if the student still struggles, provide a brief explanation (not the full answer) and then ask them to apply it.

HINTS ALREADY GIVEN: ${hints.length > 0 ? hints.join('; ') : 'None yet'}
${contextInfo}

Conversation history:
${messages.map((m: any) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n')}

Current student message: ${message}

Respond as a Socratic tutor. Ask a guiding question or give a small hint.`

  const chatMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map((m: any) => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  const response = await OpenAIService.generateText(chatMessages, {
    maxTokens: 500,
    temperature: 0.7,
  })

  return NextResponse.json({ response: stripLatex(response) })
})
