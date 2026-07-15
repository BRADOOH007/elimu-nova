import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIContentType } from '@prisma/client';

export async function GET(
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

    const rubric = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: (await params).id,
        teacherId: teacher.id,
        type: AIContentType.RUBRIC
      }
    });

    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    // Parse the content
    const rubricData = typeof rubric.content === 'string' 
      ? JSON.parse(rubric.content) 
      : rubric.content;

    return NextResponse.json({
      success: true,
      rubric: {
        ...rubric,
        rubricData
      }
    });

  } catch (error) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubric' },
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

    const { 
      title, 
      description, 
      subject, 
      grade, 
      totalPoints, 
      performanceLevels, 
      criteria, 
      metadata 
    } = await req.json();

    // Check if rubric exists and belongs to teacher
    const existingRubric = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: (await params).id,
        teacherId: teacher.id,
        type: AIContentType.RUBRIC
      }
    });

    if (!existingRubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    // Create updated rubric content
    const rubricContent = {
      title: title || existingRubric.title,
      description: description || '',
      subject: subject || existingRubric.subject,
      grade: grade || existingRubric.grade,
      totalPoints: totalPoints || 100,
      performanceLevels: performanceLevels || [],
      criteria: criteria || [],
      metadata: { ...(existingRubric.metadata as Record<string, any> || {}), ...metadata }
    };

    const updatedRubric = await prisma.aIGeneratedContent.update({
      where: { id: (await params).id },
      data: {
        title: title || existingRubric.title,
        content: JSON.stringify(rubricContent),
        subject: subject || existingRubric.subject,
        grade: grade || existingRubric.grade,
        topic: title || existingRubric.topic,
        metadata: {
          totalPoints,
          performanceLevels,
          criteria,
          ...metadata
        }
      }
    });

    return NextResponse.json({
      success: true,
      rubric: updatedRubric
    });

  } catch (error) {
    console.error('Error updating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to update rubric' },
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

    // Check if rubric exists and belongs to teacher
    const existingRubric = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: (await params).id,
        teacherId: teacher.id,
        type: AIContentType.RUBRIC
      }
    });

    if (!existingRubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    await prisma.aIGeneratedContent.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({
      success: true,
      message: 'Rubric deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: 'Failed to delete rubric' },
      { status: 500 }
    );
  }
}
