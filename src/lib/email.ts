import nodemailer from 'nodemailer'
import { prisma } from './prisma'

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const keys = await prisma.systemSettings.findMany({
      where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'] } }
    })
    const map = new Map(keys.map(k => [k.key, k.value]))
    return {
      host: map.get('smtp_host') || process.env.SMTP_HOST || '',
      port: parseInt(map.get('smtp_port') || process.env.SMTP_PORT || '587', 10),
      user: map.get('smtp_user') || process.env.SMTP_USER || '',
      pass: map.get('smtp_pass') || process.env.SMTP_PASS || '',
      from: map.get('smtp_from') || process.env.SMTP_FROM || 'noreply@edugenius.com',
    }
  } catch {
    return {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'noreply@edugenius.com',
    }
  }
}

export interface CredentialEmailPayload {
  to: string
  recipientName: string
  role: 'STUDENT' | 'PARENT'
  email: string
  password: string
  studentName?: string
}

export async function sendCredentialEmail(payload: CredentialEmailPayload): Promise<{ sent: boolean; method: string }> {
  const config = await getSmtpConfig()
  const configured = !!(config.host && config.user && config.pass)

  const subject = payload.role === 'PARENT'
    ? `Your EduGenius Parent Account Credentials`
    : `Welcome to EduGenius – Student Account`

  const roleLabel = payload.role === 'PARENT' ? 'Parent' : 'Student'
  const loginUrl  = `${baseUrl}/login`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Welcome to EduGenius!</h1>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; margin-top: 0;">Hi <strong>${payload.recipientName}</strong>,</p>
        <p style="color: #374151;">Your ${roleLabel.toLowerCase()} account has been created. Sign in with the credentials below:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #f3f4f6; font-weight: 600; color: #374151; border-radius: 6px 0 0 6px;">Email</td>
            <td style="padding: 8px 12px; background: #f3f4f6; font-family: monospace; color: #1f2937; border-radius: 0 6px 6px 0;">${payload.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #374151;">Password</td>
            <td style="padding: 8px 12px; font-family: monospace; color: #1f2937;">${payload.password}</td>
          </tr>
        </table>

        ${payload.studentName ? `<p style="color: #6b7280; font-size: 14px;">Linked student: <strong>${payload.studentName}</strong></p>` : ''}

        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; margin: 8px 0;">Sign In</a>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
          For security, please change your password after first login.
        </p>
      </div>
    </div>
  `

  if (configured) {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    })
    try {
      await transporter.sendMail({
        from: `"EduGenius" <${config.from}>`,
        to: payload.to,
        subject,
        html,
      })
      return { sent: true, method: 'smtp' }
    } catch (err) {
      console.error('Email sending failed, falling back to log:', err)
    }
  }

  console.log(`[EMAIL] To: ${payload.to} | Subject: ${subject} | Email: ${payload.email} | Password: ${payload.password}`)
  return { sent: false, method: 'logged' }
}

/** Test SMTP connection using current config */
export async function testSmtpConnection(): Promise<{ ok: boolean; message: string }> {
  const config = await getSmtpConfig()
  if (!config.host || !config.user || !config.pass) {
    return { ok: false, message: 'SMTP not fully configured (host, user, pass required)' }
  }
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    })
    await transporter.verify()
    return { ok: true, message: 'SMTP connection successful' }
  } catch (err: any) {
    return { ok: false, message: err?.message || 'SMTP connection failed' }
  }
}
