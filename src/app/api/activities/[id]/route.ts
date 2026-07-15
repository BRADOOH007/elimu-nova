import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a specific activity
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activity = await prisma.activity.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({
      activity: {
        id: activity.id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'
      }
    });

  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

// PUT - Update an activity
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, action, description, metadata } = body;

    // Check if activity exists and belongs to user
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id
      }
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Update activity
    const activity = await prisma.activity.update({
      where: { id: (await params).id },
      data: {
        type,
        action,
        description,
        metadata: metadata || null
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({
      activity: {
        id: activity.id,
        type: activity.type,
        action: activity.action,
        description: activity.description,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'
      }
    });

  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an activity
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if activity exists and belongs to user
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id: (await params).id,
        userId: session.user.id
      }
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Delete activity
    await prisma.activity.delete({
      where: { id: (await params).id }
    });

    return NextResponse.json({ message: 'Activity deleted successfully' });

  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
