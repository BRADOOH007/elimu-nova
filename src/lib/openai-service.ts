/**
 * OpenAIService — now routes through the ElimuNova AI waterfall.
 * Priority: Cerebras → DeepSeek → Gemini → Groq → OpenRouter → OpenAI
 * Drop-in replacement — all existing callers work unchanged.
 */

import { callAI, getAIReasoning, type AIMessage } from '@/lib/ai-provider'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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
      useReasoner?: boolean  // set true for complex reasoning tasks
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
}
