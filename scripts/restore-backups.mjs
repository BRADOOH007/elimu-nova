import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.resolve(__dirname, '../src/app/api')

let count = 0
function restoreAll(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      restoreAll(fullPath)
    } else if (entry.name.endsWith('.codemod.bak')) {
      const orig = fullPath.replace(/\.codemod\.bak$/, '')
      fs.copyFileSync(fullPath, orig)
      count++
    }
  }
}

restoreAll(API_DIR)
console.log(`Restored ${count} files from .codemod.bak backups`)
