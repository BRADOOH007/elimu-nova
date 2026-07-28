import { NextResponse } from 'next/server'
import ImageStorageService from '@/lib/image-storage-service'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (request, { user }) => {

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const type = searchParams.get('type')
    const topic = searchParams.get('topic')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('📋 Gallery API: Query params:', { studentId, type, topic, limit, offset })

    // Get user's images
    console.log('🔍 Gallery API: Fetching images for user:', user.id)
    const result = await ImageStorageService.getUserImages(user.id, {
      studentId: studentId || undefined,
      type: type || undefined,
      topic: topic || undefined,
      limit,
      offset
    })

    console.log('✅ Gallery API: Found images:', result.images?.length || 0)
    return NextResponse.json(result)
})

export const DELETE = route({}, async (request, { user }) => {

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    const deleted = await ImageStorageService.deleteImage(imageId, user.id)

    if (!deleted) {
      return NextResponse.json({ error: 'Image not found or not authorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Image deleted successfully' })
})