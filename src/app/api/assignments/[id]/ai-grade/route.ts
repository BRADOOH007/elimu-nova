import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIContent } from '@/lib/openrouter-ai';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = params.id;
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    // Get assignment and submission
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { student: { include: { user: true } } }
    });

    if (!assignment || !submission) {
      return NextResponse.json({ error: 'Assignment or submission not found' }, { status: 404 });
    }

    // Check if user is authorized (teacher or admin)
    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      });
      if (!teacher || teacher.id !== assignment.teacherId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare grading prompt
    let prompt = `You are an expert teacher grading a student assignment. Please grade the following submission carefully.

Assignment Title: ${assignment.title}
Assignment Description: ${assignment.description}
${assignment.answerKey ? `Answer Key: ${assignment.answerKey}` : ''}
${assignment.rubricId ? `Please use the provided rubric for grading.` : ''}

Student Submission:
${submission.content}

Please provide:
1. A numerical grade (0-100)
2. Detailed feedback for the student
3. A breakdown of scores by question (if applicable)
4. Specific suggestions for improvement

Format your response as a JSON object with the following structure:
{
  "grade": number,
  "feedback": string,
  "confidence": number (0-1),
  "questionScores": [
    {
      "questionId": string,
      "score": number,
      "feedback": string
    }
  ],
  "needsRevision": boolean,
  "revisionNotes": string
}

Make sure your response is valid JSON without any markdown formatting.`;

    const aiResponse = await generateAIContent(prompt, {
      maxTokens: 2000,
      temperature: 0.5
    });

    // Parse AI response
    let gradingResult;
    try {
      // Clean up the response if it has markdown code block
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      
      gradingResult = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      console.error('Failed to parse AI grading response:', parseError);
      // Fallback to simple grading
      gradingResult = {
        grade: 0,
        feedback: 'AI grading failed. Please grade manually.',
        confidence: 0,
        questionScores: [],
        needsRevision: true,
        revisionNotes: 'AI grading failed'
      };
    }

    // Update submission with AI grading results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: gradingResult.grade,
        feedback: gradingResult.feedback,
        status: 'GRADED',
        gradedAt: new Date(),
        isAiGraded: true,
        aiGradingMetadata: gradingResult,
        aiConfidence: gradingResult.confidence,
        questionScores: gradingResult.questionScores,
        needsRevision: gradingResult.needsRevision,
        revisionNotes: gradingResult.revisionNotes
      },
      include: {
        student: { include: { user: true } },
        assignment: true
      }
    });

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: 'Submission graded successfully by AI'
    });

  } catch (error) {
    console.error('AI Grading Error:', error);
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    );
  }
}
