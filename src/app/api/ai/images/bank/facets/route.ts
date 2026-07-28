import { NextResponse } from 'next/server'
import { ImageBank } from '@/lib/image-bank'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (request, { user }) => {

    const result = await ImageBank.getFacets(user.schoolAdminId || undefined)
    return NextResponse.json(result)
})
