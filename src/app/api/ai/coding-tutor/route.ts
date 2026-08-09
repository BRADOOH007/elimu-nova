import { NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai-service'
import { route } from '@/lib/api-middleware'

type CodingTrackId = 'scratch' | 'web-dev' | 'ai-for-kids' | 'python'

const TRACK_PROMPTS: Record<CodingTrackId, string> = {
  'web-dev': `You are an HTML/CSS/JS tutor. Explain DOM elements and CSS rules simply for Grade 4-6 students. Break layout, styling, and interactivity into small, fun steps. Reference specific elements/classes from the student's code when you can.`,
  scratch: `You are a Scratch block-coding mentor. Help with sprite movement, loops, conditionals, and broadcasts. Describe blocks visually (e.g. "the blue 'move 10 steps' block"). Encourage experimentation in the TurboWarp canvas.`,
  python: `You are a Python tutor. Help with syntax, logic, functions, and debugging without giving direct copy-paste answers immediately. Guide the student step by step so they discover the fix themselves.`,
  'ai-for-kids': `You are a friendly AI teacher for young students. Explain AI concepts (training, patterns, image recognition, ethics) with simple examples and encouraging language.`,
}

const QUICK_SUGGESTIONS: Record<CodingTrackId, string[]> = {
  scratch: ['Explain my code', 'Find my bug', 'Give me a step-by-step hint'],
  'web-dev': ['Explain my code', 'Find my bug', 'Give me a step-by-step hint'],
  python: ['Explain my code', 'Find my bug', 'Give me a step-by-step hint'],
  'ai-for-kids': ['Explain this idea', 'Why does it matter?', 'Give me an example'],
}

const mapTrack = (trackId?: string): CodingTrackId => {
  const t = (trackId || 'web-dev') as CodingTrackId
  return t in TRACK_PROMPTS ? t : 'web-dev'
}

export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { message, trackId, lessonId, activeCode, errorLogs, history } = await request.json()
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const track = mapTrack(trackId)
  const systemPrompt = `${TRACK_PROMPTS[track]}

Current context:
- Track: ${track}
- Lesson: ${lessonId || 'General coding help'}
${activeCode ? `\nStudent's current code:\n\`\`\`\n${activeCode.slice(0, 3000)}\n\`\`\`` : ''}
${errorLogs ? `\nErrors the student is seeing:\n${errorLogs.slice(0, 1500)}` : ''}

Your teaching style:
- Keep explanations brief and age-appropriate for the student's level.
- Give concrete, runnable examples, but never the whole solution at once.
- Encourage progress and ask a short follow-up to check understanding.`

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]
  const hist = Array.isArray(history) ? history.slice(-6) : []
  for (const h of hist) {
    if (h?.role === 'user' || h?.role === 'assistant') {
      messages.push({ role: h.role, content: String(h.content || '').slice(0, 3000) })
    }
  }
  messages.push({ role: 'user', content: message })

  const response = await OpenAIService.generateText(messages, { maxTokens: 700, temperature: 0.7 })

  return NextResponse.json({ response, quickActions: QUICK_SUGGESTIONS[track] })
})