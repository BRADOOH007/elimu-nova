import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import { generateAIContent } from '@/lib/openrouter-ai';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const MAX_SIZE_MB = 20;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Failed to parse upload data' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;
    const subject = (formData.get('subject') as string) || 'General';
    const grade = (formData.get('grade') as string) || 'General';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted: PDF, Word (.doc/.docx), plain text` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `elimunova/exam-documents`,
          resource_type: 'raw',
          public_id: `exam_${session.user.id}_${Date.now()}`,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    // Extract text (for text files)
    let extractedText: string | null = null;
    if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    }

    // Prepare AI prompt to parse exam questions
    let prompt = `You are an expert exam parser. Please parse the following exam document and extract all questions.

Subject: ${subject}
Grade: ${grade}
Document: ${file.name}

${extractedText ? `Document Content:\n${extractedText}` : 'Please use the uploaded document to extract questions.'}

Please extract:
1. All questions from the exam
2. For each question, identify:
   - Question type (MCQ, True/False, Short Answer, Essay, etc.)
   - Question text
   - Options (if MCQ)
   - Correct answer (if available)
   - Point value (if available)

Format your response as a JSON object with the following structure:
{
  "title": "Exam Title",
  "subject": "${subject}",
  "grade": "${grade}",
  "questions": [
    {
      "id": "q1",
      "type": "MCQ",
      "questionText": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "points": 10
    }
  ],
  "totalPoints": 100
}

Make sure your response is valid JSON without any markdown formatting.`;

    const aiResponse = await generateAIContent(prompt, {
      maxTokens: 3000,
      temperature: 0.3
    });

    // Parse AI response
    let parsedExam;
    try {
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
      
      parsedExam = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse exam document',
        aiResponse: aiResponse
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      exam: parsedExam,
      documentUrl: uploadResult.secure_url,
      message: 'Exam document parsed successfully'
    });

  } catch (error) {
    console.error('Document parsing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse document' },
      { status: 500 }
    );
  }
}
