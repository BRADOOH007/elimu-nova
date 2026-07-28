import fs from 'fs'

const filePath = 'src/app/api/school-admin/meetings/[id]/route.ts'
const content = fs.readFileSync(filePath, 'utf-8')

console.log('File has route(:', /route\s*\(\s*\{/.test(content))
console.log('File has getServerSession:', content.includes('getServerSession'))
console.log('File has session.', content.includes('session.'))
console.log('File has console.', content.includes('console.'))

if (/route\s*\(\s*\{/.test(content)) {
  const needsReprocess = content.includes('getServerSession') || content.includes('session?.user') || content.includes('session.') || content.includes('console.')
  console.log('Needs reprocess:', needsReprocess)

  if (needsReprocess) {
    const bak = filePath + '.codemod.bak'
    const bakContent = fs.readFileSync(bak, 'utf-8')
    console.log('Backup length:', bakContent.length)
    console.log('Backup has route(:', /route\s*\(\s*\{/.test(bakContent))
    console.log('Backup has export async:', /export\s+async\s+function/.test(bakContent))
    
    // Test extractHandlers on backup
    function skipComment(text, i) {
      if (text[i] === '/' && i + 1 < text.length) {
        if (text[i + 1] === '/') { i += 2; while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++; return i }
        if (text[i + 1] === '*') { i += 2; while (i < text.length) { if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '/') { i += 2; break } i++ } return i }
      }
      return -1
    }
    function findMatchingBrace(text, startIdx) {
      let depth = 1, i = startIdx + 1
      let inS = false, inD = false, inB = false
      while (i < text.length && depth > 0) {
        const ch = text[i], prev = i > 0 ? text[i - 1] : ''
        if (inS) { if (ch === "'" && prev !== '\\') inS = false }
        else if (inD) { if (ch === '"' && prev !== '\\') inD = false }
        else if (inB) { if (ch === '`' && prev !== '\\') inB = false }
        else {
          const ac = skipComment(text, i); if (ac !== -1) { i = ac; continue }
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
          const ac = skipComment(text, i); if (ac !== -1) { i = ac; continue }
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
        handlers.push({ method, startIdx: m.index, endIdx: braceEnd + 1, bodyText: content.slice(braceStart + 1, braceEnd) })
        console.log(method + ': OK start=' + m.index + ' end=' + (braceEnd + 1))
      }
      return handlers
    }
    
    const handlers = extractHandlers(bakContent)
    console.log('Handlers from backup:', handlers.length)
    if (handlers.length > 0) {
      for (const h of handlers) {
        console.log('  ' + h.method + ': start=' + h.startIdx + ' end=' + h.endIdx)
      }
      // Check if handlers overlap
      for (let i = 0; i < handlers.length; i++) {
        for (let j = i + 1; j < handlers.length; j++) {
          const a = handlers[i], b = handlers[j]
          console.log('  Overlap ' + a.method + '[' + a.startIdx + '-' + a.endIdx + '] vs ' + b.method + '[' + b.startIdx + '-' + b.endIdx + ']: ' + (a.startIdx < b.endIdx && b.startIdx < a.endIdx))
        }
      }
    }
  }
}
