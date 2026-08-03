import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/openrouter-ai';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { route } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { saveFileLocally } from '@/lib/local-storage';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const MAX_SIZE_MB = 20;

export const POST = route({ auth: 'TEACHER' }, async (req, { user }) => {
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

    // Upload to Supabase Storage
    const docPath = `exam-documents/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    let documentUrl: string;
    if (!supabaseAdmin) {
      const localUrl = await saveFileLocally('teacher-documents', docPath, buffer);
      if (!localUrl) {
        return NextResponse.json({ error: 'Upload failed: could not save file' }, { status: 500 });
      }
      documentUrl = localUrl;
    } else {
      const { data: docUpload, error: docError } = await supabaseAdmin.storage
        .from('teacher-documents')
        .upload(docPath, buffer, { contentType: file.type, upsert: true });
      if (docError) {
        console.error('Supabase upload error:', docError);
        return NextResponse.json({ error: `Upload failed: ${docError.message}` }, { status: 500 });
      }
      const { data: docUrlData } = supabaseAdmin.storage.from('teacher-documents').getPublicUrl(docUpload.path);
      documentUrl = docUrlData.publicUrl;
    }

    // Extract text from uploaded document
    let extractedText: string | null = null;
    if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } else if (file.type === 'application/pdf') {
      try {
        const pdf = new PDFParse({ data: buffer });
        const result = await pdf.getText({});
        extractedText = result.text;
      } catch (parseErr) {
        console.warn('PDF text extraction failed:', parseErr);
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value;
      } catch (parseErr) {
        console.warn('Word document extraction failed:', parseErr);
      }
    }

    // Truncate extracted text to avoid exceeding token limits
    if (extractedText && extractedText.length > 4000) {
      extractedText = extractedText.slice(0, 4000) + '\n... [truncated]';
    }

    // Prepare AI prompt to parse exam questions
    let prompt = `You are an expert exam parser. Please parse the following exam document and extract all questions.

Subject: ${subject}
Grade: ${grade}
Document: ${file.name}

Document Content:
${extractedText || '[No text could be extracted from this document type]'}

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
      documentUrl,
      message: 'Exam document parsed successfully'
    });

})
