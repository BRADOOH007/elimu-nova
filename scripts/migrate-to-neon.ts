/**
 * Neon-to-Neon Database Migration
 *
 * Copies ALL data from the old Neon database (OLD_DATABASE_URL) to the new
 * Neon database (DATABASE_URL). Tables are migrated in foreign-key order so
 * that parent rows always exist before children reference them.
 *
 * Usage:
 *   npm run migrate:neon
 *
 * Requires OLD_DATABASE_URL and DATABASE_URL in .env.
 */

import { PrismaClient } from '@prisma/client'

const oldDb = new PrismaClient({
  datasources: { db: { url: process.env.OLD_DATABASE_URL } },
})
const newDb = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

// ── helpers ──────────────────────────────────────────────────────

async function count(client: PrismaClient, model: string) {
  const accessor = (client as any)[model]
  if (!accessor || typeof accessor.count !== 'function') return 0
  return accessor.count()
}

// Batched insert with skipDuplicates. Rows are inserted in chunks of 500
// to avoid huge single statements, and duplicates are silently skipped so
// a re-run is idempotent and resumable.
const BATCH = 500

async function migrate<T extends { id: string }>(
  label: string,
  oldClient: PrismaClient,
  newClient: PrismaClient,
  model: string,
) {
  const accessor = (oldClient as any)[model]
  if (!accessor || typeof accessor.findMany !== 'function') {
    console.log(`  ${label}: model not in client (skipped)`)
    return 0
  }
  const rows: T[] = await accessor.findMany()
  if (rows.length === 0) {
    console.log(`  ${label}: 0 rows (skipped)`)
    return 0
  }
  const target = (newClient as any)[model]
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    await target.createMany({ data: chunk, skipDuplicates: true })
  }
  console.log(`  ${label}: ${rows.length} rows`)
  return rows.length
}

// Like migrate but uses a unique field other than `id` (e.g. userId).
// Because skipDuplicates skips on ANY unique-constraint violation, passing
// the full row is safe: the PK and secondary unique keys are both honored.
async function migrateByUnique(
  label: string,
  oldClient: PrismaClient,
  newClient: PrismaClient,
  model: string,
  _uniqueField: string,
) {
  const accessor = (oldClient as any)[model]
  if (!accessor || typeof accessor.findMany !== 'function') {
    console.log(`  ${label}: model not in client (skipped)`)
    return 0
  }
  const rows: any[] = await accessor.findMany()
  if (rows.length === 0) {
    console.log(`  ${label}: 0 rows (skipped)`)
    return 0
  }
  const target = (newClient as any)[model]
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    await target.createMany({ data: chunk, skipDuplicates: true })
  }
  console.log(`  ${label}: ${rows.length} rows`)
  return rows.length
}

// ── main migration tiers ─────────────────────────────────────────

