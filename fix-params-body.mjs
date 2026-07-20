import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, sep } from 'path'

const root = join(import.meta.dirname, 'src')
let totalFixed = 0

function findRouteFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) findRouteFiles(full)
    else if (entry.name === 'route.ts') {
      totalFixed += tryFixBody(full) ? 1 : 0
    }
  }
}

function tryFixBody(filePath) {
  let content = readFileSync(filePath, 'utf-8')
  const original = content

  // If the file uses Promise<{...}> params, replace params.X with (await params).X
  // Match lines that use `params.XXX` where params is typed as Promise
  if (content.includes('Promise<{')) {
    // Replace `params.XXX` (but not `await params.XXX` or `const { X } = await params`)
    content = content.replace(
      /(?<!await\s)(?<!const\s*\{[^}]*\s*=\s*)params\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      '(await params).$1'
    )

    if (content !== original) {
      writeFileSync(filePath, content, 'utf-8')
      console.log(`  Fixed body: ${filePath.replace(root + sep, '')}`)
      return true
    }
  }
  return false
}

console.log('Fixing params.X to (await params).X in route handlers...')
findRouteFiles(root)
console.log(`\nFixed ${totalFixed} files.`)
