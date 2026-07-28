import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.resolve(__dirname, '../src/app/api')

function findAllRouteFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...findAllRouteFiles(fullPath))
    else if (entry.name === 'route.ts') files.push(fullPath)
  }
  return files
}

// Step 1: Normalize destructuring to use `req` instead of `request`
// This way all existing body code that references `req` (from the original source) works.
const allFiles = findAllRouteFiles(API_DIR)
let step1 = 0, step2 = 0

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Replace: async (request, { user, params }) => {
  // With:    async (req, { user, params }) => {
  content = content.replace(
    /async\s*\(\s*[a-zA-Z_$][\w$]*\s*,\s*\{\s*user\s*,\s*params\s*\}\s*\)\s*=>\s*\{/g,
    'async (req, { user, params }) => {'
  )

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    step1++
  }
}

// Step 2: Rename request. → req. in body (for files that already used `request` in body)
for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Only do this rename if the file has the route wrapper pattern with `req` as parameter
  if (content.includes('async (req, { user, params })')) {
    content = content.replace(/(?<![$\w])request\./g, 'req.')
    content = content.replace(/(?<![$\w])request\(/g, 'req(')
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    step2++
  }
}

console.log(`Step 1 - normalized destructuring to use 'req': ${step1} files`)
console.log(`Step 2 - renamed request. → req. in body: ${step2} files`)
