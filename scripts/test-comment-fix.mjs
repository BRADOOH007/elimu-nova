import fs from 'fs'

const content = fs.readFileSync('src/app/api/admin-users/route.ts', 'utf-8')

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

const re = /export\s+async\s+function\s+(POST|GET)\s*\(/g
let m
while ((m = re.exec(content)) !== null) {
  const method = m[1]
  const parenStart = m.index + m[0].length - 1
  const parenEnd = findMatchingParen(content, parenStart)
  if (parenEnd === -1) { console.log(`${method}: paren match failed`); continue }

  let braceStart = parenEnd + 1
  while (braceStart < content.length && content[braceStart].match(/\s/)) braceStart++
  if (content[braceStart] !== '{') { console.log(`${method}: no brace at ${braceStart}`); continue }

  const braceEnd = findMatchingBrace(content, braceStart)
  if (braceEnd === -1) { console.log(`${method}: no matching brace`); continue }

  const bodyText = content.slice(braceStart + 1, braceEnd)
  const openBraces = (bodyText.match(/{/g) || []).length
  const closeBraces = (bodyText.match(/}/g) || []).length
  console.log(`${method}: brace from ${braceStart} to ${braceEnd}, body length ${bodyText.length}, braces ${openBraces}/${closeBraces}, balanced=${openBraces === closeBraces}`)

  // Check the end of the body
  const endSnippet = content.slice(Math.max(0, braceEnd - 80), braceEnd + 10)
  console.log(`  Ends with: ${JSON.stringify(endSnippet.slice(-100))}`)
}
