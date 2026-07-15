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

    // Find the PowerPoint
    const powerpoint = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: (await params).id,
        teacherId: teacher.id,
        type: AIContentType.POWERPOINT
      },
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
        }
      }
    });

    if (!powerpoint) {
      return NextResponse.json({ error: 'PowerPoint not found' }, { status: 404 });
    }

    // Parse content
    let parsedContent;
    try {
      parsedContent = JSON.parse(powerpoint.content);
    } catch (error) {
      console.error('Error parsing PowerPoint content:', error);
      parsedContent = {
        title: powerpoint.title,
        slides: [],
        metadata: {}
      };
    }

    return NextResponse.json({
      success: true,
      powerpoint: {
        id: powerpoint.id,
        title: powerpoint.title,
        subject: powerpoint.subject,
        grade: powerpoint.grade,
        topic: powerpoint.topic,
        content: parsedContent,
        metadata: powerpoint.metadata,
        isShared: powerpoint.isShared,
        createdAt: powerpoint.createdAt,
        updatedAt: powerpoint.updatedAt,
        teacher: powerpoint.teacher
      }
    });

  } catch (error) {
    console.error('Error fetching PowerPoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PowerPoint' },
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
      topic,
      duration,
      slideCount,
      slides, 
      metadata 
    } = await req.json();

    if (!title || !subject || !grade || !topic || !slides || slides.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if PowerPoint exists and belongs to teacher
    const existingPowerPoint = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: (await params).id,
        teacherId: teacher.id,
        type: AIContentType.POWERPOINT
      }
    });

    if (!existingPowerPoint) {
      return NextResponse.json({ error: 'PowerPoint not found' }, { status: 404 });
    }

    // Create updated PowerPoint content as JSON
    const powerpointContent = {
      title,
      description: description || '',
      subject,
      grade,
      topic,
      duration: duration || 45,
      slideCount: slideCount || 10,
      slides: slides || [],
      metadata: metadata || {}
    };

    // Update the PowerPoint
    const updatedPowerPoint = await prisma.aIGeneratedContent.update({
      where: { id: (await params).id },
      data: {
        title,
        content: JSON.stringify(powerpointContent),
        subject,
        grade,
        topic,
        metadata: {
          duration,
          slideCount,
          slides,
          ...metadata,
          updatedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      powerpoint: {
        id: updatedPowerPoint.id,
        title: updatedPowerPoint.title,
        subject: updatedPowerPoint.subject,
        grade: updatedPowerPoint.grade,
        topic: updatedPowerPoint.topic,
        content: JSON.parse(updatedPowerPoint.content),
        metadata: updatedPowerPoint.metadata,
        createdAt: updatedPowerPoint.createdAt,
        updatedAt: updatedPowerPoint.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating PowerPoint:', error);
    return NextResponse.json(
      { error: 'Failed to update PowerPoint' },
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

    // Check if PowerPoint exists and belongs to teacher
    const existingPowerPoint = await prisma.aIGeneratedContent.findFirst({
      where: {
        id: (await params).id,
        teacherId: teacher.id,
        type: AIContentType.POWERPOINT
      }
    });

    if (!existingPowerPoint) {
      return NextResponse.json({ error: 'PowerPoint not found' }, { status: 404 });
    }

    // Delete the PowerPoint
    await prisma.aIGeneratedContent.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({
      success: true,
      message: 'PowerPoint deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting PowerPoint:', error);
    return NextResponse.json(
      { error: 'Failed to delete PowerPoint' },
      { status: 500 }
    );
  }
}
