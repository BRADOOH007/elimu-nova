import { describe, it, expect } from 'vitest'
import { CreateStudentSchema, CreateClassSchema, CreateTeacherSchema, ParentSchema, SchemeOfWorkSchema, LessonPlanSchema } from '@/lib/validators'

describe('CreateStudentSchema', () => {
  it('accepts valid student data', () => {
    const data = CreateStudentSchema.parse({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' })
    expect(data.firstName).toBe('John')
    expect(data.lastName).toBe('Doe')
  })

  it('rejects missing first name', () => {
    expect(() => CreateStudentSchema.parse({ lastName: 'Doe' })).toThrow()
  })

  it('rejects empty first name', () => {
    expect(() => CreateStudentSchema.parse({ firstName: '', lastName: 'Doe' })).toThrow()
  })

  it('accepts minimal data (just name)', () => {
    const data = CreateStudentSchema.parse({ firstName: 'Jane', lastName: 'Smith' })
    expect(data.firstName).toBe('Jane')
  })

  it('trims whitespace from names', () => {
    const data = CreateStudentSchema.parse({ firstName: '  Bob  ', lastName: '  Jones  ' })
    expect(data.firstName).toBe('Bob')
    expect(data.lastName).toBe('Jones')
  })

  it('rejects invalid email format', () => {
    expect(() => CreateStudentSchema.parse({ firstName: 'Test', lastName: 'User', email: 'not-an-email' })).toThrow()
  })

  it('accepts optional phone field', () => {
    const data = CreateStudentSchema.parse({ firstName: 'A', lastName: 'B', phone: '+254712345678' })
    expect(data.phone).toBe('+254712345678')
  })
})

describe('CreateClassSchema', () => {
  it('accepts valid class data', () => {
    const data = CreateClassSchema.parse({ name: 'Grade 8A', grade: 'Grade 8', subject: 'Mathematics' })
    expect(data.name).toBe('Grade 8A')
  })

  it('rejects missing grade', () => {
    expect(() => CreateClassSchema.parse({ name: 'Grade 8A', subject: 'Math' })).toThrow()
  })

  it('rejects empty name', () => {
    expect(() => CreateClassSchema.parse({ name: '', grade: 'Grade 8', subject: 'Math' })).toThrow()
  })
})

describe('CreateTeacherSchema', () => {
  it('accepts valid teacher data', () => {
    const data = CreateTeacherSchema.parse({ firstName: 'Jane', lastName: 'Teacher', email: 'jane@school.com' })
    expect(data.email).toBe('jane@school.com')
  })

  it('rejects invalid email', () => {
    expect(() => CreateTeacherSchema.parse({ firstName: 'J', lastName: 'T', email: 'bad' })).toThrow()
  })
})

describe('ParentSchema', () => {
  it('accepts valid parent with students', () => {
    const data = ParentSchema.parse({ firstName: 'Parent', lastName: 'One', email: 'p@example.com', studentIds: ['s1', 's2'] })
    expect(data.studentIds).toHaveLength(2)
  })

  it('rejects parent without student IDs', () => {
    expect(() => ParentSchema.parse({ firstName: 'P', lastName: 'T', email: 'p@t.com', studentIds: [] })).toThrow()
  })
})

describe('SchemeOfWorkSchema', () => {
  it('accepts valid scheme data', () => {
    const data = SchemeOfWorkSchema.parse({ title: 'Term 1 Math', subject: 'Mathematics', grade: 'Grade 8', term: 'Term 1' })
    expect(data.title).toBe('Term 1 Math')
  })
})

describe('LessonPlanSchema', () => {
  it('accepts valid lesson plan data', () => {
    const data = LessonPlanSchema.parse({ title: 'Algebra Intro', subject: 'Math', grade: 'Grade 8', topic: 'Linear Equations', duration: 40 })
    expect(data.duration).toBe(40)
  })

  it('rejects duration less than 5', () => {
    expect(() => LessonPlanSchema.parse({ title: 'T', subject: 'S', grade: 'G', topic: 'T', duration: 2 })).toThrow()
  })

  it('rejects duration more than 240', () => {
    expect(() => LessonPlanSchema.parse({ title: 'T', subject: 'S', grade: 'G', topic: 'T', duration: 300 })).toThrow()
  })
})
