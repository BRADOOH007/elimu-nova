/**
 * Local file storage fallback for ElimuNova.
 *
 * When Supabase Storage isn't configured, files are written to the app's
 * `public/uploads` directory and served statically by Next.js.
 */

import { promises as fs } from 'fs'
import path from 'path'

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Write a file to local storage under `public/uploads/<bucket>/<relativePath>`.
 * Returns a public URL path (`/uploads/...`) or null on failure.
 */
export async function saveFileLocally(
  bucket: string,
  relativePath: string,
  buffer: Buffer,
): Promise<string | null> {
  try {
    // In production on serverless hosts the filesystem is ephemeral, so we
    // keep writing to the same location and rely on Next's static serving in dev.
    const safeBucket = bucket.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(PUBLIC_UPLOAD_DIR, safeBucket, relativePath)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, buffer)
    return `/uploads/${safeBucket}/${relativePath}`
  } catch (error) {
    console.error('[LocalStorage] save failed:', error)
    return null
  }
}

/**
 * Remove a local file identified by its public URL path.
 */
export async function removeFileLocally(publicUrl: string): Promise<void> {
  try {
    const match = publicUrl.match(/^\/uploads\/[^/]+\/(.+)$/)
    if (!match) return
    const bucket = publicUrl.split('/')[2]
    const relativePath = match[1]
    const filePath = path.join(PUBLIC_UPLOAD_DIR, bucket, relativePath)
    await fs.unlink(filePath)
  } catch {
    // non-critical cleanup
  }
}
