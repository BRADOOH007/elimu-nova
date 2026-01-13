import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the assignment to check ownership and get subject/grade info
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        teacher: {
          include: { user: true }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify teacher owns the assignment
    if (assignment.teacher.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get teacher's rubrics
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Find rubrics that match or are compatible with the assignment
    const rubrics = await prisma.aIGeneratedContent.findMany({
      where: {
        teacherId: teacher.id,
        type: 'RUBRIC'
      },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        topic: true,
        createdAt: true,
        metadata: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse assignment content to try to extract subject/grade info
    let assignmentSubject = ''
    let assignmentGrade = ''
    
    try {
      const assignmentContent = JSON.parse(assignment.content)
      assignmentSubject = assignmentContent.subject || ''
      assignmentGrade = assignmentContent.grade || ''
    } catch (error) {
      // Assignment content might not be JSON, that's okay
    }

    // Categorize rubrics by compatibility
    const compatibleRubrics = rubrics.filter(rubric => 
      (assignmentSubject && rubric.subject.toLowerCase().includes(assignmentSubject.toLowerCase())) ||
      (assignmentGrade && rubric.grade.toLowerCase().includes(assignmentGrade.toLowerCase()))
    )

    const otherRubrics = rubrics.filter(rubric => 
      !compatibleRubrics.find(cr => cr.id === rubric.id)
    )

    return NextResponse.json({
      compatible: compatibleRubrics,
      other: otherRubrics,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        subject: assignmentSubject,
        grade: assignmentGrade
      }
    })

  } catch (error) {
    console.error('Error fetching available rubrics:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch available rubrics' 
    }, { status: 500 })
  }
}