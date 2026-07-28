import { readFileSync } from 'fs'
import { join } from 'path'
// @ts-ignore - handlebars types not installed
import Handlebars from 'handlebars'
import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { logger } from './logger'

interface EmailOptions {
  to: string | string[]
  subject: string
  template: string
  data: Record<string, unknown>
}

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
      from: map.get('smtp_from') || process.env.SMTP_FROM || 'noreply@elimunova.com',
    }
  } catch (e) {
    console.warn('[EmailService] Failed to load SMTP config from DB:', e)
    return {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'noreply@elimunova.com',
    }
  }
}

class EmailService {
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map()

  constructor() {
    this.loadTemplates()
  }

  private loadTemplates() {
    const templateFiles = [
      'welcome.html',
      'credentials.html',
      'password-reset.html',
      'invoice.html',
      'subscription-renewal.html',
      'trial-ending.html',
    ]

    for (const file of templateFiles) {
      try {
        const path = join(process.cwd(), 'src/lib/emails/templates', file)
        const source = readFileSync(path, 'utf-8')
        const template = Handlebars.compile(source)
        const name = file.replace('.html', '')
        this.templates.set(name, template)
      } catch (error) {
        logger.warn(`Failed to load email template: ${file}`, { error })
      }
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const template = this.templates.get(options.template)

    if (!template) {
      logger.warn(`Email template not found: ${options.template}`)
      return false
    }

    try {
      const html = template({
        ...options.data,
        year: new Date().getFullYear(),
      })

      const config = await getSmtpConfig()
      const configured = !!(config.host && config.user && config.pass)

      if (configured) {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.port === 465,
          auth: { user: config.user, pass: config.pass },
        })
        await transporter.sendMail({
          from: `"ElimuNova" <${config.from}>`,
          to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          html,
        })
        return true
      }

      logger.info(`SMTP not configured — email logged only: ${options.subject} to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`)
      return true
    } catch (error) {
      logger.error('Failed to send email', error, { template: options.template })
      return false
    }
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    return this.sendEmail({
      to,
      subject: 'Welcome to ElimuNova AI!',
      template: 'welcome',
      data: { firstName },
    })
  }

  async sendCredentialsEmail(
    to: string,
    firstName: string,
    username: string,
    password: string
  ) {
    return this.sendEmail({
      to,
      subject: 'Your Credentials for ElimuNova AI',
      template: 'credentials',
      data: { firstName, username, password },
    })
  }

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    resetUrl: string
  ) {
    return this.sendEmail({
      to,
      subject: 'Reset Your ElimuNova AI Password',
      template: 'password-reset',
      data: { firstName, resetUrl },
    })
  }

  async sendInvoiceEmail(
    to: string,
    firstName: string,
    invoiceNumber: string,
    planName: string,
    amount: number,
    dueDate: string,
    status: string,
    paymentUrl: string
  ) {
    return this.sendEmail({
      to,
      subject: `Invoice ${invoiceNumber} from ElimuNova AI`,
      template: 'invoice',
      data: {
        firstName,
        invoiceNumber,
        planName,
        amount,
        dueDate,
        status,
        paymentUrl,
      },
    })
  }

  async sendSubscriptionRenewalEmail(
    to: string,
    firstName: string,
    planName: string,
    amount: number,
    renewalDate: string,
    billingUrl: string
  ) {
    return this.sendEmail({
      to,
      subject: 'Subscription Renewal Reminder',
      template: 'subscription-renewal',
      data: {
        firstName,
        planName,
        amount,
        renewalDate,
        billingUrl,
      },
    })
  }

  async sendTrialEndingEmail(
    to: string,
    firstName: string,
    planName: string,
    daysRemaining: number,
    trialEndDate: string,
    billingUrl: string
  ) {
    return this.sendEmail({
      to,
      subject: 'Your Free Trial is Ending Soon',
      template: 'trial-ending',
      data: {
        firstName,
        planName,
        daysRemaining,
        trialEndDate,
        billingUrl,
      },
    })
  }

  async sendNotificationEmail(
    to: string,
    firstName: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ) {
    return this.sendEmail({
      to,
      subject: title,
      template: 'notification',
      data: {
        firstName,
        notificationTitle: title,
        notificationMessage: message,
        actionUrl,
        actionText,
      },
    })
  }
}

export const emailService = new EmailService()