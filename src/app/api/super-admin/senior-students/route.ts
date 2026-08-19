import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { invalidateSubscriptionCache } from '@/lib/subscription-service'

// List all senior students with their approval status.
export const GET = route({ auth: 'SUPER_ADMIN' }, async () => {
  const seniors = await prisma.seniorStudent.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true, createdAt: true } },
      gedSubjectProgress: true,
      certificates: { select: { id: true, certNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const subs = await prisma.subscription.findMany({
    where: { userId: { in: seniors.map((s) => s.userId) } },
    include: { package: { select: { name: true, price: true } } },
  })
  const subByUser = new Map(subs.map((x) => [x.userId, x]))

  const list = seniors.map((s) => {
    const sub = subByUser.get(s.userId)
    return {
      id: s.id,
      userId: s.user.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      isActive: s.user.isActive,
      approvalStatus: s.approvalStatus,
      approvedAt: s.approvedAt,
      ageBracket: s.ageBracket,
      priorEducation: s.priorEducation,
      englishLevel: s.englishLevel,
      isGEDReady: s.isGEDReady,
      certificate: s.certificates[0]?.certNumber ?? null,
      joinedAt: s.user.createdAt,
      subscription: sub
        ? { status: sub.status, amount: sub.amount, packageName: sub.package?.name ?? null, endDate: sub.endDate, isFreemium: sub.isFreemium }
        : null,
    }
  })

  return NextResponse.json({ seniors: list })
})

async function getOrCreateBasicPackage() {
  let pkg = await prisma.package.findFirst({ where: { name: 'Basic' }, orderBy: { price: 'asc' } })
  if (!pkg) {
    pkg = await prisma.package.create({
      data: {
        name: 'Basic',
        price: 0,
        duration: 30,
        maxTeachers: 1,
        maxStudents: 30,
        features: ['AI tutoring', 'Progress tracking', 'Basic reports'],
        isActive: true,
      },
    })
  }
  return pkg
}

async function issueFreemium(userId: string) {
  const pkg = await getOrCreateBasicPackage()
  const now = new Date()
  const endDate = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years
  const existing = await prisma.subscription.findFirst({ where: { userId } })
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { isFreemium: true, type: 'FREEMIUM', status: 'ACTIVE', endDate, isTrial: false },
    })
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        packageId: pkg.id,
        status: 'ACTIVE',
        startDate: now,
        endDate,
        amount: 0,
        type: 'FREEMIUM',
        paymentMethod: 'FREEMIUM',
        isFreemium: true,
      },
    })
  }
}

async function getOrCreateSeniorPackage() {
  let pkg = await prisma.package.findFirst({ where: { name: 'Senior GED Plan', isActive: true } })
  if (pkg && pkg.price !== 100) {
    pkg = await prisma.package.update({ where: { id: pkg.id }, data: { price: 100 } })
  }
  if (!pkg) {
    pkg = await prisma.package.create({
      data: {
        name: 'Senior GED Plan',
        description: 'Monthly access to the US General Education Diploma (GED) preparation program.',
        price: 100,
        duration: 30,
        maxTeachers: 1,
        maxStudents: 1,
        features: ['Full GED curriculum', 'Computer & AI literacy courses', 'Live lessons', 'GED certificate'],
        isActive: true,
      },
    })
  }
  return pkg
}

async function activatePaidSubscription(userId: string, amount?: number) {
  const pkg = await getOrCreateSeniorPackage()
  const now = new Date()
  const endDate = new Date(now.getTime() + pkg.duration * 24 * 60 * 60 * 1000)
  const finalAmount = amount ?? pkg.price

  const existing = await prisma.subscription.findFirst({ where: { userId } })
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        packageId: pkg.id,
        status: 'ACTIVE',
        type: 'SUBSCRIPTION',
        paymentMethod: 'CASH',
        amount: finalAmount,
        isFreemium: false,
        isTrial: false,
        startDate: now,
        endDate,
      },
    })
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        packageId: pkg.id,
        status: 'ACTIVE',
        type: 'SUBSCRIPTION',
        paymentMethod: 'CASH',
        amount: finalAmount,
        isFreemium: false,
        isTrial: false,
        startDate: now,
        endDate,
      },
    })
  }
}

async function revokeSubscription(userId: string) {
  const existing = await prisma.subscription.findFirst({ where: { userId } })
  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { isFreemium: false, type: 'SUBSCRIPTION', status: 'CANCELLED' },
    })
  }
}

// Action endpoint:
//   approve  — issue freemium (free limited access)
//   activate — mark cash payment received + activate a paid subscription
//   lock     — lock dashboard (student sees subscribe screen)
//   pending  — reset to awaiting approval
export const POST = route({ auth: 'SUPER_ADMIN' }, async (req) => {
  const { userId, action, amount } = await req.json()

  if (!userId || !['approve', 'activate', 'lock', 'pending'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const senior = await prisma.seniorStudent.findUnique({ where: { userId } })
  if (!senior) {
    return NextResponse.json({ error: 'Senior student not found' }, { status: 404 })
  }

  let approvalStatus: string
  let approvedAt = senior.approvedAt

  if (action === 'approve') {
    approvalStatus = 'FREEMIUM'
    approvedAt = new Date()
    await issueFreemium(userId)
  } else if (action === 'activate') {
    approvalStatus = 'ACTIVE'
    approvedAt = new Date()
    await activatePaidSubscription(userId, typeof amount === 'number' ? amount : undefined)
  } else if (action === 'lock') {
    approvalStatus = 'LOCKED'
    await revokeSubscription(userId)
  } else {
    approvalStatus = 'PENDING'
    await revokeSubscription(userId)
  }

  const updated = await prisma.seniorStudent.update({
    where: { userId },
    data: { approvalStatus, approvedAt },
  })

  await invalidateSubscriptionCache(userId).catch(() => {})

  return NextResponse.json({ id: updated.id, approvalStatus: updated.approvalStatus, approvedAt: updated.approvedAt })
})
