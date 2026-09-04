export function cleanAiJson(raw: string): string {
  if (!raw) return ''
  let cleaned = raw.trim()

  // Strip markdown code fences
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()

  // Find the outermost JSON object or array by whichever bracket appears FIRST.
  // (An object that contains arrays must be treated as an object, not an array.)
  const objIdx = cleaned.indexOf('{')
  const arrIdx = cleaned.indexOf('[')
  let start: number
  let endChar: string
  if (objIdx === -1 && arrIdx === -1) return ''
  if (objIdx === -1)       { start = arrIdx; endChar = ']' }
  else if (arrIdx === -1)  { start = objIdx; endChar = '}' }
  else if (objIdx < arrIdx) { start = objIdx; endChar = '}' }
  else                     { start = arrIdx; endChar = ']' }
  const end = cleaned.lastIndexOf(endChar)
  if (end <= start) return ''
  cleaned = cleaned.slice(start, end + 1)

  // If the model returned valid JSON already, return it untouched. The repair
  // transforms below are regex-based and NOT string-aware — running them on
  // already-valid JSON can corrupt it (e.g. single-quote conversion firing
  // inside an existing double-quoted string value). Only fall back to repair
  // when the output is genuinely malformed.
  try {
    JSON.parse(cleaned)
    return cleaned
  } catch { /* fall through to repair */ }

  // Fix common AI JSON issues
  cleaned = fixJson(cleaned)
  return cleaned
}

/** Repair common JSON malformations from AI output */
function fixJson(json: string): string {
  let s = json

  // Remove single-line comments: // ...
  s = s.replace(/\/\/[^\n]*/g, '')

  // Remove multi-line comments: /* ... */
  s = s.replace(/\/\*[\s\S]*?\*\//g, '')

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1')

  // Convert single-quoted strings to double-quoted strings
  s = s.replace(/'((?:[^'\\]|\\.)*)'/g, '"$1"')

  // Quote unquoted keys: { key: → { "key":
  s = s.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')

  // Normalize invalid JSON numeric literals (and bare `undefined`) to null.
  // Using word-boundary checks avoids touching numbers/strings that legitimately
  // contain these tokens (e.g. "Infinity" inside a quoted string).
  s = s.replace(/(?<![A-Za-z0-9_."'])(?:-?Infinity|NaN|undefined)(?![A-Za-z0-9_."'])/g, 'null')

  // Quote bare-word VALUES (array elements / object values) that the model
  // emitted without quotes, e.g.  ["a", b, c]  or  { "k": value }.
  // This runs AFTER key-quoting so keys (followed by ":") are never touched.
  // true / false / null are preserved as valid JSON.
  s = s.replace(
    /([{,[]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*[,}\]])/g,
    (_m, pre, tok) => {
      const lower = tok.toLowerCase()
      if (lower === 'true' || lower === 'false' || lower === 'null') return pre + tok
      return pre + '"' + tok + '"'
    }
  )

  // Fix unescaped newlines inside string values (replace literal \n with \\n)
  // This is a best-effort fix — walk char by char inside strings
  s = fixEscapedNewlines(s)

  return s
}

function fixEscapedNewlines(s: string): string {
  let result = ''
  let inString = false
  let escape = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (escape) {
      result += ch
      escape = false
      continue
    }
    if (ch === '\\') {
      escape = true
      result += ch
      continue
    }
    if (ch === '"') {
      inString = !inString
      result += ch
      continue
    }
    if (inString && (ch === '\n' || ch === '\r')) {
      result += '\\n'
      continue
    }
    result += ch
  }
  return result
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
