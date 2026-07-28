import fs from 'fs'

const content = fs.readFileSync('src/app/api/school-admin/meetings/[id]/route.ts.codemod.bak', 'utf-8')

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
  if (text[startIdx] !== '(') return -1
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

// Find PUT handler specifically
const re = /export\s+async\s+function\s+(PUT)\s*\(/g
let m
while ((m = re.exec(content)) !== null) {
  const method = m[1]
  const parenStart = m.index + m[0].length - 1
  const parenEnd = findMatchingParen(content, parenStart)
  if (parenEnd === -1) { console.log('PUT: paren FAIL'); continue }
  console.log('PUT paren:', parenStart, '-', parenEnd)
  console.log('PUT paren text:', JSON.stringify(content.slice(parenStart, parenEnd + 1)))

  let braceStart = parenEnd + 1
  while (braceStart < content.length && content[braceStart].match(/\s/)) braceStart++
  if (content[braceStart] !== '{') { console.log('PUT: no brace'); continue }
  console.log('PUT brace start:', braceStart)

  const braceEnd = findMatchingBrace(content, braceStart)
  if (braceEnd === -1) { console.log('PUT: brace FAIL'); continue }
  console.log('PUT brace end:', braceEnd)
  console.log('PUT body length:', braceEnd - braceStart - 1)
  
  const bodyText = content.slice(braceStart + 1, braceEnd)
  const openBraces = (bodyText.match(/{/g) || []).length
  const closeBraces = (bodyText.match(/}/g) || []).length
  console.log('PUT braces:', openBraces, '/', closeBraces, 'balanced:', openBraces === closeBraces)
  console.log('PUT last 150 chars:', JSON.stringify(bodyText.slice(-150)))
  
  // Also check if it includes the catch
  console.log('PUT has catch:', bodyText.includes('catch'))
}
