/**
 * Shared payment success/failure handling for M-Pesa and Stripe.
 *
 * Ensures every confirmed payment:
 *   1. Flips the subscription to ACTIVE (+ payment method / receipt)
 *   2. Creates a local PAID Invoice (Stripe previously skipped this)
 *   3. Invalidates the access cache so the subscriber is unblocked immediately
 *   4. Creates a dashboard Notification for the school admin + super admins
 *   5. Sends a payment confirmation email (Resend or SMTP)
 */

import { prisma } from './prisma'
import { invalidateSubscriptionCache } from './subscription-service'
import { sendEmail } from './email-provider'

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export interface PaymentSuccessInput {
  subscriptionId: string
  amount?: number
  method: string
  receipt: string
  notes?: string
}

export interface PaymentFailureInput {
  subscriptionId?: string
  method: string
  checkoutRequestId?: string
  reason?: string
}

async function getNextInvoiceNumber(): Promise<string> {
  try {
    const all = await prisma.invoice.findMany({ select: { invoiceNumber: true } })
    let max = 0
    for (const inv of all) {
      const num = parseInt(inv.invoiceNumber.replace('INV-', ''), 10)
      if (!isNaN(num) && num > max) max = num
    }
    return `INV-${String(max + 1).padStart(6, '0')}`
  } catch { /* fall through */ }
  return `INV-${String(1).padStart(6, '0')}`
}

/** Resolve the most recent subscription for a school / user pair. */
export async function resolveSubscription(schoolId?: string | null, userId?: string | null) {
  return prisma.subscription.findFirst({
    where: {
      ...(schoolId ? { schoolId } : {}),
      ...(schoolId ? {} : userId ? { userId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { package: true },
  })
}

/** People who should hear about a school's payment: the school admin + all super admins. */
async function getPaymentRecipients(schoolId?: string | null, userId?: string | null): Promise<Array<{ userId: string; email: string; firstName: string }>> {
  const recipients: Array<{ userId: string; email: string; firstName: string }> = []

  if (schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { schoolAdmin: { include: { user: true } } },
    })
    const admin = school?.schoolAdmin?.user
    if (admin?.email) {
      recipients.push({ userId: admin.id, email: admin.email, firstName: admin.firstName || 'School Admin' })
    }
  } else if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.email) recipients.push({ userId: user.id, email: user.email, firstName: user.firstName || 'User' })
  }

  const superAdmins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true, email: true, firstName: true },
  })
  for (const sa of superAdmins) {
    if (!recipients.some(r => r.userId === sa.id) && sa.email) {
      recipients.push({ userId: sa.id, email: sa.email, firstName: sa.firstName || 'Super Admin' })
    }
  }

  return recipients
}

/** Create a PAID invoice, deduped by receipt (stored in notes). */
export async function createPaidInvoice(
  subscriptionId: string,
  amount: number,
  method: string,
  receipt: string,
  extraNotes?: string
) {
  if (receipt) {
    const existing = await prisma.invoice.findFirst({
      where: { subscriptionId, notes: { contains: receipt } },
    })
    if (existing) return existing
  }

  const notes = `${method}:${receipt}${extraNotes ? `|${extraNotes}` : ''}`

  // Invoice numbers aren't guaranteed monotonic by createdAt — compute the
  // highest number in use and retry on the (rare) concurrent collision.
  let invoice: any
  for (let attempt = 0; attempt < 3; attempt++) {
    const invoiceNumber = await getNextInvoiceNumber()
    try {
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          subscriptionId,
          amount,
          taxAmount: 0,
          totalAmount: amount,
          status: 'PAID',
          dueDate: new Date(),
          paidDate: new Date(),
          notes,
        },
      })
      break
    } catch (err: any) {
      if (err?.code === 'P2002' && attempt < 2) continue
      throw err
    }
  }

  return invoice
}

