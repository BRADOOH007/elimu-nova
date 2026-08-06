import { NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/openai-service';
import { route } from '@/lib/api-middleware';

export const POST = route({}, async (req, { user }) => {
    const { subject, grade, questions } = await req.json();
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions to grade' }, { status: 400 });
    }

    const prompt = `You are an expert ${grade} ${subject} teacher. Grade the following student answers against the correct answers. For each question, determine if the student's answer is essentially correct (content-wise, not just exact string match). Be generous — accept synonyms and rephrasing.

Return a JSON array with objects: { questionId: number, isCorrect: boolean, feedback: string }

Questions:
${JSON.stringify(questions, null, 2)}

Rules:
- Mark as correct if the student demonstrated understanding of the concept
- For numerical answers, accept alternative correct values
- For explanations, accept if the core idea is conveyed
- Provide brief, encouraging feedback for each answer`;

    const content = await OpenAIService.generateLongContent(
      [
        { role: 'system', content: 'You are an AI exam grader for CBC curriculum. Return ONLY valid JSON.' },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 2000, temperature: 0.3 }
    );

    let results: Array<{ questionId: number; isCorrect: boolean; feedback: string }> = [];
    try {
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) results = parsed;
    } catch (e) {
      console.warn('[Grade] Failed to parse AI grading JSON:', e)
      results = questions.map((q: any) => ({
        questionId: q.id,
        isCorrect: q.studentAnswer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim(),
        feedback: 'Nice effort — keep practising!',
      }));
    }

    if (results.length === 0 && questions.length > 0) {
      results = questions.map((q: any) => ({
        questionId: q.id,
        isCorrect: q.studentAnswer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim(),
        feedback: 'Nice effort — keep practising!',
      }));
    }

    const totalScore = results.filter(r => r.isCorrect).length;
    const totalQuestions = results.length;
    const feedback = totalQuestions > 0
      ? `Your answers were reviewed! You got ${totalScore} of ${totalQuestions} correct (${Math.round((totalScore / totalQuestions) * 100)}%). ${totalScore === totalQuestions ? 'Perfect score — brilliant work!' : 'Keep going — you are improving every day!'}`
      : 'Your answers were received. Keep up the great effort!';

    return NextResponse.json({ results, feedback });
})
