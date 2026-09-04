/**
 * GET /api/senior-student/profile  → the senior student's profile/onboarding fields
 * PATCH /api/senior-student/profile → update the senior student's profile fields
 *
 * Writes the SeniorStudent onboarding fields (ageBracket, priorEducation,
 * englishLevel, goals, selectedGEDSubjects) that the dashboard, senior-teacher
 * learners view, and super-admin panel already read but that previously had no
 * endpoint to persist them.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'
import { z } from 'zod'
import { GED_SUBJECTS } from '@/lib/constants/ged'

const AGE_BRACKETS = ['under-18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const ENGLISH_LEVELS = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Native']
const EDUCATION_LEVELS = [
  'Some primary school',
  'Some secondary school',
  'Completed secondary (O-Level / High School)',
  'Some college / vocational training',
  'College / university degree',
]

const schema = z.object({
  ageBracket: z.string().optional().nullable(),
  priorEducation: z.string().optional().nullable(),
  englishLevel: z.string().optional().nullable(),
  goals: z.array(z.string()).optional(),
  selectedGEDSubjects: z.array(z.string()).optional(),
})

export const GET = route({ auth: 'SENIOR_STUDENT' }, async (_req, { user }) => {
  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })
  return NextResponse.json({
    profile: {
      ageBracket: senior.ageBracket,
      priorEducation: senior.priorEducation,
      englishLevel: senior.englishLevel,
      goals: senior.goals ?? [],
      selectedGEDSubjects: senior.selectedGEDSubjects ?? [],
    },
    options: { ageBrackets: AGE_BRACKETS, englishLevels: ENGLISH_LEVELS, educationLevels: EDUCATION_LEVELS },
  })
})

export const PATCH = route({ auth: 'SENIOR_STUDENT', schema }, async (_req, { user, body }) => {
  const data = body as z.infer<typeof schema>

  let senior = await prisma.seniorStudent.findUnique({ where: { userId: user.id } })
  if (!senior) senior = await prisma.seniorStudent.create({ data: { userId: user.id } })

  const update: any = {}
  if (data.ageBracket !== undefined) update.ageBracket = data.ageBracket ?? null
  if (data.priorEducation !== undefined) update.priorEducation = data.priorEducation ?? null
  if (data.englishLevel !== undefined) update.englishLevel = data.englishLevel ?? null
  if (data.goals !== undefined) update.goals = data.goals
  if (data.selectedGEDSubjects !== undefined) {
    const subjects = data.selectedGEDSubjects.filter((s) => GED_SUBJECTS.includes(s as any))
    update.selectedGEDSubjects = subjects
  }

  const saved = await prisma.seniorStudent.update({ where: { id: senior.id }, data: update })

  return NextResponse.json({
    updated: true,
    profile: {
      ageBracket: saved.ageBracket,
      priorEducation: saved.priorEducation,
      englishLevel: saved.englishLevel,
      goals: saved.goals ?? [],
      selectedGEDSubjects: saved.selectedGEDSubjects ?? [],
    },
  })
})
