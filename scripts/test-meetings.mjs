import fs from 'fs'

// Restore from backup first
const origPath = 'src/app/api/school-admin/meetings/[id]/route.ts'
const bakPath = origPath + '.codemod.bak'

// Check if the current file is already the converted version
const current = fs.readFileSync(origPath, 'utf-8')
console.log('Current file first 200 chars:', JSON.stringify(current.slice(0, 200)))
console.log('Has route():', current.includes('route('))
console.log('Has getServerSession:', current.includes('getServerSession'))

// If it still has original content, run the transform
if (!current.includes('route(')) {
  // inline the needed functions (simplified)
  function skipComment(text, i) {
    if (text[i] === '/' && i + 1 < text.length) {
      if (text[i + 1] === '/') {
        i += 2
        while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++
        return i
      }
      if (text[i + 1] === '*') {
        i += 2
        while (i < text.length) {
          if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '/') {
            i += 2; break
          }
          i++
        }
        return i
      }
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
        const ac = skipComment(text, i)
        if (ac !== -1) { i = ac; continue }
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
        const ac = skipComment(text, i)
        if (ac !== -1) { i = ac; continue }
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
      if (parenEnd === -1) { console.log(method + ': paren FAIL'); continue }

      let braceStart = parenEnd + 1
      while (braceStart < content.length && content[braceStart].match(/\s/)) braceStart++
      if (content[braceStart] !== '{') { console.log(method + ': no brace'); continue }

      const braceEnd = findMatchingBrace(content, braceStart)
      if (braceEnd === -1) { console.log(method + ': brace FAIL'); continue }

      handlers.push({
        method,
        startIdx: m.index,
        endIdx: braceEnd + 1,
        bodyText: content.slice(braceStart + 1, braceEnd),
      })
      console.log(method + ': OK start=' + m.index + ' end=' + (braceEnd + 1) + ' bodyLen=' + (braceEnd - braceStart))
    }
    return handlers
  }

  const handlers = extractHandlers(current)
  console.log('Handlers:', handlers.length)

  // Show conflicts
  for (let i = 0; i < handlers.length; i++) {
    for (let j = i + 1; j < handlers.length; j++) {
      const a = handlers[i], b = handlers[j]
      const overlap = a.startIdx < b.endIdx && b.startIdx < a.endIdx
      console.log(`  ${a.method}[${a.startIdx}-${a.endIdx}] vs ${b.method}[${b.startIdx}-${b.endIdx}] overlap=${overlap}`)
    }
  }

  // Now test the replacement
  const replacements = handlers.map(h => ({
    ...h,
    replacement: 'export const ' + h.method + ' = route({}, async (request, { user }) => { BODY })'
  }))
  replacements.sort((a, b) => b.startIdx - a.startIdx)
  let result = current
  for (const r of replacements) {
    result = result.slice(0, r.startIdx) + r.replacement + result.slice(r.endIdx)
  }
  console.log('Result length:', result.length)
  console.log('Result last 300:', JSON.stringify(result.slice(-300)))
} else {
  console.log('File already converted')
}
