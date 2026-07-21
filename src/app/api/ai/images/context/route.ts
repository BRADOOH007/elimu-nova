import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ImageBank } from '@/lib/image-bank'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contextType = searchParams.get('contextType')
    const contextId = searchParams.get('contextId')

    if (!contextType || !contextId) {
      return NextResponse.json({ error: 'contextType and contextId are required' }, { status: 400 })
    }

    const images = await ImageBank.getContextImages(contextType, contextId)
    return NextResponse.json(images)
  } catch (error) {
    console.error('Context images error:', error)
    return NextResponse.json({ error: 'Failed to get context images' }, { status: 500 })
  }
}
