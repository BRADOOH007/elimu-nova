import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

// POST /api/packages/cleanup
// Keeps only three default packages (by name), dedupes by keeping the most recently created,
// creates any missing defaults with USD pricing, and deletes the rest if they have no subscriptions.
export const POST = route({ auth: 'SUPER_ADMIN' }, async () => {

    // Allowed/default package names and their default USD pricing
    const defaults = [
      {
        name: 'Basic Plan',
        description: 'Perfect for small schools getting started with ElimuNova AI',
        price: 38.46,
        duration: 30,
        maxTeachers: 5,
        maxStudents: 100,
        features: [
          'Basic AI tutoring',
          'Progress tracking',
          'Email support',
          'Standard curriculum',
        ] as string[],
      },
      {
        name: 'Premium Plan',
        description: 'Advanced features for growing schools',
        price: 115.38,
        duration: 30,
        maxTeachers: 20,
        maxStudents: 500,
        features: [
          'Advanced AI tutoring',
          'Personalized learning paths',
          'Real-time analytics',
          'Priority support',
          'Custom curriculum',
          'Parent portal',
        ] as string[],
      },
      {
        name: 'Enterprise Plan',
        description: 'Complete solution for large educational institutions',
        price: 384.62,
        duration: 30,
        maxTeachers: 100,
        maxStudents: 2000,
        features: [
          'Full AI suite',
          'Custom AI models',
          'Advanced analytics',
          '24/7 dedicated support',
          'Custom integrations',
          'Multi-campus support',
          'API access',
          'White-label options',
        ] as string[],
      },
    ]

    const allowedNames = defaults.map((d) => d.name.toLowerCase())

    // Fetch all packages with counts and createdAt for dedupe
    const allPackages = await prisma.package.findMany({
      include: {
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Build keep set: for each allowed name, keep the newest (since we ordered desc)
    const keepIds: Set<string> = new Set()
    const foundByName: Record<string, boolean> = {}

    for (const pkg of allPackages) {
      const nameKey = pkg.name.toLowerCase()
      if (allowedNames.includes(nameKey) && !foundByName[nameKey]) {
        keepIds.add(pkg.id)
        foundByName[nameKey] = true
      }
    }

    // Create any missing default packages
    const createdDefaults: string[] = []
    for (const def of defaults) {
      const exists = allPackages.find((p) => p.name.toLowerCase() === def.name.toLowerCase())
      if (!exists) {
        const created = await prisma.package.create({
          data: {
            name: def.name,
            description: def.description,
            price: def.price,
            duration: def.duration,
            maxTeachers: def.maxTeachers,
            maxStudents: def.maxStudents,
            features: def.features,
            isActive: true,
          },
        })
        keepIds.add(created.id)
        createdDefaults.push(created.name)
      }
    }

    // Determine deletions: anything not in keepIds and with zero subscriptions
    const deletable = allPackages.filter(
      (p) => !keepIds.has(p.id) && p._count.subscriptions === 0,
    )

    const deleted = await prisma.package.deleteMany({
      where: { id: { in: deletable.map((p) => p.id) } },
    })

    // Report any packages that could not be deleted due to subscriptions
    const protectedPackages = allPackages.filter(
      (p) => !keepIds.has(p.id) && p._count.subscriptions > 0,
    )

    return NextResponse.json({
      keptCount: keepIds.size,
      createdDefaults,
      deletedCount: deleted.count,
      protectedCount: protectedPackages.length,
      protectedPackages: protectedPackages.map((p) => ({ id: p.id, name: p.name, subscriptions: p._count.subscriptions })),
    })
})
