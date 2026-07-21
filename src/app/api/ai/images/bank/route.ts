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
    const subject = searchParams.get('subject') || undefined
    const grade = searchParams.get('grade') || undefined
    const topic = searchParams.get('topic') || undefined
    const prompt = searchParams.get('prompt') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await ImageBank.search({
      subject,
      grade,
      topic,
      prompt,
      schoolId: session.user.schoolAdminId || undefined,
      limit: Math.min(limit, 50),
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Image bank search error:', error)
    return NextResponse.json({ error: 'Failed to search image bank' }, { status: 500 })
  }
}
