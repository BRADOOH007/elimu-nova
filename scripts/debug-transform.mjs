import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.resolve(__dirname, '../src/app/api')

function readFile(p) { try { return fs.readFileSync(p, 'utf-8') } catch { return null } }

function getScopeName(filePath) {
  const rel = path.relative(API_DIR, filePath).replace(/\\/g, '/').replace(/\/route\.ts$/, '')
  return rel.replace(/\[/g, '').replace(/\]/g, '')
}

function addMiddlewareImport(content, scope) {
  if (content.includes("from '@/lib/api-middleware'")) return content
  const lines = content.split('\n')
  let lastImport = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) lastImport = i
  }
  const importLine = `\nimport { route, apiLogger } from '@/lib/api-middleware'\nconst log = apiLogger('${scope}')\n`
  if (lastImport === -1) return importLine + '\n' + content
  lines.splice(lastImport + 1, 0, importLine)
  return lines.join('\n')
}

// Skip comments in brace tracking
function skipComment(text, i) {
  if (text[i] === '/' && i + 1 < text.length && text[i + 1] === '/') {
    i += 2
    while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++
    return i
  }
  if (text[i] === '/' && i + 1 < text.length && text[i + 1] === '*') {
    i += 2
    while (i < text.length) {
      if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '/') { i += 2; break }
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
        const c = findMatchingBrace(text, i + 1); if (c === -1) return -1; i = c
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
    else if (inB) {
      if (ch === '`' && prev !== '\\') inB = false
    } else {
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
    if (parenEnd === -1) { console.log(`  ${method}: findMatchingParen returned -1`); continue }
    let braceStart = parenEnd + 1
    while (braceStart < content.length && content[braceStart].match(/\s/)) braceStart++
    if (content[braceStart] !== '{') { console.log(`  ${method}: expected { at ${braceStart}, got '${content[braceStart]}'`); continue }
    const braceEnd = findMatchingBrace(content, braceStart)
    if (braceEnd === -1) { console.log(`  ${method}: findMatchingBrace returned -1`); continue }
    handlers.push({ method, startIdx: m.index, endIdx: braceEnd + 1, bodyText: content.slice(braceStart + 1, braceEnd) })
  }
  return handlers
}

function transformBody(body) {
  let b = body
  b = b.replace(/const\s+session\s*=\s*await\s+getServerSession\(authOptions\)\s*;?\n?/g, '')
  b = b.replace(/if\s*\(\s*!session\??\.?\s*user\??\.?\s*id\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?\)\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)
  b = b.replace(/if\s*\(\s*!session\??\.?\s*user\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?\)\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)
  b = b.replace(/if\s*\(\s*!session\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?\)\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)
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

function isPublicRoute(content) {
  return !content.includes('getServerSession') && !content.includes('session?.user')
}

// Single file test
function testFile(filePath) {
  const content = readFile(filePath)
  if (!content) { console.log('File not found'); return }
  console.log(`\n=== Testing ${path.relative(API_DIR, filePath)} ===`)
  console.log(`Has route({: ${/route\s*\(\s*\{/.test(content)}`)
  console.log(`Has getServerSession: ${content.includes('getServerSession')}`)
  console.log(`Has export async function: ${/export\s+async\s+function/.test(content)}`)
  
  const handlers = extractHandlers(content)
  console.log(`Handlers found: ${handlers.length}`)
  for (const h of handlers) {
    console.log(`  ${h.method}: body length ${h.bodyText.length}, ends at ${h.endIdx}`)
  }
  if (handlers.length === 0) {
    // Debug: find where export async function is
    const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g
    let m
    while ((m = re.exec(content)) !== null) {
      console.log(`  Found pattern at ${m.index}: ${m[0]}`)
      const parenStart = m.index + m[0].length - 1
      const parenEnd = findMatchingParen(content, parenStart)
      console.log(`  Paren end: ${parenEnd}`)
      if (parenEnd !== -1) {
        let braceStart = parenEnd + 1
        while (braceStart < content.length && content[braceStart].match(/\s/)) braceStart++
        console.log(`  Brace start: ${braceStart}, char: '${content[braceStart]}'`)
        if (content[braceStart] === '{') {
          const braceEnd = findMatchingBrace(content, braceStart)
          console.log(`  Brace end (from findBrace): ${braceEnd}`)
        }
      }
    }
  }
}

testFile('src/app/api/ai/generate-content/route.ts.codemod.bak')

// Full transformContent replica
function transformContent(content, filePath) {
  const scope = getScopeName(filePath)

  if (/route\s*\(\s*\{/.test(content)) {
    if (!content.includes('getServerSession')) {
      return { status: 'already_converted', result: addMiddlewareImport(content, scope) }
    }
    const bak = filePath + '.codemod.bak'
    const bakContent = readFile(bak)
    if (bakContent) {
      content = bakContent
    }
  }

  const handlers = extractHandlers(content)
  if (handlers.length === 0) {
    return { status: 'no_handlers', result: null }
  }

  const isPublic = isPublicRoute(content)
  const detectedRole = isPublic ? null : detectRole(handlers)

  let authStr = ''
  if (isPublic) authStr = "auth: 'none'"
  else if (detectedRole === null) authStr = ''
  else if (Array.isArray(detectedRole)) authStr = `auth: [${detectedRole.map(r => `'${r}'`).join(', ')}]`
  else authStr = `auth: '${detectedRole}'`
  const authConfig = authStr ? `{ ${authStr} }` : '{}'

  const replacements = handlers.map(h => {
    const inner = transformBody(h.bodyText)
    const newHandler = `export const ${h.method} = route(${authConfig}, async (request, { user }) => {${inner}\n})`
    return { ...h, replacement: newHandler }
  })

  replacements.sort((a, b) => b.startIdx - a.startIdx)
  let result = content
  for (const r of replacements) {
    result = result.slice(0, r.startIdx) + r.replacement + result.slice(r.endIdx)
  }

  result = addMiddlewareImport(result, scope)

  if (!/getServerSession/.test(result)) {
    result = result.replace(/import\s*\{\s*getServerSession\s*}\s*from\s*['"]next-auth['"]\s*;?\n?/g, '')
  }
  if (!/authOptions/.test(result)) {
    result = result.replace(/import\s*\{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth['"]\s*;?\n?/g, '')
    result = result.replace(/import\s*\{\s*authOptions\s*}\s*from\s*['"]\.\.\/lib\/auth['"]\s*;?\n?/g, '')
  }
  if (!/NextResponse\./.test(result)) {
    result = result.replace(/import\s*\{\s*NextRequest,\s*NextResponse\s*}\s*from\s*['"]next\/server['"]\s*;?\n?/g, "import { NextRequest } from 'next/server'\n")
  }

  result = result.replace(/\n{3,}/g, '\n\n')
  return { status: 'transformed', result }
}

// Test ALL files
const allFiles = []
function findAllRouteFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) findAllRouteFiles(fullPath)
    else if (entry.name === 'route.ts') allFiles.push(fullPath)
  }
}

findAllRouteFiles(API_DIR)
console.log(`Total route files: ${allFiles.length}`)

let converted = 0, alreadyConverted = 0, noHandlers = 0, sameContent = 0

for (const filePath of allFiles) {
  const relPath = path.relative(API_DIR, filePath).replace(/\\/g, '/')
  const content = readFile(filePath)
  if (!content) { noHandlers++; continue }

  const result = transformContent(content, filePath)

  if (result.status === 'already_converted') {
    alreadyConverted++
    continue
  }
  if (result.status === 'no_handlers' || result.result === null) {
    noHandlers++
    if (!/route\s*\(\s*\{/.test(content) && content.includes('export async function')) {
      console.log(`  NO HANDLERS despite export fn: ${relPath}`)
    }
    continue
  }

  if (result.result === content) {
    sameContent++
    if (sameContent === 1) {
      console.log(`  SAME CONTENT (first): ${relPath}`)
      console.log('Content length:', content.length, 'Result length:', result.result.length)
    }
  } else {
    converted++
    console.log(`  CONVERTED: ${relPath}`)
  }
}

console.log(`\nSummary: converted=${converted}, alreadyConv=${alreadyConverted}, noHandlers=${noHandlers}, sameContent=${sameContent}`)
