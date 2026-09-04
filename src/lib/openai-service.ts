/**
 * OpenAIService — now routes through the ElimuNova AI waterfall.
 * Priority: Cerebras → Groq → DeepSeek → Gemini → OpenRouter → OpenAI
 * Drop-in replacement — all existing callers work unchanged.
 */

import { callAI, getKey, type AIMessage } from '@/lib/ai-provider'
import { cleanAiJson } from '@/lib/ai-generation-utils'
import { fetchWithTimeout, TIMEOUTS } from './fetch-utils'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ImageGenerationResult {
  url: string
  provider: string
  revisedPrompt?: string
  metadata?: any
}

export class OpenAIService {
  /**
   * Generate text — routes through the full AI waterfall.
   */
  static async generateText(
    messages: OpenAIMessage[],
    options?: {
      model?:       string
      maxTokens?:   number
      temperature?: number
      useReasoner?: boolean
      responseFormat?: 'json_object'
    }
  ): Promise<string> {
    const result = await callAI({
      messages:    messages as AIMessage[],
      maxTokens:   options?.maxTokens   ?? 2000,
      temperature: options?.temperature ?? 0.7,
      useReasoner: options?.useReasoner ?? false,
      responseFormat: options?.responseFormat,
    })
    console.log(`[AI] ${result.provider}/${result.model} — ${result.latencyMs}ms, ${result.tokensUsed ?? '?'} tokens`)
    return result.content
  }

  /**
   * Generate text and also return which provider/model served the request
   * (used by the AI test suite to display the winning provider).
   */
  static async generateTextDetailed(
    messages: OpenAIMessage[],
    options?: {
      model?:       string
      maxTokens?:   number
      temperature?: number
      useReasoner?: boolean
    }
  ): Promise<{ content: string; provider: string; model: string; tokensUsed?: number; latencyMs?: number }> {
    const result = await callAI({
      messages:    messages as AIMessage[],
      maxTokens:   options?.maxTokens   ?? 2000,
      temperature: options?.temperature ?? 0.7,
      useReasoner: options?.useReasoner ?? false,
    })
    console.log(`[AI] ${result.provider}/${result.model} — ${result.latencyMs}ms, ${result.tokensUsed ?? '?'} tokens`)
    return result
  }

  /**
   * Generate text optimised for long-form content (lesson plans, schemes).
   */
  static async generateLongContent(
    messages: OpenAIMessage[],
    options?: { maxTokens?: number; temperature?: number; responseFormat?: 'json_object' }
  ): Promise<string> {
    return this.generateText(messages, {
      maxTokens:   options?.maxTokens   ?? 3000,
      temperature: options?.temperature ?? 0.7,
      responseFormat: options?.responseFormat,
    })
  }

  /**
   * Generate text with reasoning (exams, analysis, rubrics).
   */
  static async generateWithReasoning(
    messages: OpenAIMessage[],
    options?: { maxTokens?: number }
  ): Promise<string> {
    return this.generateText(messages, {
      maxTokens:   options?.maxTokens ?? 2000,
      useReasoner: true,
    })
  }

  /**
   * Generate AI content — alias for generateLongContent (backward compat).
   */
  static async generateAIContent(
    prompt: string,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    return this.generateText(
      [{ role: 'user', content: prompt }],
      options
    )
  }

