import { readFileSync } from 'fs'
import { join } from 'path'
import Handlebars from 'handlebars'
import { logger } from './logger'

interface EmailOptions {
  to: string | string[]
  subject: string
  template: string
  data: Record<string, unknown>
}

class EmailService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map()
  private transporter: any = null

  constructor() {
    this.loadTemplates()
  }

  private loadTemplates() {
    const templateDir = join(process.cwd(), 'src/lib/emails/templates')
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
        const source = require('fs').readFileSync(path, 'utf-8')
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
      console.error(`Email template not found: ${options.template}`)
      return false
    }

    try {
      const html = template({
        ...options.data,
        year: new Date().getFullYear(),
      })

      // Log email (in production, use actual SMTP)
      console.log('Email would be sent:', {
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
      })

      // TODO: Implement actual SMTP sending with nodemailer
      // const transporter = createTransport({...})
      // await transporter.sendMail({...})

      return true
    } catch (error) {
      console.error('Failed to send email:', error)
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