export async function handlePaymentSuccess(input: PaymentSuccessInput) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: input.subscriptionId },
    include: { package: true },
  })
  if (!subscription) {
    console.warn('[Payment] handlePaymentSuccess: subscription not found', input.subscriptionId)
    return null
  }

  const amount = input.amount ?? subscription.amount
  const planName = subscription.package?.name || 'Subscription'

  // 1. Activate the subscription + record receipt
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'ACTIVE',
      paymentMethod: input.method,
      transactionId: input.receipt,
      ...(input.notes ? { notes: `${subscription.notes ? subscription.notes + '|' : ''}${input.notes}` } : {}),
    },
  })

  // 2. Create a PAID local invoice (deduped by receipt)
  const invoice = await createPaidInvoice(subscription.id, amount, input.method, input.receipt)

  // 3. Unblock the subscriber immediately
  try {
    await invalidateSubscriptionCache(subscription.userId || undefined, subscription.schoolId || undefined)
  } catch { /* ignore */ }

  // 4. Notifications + 5. Email
  const recipients = await getPaymentRecipients(subscription.schoolId, subscription.userId)
  const title = 'Payment Received'
  const message = `${input.method} payment of KSh ${amount.toLocaleString()} for ${planName} received${input.receipt ? ` (${input.receipt})` : ''}. Subscription is now ACTIVE.`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #16a34a, #2563eb); padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Payment Received</h1>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; margin-top: 0;">Hi <strong>{firstName}</strong>,</p>
        <p style="color: #374151;">We received your <strong>${input.method}</strong> payment for <strong>${planName}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #f3f4f6; font-weight: 600; color: #374151; border-radius: 6px 0 0 6px;">Amount</td>
            <td style="padding: 8px 12px; background: #f3f4f6; font-family: monospace; color: #1f2937; border-radius: 0 6px 6px 0;">KSh ${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #374151;">Plan</td>
            <td style="padding: 8px 12px; color: #1f2937;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #374151;">Invoice</td>
            <td style="padding: 8px 12px; color: #1f2937;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #374151;">Reference</td>
            <td style="padding: 8px 12px; font-family: monospace; color: #1f2937;">${input.receipt}</td>
          </tr>
        </table>
        <a href="${baseUrl}/billing" style="display: inline-block; background: linear-gradient(135deg, #16a34a, #2563eb); color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; margin: 8px 0;">View Billing</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 12px;">Thank you for your continued support.</p>
      </div>
    </div>
  `

  for (const r of recipients) {
    try {
      await prisma.notification.create({
        data: {
          title,
          message,
          type: 'success',
          userId: r.userId,
          schoolId: subscription.schoolId,
        },
      })
    } catch (e) { console.error('[Payment] Failed to create notification:', e) }

    try {
      await sendEmail({
        to: r.email,
        subject: `Payment received — KSh ${amount.toLocaleString()} (${planName})`,
        html: html.replace('{firstName}', r.firstName),
      })
    } catch (e) { console.error('[Payment] Failed to send email:', e) }
  }

  console.log('[Payment] handlePaymentSuccess complete', { subscriptionId: input.subscriptionId, invoice: invoice.invoiceNumber, method: input.method })
  return { invoice, subscription }
}

export async function handlePaymentFailure(input: PaymentFailureInput) {
  const subscription = input.subscriptionId
    ? await prisma.subscription.findUnique({ where: { id: input.subscriptionId } })
    : null

  if (!subscription) return null

  const recipients = await getPaymentRecipients(subscription.schoolId, subscription.userId)
  const title = 'Payment Failed'
  const message = `Your ${input.method} payment could not be completed${input.reason ? `: ${input.reason}` : ''}. Your subscription remains inactive.`

  for (const r of recipients) {
    try {
      await prisma.notification.create({
        data: { title, message, type: 'error', userId: r.userId, schoolId: subscription.schoolId },
      })
    } catch (e) { console.error('[Payment] Failed to create failure notification:', e) }
  }

  return { subscription }
}
