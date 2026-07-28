import { NextResponse } from 'next/server'
import ImageStorageService from '@/lib/image-storage-service'
import { route } from '@/lib/api-middleware'

export const POST = route({}, async (request, { user, params }) => {

    const { usageType, context } = await request.json()

    if (!usageType) {
      return NextResponse.json({ error: 'Usage type is required' }, { status: 400 })
    }

    await ImageStorageService.trackImageUsage(
      params.id,
      user.id,
      usageType,
      context
    )

    return NextResponse.json({ success: true, message: 'Usage tracked successfully' })

})