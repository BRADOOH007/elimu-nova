import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ImageStorageService from '@/lib/image-storage-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Gallery API: Getting session...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ Gallery API: No session or user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Gallery API: User authenticated:', session.user.id, session.user.email)

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const type = searchParams.get('type')
    const topic = searchParams.get('topic')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('📋 Gallery API: Query params:', { studentId, type, topic, limit, offset })

    // Get user's images
    console.log('🔍 Gallery API: Fetching images for user:', session.user.id)
    const result = await ImageStorageService.getUserImages(session.user.id, {
      studentId: studentId || undefined,
      type: type || undefined,
      topic: topic || undefined,
      limit,
      offset
    })

    console.log('✅ Gallery API: Found images:', result.images?.length || 0)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching AI images:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch AI images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    const deleted = await ImageStorageService.deleteImage(imageId, session.user.id)

    if (!deleted) {
      return NextResponse.json({ error: 'Image not found or not authorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Image deleted successfully' })

  } catch (error) {
    console.error('Error deleting AI image:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete AI image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}