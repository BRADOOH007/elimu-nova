import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
    const { id } = params

    const packageData = await prisma.package.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    })

    if (!packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json(packageData)
})

export const PUT = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
    const { id } = params

    const body = await req.json()
    const { 
      name,
      description,
      price,
      duration,
      maxTeachers,
      maxStudents,
      features,
      isActive
    } = body

    // Check if package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id }
    })

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existingPackage.name) {
      const nameExists = await prisma.package.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json({ error: 'Package name already exists' }, { status: 409 })
      }
    }

    // Update package
    const packageData = await prisma.package.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(duration && { duration: parseInt(duration) }),
        ...(maxTeachers && { maxTeachers: parseInt(maxTeachers) }),
        ...(maxStudents && { maxStudents: parseInt(maxStudents) }),
        ...(features && { features }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        subscriptions: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    })

    return NextResponse.json(packageData)
})

export const DELETE = route({ auth: 'SUPER_ADMIN' }, async (req, { params }) => {
    const { id } = params

    // Check if package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Check if package has active subscriptions
    if (existingPackage.subscriptions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete package with active subscriptions' 
      }, { status: 409 })
    }

    // Delete package
    await prisma.package.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Package deleted successfully' })
})
