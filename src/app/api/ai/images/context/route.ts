import { NextResponse } from 'next/server'
import { ImageBank } from '@/lib/image-bank'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (request, { user }) => {

    const { searchParams } = new URL(request.url)
    const contextType = searchParams.get('contextType')
    const contextId = searchParams.get('contextId')

    if (!contextType || !contextId) {
      return NextResponse.json({ error: 'contextType and contextId are required' }, { status: 400 })
    }

    const images = await ImageBank.getContextImages(contextType, contextId)
    return NextResponse.json(images)
})
