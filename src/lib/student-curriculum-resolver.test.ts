import { describe, it, expect } from 'vitest'
import {
  resolveEffectiveCurriculum,
  isCBCForStudent,
  advanceGradeByYears,
  getYearsElapsedSince,
  resolveStudentGradeAndCurriculum,
} from '@/lib/student-curriculum-resolver'

const GRADES_CBC = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

describe('resolveEffectiveCurriculum (country-aware, never CBC outside Kenya)', () => {
  it('Kenya with no curriculum -> cbc', () => {
    expect(resolveEffectiveCurriculum('KE', '')).toBe('cbc')
    expect(resolveEffectiveCurriculum('KE', null)).toBe('cbc')
  })
  it('Unknown/empty country -> cbc', () => {
    expect(resolveEffectiveCurriculum('', '')).toBe('cbc')
    expect(resolveEffectiveCurriculum(undefined, undefined)).toBe('cbc')
  })
  it('US with no curriculum -> common-core (not cbc)', () => {
    const cur = resolveEffectiveCurriculum('US', '')
    expect(cur).toBe('common-core')
    expect(cur).not.toBe('cbc')
  })
  it('US with explicit cbc -> still NOT cbc (no CBC leak, country default)', () => {
    expect(resolveEffectiveCurriculum('US', 'cbc')).not.toBe('cbc')
    expect(resolveEffectiveCurriculum('US', 'cbc')).toBe('common-core')
  })
  it('preserves a valid explicit non-CBC curriculum for seniors (ged-hiset)', () => {
    expect(resolveEffectiveCurriculum('US', 'ged-hiset')).toBe('ged-hiset')
    expect(resolveEffectiveCurriculum('US', 'common-core')).toBe('common-core')
    expect(resolveEffectiveCurriculum('US', 'general')).toBe('general')
    expect(isCBCForStudent('US', 'ged-hiset')).toBe(false)
  })
  it('GB -> cambridge, NG -> nerdc, IN -> cbse, ZA -> caps', () => {
    expect(resolveEffectiveCurriculum('GB', '')).toBe('cambridge')
    expect(resolveEffectiveCurriculum('NG', '')).toBe('nerdc')
    expect(resolveEffectiveCurriculum('IN', '')).toBe('cbse')
    expect(resolveEffectiveCurriculum('ZA', '')).toBe('caps')
  })
  it('Unknown country code falls back to general', () => {
    expect(resolveEffectiveCurriculum('XX', '')).toBe('general')
  })
  it('isCBCForStudent reflects country', () => {
    expect(isCBCForStudent('KE', '')).toBe(true)
    expect(isCBCForStudent('US', '')).toBe(false)
    expect(isCBCForStudent('US', 'cbc')).toBe(false)
  })
})

describe('grade advancement (calendar-year rollover)', () => {
  it('advances a CBC grade one step per year, clamping at max', () => {
    expect(advanceGradeByYears('Grade 4', 0, GRADES_CBC)).toBe('Grade 4')
    expect(advanceGradeByYears('Grade 4', 1, GRADES_CBC)).toBe('Grade 5')
    expect(advanceGradeByYears('Grade 5', 1, GRADES_CBC)).toBe('Grade 6')
    expect(advanceGradeByYears('Grade 11', 5, GRADES_CBC)).toBe('Grade 12')
    // clamp at last
    expect(advanceGradeByYears('Grade 12', 3, GRADES_CBC)).toBe('Grade 12')
  })
  it('advances non-sequential systems by index (Form/Year/Class)', () => {
    expect(advanceGradeByYears('Form 1', 1, ['Form 1', 'Form 2', 'Form 3', 'Form 4'])).toBe('Form 2')
    expect(advanceGradeByYears('Year 9', 1, ['Year 9', 'Year 10', 'Year 11'])).toBe('Year 10')
  })
  it('no-op when grade unchanged / zero years', () => {
    expect(advanceGradeByYears('Grade 4', 0, GRADES_CBC)).toBe('Grade 4')
  })
  it('years elapsed is zero for the current year', () => {
    expect(getYearsElapsedSince(new Date().getFullYear())).toBe(0)
    expect(getYearsElapsedSince(new Date().getFullYear() - 1)).toBe(1)
  })
})

describe('resolveStudentGradeAndCurriculum end-to-end', () => {
  it('Kenya student created this year stays in CBC grade', () => {
    const r = resolveStudentGradeAndCurriculum({
      grade: 'Grade 4',
      country: 'KE',
      curriculum: 'cbc',
      createdAt: new Date().toISOString(),
    })
    expect(r.curriculum).toBe('cbc')
    expect(r.grade).toBe('Grade 4')
  })
  it('US student gets common-core subjects family and non-cbc curriculum', () => {
    const r = resolveStudentGradeAndCurriculum({
      grade: 'Grade 4',
      country: 'US',
      curriculum: '',
      createdAt: new Date().toISOString(),
    })
    expect(r.curriculum).toBe('common-core')
  })
  it('US student created 2 years ago advances to Grade 6 (Common Core list)', () => {
    const r = resolveStudentGradeAndCurriculum({
      grade: 'Grade 4',
      country: 'US',
      curriculum: '',
      createdAt: new Date(new Date().getFullYear() - 2, 5, 1).toISOString(),
    })
    expect(r.curriculum).toBe('common-core')
    expect(r.grade).toBe('Grade 6')
  })
  it('US senior student (GED) preserves ged-hiset curriculum', () => {
    const r = resolveStudentGradeAndCurriculum({
      grade: '',
      country: 'US',
      curriculum: 'ged-hiset',
      createdAt: new Date().toISOString(),
    })
    expect(r.curriculum).toBe('ged-hiset')
  })
})