  /**
   * Generate a personalized AI assignment for a student (routes through the AI waterfall).
   */
  static async generateAIAssignment(data: {
    subject: string
    topic: string
    difficulty: string
    duration: number
    description?: string
    studentLevel: string
    learningStyle: string
    studentName: string
  }): Promise<any> {
    const subject = (data.subject || '').trim() || 'General Studies'
    const topic = (data.topic || '').trim() || 'General Knowledge'
    const difficulty = (data.difficulty || '').trim() || 'medium'
    const duration = typeof data.duration === 'number' && data.duration > 0 ? data.duration : 7

    const isMathSubject = subject.toLowerCase().includes('math') ||
                         subject.toLowerCase().includes('algebra') ||
                         subject.toLowerCase().includes('geometry') ||
                         subject.toLowerCase().includes('calculus') ||
                         subject.toLowerCase().includes('arithmetic')

    const systemPrompt = `You are a warm, friendly teacher creating personalized assignments for students. Your assignments should feel like a caring teacher is talking directly to the student.

Student Information:
- Name: ${data.studentName}
- Subject: ${subject}
- Topic: ${topic}
- Level: ${data.studentLevel}
- Learning Style: ${data.learningStyle}
- Difficulty: ${difficulty}
- Duration: ${duration} days

FORMATTING REQUIREMENTS:
1. Use warm, encouraging language
2. Include emojis in headings (📚 ✏️ 🤔 💪)
3. Address the student directly ("you", "your")
4. Add encouraging phrases throughout
5. Make it visually friendly with clear sections

${isMathSubject ? `
MATHEMATICS ASSIGNMENT FORMAT:
- Include 8-12 clear mathematical problems
- Use proper mathematical notation
- Show problems like: "Question 1: Calculate 25 × 4 = _____"
- Include word problems with real-life scenarios
- Add "Show your work" reminders
- Mix problem types: calculations, word problems, applications
- Include one challenge problem for extra credit
` : ''}

Create an assignment in the following JSON format:
{
  "title": "Friendly, engaging title",
  "description": "Warm introduction that motivates the student",
  "instructions": "Step-by-step instructions in friendly language",
  "objectives": ["What you'll learn 1", "What you'll learn 2", "What you'll learn 3"],
  "requirements": ["What you need", "How to submit"],
  "resources": ["Helpful resource 1", "Helpful resource 2"],
  "rubric": {
    "excellent": "Amazing work! You've mastered this!",
    "good": "Great job! You're doing well!",
    "satisfactory": "Good effort! Keep practicing!",
    "needsImprovement": "You're learning! Let's work on this together."
  },
  "content": "Full assignment with warm greeting, clear questions/problems, and encouraging closing",
  "estimatedTime": "${duration} days",
  "difficulty": "${difficulty}",
  "learningOutcomes": ["Skill you'll develop 1", "Skill you'll develop 2"],
  "questions": [
    { "id": 1, "type": "multiple_choice", "question": "Question text", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "B", "marks": 1 },
    { "id": 2, "type": "short_answer", "question": "Question text", "correctAnswer": "The expected key points", "marks": 2 }
  ],
  "answerKey": { "1": "B", "2": "The expected key points" }
}`

    const userPrompt = `Create a warm, friendly, and engaging assignment for ${data.studentName} about ${topic} in ${subject}. Make it feel personal and encouraging. Use ${data.learningStyle} learning approaches. The assignment should be ${difficulty} level and take about ${duration} days to complete.

${data.description ? `Teacher's special notes: ${data.description}` : ''}

Remember: Be warm, encouraging, and make the student feel supported!`

    const response = await this.generateText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { maxTokens: 2500, temperature: 0.7 }
    )

    try {
      const cleaned = cleanAiJson(response)
      if (cleaned) {
        const parsed = JSON.parse(cleaned)
        if (parsed && typeof parsed === 'object') {
          // --- answerKey[] support: normalise the structured questions table and
          // answer key so assignments can be auto-graded per question. ---
          const questions = Array.isArray(parsed.questions)
            ? parsed.questions.map((q: any, i: number) => {
                const id = Number(q?.id) || i + 1
                return {
                  id,
                  type: q?.type === 'short_answer' ? 'short_answer' : 'multiple_choice',
                  question: String(q?.question || q?.text || `Question ${id}`),
                  options: Array.isArray(q?.options) ? q.options.map((o: any) => String(o)) : undefined,
                  correctAnswer: q?.correctAnswer != null ? String(q.correctAnswer) : undefined,
                  marks: Number(q?.marks) || 1,
                }
              })
            : []
          const answerKey: Record<string, string> = {}
          if (parsed.answerKey && typeof parsed.answerKey === 'object') {
            Object.entries(parsed.answerKey).forEach(([k, v]) => { answerKey[String(k)] = String(v) })
          } else {
            questions.forEach((q: { id: number; correctAnswer?: string }) => { if (q.correctAnswer && !answerKey[String(q.id)]) answerKey[String(q.id)] = q.correctAnswer })
          }
          if (questions.length > 0) {
            parsed.questions = questions
            parsed.answerKey = answerKey
          }
          return parsed
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error)
    }

    return {
      title: `${topic} - ${subject} Assignment`,
      description: `Complete this assignment on ${topic} in ${subject}`,
      instructions: `1. Research the topic thoroughly\n2. Complete all required tasks\n3. Submit your work on time`,
      objectives: [`Understand ${topic}`, `Apply knowledge practically`, `Demonstrate learning`],
      requirements: ['Original work', 'Proper citations', 'On-time submission'],
      resources: ['Textbook', 'Online resources', 'Library materials'],
      rubric: {
        excellent: 'Exceeds expectations',
        good: 'Meets expectations',
        satisfactory: 'Meets basic requirements',
        needsImprovement: 'Below expectations'
      },
      content: `This assignment focuses on ${topic} in ${subject}. You will explore key concepts and apply your knowledge.`,
      estimatedTime: `${duration} days`,
      difficulty,
      learningOutcomes: ['Enhanced understanding', 'Practical application', 'Critical thinking'],
      questions: [
        {
          id: 1,
          type: 'short_answer',
          question: `In your own words, explain what ${topic} means and give one everyday example.`,
          correctAnswer: `A clear explanation of ${topic} with a relevant, accurate everyday example.`,
          marks: 2,
        },
        {
          id: 2,
          type: 'short_answer',
          question: `Describe one real-life situation where ${topic} is applied in ${subject}.`,
          correctAnswer: `A correct, real-world application of ${topic} in ${subject}.`,
          marks: 2,
        },
      ],
      answerKey: {
        '1': `A clear explanation of ${topic} with a relevant, accurate everyday example.`,
        '2': `A correct, real-world application of ${topic} in ${subject}.`,
      },
    }
  }

  /**
   * Generate an image using a cost-aware waterfall:
   *   Pollinations (free, no key) → DALL-E 3 → Google Imagen → Stability → Groq SVG → placeholder
   * Pollinations is tried first so the platform always renders a visual reliably at no cost.
   */
   /**
    * Grade a student submission using AI.
    */
   static async gradeSubmission(input: {
     assignmentTitle: string
     assignmentInstructions?: string | null
     submissionContent: string
     rubric?: string
     answerKey?: string
     maxPoints?: number
     subject?: string
     grade?: string
     curriculum?: string
     country?: string
   }): Promise<{
     grade: number
     feedback: string
     confidence?: number
     questionScores?: any
     needsRevision?: boolean
     revisionNotes?: string
   }> {
     const { buildCurriculumAssessmentContext } = await import('@/lib/curriculum-prompt')
     const curCtx = input.curriculum && input.curriculum !== 'cbc'
       ? buildCurriculumAssessmentContext({ curriculum: input.curriculum, country: input.country, grade: input.grade || '', subject: input.subject || '' })
       : null

     const gradeLabel = input.curriculum && input.curriculum !== 'cbc'
       ? 'Use a standard percentage score (0-100) and letter grade equivalent (A=90-100, B=80-89, C=70-79, D=60-69, F=below 60).'
       : 'Use a standard percentage score (0-100).'

     const systemPrompt = `You are a warm, encouraging expert teacher${input.subject ? ` specializing in ${input.subject}` : ''}${input.grade ? ` teaching ${input.grade} students` : ''}. Grade student work fairly and consistently. Always be kind and motivating in your feedback. Return only strict JSON.`

     const userPrompt = `Grade the following student's submission.
${curCtx ? `Context: ${curCtx}` : ''}
Assignment: ${input.assignmentTitle}
Subject: ${input.subject || 'N/A'} | Grade: ${input.grade || 'N/A'}
Instructions: ${input.assignmentInstructions || 'N/A'}
${input.rubric ? `Rubric: ${input.rubric.slice(0, 4000)}` : ''}
${input.answerKey ? `Answer Key: ${input.answerKey.slice(0, 2000)}` : ''}
Max Points: ${input.maxPoints || 100}

Student Submission:
${input.submissionContent.slice(0, 6000)}

Return JSON with shape { "grade": 0-100, "feedback": "string", "confidence": 0-1, "questionScores": {}, "needsRevision": false, "revisionNotes": "string" }.

Grading: ${gradeLabel}

Feedback rules:
- Always open by acknowledging the student's effort.
- Mention at least one specific thing they did well.
- Give 1-2 kind, concrete suggestions for improvement.
- End with an encouraging, motivating sentence.
- Be fair but never harsh. Even low-scoring work should feel supported.
${curCtx ? '' : '- Use examples and references appropriate for the student\'s grade level and region.'}`

    const response = await this.generateWithReasoning([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { maxTokens: 2000 })

    try {
      const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/) || response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed = JSON.parse(jsonStr)
        const safeGrade = Math.max(0, Math.min(100, Number(parsed.grade) || 0))
        return {
          grade: safeGrade,
          feedback: String(parsed.feedback || 'Good effort!'),
          confidence: parsed.confidence,
          questionScores: parsed.questionScores,
          needsRevision: parsed.needsRevision,
          revisionNotes: parsed.revisionNotes,
        }
      }
    } catch (e) {
      console.error('Failed to parse grading JSON:', e)
    }
    return { grade: 0, feedback: 'Your work was received, but auto-grading could not read it this time. A teacher will review it soon — keep up the great effort!' }
  }

  static async generateImage(options: {
    prompt:   string
    style?:   'natural' | 'vivid'
    size?:    '1024x1024' | '1792x1024' | '1024x1792' | '512x512'
    quality?: 'standard' | 'hd'
  }): Promise<ImageGenerationResult> {
    const dalleKey  = await getKey('OPENAI_DALLE_API_KEY') || ''
    const openaiKey = await getKey('OPENAI_API_KEY') || ''
    // Use DALLE key if available and not an OpenRouter key
    const apiKey = (dalleKey && !dalleKey.startsWith('sk-or-')) ? dalleKey
                 : (openaiKey && !openaiKey.startsWith('sk-or-')) ? openaiKey
                 : ''

    // 1. Pollinations — free, no API key, no quota, always available. Tried
    // first so the platform always produces an image quickly and at no cost,
    // then falls back to premium/paid providers when higher quality is needed.
    try {
      const { PollinationsService } = await import('./pollinations-service')
      const poll = await PollinationsService.generateImage(options.prompt, { size: options.size })
      if (poll?.url) return { ...poll }
    } catch (e: any) {
      console.warn('[AI] Pollinations failed:', e.message)
    }

    // 2. Try DALL-E if we have a real OpenAI key
    if (apiKey) {
      try {
        const { OpenAI } = await import('openai')
        const openai = new OpenAI({ apiKey })
        const size = (options.size === '512x512' ? '1024x1024' : options.size) ?? '1024x1024'
        const resp = await openai.images.generate({
          model:   'dall-e-3',
          prompt:  options.prompt,
          n:       1,
          size:    size as any,
          quality: options.quality ?? 'standard',
          style:   options.style ?? 'natural',
        })
        const url = resp.data?.[0]?.url
        if (url) return { url, provider: 'openai-dalle-3', revisedPrompt: resp.data?.[0]?.revised_prompt }
      } catch (e: any) {
        console.warn('[AI] DALL-E failed:', e.message)
      }
    }

    // Google Imagen — high-quality educational illustrations. Uses the same
    // Gemini/Google AI key; no extra credentials required.
    try {
      const { ImagenService } = await import('./imagen-service')
      const imagen = await ImagenService.generateImage(options.prompt, {
        quality: options.quality,
        size:    options.size,
      })
      if (imagen?.url) return { ...imagen }
    } catch (e: any) {
      console.warn('[AI] Imagen failed:', e.message)
    }

    // 3. Fallback: try Stability AI
    try {
      const stabilityKey = await getKey('STABILITY_API_KEY')
      if (stabilityKey) {
        const formData = new FormData()
        formData.append('prompt', options.prompt)
        formData.append('aspect_ratio', '1:1')
        formData.append('output_format', 'png')
        formData.append('mode', 'text-to-image')
        const resp = await fetchWithTimeout('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
          method: 'POST',
          headers: { Authorization: `Bearer ${stabilityKey}` },
          body: formData,
        }, TIMEOUTS.IMAGE)
        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer())
          const url = `data:image/png;base64,${buf.toString('base64')}`
          return { url, provider: 'stability-ai', revisedPrompt: options.prompt }
        }
      }
    } catch (e: any) {
      console.warn('[AI] Stability AI failed:', e.message)
    }

    // Fallback: Groq SVG diagram (free, fast — no DALL-E/Stability key needed)
    try {
      const groqSvg = await this.generateGroqSVG(options.prompt)
      if (groqSvg) return groqSvg
    } catch (e: any) {
      console.warn('[AI] Groq SVG failed:', e.message)
    }

    // Fallback: generate an SVG educational diagram using text AI
    try {
      const svgContent = await this.generateText([
        {
          role: 'system',
          content: `You are an expert educational diagram illustrator. Return ONLY valid SVG markup.
Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"> and end with </svg>.
DRAW THE ACTUAL TOPIC — a real labeled diagram, not a generic placeholder. Examples:
- "The Heart" → draw an anatomical heart with labeled chambers (left/right atrium & ventricle) and arrows showing blood flow.
- "Evaporation" → draw the water cycle or a labeled pan of water with arrows showing liquid→vapour, sun, steam.
- "Heat Transfer" → draw three labeled panels: conduction (metal rod over flame), convection (pot of water with arrows), radiation (sun rays).
Use bright, high-contrast educational colors. Clean, textbook-style, age-appropriate. Always include clear labels and directional arrows.
No markdown fences, no explanations — just the SVG.`,
        },
        {
          role: 'user',
          content: `Create a classroom-ready educational illustration as SVG for: ${options.prompt}`,
        },
      ], { maxTokens: 2000, temperature: 0.4 })

      const match = svgContent.match(/<svg[\s\S]*?<\/svg>/i)
      if (match) {
        const svgUrl = `data:image/svg+xml;base64,${Buffer.from(match[0]).toString('base64')}`
        console.log('[AI] SVG diagram generated via text waterfall')
        return { url: svgUrl, provider: 'svg-ai', revisedPrompt: options.prompt }
      }
    } catch (e: any) {
      console.warn('[AI] SVG generation failed:', e.message)
    }

    // Final fallback: static SVG placeholder
    const text = options.prompt.slice(0, 55)
    const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e8f4fd"/>
      <rect x="30" y="30" width="964" height="964" rx="16" fill="none" stroke="#90c4e8" stroke-width="4"/>
      <circle cx="512" cy="420" r="80" fill="#b3d9f5" opacity="0.7"/>
      <text x="512" y="580" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" fill="#2c6e9e" font-weight="bold">🎨 ElimuNova AI</text>
      <text x="512" y="640" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#4a8cbb">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
    </svg>`
    return {
      url: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      provider: 'placeholder',
      revisedPrompt: options.prompt,
    }
  }

