import { NextResponse } from 'next/server'
import { getViolations } from '@/lib/ai-safety'

import { route, apiLogger } from '@/lib/api-middleware'
const log = apiLogger('super-admin/safety-log')

export const GET = route({ auth: 'SUPER_ADMIN' }, async (req, { user, params }) => {
  try {
    const violations = await getViolations(200)
    return NextResponse.json({ violations, total: violations.length })
  } catch (error) {
    log.error('Error fetching safety log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

})
