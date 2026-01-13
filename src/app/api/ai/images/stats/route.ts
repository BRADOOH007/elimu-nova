import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ImageStorageService from '@/lib/image-storage-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await ImageStorageService.getImageStats(
      session.user.id,
      session.user.school?.id
    )

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching AI image stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch AI image statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}