import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma, withRetry } from '@/lib/prisma';
import { route } from '@/lib/api-middleware';

export const GET = route({ auth: 'TEACHER' }, async (req, { user }) => {

    // Get or create teacher profile
    let teacher = await withRetry(() => prisma.teacher.findUnique({
      where: { userId: user.id }
    }));

    if (!teacher) {
      teacher = await prisma.teacher.create({ data: { userId: user.id } });
    }

    // Get lesson plans for this teacher
    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        teacherId: teacher.id
      },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        content: true,
        isShared: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      lessonPlans,
      total: lessonPlans.length
    });
})

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {

    // Get or create teacher profile
    let teacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    });

    if (!teacher) {
      teacher = await prisma.teacher.create({ data: { userId: user.id } });
    }

    const body = await req.json();
    const { title, subject, grade, content } = body;

    // Validate required fields
    if (!title || !subject || !grade || !content) {

      return NextResponse.json({ 
        error: 'Missing required fields: title, subject, grade, and content are required' 
      }, { status: 400 });
    }

    // Convert content object to JSON string if it's an object
    const contentString = typeof content === 'object' ? JSON.stringify(content) : content;

    // ── Dedup: don't save duplicate generations ──
    // If the same teacher already has a lesson plan with the exact same
    // title + subject + grade + content, return the existing one instead
    // of creating a duplicate. Content is normalized to a stable hash.
    const contentHash = crypto.createHash('sha256').update(contentString).digest('hex').slice(0, 24);
    const existing = await prisma.lessonPlan.findFirst({
      where: { teacherId: teacher.id, subject, grade, title },
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true },
    });

    if (existing) {
      let existingContent = existing.content;
      let existingHash = '';
      try {
        const parsed = typeof existing.content === 'string' ? JSON.parse(existing.content) : existing.content;
        existingContent = parsed;
        existingHash = crypto.createHash('sha256').update(
          typeof existing.content === 'string' ? existing.content : JSON.stringify(existing.content)
        ).digest('hex').slice(0, 24);
      } catch {
        existingHash = crypto.createHash('sha256').update(String(existing.content)).digest('hex').slice(0, 24);
      }

      // If content matches exactly, return existing to avoid duplicates
      if (existingHash === contentHash) {
        return NextResponse.json({
          success: true,
          existing: true,
          lessonPlan: existing,
          message: 'Lesson plan already exists — no duplicate created'
        });
      }
    }

    // Create lesson plan
    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        title,
        subject,
        grade,
        content: contentString,
        teacherId: teacher.id
      },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      lessonPlan,
      message: 'Lesson plan created successfully'
    });
})
