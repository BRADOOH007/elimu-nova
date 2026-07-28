import { NextResponse } from 'next/server';
import { fixPlainTextPasswords } from '@/lib/fix-passwords';
import { route } from '@/lib/api-middleware';

export const POST = route({ auth: 'SUPER_ADMIN' }, async (req, { user }) => {

    // Only allow in development or for super admin
    if (process.env.NODE_ENV !== 'development' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }

    await fixPlainTextPasswords();

    return NextResponse.json({ message: 'Passwords fixed successfully' });

})
