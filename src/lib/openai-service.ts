/**
 * OpenAIService — now routes through the ElimuNova AI waterfall.
 * Priority: Cerebras → Groq → DeepSeek → Gemini → OpenRouter → OpenAI
 * Drop-in replacement — all existing callers work unchanged.
 */

import { callAI, type AIMessage } from '@/lib/ai-provider'

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
    }
  ): Promise<string> {
    const result = await callAI({
      messages:    messages as AIMessage[],
      maxTokens:   options?.maxTokens   ?? 2000,
      temperature: options?.temperature ?? 0.7,
      useReasoner: options?.useReasoner ?? false,
    })
    console.log(`[AI] ${result.provider}/${result.model} — ${result.latencyMs}ms, ${result.tokensUsed ?? '?'} tokens`)
    return result.content
  }

  /**
   * Generate text optimised for long-form content (lesson plans, schemes).
   */
  static async generateLongContent(
    messages: OpenAIMessage[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    return this.generateText(messages, {
      maxTokens:   options?.maxTokens   ?? 3000,
      temperature: options?.temperature ?? 0.7,
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
   * Generate an image using DALL-E 3 (direct — no waterfall alternative exists for images).
   * Falls back to an AI-generated SVG diagram via the text waterfall when DALL-E unavailable.
   * This mirrors TutorBot's approach: OpenAI gpt-image-1 → DALL-E 3 → SVG via Gemini/AI.
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
  }): Promise<{
    grade: number
    feedback: string
    confidence?: number
    questionScores?: any
    needsRevision?: boolean
    revisionNotes?: string
  }> {
    const systemPrompt = `You are an expert teacher. Grade student work fairly and consistently. Return only strict JSON.`

    const userPrompt = `Grade the following student's submission.

Assignment: ${input.assignmentTitle}
Instructions: ${input.assignmentInstructions || 'N/A'}
${input.rubric ? `Rubric: ${input.rubric.slice(0, 4000)}` : ''}
${input.answerKey ? `Answer Key: ${input.answerKey.slice(0, 2000)}` : ''}
Max Points: ${input.maxPoints || 100}

Student Submission:
${input.submissionContent.slice(0, 6000)}

Return JSON with shape { "grade": 0-100, "feedback": "string", "confidence": 0-1, "questionScores": {}, "needsRevision": false, "revisionNotes": "string" }.`

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
    return { grade: 0, feedback: 'Unable to auto-grade. Teacher will review.' }
  }

  static async generateImage(options: {
    prompt:   string
    style?:   'natural' | 'vivid'
    size?:    '1024x1024' | '1792x1024' | '1024x1792' | '512x512'
    quality?: 'standard' | 'hd'
  }): Promise<ImageGenerationResult> {
    const dalleKey = process.env.OPENAI_DALLE_API_KEY || ''
    const openaiKey = process.env.OPENAI_API_KEY || ''
    // Use DALLE key if available and not an OpenRouter key
    const apiKey = (dalleKey && !dalleKey.startsWith('sk-or-')) ? dalleKey
                 : (openaiKey && !openaiKey.startsWith('sk-or-')) ? openaiKey
                 : ''

    // Try DALL-E if we have a real OpenAI key
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

    // Fallback: generate an SVG educational diagram using text AI (Cerebras/Groq — same as TutorBot)
    try {
      const svgContent = await this.generateText([
        {
          role: 'system',
          content: `You are an expert educational diagram creator. Return ONLY valid SVG markup.
Start with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"> and end with </svg>.
Use bright, high-contrast educational colors. Make it clean, textbook-style, and age-appropriate.
Include helpful labels. No markdown fences, no explanations — just the SVG.`,
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
}

function generateSVGPlaceholder(prompt: string): string {
  const text = prompt.slice(0, 60) + (prompt.length > 60 ? '…' : '')
  const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f4f8"/>
    <rect x="40" y="40" width="944" height="944" rx="12" fill="none" stroke="#c3d0e0" stroke-width="3"/>
    <text x="512" y="480" text-anchor="middle" font-family="Arial" font-size="36" fill="#6b7a8d">🎨 Educational Illustration</text>
    <text x="512" y="540" text-anchor="middle" font-family="Arial" font-size="22" fill="#8896a5">${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>
    <text x="512" y="600" text-anchor="middle" font-family="Arial" font-size="18" fill="#aab4c0">ElimuNova AI</text>
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

