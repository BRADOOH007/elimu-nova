import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-provider'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (req, { user }) => {
  let language = 'en'
  try {
    const body = await req.json()
    language = body.language || 'en'
    const { message, subject, topic } = body
    const langHint = language === 'sw'
      ? 'Jibu kwa Kiswahili sanifu. Kuwa msaada na rafiki. Tumia sentensi fupi 2-4.'
      : 'Answer in English. Be helpful and friendly. Use 2-4 short sentences.'
    const subjectHint = subject ? `Subject: ${subject}.` : ''
    const topicHint = topic ? `Topic: ${topic}.` : ''

    const response = await callAI({
      messages: [
        { role: 'system', content: `You are a Voice AI Tutor for students. ${subjectHint} ${topicHint} ${langHint} Since this will be read aloud via TTS, keep responses brief and conversational. Use simple vocabulary suitable for the student's level.` },
        { role: 'user', content: message },
      ],
      maxTokens: 300,
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('[VoiceTutor] Error:', error)
    return NextResponse.json({ response: language === 'sw' ? 'Samahani, kuna tatizo. Jaribu tena.' : 'Sorry, something went wrong. Please try again.' })
  }
})
