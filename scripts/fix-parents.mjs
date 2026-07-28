import fs from 'fs'

const bak = fs.readFileSync('src/app/api/teacher/parents/route.ts.codemod.bak', 'utf-8')

// Split into GET and POST handlers by finding the function boundaries
const getMatch = bak.match(/^export async function GET[\s\S]*?(?=^export async function POST)/m)
const postMatch = bak.match(/^export async function POST[\s\S]*$/m)

function convertHandler(code, handlerName, isLast) {
  const lines = code.split('\n').filter((l, i) => i > 0 || l.startsWith('export'))
  // lines[0] is the export async function line
  const firstLine = lines[0]
  const body = lines.slice(1).join('\n')

  // Determine auth from handler name
  const auth = handlerName === 'GET' ? "['TEACHER']" : "['TEACHER']"

  // Remove the export async function line
  let result = code.replace(/^export async function (GET|POST)\(req: NextRequest\)\s*[\s\S]*?{/, '')

  // Remove imports and blank lines at top
  // Actually, let me rebuild cleanly
  
  // Remove:
  // 1. import { NextRequest... line
  // 2. import { getServerSession... line  
  // 3. import { authOptions... line
  // 4. const session = await getServerSession... line
  // 5. if (!session?.user?.id) {...} block
  // 6. console.log → log.info, console.error → log.error
  // 7. session.user.role → authUser.role, session.user.id → authUser.id
  
  let c = code

  // Remove the function signature and opening brace
  c = c.replace(/^export async function (GET|POST)\(req: NextRequest\)\s*\{/, '')
  
  // Add route wrapper  
  c = `export const ${handlerName} = route({ auth: ${auth} }, async (req, { user: authUser, params }) => {${c}`
  
  // Close route() call at end - need to replace final } with })
  // Find last non-whitespace character that is }
  let endIdx = c.length
  while (endIdx > 0 && /\s/.test(c[endIdx - 1])) endIdx--
  if (c[endIdx - 1] === '}') {
    c = c.substring(0, endIdx - 1) + '})' + c.substring(endIdx)
  }

  return c
}

// Remove all imports from original (we'll add new ones)
let processed = bak
processed = processed.replace(/^import .+$/gm, '')

// Remove blank lines at start
processed = processed.replace(/^\s*\n/, '')

// Convert GET  
const getEnd = processed.search(/^export async function POST/m)
const getPart = processed.substring(0, getEnd)
const postPart = processed.substring(getEnd)

// Process GET
let getResult = getPart
  .replace(/^export async function GET\(req: NextRequest\)\s*\{/, '')
  .replace(/const session = await getServerSession\(authOptions\);?\s*\n?/g, '')
  .replace(/if \(!session\?\.?user\?\.?id\)[\s\S]*?\{[\s\S]*?return NextResponse\.json\([\s\S]*?\}\)[\s;]*\n?\s*\}\s*\n?/g, '')
  .replace(/console\.log\(/g, 'log.info(')
  .replace(/console\.error\(/g, 'log.error(')
  .replace(/session\.user\.role/g, 'authUser.role')
  .replace(/session\.user\.id/g, 'authUser.id')
  .replace(/session\.user/g, 'authUser')

// Trim trailing whitespace and add route wrapper
getResult = getResult.trimEnd()
if (getResult.endsWith('}')) getResult = getResult.slice(0, -1) + '})'
getResult = `export const GET = route({ auth: ['TEACHER'] }, async (req, { user: authUser, params }) => {${getResult}`

// Process POST
let postResult = postPart
  .replace(/^export async function POST\(req: NextRequest\)\s*\{/, '')
  .replace(/const session = await getServerSession\(authOptions\);?\s*\n?/g, '')
  .replace(/if \(!session\?\.?user\?\.?id\s*\|\|\s*session\?\.?user\?\.?role !== 'TEACHER'\)[\s\S]*?\{[\s\S]*?return NextResponse\.json\([\s\S]*?\}\)[\s;]*\n?\s*\}\s*\n?/g, '')
  .replace(/if \(!session\?\.?user\?\.?id\)[\s\S]*?\{[\s\S]*?return NextResponse\.json\([\s\S]*?\}\)[\s;]*\n?\s*\}\s*\n?/g, '')  
  .replace(/console\.log\(/g, 'log.info(')
  .replace(/console\.error\(/g, 'log.error(')
  .replace(/session\.user\.role/g, 'authUser.role')
  .replace(/session\.user\.id/g, 'authUser.id')
  .replace(/session\.user/g, 'authUser')

postResult = postResult.trimEnd()
if (postResult.endsWith('}')) postResult = postResult.slice(0, -1) + '})'
postResult = `\n\nexport const POST = route({ auth: ['TEACHER'] }, async (req, { user: authUser, params }) => {${postResult}`

// Final file
const final = `import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('teacher/parents')

${getResult}
${postResult}
`

fs.writeFileSync('src/app/api/teacher/parents/route.ts', final, 'utf-8')
console.log('Done')
console.log('First 10 lines:')
console.log(final.split('\n').slice(0, 10).join('\n'))
console.log('...')
console.log('Last 5 lines:')
const lines = final.trimEnd().split('\n')
console.log(lines.slice(-5).join('\n'))
