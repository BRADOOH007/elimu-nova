import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ImageBank } from '@/lib/image-bank'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await ImageBank.getFacets(session.user.schoolAdminId || undefined)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Image bank facets error:', error)
    return NextResponse.json({ error: 'Failed to get facets' }, { status: 500 })
  }
}
