import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { z } from 'zod'
import nodemailer from 'nodemailer'

const AlertSchema = z.object({
  studentId: z.string(),
  type: z.enum(['performance_drop', 'absence', 'behavior', 'achievement']),
  message: z.string(),
})

const typeLabel: Record<string, { title: string; notifType: string }> = {
  performance_drop: { title: 'Performance Drop Alert', notifType: 'warning' },
  absence: { title: 'Absence Alert', notifType: 'warning' },
  behavior: { title: 'Behavior Alert', notifType: 'error' },
  achievement: { title: 'Achievement Unlocked', notifType: 'success' },
}

async function sendNotificationEmail(to: string, parentName: string, studentName: string, title: string, message: string) {
  try {
    const keys = await prisma.systemSettings.findMany({
      where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'] } }
    })
    const map = new Map(keys.map(k => [k.key, k.value]))
    const host = map.get('smtp_host') || process.env.SMTP_HOST || ''
    const port = parseInt(map.get('smtp_port') || process.env.SMTP_PORT || '587', 10)
    const user = map.get('smtp_user') || process.env.SMTP_USER || ''
    const pass = map.get('smtp_pass') || process.env.SMTP_PASS || ''
    const from = map.get('smtp_from') || process.env.SMTP_FROM || 'noreply@elimunova.com'

    if (!host || !user || !pass) return { sent: false, method: 'logged' }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: `"EduGenius" <${from}>`,
      to,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">${title}</h1>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; margin-top: 0;">Hi <strong>${parentName}</strong>,</p>
            <p style="color: #374151;">Regarding your child <strong>${studentName}</strong>:</p>
            <p style="color: #374151;">${message}</p>
          </div>
        </div>
      `,
    })
    return { sent: true, method: 'smtp' }
  } catch (err) {
    console.error('[Alert Email] Failed to send:', err)
    return { sent: false, method: 'logged' }
  }
}

export const POST = route({ auth: 'TEACHER', schema: AlertSchema }, async (req, { user, body }) => {
  const { studentId, type, message } = body!

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { firstName: true, lastName: true } } }
  })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const parentStudents = await prisma.parentStudent.findMany({
    where: { studentId },
    include: {
      parent: {
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }
      }
    }
  })

  if (parentStudents.length === 0) {
    return NextResponse.json({ error: 'No parents found for this student' }, { status: 404 })
  }

  const { title, notifType } = typeLabel[type]
  const studentName = `${student.user.firstName} ${student.user.lastName}`

  let notifiedCount = 0
  for (const ps of parentStudents) {
    const parentUser = ps.parent.user
    const parentName = `${parentUser.firstName} ${parentUser.lastName}`

    await prisma.notification.create({
      data: {
        title,
        message,
        type: notifType,
        userId: parentUser.id,
        senderId: user.id,
      }
    })

    if (parentUser.email) {
      const result = await sendNotificationEmail(parentUser.email, parentName, studentName, title, message)
      if (result.sent) notifiedCount++
    }
  }

  return NextResponse.json({
    notified: notifiedCount,
    total: parentStudents.length,
  })
})