async function migrateAll() {
  let total = 0
  const t = async (
    label: string,
    model: string,
    fn?: () => Promise<number>,
  ) => {
    const n = fn ? await fn() : await migrate(label, oldDb, newDb, model)
    total += n
  }

  // ━━━ TIER 0: No foreign-key dependencies ━━━
  console.log('\n━━━ Tier 0: Independent tables ━━━')
  await t('District', 'district')
  await t('School', 'school')
  await t('Package', 'package')
  await t('PaymentMethod', 'paymentMethod')

  // ━━━ TIER 1: Core users & auth ━━━
  console.log('\n━━━ Tier 1: Core users ━━━')
  await t('User', 'user')
  await t('SuperAdmin', 'superAdmin')
  await t('SeniorStudent', 'seniorStudent')
  await t('SeniorTeacher', 'seniorTeacher')

  // ━━━ TIER 2: School-linked roles ━━━
  console.log('\n━━━ Tier 2: School-linked roles ━━━')
  await t('SchoolAdmin', 'schoolAdmin', async () =>
    migrateByUnique('SchoolAdmin', oldDb, newDb, 'schoolAdmin', 'userId'),
  )
  await t('Teacher', 'teacher', async () =>
    migrateByUnique('Teacher', oldDb, newDb, 'teacher', 'userId'),
  )
  await t('Class', 'class')
  await t('Student', 'student', async () =>
    migrateByUnique('Student', oldDb, newDb, 'student', 'userId'),
  )
  await t('Parent', 'parent', async () =>
    migrateByUnique('Parent', oldDb, newDb, 'parent', 'userId'),
  )

  // ━━━ TIER 3: Junction / link tables ━━━
  console.log('\n━━━ Tier 3: Junction tables ━━━')
  await t('TeacherSubjectAssignment', 'teacherSubjectAssignment')
  await t('ParentStudent', 'parentStudent')
  await t('UserPreference', 'userPreference', async () =>
    migrateByUnique('UserPreference', oldDb, newDb, 'userPreference', 'userId'),
  )
  await t('SearchHistory', 'searchHistory')

  // ━━━ TIER 4: NextAuth models ━━━
  console.log('\n━━━ Tier 4: NextAuth (auth sessions) ━━━')
  await t('Account', 'account')
  await t('Session', 'session')
  await t('VerificationToken', 'verificationToken')

  // ━━━ TIER 5: Packages, subscriptions ━━━
  console.log('\n━━━ Tier 5: Billing ━━━')
  await t('Subscription', 'subscription')
  await t('Invoice', 'invoice')

  // ━━━ TIER 6: School settings & security ━━━
  console.log('\n━━━ Tier 6: Settings & security ━━━')
  await t('SystemSettings', 'systemSettings')
  await t('SchoolSettings', 'schoolSettings')
  await t('SecurityLog', 'securityLog')
  await t('SecurityPolicy', 'securityPolicy')
  await t('SystemIncident', 'systemIncident')
  await t('ApiLog', 'apiLog')

  // ━━━ TIER 7: Reports & audit ━━━
  console.log('\n━━━ Tier 7: Reports & audit ━━━')
  await t('Report', 'report')
  await t('AdminAuditLog', 'adminAuditLog')

  // ━━━ TIER 8: Curriculum ━━━
  console.log('\n━━━ Tier 8: Curriculum ━━━')
  await t('Curriculum', 'curriculum')
  await t('CurriculumStrand', 'curriculumStrand')
  await t('CurriculumSubstrand', 'curriculumSubstrand')
  await t('CurriculumLesson', 'curriculumLesson')
  await t('CurriculumIngestionLog', 'curriculumIngestionLog')

  // ━━━ TIER 9: Courses ━━━
  console.log('\n━━━ Tier 9: Courses ━━━')
  await t('Course', 'course')
  await t('CourseLesson', 'courseLesson')
  await t('CourseAssignment', 'courseAssignment')
  await t('TeacherCourseAssignment', 'teacherCourseAssignment')
  await t('CourseEnrollment', 'courseEnrollment')
  await t('SeniorCourseEnrollment', 'seniorCourseEnrollment')
  await t('LearningArea', 'learningArea')

  // ━━━ TIER 10: Teaching content ━━━
  console.log('\n━━━ Tier 10: Teaching content ━━━')
  await t('SchemeOfWork', 'schemeOfWork')
  await t('SchemeTopic', 'schemeTopic')
  await t('SharedSchemeOfWork', 'sharedSchemeOfWork')
  await t('LessonPlan', 'lessonPlan')
  await t('SharedLessonPlan', 'sharedLessonPlan')
  await t('Assignment', 'assignment')
  await t('Submission', 'submission')
  await t('Resource', 'resource')
  await t('TeacherNote', 'teacherNote')
  await t('DocumentLibrary', 'documentLibrary')

  // ━━━ TIER 11: Student progress & analytics ━━━
  console.log('\n━━━ Tier 11: Student progress ━━━')
  await t('StudentProgress', 'studentProgress')
  await t('SkillMastery', 'skillMastery')
  await t('StudySession', 'studySession')
  await t('StudentAnalytics', 'studentAnalytics')

  // ━━━ TIER 12: AI tutor ━━━
  console.log('\n━━━ Tier 12: AI tutor ━━━')
  await t('AITutorSession', 'aiTutorSession')
  await t('TutorSession', 'tutorSession')
  await t('TutorQuestion', 'tutorQuestion')
  await t('StudentMemory', 'studentMemory')

  // ━━━ TIER 13: Wellness ━━━
  console.log('\n━━━ Tier 13: Wellness ━━━')
  await t('WellnessCheckIn', 'wellnessCheckIn')

  // ━━━ TIER 14: Messaging & notifications ━━━
  console.log('\n━━━ Tier 14: Messaging ━━━')
  await t('Message', 'message')
  await t('Notification', 'notification')
  await t('ContactMessage', 'contactMessage')

  // ━━━ TIER 15: Meetings & schedules ━━━
  console.log('\n━━━ Tier 15: Meetings & schedules ━━━')
  await t('Meeting', 'meeting')
  await t('Schedule', 'schedule')
  await t('AcademicCalendar', 'academicCalendar')
  await t('AcademicCalendarEvent', 'academicCalendarEvent')
  await t('TimetableSlot', 'timetableSlot')
  await t('ClassSchedule', 'classSchedule')

  // ━━━ TIER 16: Activities ━━━
  console.log('\n━━━ Tier 16: Activities ━━━')
  await t('Activity', 'activity')

  // ━━━ TIER 17: AI generated content & images ━━━
  console.log('\n━━━ Tier 17: AI content ━━━')
  await t('AIGeneratedContent', 'aiGeneratedContent')
  await t('SharedAIContent', 'sharedAIContent')
  await t('SharedAIContentWithClass', 'sharedAIContentWithClass')
  await t('AIGeneratedImage', 'aiGeneratedImage')
  await t('AIImageUsage', 'aiImageUsage')

  // ━━━ TIER 18: Caches ━━━
  console.log('\n━━━ Tier 18: Caches ━━━')
  await t('LessonCache', 'lessonCache')
  await t('LessonPlanCache', 'lessonPlanCache')
  await t('LessonContentCache', 'lessonContentCache')

  // ━━━ TIER 19: Mastery & spaced repetition ━━━
  console.log('\n━━━ Tier 19: Mastery & spaced repetition ━━━')
  await t('UnitMastery', 'unitMastery')
  await t('SkillPrerequisite', 'skillPrerequisite')
  await t('ReviewSchedule', 'reviewSchedule')
  await t('TopicProgress', 'topicProgress')
  await t('CourseChallenge', 'courseChallenge')

  // ━━━ TIER 20: Writing ━━━
  console.log('\n━━━ Tier 20: Writing ━━━')
  await t('WritingSubmission', 'writingSubmission')
  await t('SeniorWritingSubmission', 'seniorWritingSubmission')

  // ━━━ TIER 21: Exams & lockdown ━━━
  console.log('\n━━━ Tier 21: Exams ━━━')
  await t('ExamSession', 'examSession')
  await t('LockdownViolation', 'lockdownViolation')

  // ━━━ TIER 22: GED ━━━
  console.log('\n━━━ Tier 22: GED ━━━')
  await t('GEDSubjectProgress', 'gedSubjectProgress')
  await t('GEDCertificate', 'gedCertificate')

  // ━━━ TIER 23: Quiz & practice ━━━
  console.log('\n━━━ Tier 23: Quiz & practice ━━━')
  await t('QuizResult', 'quizResult')
  await t('PracticeAttempt', 'practiceAttempt')

  // ━━━ TIER 24: Library ━━━
  console.log('\n━━━ Tier 24: Library ━━━')
  await t('Book', 'book')
  await t('BookProgress', 'bookProgress')
  await t('BookRating', 'bookRating')
  await t('ReadingLog', 'readingLog')

  // ━━━ TIER 25: External infra ━━━
  console.log('\n━━━ Tier 25: External infra ━━━')
  await t('ExternalDatabase', 'externalDatabase')
  await t('CommunicationService', 'communicationService')
  await t('RedisConfig', 'redisConfig')

  return total
}

