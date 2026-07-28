import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findFirst({
    where: { userId: user.id },
    select: { schoolId: true }
  })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    const setting = await prisma.schoolSettings.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      },
      include: {
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    return NextResponse.json(setting)
})

export const PUT = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
    const body = await req.json()
    const { 
      value, 
      type,
      category,
      description,
      isEditable
    } = body

    // Get school admin's school ID
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      select: { schoolId: true }
    })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if setting exists and belongs to this school
    const existingSetting = await prisma.schoolSettings.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingSetting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    // Check if setting is editable
    if (!existingSetting.isEditable) {
      return NextResponse.json({ error: 'This setting cannot be edited' }, { status: 400 })
    }

    // Update setting
    const setting = await prisma.schoolSettings.update({
      where: { id },
      data: {
        ...(value !== undefined && { value: typeof value === 'string' ? value : JSON.stringify(value) }),
        ...(type && { type }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(isEditable !== undefined && { isEditable }),
        updatedBy: user.id
      },
      include: {
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(setting)
})

export const DELETE = route({ auth: 'SCHOOL_ADMIN' }, async (req, { user, params }) => {
  const { id } = await params
  const schoolAdmin = await prisma.schoolAdmin.findFirst({
    where: { userId: user.id },
    select: { schoolId: true }
  })
    
    if (!schoolAdmin) {
      return NextResponse.json({ error: 'School admin not found' }, { status: 404 })
    }

    // Check if setting exists and belongs to this school
    const existingSetting = await prisma.schoolSettings.findFirst({
      where: {
        id,
        schoolId: schoolAdmin.schoolId
      }
    })

    if (!existingSetting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    // Delete setting
    await prisma.schoolSettings.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Setting deleted successfully' })
})
