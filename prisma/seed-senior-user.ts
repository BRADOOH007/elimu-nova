/* eslint-disable */
// Creates a demo SENIOR_STUDENT account for testing the GED portal.
// Idempotent (upserts by email). Run: npx tsx prisma/seed-senior-user.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'senior@elimunova.ai' },
    update: {},
    create: {
      email: 'senior@elimunova.ai',
      password: hashedPassword,
      firstName: 'Mary',
      lastName: 'Senior',
      username: 'mary.senior',
      role: 'SENIOR_STUDENT',
      isActive: true,
    },
  })

  await prisma.seniorStudent.upsert({
    where: { userId: user.id },
    update: { selectedGEDSubjects: [], approvalStatus: 'FREEMIUM', approvedAt: new Date() },
    create: {
      userId: user.id,
      ageBracket: '30-49',
      priorEducation: 'Some Secondary',
      englishLevel: 'Intermediate',
      selectedGEDSubjects: [],
      approvalStatus: 'FREEMIUM',
      approvedAt: new Date(),
    },
  })

  // Approved → issue a freemium subscription so the dashboard is accessible.
  let basicPackage = await prisma.package.findFirst({ where: { name: 'Basic' }, orderBy: { price: 'asc' } })
  if (!basicPackage) {
    basicPackage = await prisma.package.create({
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
  const now = new Date()
  const endDate = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000)
  const existingSub = await prisma.subscription.findFirst({ where: { userId: user.id } })
  if (existingSub) {
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { isFreemium: true, type: 'FREEMIUM', status: 'ACTIVE', endDate, isTrial: false },
    })
  } else {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        packageId: basicPackage.id,
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

  console.log('✅ Demo senior student ready:')
  console.log('   Email:    senior@elimunova.ai')
  console.log('   Password: password123')
  console.log('   Role:     SENIOR_STUDENT → /senior-student/dashboard')
}

main()
  .catch((e) => {
    console.error('Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