// ── report ───────────────────────────────────────────────────────

async function report(label: string, client: PrismaClient) {
  console.log(`\n📊 ${label}:`)
  const models = [
    'user', 'superAdmin', 'school', 'schoolAdmin', 'teacher', 'class',
    'student', 'parent', 'parentStudent', 'seniorStudent', 'seniorTeacher',
    'package', 'subscription', 'paymentMethod', 'invoice',
    'account', 'session', 'verificationToken',
    'systemSettings', 'schoolSettings', 'securityLog', 'securityPolicy',
    'systemIncident', 'apiLog', 'report', 'adminAuditLog',
    'curriculum', 'curriculumStrand', 'curriculumSubstrand', 'curriculumLesson',
    'course', 'courseLesson', 'courseAssignment', 'teacherCourseAssignment',
    'courseEnrollment', 'seniorCourseEnrollment', 'learningArea',
    'schemeOfWork', 'schemeTopic', 'sharedSchemeOfWork',
    'lessonPlan', 'sharedLessonPlan', 'assignment', 'submission',
    'resource', 'teacherNote', 'documentLibrary',
    'studentProgress', 'skillMastery', 'studySession', 'studentAnalytics',
    'aiTutorSession', 'tutorSession', 'tutorQuestion', 'studentMemory',
    'wellnessCheckIn', 'message', 'notification', 'contactMessage',
    'meeting', 'schedule', 'academicCalendar', 'academicCalendarEvent',
    'timetableSlot', 'classSchedule', 'activity',
    'aiGeneratedContent', 'sharedAIContent', 'sharedAIContentWithClass',
    'aiGeneratedImage', 'aiImageUsage',
    'lessonCache', 'lessonPlanCache', 'lessonContentCache',
    'unitMastery', 'skillPrerequisite', 'reviewSchedule', 'topicProgress', 'courseChallenge',
    'writingSubmission', 'seniorWritingSubmission',
    'examSession', 'lockdownViolation',
    'gedSubjectProgress', 'gedCertificate',
    'quizResult', 'practiceAttempt',
    'book', 'bookProgress', 'bookRating', 'readingLog',
    'externalDatabase', 'communicationService', 'redisConfig',
  ]
  for (const m of models) {
    const n = await count(client, m)
    if (n > 0) console.log(`  ${m}: ${n}`)
  }
}

// ── entry point ──────────────────────────────────────────────────

async function main() {
  console.log('🔄 Neon → Neon Migration')
  console.log('========================')
  console.log(`Source: ${process.env.OLD_DATABASE_URL?.split('@')[1]?.split('/')[0]}`)
  console.log(`Target: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]}`)

  if (!process.env.OLD_DATABASE_URL) {
    console.error('❌ OLD_DATABASE_URL not set in .env')
    process.exit(1)
  }

  try {
    await report('Source (old) database', oldDb)
    await report('Target (new) database — before migration', newDb)

    console.log('\n🚀 Starting migration...\n')
    const total = await migrateAll()

    console.log(`\n✅ Migration complete — ${total} total rows migrated`)
    await report('Target (new) database — after migration', newDb)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await oldDb.$disconnect()
    await newDb.$disconnect()
  }
}

main()
