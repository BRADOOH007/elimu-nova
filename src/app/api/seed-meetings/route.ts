import { NextResponse } from 'next/server';
import { seedMeetings } from '@/lib/seed-meetings';
import { route } from '@/lib/api-middleware';

export const POST = route({}, async (req, { user }) => {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  await seedMeetings();

  return NextResponse.json({ message: 'Meetings seeded successfully' });
})
