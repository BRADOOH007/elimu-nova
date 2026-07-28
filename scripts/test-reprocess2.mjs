import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Import the actual codemod functions
const codemod = await import('./codemod-routes.mjs')

const filePath = path.resolve(__dirname, '../src/app/api/school-admin/meetings/[id]/route.ts')
const scope = 'school-admin/meetings/id'
const content = fs.readFileSync(filePath, 'utf-8')

console.log('Testing transformContent...')
const result = codemod.transformContent(content, filePath)
if (result === null) {
  console.log('transformContent returned null')
} else if (result === content) {
  console.log('transformContent returned same content (no change)')
} else {
  console.log('transformContent returned DIFFERENT content')
  console.log('Result length:', result.length)
  console.log('Has route():', result.includes('route('))
  console.log('Has getServerSession:', result.includes('getServerSession'))
  
  // Check last few lines
  const lines = result.split('\n')
  console.log('Last 10 lines:')
  for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
    console.log((i + 1) + ': ' + lines[i])
  }
}
