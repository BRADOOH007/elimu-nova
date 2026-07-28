import fs from 'fs'

const bakContent = fs.readFileSync('src/app/api/school-admin/meetings/[id]/route.ts.codemod.bak', 'utf-8')

// Replicate the extractHandlers logic
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
        const c = findMatchingBrace(text, i + 1); if (c === -1) return -1; i = c
      }
    } else {
      if (ch === '/' && i + 1 < text.length) {
        if (text[i + 1] === '/') { i += 2; while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++; continue }
        if (text[i + 1] === '*') { i += 2; while (i < text.length) { if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '/') { i += 2; break } i++ } continue }
      }
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
  let depth = 1, i = startIdx + 1
  let inS = false, inD = false, inB = false
  while (i < text.length && depth > 0) {
    const ch = text[i], prev = i > 0 ? text[i - 1] : ''
    if (inS) { if (ch === "'" && prev !== '\\') inS = false }
    else if (inD) { if (ch === '"' && prev !== '\\') inD = false }
    else if (inB) { if (ch === '`' && prev !== '\\') inB = false }
    else {
      if (ch === '/' && i + 1 < text.length) {
        if (text[i + 1] === '/') { i += 2; while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++; continue }
        if (text[i + 1] === '*') { i += 2; while (i < text.length) { if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '/') { i += 2; break } i++ } continue }
      }
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
    handlers.push({ method, startIdx: m.index, endIdx: braceEnd + 1, bodyText: content.slice(braceStart + 1, braceEnd) })
  }
  return handlers
}

const handlers = extractHandlers(bakContent)
console.log('Handlers:')
for (const h of handlers) {
  console.log(`  ${h.method}: [${h.startIdx}, ${h.endIdx}) bodyLen=${h.bodyText.length}`)
}

// Test transformBody
function transformBody(body) {
  let b = body
  b = b.replace(/const\s+session\s*=\s*await\s+getServerSession\(authOptions\)\s*;?\n?/g, '')
  b = b.replace(/if\s*\(\s*!session\??\.?\s*user\??\.?\s*id\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?;\s*\}/g, '')
  b = b.replace(/if\s*\(\s*!session\??\.?\s*user\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?;\s*\}/g, '')
  b = b.replace(/if\s*\(\s*!session\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?;\s*\}/g, '')
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

const putHandler = handlers.find(h => h.method === 'PUT')
if (putHandler) {
  const inner = transformBody(putHandler.bodyText)
  console.log('\n--- PUT handler transformed body (first 200 chars) ---')
  console.log(JSON.stringify(inner.slice(0, 200)))
  console.log('\n--- PUT handler transformed body (last 200 chars) ---')
  console.log(JSON.stringify(inner.slice(-200)))
  console.log('\nHas empty try { } pattern:', /try\s*\{\s*\}/.test(inner))
  console.log('Has if (!session):', /if\s*\(\s*!session/.test(inner))
  
  // Now build the full replacement string
  const newHandler = `export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (request, { user }) => {${inner}\n})`
  console.log('\n--- Full replacement (first 250) ---')
  console.log(JSON.stringify(newHandler.slice(0, 250)))
  console.log('\n--- Full replacement (last 250) ---')
  console.log(JSON.stringify(newHandler.slice(-250)))
  
  // Apply the replacement to see the result
  let result = bakContent
  const DELETE = handlers.find(h => h.method === 'DELETE')
  const GET = handlers.find(h => h.method === 'GET')
  
  const replacements = [GET, putHandler, DELETE].sort((a, b) => b.startIdx - a.startIdx)
  for (const r of replacements) {
    let innerR = transformBody(r.bodyText)
    const auth = r.method === 'GET' || r.method === 'PUT' || r.method === 'DELETE' ? "{ auth: 'SCHOOL_ADMIN' }" : '{}'
    const newR = `export const ${r.method} = route(${auth}, async (request, { user }) => {${innerR}\n})`
    result = result.slice(0, r.startIdx) + newR + result.slice(r.endIdx)
  }
  
  console.log('\n--- Result PUT section (lines around PUT) ---')
  const lines = result.split('\n')
  let putStart = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export const PUT')) { putStart = i; break }
  }
  if (putStart >= 0) {
    for (let i = putStart; i < Math.min(lines.length, putStart + 15); i++) {
      console.log((i + 1) + ': ' + lines[i])
    }
  }
  
  // Check we didn't get try { } pattern
  const hasEmptyTry = result.includes('try {') && result.includes('try {\n    }')
  console.log('\nHas empty try pattern in result:', hasEmptyTry)
}
