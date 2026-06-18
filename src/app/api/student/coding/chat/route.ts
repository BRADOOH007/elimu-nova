import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, language, lessonTitle, context } = await request.json()
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const { OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined,
    })

    const systemPrompt = `You are an expert coding tutor for the ElimuNova AI Coding Studio. 
You help students (Grade 1-12) learn programming step by step.

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

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 600,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || 'I could not generate a response. Please try again.'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('[CODING_CHAT]', error)
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 })
  }
}
