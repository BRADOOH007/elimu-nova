// ──────────────────────────────────────────────────────────────
// Zod validation schemas for all CRUD operations.
// Used by route() wrapper via `schema` config option.
// Add new schemas here, then wire to any POST/PUT route:
//   export const POST = route({ auth: 'TEACHER', schema: MySchema }, handler)
// ──────────────────────────────────────────────────────────────

import { z } from 'zod'

export const CreateStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable().or(z.literal('')),
  classId: z.string().optional().nullable().or(z.literal('')),
  password: z.string().min(6).max(100).optional(),
  teacherId: z.string().optional().nullable().or(z.literal('')),
  subjects: z.array(z.string()).optional(),
  parentFirstName: z.string().optional().or(z.literal('')),
  parentLastName: z.string().optional().or(z.literal('')),
  parentEmail: z.string().optional().or(z.literal('')),
  parentPhone: z.string().optional().or(z.literal('')),
})

export const UpdateStudentSchema = CreateStudentSchema.partial()

export const CreateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100).trim(),
  grade: z.string().min(1).max(50).trim(),
  subject: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
})

export const UpdateClassSchema = CreateClassSchema.partial()

export const CreateTeacherSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal('')),
  subjects: z.array(z.string()).optional(),
})

export const UpdateTeacherSchema = CreateTeacherSchema.partial()

export const CreateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(2000).optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
  subject: z.string().max(100).optional().or(z.literal('')),
  grade: z.string().max(50).optional().or(z.literal('')),
  dueDate: z.string().datetime(),
  lessonPlanId: z.string().optional().or(z.literal('')),
  classId: z.string().optional().or(z.literal('')),
  studentIds: z.array(z.string()).optional(),
  isTimed: z.boolean().optional(),
  timeLimit: z.number().int().min(1).max(480).optional(),
  aiGradeable: z.boolean().optional(),
  answerKey: z.string().optional().or(z.literal('')),
})

export const SchemeOfWorkSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  subject: z.string().min(1).max(100).trim(),
  grade: z.string().min(1).max(50).trim(),
  term: z.string().min(1).max(50).trim(),
  year: z.number().int().min(2020).max(2100).optional(),
  weeks: z.number().int().min(1).max(52).optional(),
})

export const LessonPlanSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  subject: z.string().min(1).max(100).trim(),
  grade: z.string().min(1).max(50).trim(),
  topic: z.string().min(1).max(200).trim(),
  duration: z.number().int().min(5).max(240),
  objectives: z.array(z.string()).min(1).optional(),
  prerequisites: z.array(z.string()).optional(),
})

export const ParentSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal('')),
  studentIds: z.array(z.string()).min(1, 'At least one student is required'),
})
