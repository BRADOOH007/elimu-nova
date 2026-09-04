/**
 * Cross-platform dev launcher.
 *
 * Sets NODE_OPTIONS to raise the max old space size (avoids Turbopack/Next.js
 * out-of-memory crashes during heavy dev builds on Windows) and starts
 * `next dev`. Works identically on Windows, macOS, and Linux.
 *
 * Usage: npm run dev
 */
const { spawn } = require('child_process')

process.env.NODE_OPTIONS = ((process.env.NODE_OPTIONS || '') + ' --max-old-space-size=4096').trim()

// Launch via the shell so `.cmd` shims for `npx` are resolved across platforms
// (spawn with shell:false fails with EINVAL on Windows for .cmd/.bat files).
const dev = spawn('npx next dev', { stdio: 'inherit', shell: true })

dev.on('error', (err) => {
  console.error('Failed to start next dev:', err)
  process.exit(1)
})

dev.on('exit', (code) => process.exit(code || 0))
