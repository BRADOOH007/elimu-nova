/**
 * Strips markdown formatting symbols from AI-generated text
 * for display in plain-text contexts (chat bubbles, inline paragraphs, etc.)
 */
export function cleanAIText(text: string): string {
  if (!text) return text

  return text
    // Remove bold (**text** or __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic (*text* or _text_) — careful not to break bullet points
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1')
    // Remove headers (## Heading → Heading)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove code blocks (```...```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Clean up extra blank lines left behind
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
