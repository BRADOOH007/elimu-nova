import { NextResponse } from 'next/server'
import ImageStorageService from '@/lib/image-storage-service'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (request, { user }) => {

    const stats = await ImageStorageService.getImageStats(
      user.id,
      (user as any).school?.id
    )

    return NextResponse.json(stats)

})