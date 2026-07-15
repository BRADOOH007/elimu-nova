import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const content = await prisma.aIGeneratedContent.findUnique({
      where: { id: (await params).id },
      include: {
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        sharedWithStudents: {
          include: {
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        sharedWithClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true
              }
            }
          }
        },
        _count: {
          select: {
            sharedWithStudents: true,
            sharedWithClasses: true
          }
        }
      }
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Error fetching AI content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI content' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher information
    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const { title, content, subject, grade, topic, metadata } = await req.json();

    // Check if content exists and belongs to teacher
    const existingContent = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: (await params).id,
        teacherId: teacher.id
      }
    });

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const updatedContent = await prisma.aIGeneratedContent.update({
      where: { id: (await params).id },
      data: {
        title: title || existingContent.title,
        content: content || existingContent.content,
        subject: subject || existingContent.subject,
        grade: grade || existingContent.grade,
        topic: topic || existingContent.topic,
        metadata: metadata || existingContent.metadata
      },
      include: {
        _count: {
          select: {
            sharedWithStudents: true,
            sharedWithClasses: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      content: updatedContent
    });

  } catch (error) {
    console.error('Error updating AI content:', error);
    return NextResponse.json(
      { error: 'Failed to update AI content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher information
    const teacher = await prisma.teacher.findFirst({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Check if content exists and belongs to teacher
    const existingContent = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: (await params).id,
        teacherId: teacher.id
      }
    });

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    await prisma.aIGeneratedContent.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting AI content:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI content' },
      { status: 500 }
    );
  }
}
