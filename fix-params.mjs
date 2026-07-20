import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, sep } from 'path'

const root = join(import.meta.dirname, 'src')
const filesFixed = []

function findRouteFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      findRouteFiles(full)
    } else if (entry.name === 'route.ts') {
      tryFix(full)
    }
  }
}

function tryFix(filePath) {
  let content = readFileSync(filePath, 'utf-8')
  const original = content

  // Match: { params }: { params: { something: string } }
  // Replace with: { params }: { params: Promise<{ something: string }> }
  content = content.replace(
    /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z]+)\s*:\s*string\s*\}\s*\}/g,
    (_match, p1) => `{ params }: { params: Promise<{ ${p1}: string }> }`
  )

  if (content !== original) {
    writeFileSync(filePath, content, 'utf-8')
    filesFixed.push(filePath.replace(root + sep, ''))
  }
}

findRouteFiles(root)

console.log(`Fixed ${filesFixed.length} files:`)
filesFixed.forEach(f => console.log(`  ${f}`))
