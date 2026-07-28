import fs from 'fs'

const origPath = 'src/app/api/assignments/[id]/available-rubrics/route.ts'
const bakPath = origPath + '.codemod.bak'

// Restore from backup
fs.copyFileSync(bakPath, origPath)
const content = fs.readFileSync(origPath, 'utf-8')
console.log('Original length:', content.length)

// Inline the functions from the codemod script to test
function skipComment(text, i) {
  if (text[i] === '/' && i + 1 < text.length && text[i + 1] === '/') {
    i += 2
    while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++
    return i
  }
  if (text[i] === '/' && i + 1 < text.length && text[i + 1] === '*') {
    i += 2
    while (i < text.length) {
      if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '/') {
        i += 2; break
      }
      i++
    }
    return i
  }
  return -1
}

function findMatchingBrace(text, startIdx) {
  if (text[startIdx] !== '{') return -1
  let depth = 1, i = startIdx + 1
  let inS = false, inD = false, inB = false
  while (i < text.length && depth > 0) {
    const ch = text[i], prev = i > 0 ? text[i - 1] : ''
    if (inS) { if (ch === "'" && prev !== '\\') inS = false }
    else if (inD) { if (ch === '"' && prev !== '\\') inD = false }
    else if (inB) {
      if (ch === '`' && prev !== '\\') inB = false
      else if (ch === '$' && text[i + 1] === '{') {
        const c = findMatchingBrace(text, i + 1)
        if (c === -1) return -1; i = c
      }
    } else {
      const afterComment = skipComment(text, i)
      if (afterComment !== -1) { i = afterComment; continue }
      if (ch === "'" && prev !== '\\') inS = true
      else if (ch === '"' && prev !== '\\') inD = true
      else if (ch === '`' && prev !== '\\') inB = true
      else if (ch === '{') depth++
      else if (ch === '}') depth--
    }
    i++
  }
  return depth === 0 ? i - 1 : -1
}

function findMatchingParen(text, startIdx) {
  if (text[startIdx] !== '(') return -1
  let depth = 1, i = startIdx + 1
  let inS = false, inD = false, inB = false
  while (i < text.length && depth > 0) {
    const ch = text[i], prev = i > 0 ? text[i - 1] : ''
    if (inS) { if (ch === "'" && prev !== '\\') inS = false }
    else if (inD) { if (ch === '"' && prev !== '\\') inD = false }
    else if (inB) { if (ch === '`' && prev !== '\\') inB = false }
    else {
      const afterComment = skipComment(text, i)
      if (afterComment !== -1) { i = afterComment; continue }
      if (ch === "'" && prev !== '\\') inS = true
      else if (ch === '"' && prev !== '\\') inD = true
      else if (ch === '`' && prev !== '\\') inB = true
      else if (ch === '(') depth++
      else if (ch === ')') depth--
    }
    i++
  }
  return depth === 0 ? i - 1 : -1
}

function extractHandlers(content) {
  const handlers = []
  const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g
  let m
  while ((m = re.exec(content)) !== null) {
    const method = m[1]
    const parenStart = m.index + m[0].length - 1
    const parenEnd = findMatchingParen(content, parenStart)
    if (parenEnd === -1) continue

    let braceStart = parenEnd + 1
    while (braceStart < content.length && content[braceStart].match(/\s/)) braceStart++
    if (content[braceStart] !== '{') continue

    const braceEnd = findMatchingBrace(content, braceStart)
    if (braceEnd === -1) continue

    handlers.push({
      method,
      startIdx: m.index,
      endIdx: braceEnd + 1,
      bodyText: content.slice(braceStart + 1, braceEnd),
    })
  }
  return handlers
}

function transformBody(body) {
  let b = body
  b = b.replace(/const\s+session\s*=\s*await\s+getServerSession\(authOptions\)\s*;?\n?/g, '')
  b = b.replace(/if\s*\(\s*!session\??\.?\s*user\??\.?\s*id\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?;\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)
  b = b.replace(/if\s*\(\s*!session\??\.?\s*user\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?;\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)
  b = b.replace(/if\s*\(\s*!session\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?;\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)
  b = b.replace(/session\??\.\s*user\??\.\s*id\b/g, 'user.id')
  b = b.replace(/session\??\.\s*user\??\.\s*role\b/g, 'user.role')
  b = b.replace(/session\??\.\s*user\??\.\s*name\b/g, 'user.name')
  b = b.replace(/session\??\.\s*user\??\.\s*email\b/g, 'user.email')
  b = b.replace(/session\??\.\s*user\b/g, 'user')
  b = b.replace(/console\.log\(/g, 'log.info(')
  b = b.replace(/console\.error\(/g, 'log.error(')
  b = b.replace(/console\.warn\(/g, 'log.warn(')
  return b
}

function detectRole(handlers) {
  const patterns = [/role\s*!==?\s*'(\w+)'/, /role\s*===\s*'(\w+)'/, /\.role\s*!==?\s*"(\w+)"/, /\.role\s*===\s*"(\w+)"/]
  const found = new Set()
  for (const h of handlers) {
    for (const p of patterns) {
      for (const m of h.bodyText.matchAll(new RegExp(p.source, 'g'))) {
        if (['TEACHER', 'STUDENT', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'PARENT'].includes(m[1])) found.add(m[1])
      }
    }
  }
  if (found.size === 0) return null
  if (found.size === 1) return [...found][0]
  return [...found]
}

const handlers = extractHandlers(content)
console.log('Handlers found:', handlers.length)
for (const h of handlers) {
  console.log(h.method + ': start=' + h.startIdx + ' end=' + h.endIdx + ' bodyLen=' + h.bodyText.length)
}

const isPublic = !content.includes('getServerSession') && !content.includes('session?.user')
const detectedRole = detectRole(handlers)
console.log('isPublic:', isPublic, 'detectedRole:', detectedRole)

let authStr = ''
if (isPublic) authStr = "auth: 'none'"
else if (detectedRole === null) authStr = ''
else if (Array.isArray(detectedRole)) authStr = 'auth: [' + detectedRole.map(r => "'" + r + "'").join(', ') + ']'
else authStr = "auth: '" + detectedRole + "'"
const authConfig = authStr ? '{ ' + authStr + ' }' : '{}'
console.log('authConfig:', authConfig)

const replacements = handlers.map(h => {
  const inner = transformBody(h.bodyText)
  const newHandler = 'export const ' + h.method + ' = route(' + authConfig + ', async (request, { user }) => {' + inner + '\n})'
  return { ...h, replacement: newHandler }
})

replacements.sort((a, b) => b.startIdx - a.startIdx)
let result = content
for (const r of replacements) {
  result = result.slice(0, r.startIdx) + r.replacement + result.slice(r.endIdx)
}

console.log('\n--- RESULT LAST 200 ---')
console.log(JSON.stringify(result.slice(-200)))
console.log('\n--- CHECK last lines ---')
const lines = result.split('\n')
for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
  console.log((i + 1) + ': ' + lines[i])
}
