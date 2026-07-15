import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const PREFIX = 'PWD_ENC:'

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for password encryption')
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptPassword(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${encrypted}`
}

export function decryptPassword(encoded: string): string | null {
  if (!encoded.startsWith(PREFIX)) return null
  const payload = encoded.slice(PREFIX.length)
  const parts = payload.split('.')
  if (parts.length !== 3) return null
  const [ivB64, tagB64, ciphertext] = parts
  try {
    const key = getEncryptionKey()
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return null
  }
}

export function extractEncryptedPassword(address: string | null): string | null {
  if (!address) return null
  const match = address.match(new RegExp(`^${PREFIX}[^\\n]+`))
  return match ? decryptPassword(match[0]) : null
}

/** Strip the encrypted password prefix from an address, returning only the real address if any */
export function stripPasswordFromAddress(address: string | null): string | null {
  if (!address) return null
  return address.replace(new RegExp(`^${PREFIX}[^\\n]*\\n?---\\n?`), '')
}
