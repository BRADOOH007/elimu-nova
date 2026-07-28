import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { message, language, lessonTitle } = await request.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const systemPrompt = `You are an expert coding tutor for the ElimuNova AI Coding Studio.
You help Kenyan students (Grade 1-12) learn programming step by step.

Current context:
- Language/Environment: ${language || 'Scratch/Block-based programming'}
- Lesson: ${lessonTitle || 'General coding help'}

Your teaching style:
- Break concepts into small, clear steps
- Use simple language appropriate for the student's age
- Give concrete examples they can try immediately
- Encourage and celebrate progress
- For Scratch: describe blocks visually (e.g., "the blue 'move 10 steps' block")
- For web code: provide small runnable snippets
- Ask follow-up questions to check understanding
- Never give the full solution immediately — guide them to discover it

Always respond in a friendly, encouraging tone.`

  const response = await OpenAIService.generateText([
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: message         },
  ], { maxTokens: 600, temperature: 0.7 })

  return NextResponse.json({ response })
})
