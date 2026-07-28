import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';
import bcrypt from 'bcryptjs';
import { encryptPassword } from '@/lib/password-encryption';

/** Extract any real address from the combined address field */
function extractRealAddress(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split('\n---\n');
  return parts.length > 1 ? parts[1] : null;
}

/** Build the address field with encrypted password */
function buildAddressWithPassword(plainPassword: string, realAddress: string | null): string {
  const encrypted = encryptPassword(plainPassword);
  return realAddress ? `${encrypted}\n---\n${realAddress}` : encrypted;
}

export const POST = route({ auth: 'TEACHER' }, async (req, { user, params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const { password, generatePassword, resetPassword } = body;

    // Get teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Check if student exists and belongs to teacher
    const student = await prisma.student.findUnique({
      where: { 
        id: id,
        teacherId: teacher.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            address: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    // Use provided password or generate one
    let finalPassword = password;
    if (generatePassword || resetPassword || !finalPassword) {
      const adjectives = ['Blue', 'Green', 'Happy', 'Brave', 'Swift', 'Bright', 'Calm', 'Bold'];
      const nouns = ['Lion', 'Star', 'River', 'Eagle', 'Mountain', 'Sunrise', 'Ocean', 'Forest'];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const num = Math.floor(100 + Math.random() * 900);
      finalPassword = `${adj}${noun}${num}`;
    }

    if (finalPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 12);

    // Preserve any real address, update stored password
    const realAddress = extractRealAddress(student.user.address);
    const newAddress = buildAddressWithPassword(finalPassword, realAddress);

    // Update user with new password and stored plain password
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        password: hashedPassword,
        address: newAddress
      }
    });

    const credentials = {
      username: student.user.email,
      password: finalPassword
    };

    return NextResponse.json({
      credentials,
      password: finalPassword,
      message: 'Student password updated successfully'
    });

  } catch (error) {
    console.error('Error generating student credentials:', error);
    return NextResponse.json({ error: 'Failed to generate credentials' }, { status: 500 });
  }
});
