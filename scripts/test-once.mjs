import fs from 'fs'

// Just test this one file
const filePath = 'src/app/api/ai/generate-content/route.ts'

// Read current file
const content = fs.readFileSync(filePath, 'utf-8')
console.log('Current file first line:', content.split('\n')[0])
console.log('Has route(:', content.includes('route('))
console.log('Has getServerSession:', content.includes('getServerSession'))

// If current has getServerSession, restore from backup first
if (content.includes('getServerSession') && !content.includes('route(')) {
  console.log('File is original, restoring from backup...')
  const bak = filePath + '.codemod.bak'
  if (fs.existsSync(bak)) {
    fs.copyFileSync(bak, filePath)
    console.log('Restored from backup')
  }
}

// Now run transform using actual codemod script
console.log('\nRunning codemod transform on this file...')
const codemod = await import('./codemod-routes.mjs')

// Get the scope name function
const scope = 'ai/generate-content'

// We can't easily call the transform directly since it's not exported
// Let me just manually test the key functions
console.log('Backup file now used as source')
const newContent = fs.readFileSync(filePath, 'utf-8')
console.log('File length:', newContent.length)
console.log('Has route(:', /route\s*\(\s*\{/.test(newContent))
console.log('Has getServerSession:', newContent.includes('getServerSession'))
console.log('Has export async:', /export\s+async\s+function/.test(newContent))
