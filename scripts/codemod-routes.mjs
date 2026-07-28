// Codemod: Convert route.ts files to use route() from @/lib/api-middleware
// Usage: node scripts/codemod-routes.mjs
// Creates .bak files before modifying originals

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.resolve(__dirname, '../src/app/api')

const SKIP_FILES = new Set([
  'auth/[...nextauth]/route.ts',
  'webhooks/stripe/route.ts',
  'zoom/webhook/route.ts',
])

const ALREADY_CONVERTED = new Set()

function findAllRouteFiles(dir) {
  const files = []
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) files.push(...findAllRouteFiles(fullPath))
      else if (entry.name === 'route.ts') files.push(fullPath)
    }
  } catch { /* ignore */ }
  return files
}

function readFile(p) { try { return fs.readFileSync(p, 'utf-8') } catch { return null } }
function writeFile(p, c) { fs.writeFileSync(p, c, 'utf-8') }
function backupFile(p) {
  const bak = p + '.codemod.bak'
  if (!fs.existsSync(bak)) fs.copyFileSync(p, bak)
}

function getScopeName(filePath) {
  const rel = path.relative(API_DIR, filePath).replace(/\\/g, '/').replace(/\/route\.ts$/, '')
  return rel.replace(/\[/g, '').replace(/\]/g, '')
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

// Brace-tracking with string and comment awareness
function skipComment(text, i) {
  // Check for // at position i
  if (text[i] === '/' && i + 1 < text.length && text[i + 1] === '/') {
    i += 2
    while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++
    return i
  }
  // Check for /* at position i
  if (text[i] === '/' && i + 1 < text.length && text[i + 1] === '*') {
    i += 2
    while (i < text.length) {
      if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '/') {
        i += 2
        break
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
    if (inS) {
      if (ch === "'" && prev !== '\\') inS = false
    } else if (inD) {
      if (ch === '"' && prev !== '\\') inD = false
    } else if (inB) {
      if (ch === '`' && prev !== '\\') inB = false
      else if (ch === '$' && text[i + 1] === '{') {
        const c = findMatchingBrace(text, i + 1)
        if (c === -1) return -1; i = c
      }
    } else {
      // Skip comments
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
    if (inS) {
      if (ch === "'" && prev !== '\\') inS = false
    } else if (inD) {
      if (ch === '"' && prev !== '\\') inD = false
    } else if (inB) {
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

// Extract handler info: find `export async function METHOD(...) { ... }`
// Returns the FULL body including try/catch
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

// Transform full handler body: session → user, console → log, remove getServerSession
function transformBody(body) {
  let b = body

  // Remove getServerSession call
  b = b.replace(/const\s+session\s*=\s*await\s+getServerSession\(authOptions\)\s*;?\n?/g, '')

  // Remove if (!session) unauthorized check blocks
  b = b.replace(/if\s*\(\s*!session\??\.?\s*user\??\.?\s*id\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?\)\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)
  b = b.replace(/if\s*\(\s*!session\??\.?\s*user\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?\)\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)
  b = b.replace(/if\s*\(\s*!session\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\([\s\S]*?\)\s*\}/g, (m) => m.includes('401') || m.includes('Unauthorized') ? '' : m)

  // session?.user?.id → user.id  (covers both variants)
  b = b.replace(/session\??\.\s*user\??\.\s*id\b/g, 'user.id')
  b = b.replace(/session\??\.\s*user\??\.\s*role\b/g, 'user.role')
  b = b.replace(/session\??\.\s*user\??\.\s*name\b/g, 'user.name')
  b = b.replace(/session\??\.\s*user\??\.\s*email\b/g, 'user.email')

  // session?.user → user (standalone, after property patterns above)
  b = b.replace(/session\??\.\s*user\b/g, 'user')

  // console → log
  b = b.replace(/console\.log\(/g, 'log.info(')
  b = b.replace(/console\.error\(/g, 'log.error(')
  b = b.replace(/console\.warn\(/g, 'log.warn(')

  return b
}

// Add apiMiddleware import after last existing import
function addMiddlewareImport(content, scope) {
  if (content.includes("from '@/lib/api-middleware'")) return content

  const lines = content.split('\n')
  let lastImport = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import\t')) lastImport = i
  }

  const importLine = `\nimport { route, apiLogger } from '@/lib/api-middleware'\nconst log = apiLogger('${scope}')\n`
  if (lastImport === -1) return importLine + '\n' + content

  lines.splice(lastImport + 1, 0, importLine)
  return lines.join('\n')
}

// ---------- main transform ----------

function transformContent(content, filePath) {
  const scope = getScopeName(filePath)

  // Already properly converted if it has route({) and no leftover getServerSession import
  if (/route\s*\(\s*\{/.test(content)) {
    if (!content.includes('getServerSession')) {
      ALREADY_CONVERTED.add(filePath)
      return addMiddlewareImport(content, scope)
    }
    // Has route() but getServerSession still present - reprocess from backup
    const bak = filePath + '.codemod.bak'
    const bakContent = readFile(bak)
    if (bakContent) {
      content = bakContent
    }
  }

  const handlers = extractHandlers(content)
  if (handlers.length === 0) {
    return null
  }

  // Determine auth config
  const isPublic = isPublicRoute(content)
  const detectedRole = isPublic ? null : detectRole(handlers)

  let authStr = ''
  if (isPublic) authStr = "auth: 'none'"
  else if (detectedRole === null) authStr = ''
  else if (Array.isArray(detectedRole)) authStr = `auth: [${detectedRole.map(r => `'${r}'`).join(', ')}]`
  else authStr = `auth: '${detectedRole}'`
  const authConfig = authStr ? `{ ${authStr} }` : '{}'

  // Build replacements: wrap the FULL body with route(), no try/catch stripping
  const replacements = handlers.map(h => {
    const inner = transformBody(h.bodyText)
    const newHandler = `export const ${h.method} = route(${authConfig}, async (request, { user }) => {${inner}\n})`
    return { ...h, replacement: newHandler }
  })

  // Apply right-to-left to preserve indices
  replacements.sort((a, b) => b.startIdx - a.startIdx)
  let result = content
  for (const r of replacements) {
    result = result.slice(0, r.startIdx) + r.replacement + result.slice(r.endIdx)
  }

  // Add middleware import
  result = addMiddlewareImport(result, scope)

  // Remove unused imports
  if (!/getServerSession/.test(result)) {
    result = result.replace(/import\s*\{\s*getServerSession\s*}\s*from\s*['"]next-auth['"]\s*;?\n?/g, '')
  }
  if (!/authOptions/.test(result)) {
    result = result.replace(/import\s*\{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth['"]\s*;?\n?/g, '')
    result = result.replace(/import\s*\{\s*authOptions\s*}\s*from\s*['"]\.\.\/lib\/auth['"]\s*;?\n?/g, '')
  }

  // Remove NextResponse if unused
  if (!/NextResponse\./.test(result)) {
    result = result.replace(/import\s*\{\s*NextRequest,\s*NextResponse\s*}\s*from\s*['"]next\/server['"]\s*;?\n?/g, "import { NextRequest } from 'next/server'\n")
  }

  result = result.replace(/\n{3,}/g, '\n\n')
  return result
}

// ---------- main ----------

console.log('🔍 Finding route files...')
const allFiles = findAllRouteFiles(API_DIR)
console.log(`📁 Found ${allFiles.length} route.ts files`)

let converted = 0, skipped = 0, errors = []

for (const filePath of allFiles) {
  const relPath = path.relative(API_DIR, filePath).replace(/\\/g, '/')
  if (SKIP_FILES.has(relPath)) { skipped++; continue }

  const content = readFile(filePath)
  if (!content) { skipped++; continue }

  try {
    const transformed = transformContent(content, filePath)
    if (transformed && transformed !== content) {
      backupFile(filePath)
      writeFile(filePath, transformed)
      converted++
      console.log(`  ✅ ${relPath}`)
    }
  } catch (err) {
    errors.push({ file: relPath, error: err.message })
    console.log(`  ❌ ${relPath} — ${err.message}`)
  }
}

console.log(`\n📊 Summary:`)
console.log(`   Converted: ${converted}`)
console.log(`   Skipped: ${skipped}`)
console.log(`   Already converted: ${ALREADY_CONVERTED.size}`)
console.log(`   Errors: ${errors.length}`)
if (errors.length > 0) {
  console.log(`\n❌ Errors:`)
  for (const { file, error } of errors) console.log(`   ${file}: ${error}`)
}
console.log(`\n⚠️  .bak files created alongside modified files for rollback.`)
