import fs from 'fs'

const content = fs.readFileSync('src/app/api/admin-users/route.ts.codemod.bak', 'utf-8')

// Find POST handler
const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g
let m
while ((m = re.exec(content)) !== null) {
  const method = m[1]
  if (method !== 'POST') continue

  let depth = 1, parenEnd = m.index + m[0].length
  while (depth > 0 && parenEnd < content.length) {
    if (content[parenEnd] === '(') depth++
    else if (content[parenEnd] === ')') depth--
    parenEnd++
  }
  parenEnd--

  let braceStart = parenEnd + 1
  while (braceStart < content.length && content[braceStart].match(/\s/)) braceStart++

  // Track all quote transitions to find unpaired quotes
  let inS = false, inD = false, inB = false
  let quoteStack = [] // stores { type, position }
  
  // The divergence happens at 2804 (relative to braceStart)
  // Let's scan up to that point
  for (let i = braceStart; i < Math.min(braceStart + 2900, content.length); i++) {
    const ch = content[i], prev = i > 0 ? content[i - 1] : ''
    
    if (inS) {
      if (ch === "'" && prev !== '\\') {
        inS = false
        quoteStack.push({ type: 'close-single', pos: i - braceStart })
      }
    } else if (inD) {
      if (ch === '"' && prev !== '\\') {
        inD = false
        quoteStack.push({ type: 'close-double', pos: i - braceStart })
      }
    } else if (inB) {
      if (ch === '`' && prev !== '\\') {
        inB = false
        quoteStack.push({ type: 'close-backtick', pos: i - braceStart })
      }
    } else {
      if (ch === "'" && prev !== '\\') {
        inS = true
        quoteStack.push({ type: 'open-single', pos: i - braceStart, context: content.slice(i, i+40) })
      }
      else if (ch === '"' && prev !== '\\') {
        inD = true
        quoteStack.push({ type: 'open-double', pos: i - braceStart, context: content.slice(i, i+40) })
      }
      else if (ch === '`' && prev !== '\\') {
        inB = true
        quoteStack.push({ type: 'open-backtick', pos: i - braceStart, context: content.slice(i, i+40) })
      }
    }
  }
  
  console.log(`\n--- POST handler ---`)
  console.log(`Quote transitions (${quoteStack.length}):`)
  
  // Find the last unclosed single-quote
  let inS_state = false, lastOpenSingle = -1
  for (const q of quoteStack) {
    if (q.type === 'open-single') { inS_state = true; lastOpenSingle = q.pos }
    else if (q.type === 'close-single') { inS_state = false }
  }
  console.log(`End state - inS: ${inS_state}`)
  console.log(`Last unclosed single quote at position: ${lastOpenSingle}`)
  
  if (lastOpenSingle >= 0) {
    // Find the matching entry
    const entry = quoteStack.find(q => q.type === 'open-single' && q.pos === lastOpenSingle)
    if (entry) console.log(`  Context: ${entry.context}`)
  }
  
  // Show last 10 quote transitions
  console.log('\nLast 15 quote transitions:')
  for (const q of quoteStack.slice(-15)) {
    console.log(`  ${q.pos}: ${q.type}${q.context ? ' → ' + JSON.stringify(q.context) : ''}`)
  }
}
