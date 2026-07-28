import { NextResponse } from 'next/server'
import { ImageBank } from '@/lib/image-bank'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (request, { user }) => {

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
      schoolId: user.schoolAdminId || undefined,
      limit: Math.min(limit, 50),
      offset,
    })

    return NextResponse.json(result)
})
