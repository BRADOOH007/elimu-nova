import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const POST = async (req: Request) => {
  try {
    const formData = await req.formData()
    const from = String(formData.get('From') || '').replace('whatsapp:', '')
    const body = String(formData.get('Body') || '').trim().toLowerCase()

    logger.info(`[WhatsApp Webhook] From: ${from}, Body: ${body}`)

    if (!from || !body) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    const user = await prisma.user.findFirst({ where: { phone: { contains: from.slice(-9) } } })
    if (!user) {
      logger.info(`[WhatsApp Webhook] No user found for ${from}`)
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    if (body === 'menu' || body === 'help') {
      const reply = `Welcome to ElimuNova! Reply with:
• *attendance* — Get attendance summary
• *grades* — Get latest grades
• *homework* — Pending assignments
• *unread* — Unread messages count`
      return respondTwiML(reply)
    }

    if (body === 'grades' || body === 'grade') {
      const parent = await prisma.parent.findFirst({ where: { userId: user.id }, include: { students: { include: { student: { include: { user: true, assignments: { orderBy: { createdAt: 'desc' }, take: 5 } } } } } } })
      if (!parent || parent.students.length === 0) return respondTwiML('No linked students found.')
      const lines = parent.students.flatMap(ps => {
        const name = ps.student.user?.firstName || 'Student'
        const grades = ps.student.assignments.filter(a => a.grade != null).map(a => `${a.subject || 'Subject'}: ${a.grade}%`)
        return grades.length > 0 ? [`${name}:`, ...grades] : [`${name}: No grades yet`]
      })
      return respondTwiML(lines.join('\n') || 'No grades found.')
    }

    if (body === 'homework' || body === 'assignments') {
      const now = new Date()
      const parent = await prisma.parent.findFirst({ where: { userId: user.id }, include: { students: { include: { student: { include: { user: true, class: { include: { assignments: { where: { dueDate: { gte: now } }, orderBy: { dueDate: 'asc' }, take: 10 } } } } } } } } })
      if (!parent || parent.students.length === 0) return respondTwiML('No linked students found.')
      const lines = parent.students.flatMap(ps => {
        const name = ps.student.user?.firstName || 'Student'
        const assignments = ps.student.class?.assignments || []
        return assignments.length > 0 ? [`${name}:`, ...assignments.map(a => `  • ${a.title} — due ${new Date(a.dueDate).toLocaleDateString('en-GB')}`)] : [`${name}: No pending assignments`]
      })
      return respondTwiML(lines.join('\n'))
    }

    if (body === 'attendance') {
      return respondTwiML('Attendance feature coming soon. Reply *menu* for available options.')
    }

    return respondTwiML(`Hi ${user.firstName}! Reply *menu* to see available commands.`)
  } catch (error) {
    logger.error('[WhatsApp Webhook] Error:', error)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

function respondTwiML(message: string): Response {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
  return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } })
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const GET = () => NextResponse.json({ ok: true, message: 'WhatsApp webhook active' })
