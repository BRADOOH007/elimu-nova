import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

export const POST = route({ auth: 'TEACHER' }, async (request, { user }) => {
    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const systemPrompt = `You are Hope, an AI teaching assistant for ElimuNova AI. You help Kenyan teachers with:
- Lesson planning and curriculum development
- Assessment strategies and marking rubrics
- Student engagement techniques
- CBC curriculum alignment
- Teaching notes and resources
- Classroom management strategies

Always be practical, encouraging and specific to Kenyan education context.
Respond in JSON format: { "response": "your helpful response", "suggestions": ["suggestion1", "suggestion2"], "resources": ["resource1"] }`

    const raw = await OpenAIService.generateText([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: message },
    ], { maxTokens: 1000, temperature: 0.7 })

    // Parse JSON response, fallback to plain text
    let parsed: any = { response: raw, suggestions: [], resources: [] }
    try {
      const start = raw.indexOf('{'); const end = raw.lastIndexOf('}')
      if (start !== -1 && end > start) parsed = JSON.parse(raw.slice(start, end + 1))
    } catch { /* use plain text fallback */ }

    return NextResponse.json({
      response:    parsed.response    || raw,
      suggestions: parsed.suggestions || [],
      resources:   parsed.resources   || [],
    })
})
