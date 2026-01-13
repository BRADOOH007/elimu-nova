import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ImageStorageService from '@/lib/image-storage-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { usageType, context } = await request.json()

    if (!usageType) {
      return NextResponse.json({ error: 'Usage type is required' }, { status: 400 })
    }

    await ImageStorageService.trackImageUsage(
      params.id,
      session.user.id,
      usageType,
      context
    )

    return NextResponse.json({ success: true, message: 'Usage tracked successfully' })

  } catch (error) {
    console.error('Error tracking image usage:', error)
    return NextResponse.json(
      { 
        error: 'Failed to track image usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}