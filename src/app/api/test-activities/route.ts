import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'

export const GET = route({ auth: 'none' }, async (req) => {
  return NextResponse.json({
    message: 'Activities API is working',
    timestamp: new Date().toISOString(),
    status: 'ok'
  })
})
