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

const allFiles = findAllRouteFiles(API_DIR)
console.log(`Found ${allFiles.length} route files`)

let changed = 0

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Normalize all route wrapper destructuring patterns to include params
  content = content.replace(
    /async\s*\(\s*[a-zA-Z_$][\w$]*\s*,\s*\{\s*user\s*\}\s*\)\s*=>\s*\{/g,
    'async (request, { user, params }) => {'
  )

  content = content.replace(
    /async\s*\(\s*[a-zA-Z_$][\w$]*\s*,\s*\{\s*user\s*,\s*params\s*\}\s*\)\s*=>\s*\{/g,
    'async (request, { user, params }) => {'
  )

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    changed++
  }
}

console.log(`Updated ${changed} files (destructuring only)`)
