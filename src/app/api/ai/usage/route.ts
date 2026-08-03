import { NextResponse } from 'next/server'
import { route } from '@/lib/api-middleware'
import { getAIUsageStats } from '@/lib/ai-usage'

export const dynamic = 'force-dynamic'

export const GET = route({ auth: ['TEACHER', 'STUDENT', 'PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] }, async (_req, { user }) => {
  const stats = await getAIUsageStats(user.id)
  return NextResponse.json(stats)
})