  /**
   * Generate an educational SVG diagram using Groq (free, fast) —
   * used as a fallback when OpenAI DALL-E / Stability keys are unavailable.
   * Groq's fast Llama models are excellent at producing clean SVG markup.
   */
  static async generateGroqSVG(prompt: string, opts?: { model?: string }): Promise<ImageGenerationResult | null> {
    try {
      const groqKey = await getKey('GROQ_API_KEY')
      if (!groqKey) return null

      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: opts?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert educational diagram illustrator. Return ONLY valid SVG markup.
Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"> and end with </svg>.
DRAW THE ACTUAL TOPIC — a real labeled diagram, not a generic placeholder. Examples:
- "The Heart" → draw an anatomical heart with labeled chambers (left/right atrium & ventricle) and arrows showing blood flow.
- "Evaporation" → draw the water cycle or a labeled pan of water with arrows showing liquid→vapour, sun, steam.
- "Heat Transfer" → draw three labeled panels: conduction (metal rod over flame), convection (pot of water with arrows), radiation (sun rays).
Use bright, high-contrast educational colors. Clean, textbook-style, age-appropriate. Always include clear labels and directional arrows.
No markdown fences, no explanations — just the SVG.`,
            },
            {
              role: 'user',
              content: `Create a classroom-ready educational illustration as SVG for: ${prompt}`,
            },
          ],
          max_tokens: 2048,
          temperature: 0.4,
        }),
      }, TIMEOUTS.AI)
      if (!res.ok) {
        console.warn(`[AI] Groq SVG failed: ${res.status}`)
        return null
      }
      const data = await res.json()
      const svgContent = data?.choices?.[0]?.message?.content || ''
      const match = svgContent.match(/<svg[\s\S]*?<\/svg>/i)
      if (!match) return null
      const url = `data:image/svg+xml;base64,${Buffer.from(match[0]).toString('base64')}`
      console.log('[AI] SVG diagram generated via Groq')
      return { url, provider: 'groq-svg', revisedPrompt: prompt }
    } catch (e: any) {
      console.warn('[AI] Groq SVG generation failed:', e.message)
      return null
    }
  }
}

