import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { testSmtpConnection } from '@/lib/email'
import nodemailer from 'nodemailer'

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {
  try {
    const body = await req.json()

    // Save SMTP settings to system_settings table
    if (body.save) {
      const entries = [
        { key: 'smtp_host', value: body.smtp_host || '', type: 'string', category: 'email', description: 'SMTP server hostname', isEditable: true },
        { key: 'smtp_port', value: String(body.smtp_port || '587'), type: 'string', category: 'email', description: 'SMTP server port', isEditable: true },
        { key: 'smtp_user', value: body.smtp_user || '', type: 'string', category: 'email', description: 'SMTP username', isEditable: true },
        { key: 'smtp_pass', value: body.smtp_pass || '', type: 'string', category: 'email', description: 'SMTP password', isEditable: true },
        { key: 'smtp_from', value: body.smtp_from || '', type: 'string', category: 'email', description: 'Default from email address', isEditable: true },
      ]

      for (const entry of entries) {
        await prisma.systemSettings.upsert({
          where: { key: entry.key },
          update: { value: entry.value, description: entry.description, updatedBy: user.id },
          create: { ...entry, isPublic: false, updatedBy: user.id },
        })
      }

      // Test after saving
      const testResult = await testSmtpConnection()
      return NextResponse.json({ saved: true, test: testResult })
    }

    // Just test the connection without saving
    const smtpConfig = {
      host: body.smtp_host || '',
      port: parseInt(body.smtp_port || '587', 10),
      user: body.smtp_user || '',
      pass: body.smtp_pass || '',
      from: body.smtp_from || '',
    }

    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
      return NextResponse.json({ ok: false, message: 'SMTP not fully configured (host, user, pass required)' })
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: { user: smtpConfig.user, pass: smtpConfig.pass },
      })
      await transporter.verify()
      return NextResponse.json({ ok: true, message: 'SMTP connection successful' })
    } catch (err: any) {
      return NextResponse.json({ ok: false, message: err?.message || 'SMTP connection failed' })
    }

  } catch (error) {
    console.error('Error in test-email:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
})
