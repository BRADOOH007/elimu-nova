/**
 * Unified email sender — Resend API first, SMTP as fallback.
 *
 * Provider preference:
 *   1. Resend (API key from SystemSettings `resend_api_key` or RESEND_API_KEY env)
 *   2. SMTP (existing system_settings smtp_* / SMTP_* env)
 *
 * Never throws — returns a result object so callers can log and continue.
 */

import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { decryptPassword } from './password-encryption'

export interface EmailSendResult {
  sent: boolean
  method: 'resend' | 'smtp' | 'logged' | 'none'
  error?: string
}

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

async function getResendKey(): Promise<string> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'resend_api_key' },
    })
    if (setting?.value) {
      const decrypted = decryptPassword(setting.value)
      if (decrypted) return decrypted
      return setting.value
    }
  } catch (e) {
    console.warn('[EmailProvider] Failed to load Resend key from DB:', e)
  }
  return process.env.RESEND_API_KEY || ''
}

async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const keys = await prisma.systemSettings.findMany({
      where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'] } }
    })
    const map = new Map(keys.map(k => [k.key, k.value]))
    const dbPass = map.get('smtp_pass')
    const pass = dbPass ? (decryptPassword(dbPass) || dbPass) : process.env.SMTP_PASS || ''
    return {
      host: map.get('smtp_host') || process.env.SMTP_HOST || '',
      port: parseInt(map.get('smtp_port') || process.env.SMTP_PORT || '587', 10),
      user: map.get('smtp_user') || process.env.SMTP_USER || '',
      pass,
      from: map.get('smtp_from') || process.env.SMTP_FROM || 'noreply@elimunova.com',
    }
  } catch (e) {
    console.warn('[EmailProvider] Failed to load SMTP config from DB, falling back to env:', e)
    return {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'noreply@elimunova.com',
    }
  }
}

async function sendViaResend(to: string, from: string, subject: string, html: string): Promise<boolean> {
  const apiKey = await getResendKey()
  if (!apiKey) return false

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.warn(`[EmailProvider] Resend failed (${res.status}): ${text}`)
    return false
  }
  return true
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<boolean> {
  const config = await getSmtpConfig()
  if (!config.host || !config.user || !config.pass) return false

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  })
  await transporter.sendMail({
    from: `"EduGenius" <${config.from}>`,
    to,
    subject,
    html,
  })
  return true
}

/**
 * Send an email. Tries Resend, then SMTP. If neither is configured the email
 * is logged only (so flows still complete in dev).
 */
export async function sendEmail(
  options: { to: string; subject: string; html: string; from?: string }
): Promise<EmailSendResult> {
  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to
  const from = options.from || (await getSmtpConfig()).from || 'EduGenius <noreply@elimunova.com>'

  try {
    const resent = await sendViaResend(to, from, options.subject, options.html)
    if (resent) return { sent: true, method: 'resend' }

    const smtpSent = await sendViaSmtp(to, options.subject, options.html)
    if (smtpSent) return { sent: true, method: 'smtp' }

    console.log(`[EmailProvider] No email provider configured — logged only: ${options.subject} -> ${to}`)
    return { sent: false, method: 'logged' }
  } catch (err: any) {
    console.error('[EmailProvider] Failed to send email:', err)
    return { sent: false, method: 'none', error: err?.message || 'Unknown error' }
  }
}

/** Check whether any email provider is configured (Resend or SMTP). */
export async function isEmailConfigured(): Promise<boolean> {
  const resendKey = await getResendKey()
  if (resendKey) return true
  const smtp = await getSmtpConfig()
  return !!(smtp.host && smtp.user && smtp.pass)
}
