import { describe, it, expect } from 'vitest'
import { cleanAiJson } from '@/lib/ai-generation-utils'

describe('cleanAiJson', () => {
  it('returns already-valid JSON untouched (does not corrupt it)', () => {
    const input = JSON.stringify({
      totalScore: 12,
      percentage: 60,
      grade: 'ME',
      overallFeedback: "You correctly identified the stages, but 'condensation' and 'precipitation' need more depth.",
      strengths: ['Lists evaporation', 'Mentions the sun'],
    })
    // The feedback contains single-quoted words — prior to the guard this
    // valid JSON was corrupted by the single-quote-to-double-quote transform.
    expect(cleanAiJson(input)).toBe(input)
  })

  it('parses cleanly after stripping markdown fences', () => {
    const body = JSON.stringify({ a: 1, b: [1, 2] })
    const output = cleanAiJson('```json\n' + body + '\n```')
    expect(output).toBe(body)
  })

  it('extracts the JSON object when the model returns prose around it', () => {
    const obj = { result: 'ok', n: 5, list: ['x', 'y'] }
    const output = cleanAiJson(`Here you go: ${JSON.stringify(obj)} Hope that helps!`)
    expect(JSON.parse(output)).toEqual(obj)
  })

  it('repairs trailing commas and single-quoted keys in malformed JSON', () => {
    const output = cleanAiJson("{\n  totalScore: 8,\n  grade: 'AE',\n  tags: ['a', 'b',],\n}")
    expect(JSON.parse(output)).toEqual({ totalScore: 8, grade: 'AE', tags: ['a', 'b'] })
  })

  it('returns empty string for non-JSON output', () => {
    expect(cleanAiJson('Sorry, I cannot do that.')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(cleanAiJson('')).toBe('')
    expect(cleanAiJson(null as unknown as string)).toBe('')
  })
})
