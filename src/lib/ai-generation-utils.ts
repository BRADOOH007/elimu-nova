export function cleanAiJson(raw: string): string {
  if (!raw) return ''
  let cleaned = raw.trim()
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()
  const start = cleaned.indexOf(cleaned.startsWith('[') ? '[' : '{')
  const end = cleaned.lastIndexOf(cleaned.startsWith('[') ? ']' : '}')
  if (start === -1 || end <= start) return ''
  return cleaned.slice(start, end + 1)
}

export function safeGenerate<T>(
  label: string,
  fn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  return fn().catch((err) => {
    console.error(`[${label}] Generation failed:`, err)
    if (fallback !== undefined) return fallback
    throw err
  })
}
