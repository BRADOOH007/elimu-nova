import { prisma } from './prisma'
import { logger } from './logger'

interface WhatsAppConfig {
  provider: 'twilio' | 'africastalking'
  accountSid?: string
  authToken?: string
  fromNumber: string
  apiKey?: string
  username?: string
}

interface WhatsAppMessage {
  to: string
  body: string
}

async function getConfig(): Promise<WhatsAppConfig | null> {
  try {
    const keys = await prisma.systemSettings.findMany({
      where: { key: { in: ['whatsapp_provider', 'twilio_account_sid', 'twilio_auth_token', 'twilio_from_number', 'africastalking_api_key', 'africastalking_username', 'africastalking_from_number'] } }
    })
    const map = new Map(keys.map(k => [k.key, k.value]))
    const provider = (map.get('whatsapp_provider') || process.env.WHATSAPP_PROVIDER || 'twilio') as 'twilio' | 'africastalking'

    if (provider === 'africastalking') {
      const apiKey = map.get('africastalking_api_key') || process.env.AFRICASTALKING_API_KEY
      const username = map.get('africastalking_username') || process.env.AFRICASTALKING_USERNAME || 'sandbox'
      const fromNumber = map.get('africastalking_from_number') || process.env.AFRICASTALKING_FROM || ''
      if (!apiKey) return null
      return { provider, apiKey, username, fromNumber }
    }

    const accountSid = map.get('twilio_account_sid') || process.env.TWILIO_ACCOUNT_SID
    const authToken = map.get('twilio_auth_token') || process.env.TWILIO_AUTH_TOKEN
    const fromNumber = map.get('twilio_from_number') || process.env.TWILIO_FROM_NUMBER || 'whatsapp:+14155238886'
    if (!accountSid || !authToken) return null
    return { provider, accountSid, authToken, fromNumber }
  } catch {
    logger.warn('[WhatsApp] Failed to load config from DB, trying env vars')
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return { provider: 'twilio', accountSid: process.env.TWILIO_ACCOUNT_SID, authToken: process.env.TWILIO_AUTH_TOKEN, fromNumber: process.env.TWILIO_FROM_NUMBER || 'whatsapp:+14155238886' }
    }
    if (process.env.AFRICASTALKING_API_KEY) {
      return { provider: 'africastalking', apiKey: process.env.AFRICASTALKING_API_KEY, username: process.env.AFRICASTALKING_USERNAME || 'sandbox', fromNumber: process.env.AFRICASTALKING_FROM || '' }
    }
    return null
  }
}

class WhatsAppService {
  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      const config = await getConfig()
      if (!config) {
        logger.info(`[WhatsApp] Not configured — message logged: ${message.body.slice(0, 80)} to ${message.to}`)
        return true
      }

      if (config.provider === 'africastalking') {
        return await this.sendAfricasTalking(config, message)
      }
      return await this.sendTwilio(config, message)
    } catch (error) {
      logger.error('[WhatsApp] Failed to send message', error)
      return false
    }
  }

  private async sendTwilio(config: WhatsAppConfig, message: WhatsAppMessage): Promise<boolean> {
    try {
      const accountSid = config.accountSid!
      const authToken = config.authToken!
      const to = message.to.startsWith('whatsapp:') ? message.to : `whatsapp:${message.to}`
      const from = config.fromNumber.startsWith('whatsapp:') ? config.fromNumber : `whatsapp:${config.fromNumber}`

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: message.body }).toString(),
      })

      if (!response.ok) {
        const err = await response.text()
        logger.error(`[WhatsApp] Twilio error ${response.status}: ${err}`)
        return false
      }
      return true
    } catch (error) {
      logger.error('[WhatsApp] Twilio send failed', error)
      return false
    }
  }

  private async sendAfricasTalking(config: WhatsAppConfig, message: WhatsAppMessage): Promise<boolean> {
    try {
      const to = message.to.replace(/^whatsapp:/, '').replace(/^\+/, '')
      const from = config.fromNumber.replace(/^whatsapp:/, '')

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'ApiKey': config.apiKey!,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: config.username!,
          to,
          message: message.body,
          ...(from ? { from } : {}),
        }).toString(),
      })

      if (!response.ok) {
        const err = await response.text()
        logger.error(`[WhatsApp] Africa's Talking error ${response.status}: ${err}`)
        return false
      }
      return true
    } catch (error) {
      logger.error('[WhatsApp] Africa\'s Talking send failed', error)
      return false
    }
  }

  async sendParentAlert(parentId: string, title: string, message: string): Promise<boolean> {
    try {
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
        include: { user: true, students: { include: { student: { include: { user: true } } } } },
      })
      if (!parent?.user.phone) {
        logger.info(`[WhatsApp] Parent ${parentId} has no phone number`)
        return false
      }
      const body = `*${title}*\n\n${message}\n\n— ElimuNova AI`
      return await this.sendMessage({ to: parent.user.phone, body })
    } catch (error) {
      logger.error('[WhatsApp] Failed to send parent alert', error)
      return false
    }
  }

  async sendHomeworkAlert(parentId: string, studentName: string, subject: string, title: string, dueDate: string): Promise<boolean> {
    return this.sendParentAlert(parentId, '📚 New Assignment',
      `${studentName} has a new ${subject} assignment: "${title}". Due: ${new Date(dueDate).toLocaleDateString('en-GB')}.`)
  }

  async sendGradeAlert(parentId: string, studentName: string, subject: string, grade: number, feedback?: string): Promise<boolean> {
    const emoji = grade >= 70 ? '✅' : grade >= 40 ? '📈' : '⚠️'
    const msg = `${studentName} scored ${grade}% in ${subject}.${feedback ? `\n\nFeedback: ${feedback}` : ''}`
    return this.sendParentAlert(parentId, `${emoji} Grade Update`, msg)
  }

  async sendAttendanceAlert(parentId: string, studentName: string, date: string, status: string): Promise<boolean> {
    return this.sendParentAlert(parentId, '📋 Attendance Update',
      `${studentName} was marked "${status}" on ${new Date(date).toLocaleDateString('en-GB')}.`)
  }

  async sendPerformanceAlert(parentId: string, studentName: string, subject: string, message: string): Promise<boolean> {
    return this.sendParentAlert(parentId, `📊 ${studentName} — ${subject}`, message)
  }

  async sendWellnessCheckComplete(parentId: string, studentName: string): Promise<boolean> {
    return this.sendParentAlert(parentId, '💚 Wellness Check Complete',
      `${studentName} completed their weekly wellness check-in. View details in your parent dashboard.`)
  }
}

export const whatsappService = new WhatsAppService()
