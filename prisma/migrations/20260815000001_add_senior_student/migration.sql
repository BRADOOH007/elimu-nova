-- Add SENIOR_STUDENT role + GED (US General Education Diploma) support.
-- Additive only: new enum values + new tables. No existing tables/columns altered.
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so
-- apply these statements with autocommit (single statements, not wrapped).

-- Enum: add SENIOR_STUDENT role
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SENIOR_STUDENT';

-- Enum: add GED curriculum type
ALTER TYPE "CurriculumType" ADD VALUE IF NOT EXISTS 'GED';

-- Enum: add GED + adult essential-skills course types
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'GED_MATH';
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'GED_RLA';
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'GED_SCIENCE';
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'GED_SOCIAL_STUDIES';
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'ADULT_COMPUTER_LITERACY';
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'ADULT_AI_LITERACY';
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'ADULT_FINANCIAL_LITERACY';
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'ADULT_WORKPLACE_READINESS';
ALTER TYPE "CourseType" ADD VALUE IF NOT EXISTS 'ADULT_ESL';

-- Table: senior_students (adult learner profile)
CREATE TABLE IF NOT EXISTS "senior_students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ageBracket" TEXT,
    "priorEducation" TEXT,
    "englishLevel" TEXT,
    "goals" TEXT[] NOT NULL DEFAULT '{}',
    "selectedGEDSubjects" TEXT[] NOT NULL DEFAULT '{}',
    "isGEDReady" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "senior_students_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "senior_students_userId_key" ON "senior_students"("userId");
ALTER TABLE "senior_students" ADD CONSTRAINT "senior_students_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: ged_subject_progress (per-subject GED progress)
CREATE TABLE IF NOT EXISTS "ged_subject_progress" (
    "id" TEXT NOT NULL,
    "seniorStudentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "completedLessons" INTEGER NOT NULL DEFAULT 0,
    "completedLessonIds" TEXT[] NOT NULL DEFAULT '{}',
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "practiceScore" INTEGER,
    "mastery" INTEGER NOT NULL DEFAULT 0,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ged_subject_progress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ged_subject_progress_seniorStudentId_subject_key"
    ON "ged_subject_progress"("seniorStudentId", "subject");
ALTER TABLE "ged_subject_progress" ADD CONSTRAINT "ged_subject_progress_seniorStudentId_fkey"
    FOREIGN KEY ("seniorStudentId") REFERENCES "senior_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: senior_course_enrollments (adult supplemental courses)
CREATE TABLE IF NOT EXISTS "senior_course_enrollments" (
    "id" TEXT NOT NULL,
    "seniorStudentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedLessonIds" TEXT[] NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "senior_course_enrollments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "senior_course_enrollments_seniorStudentId_courseId_key"
    ON "senior_course_enrollments"("seniorStudentId", "courseId");
ALTER TABLE "senior_course_enrollments" ADD CONSTRAINT "senior_course_enrollments_seniorStudentId_fkey"
    FOREIGN KEY ("seniorStudentId") REFERENCES "senior_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "senior_course_enrollments" ADD CONSTRAINT "senior_course_enrollments_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: ged_certificates (GED prep certificate of completion)
CREATE TABLE IF NOT EXISTS "ged_certificates" (
    "id" TEXT NOT NULL,
    "seniorStudentId" TEXT NOT NULL,
    "certNumber" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectScores" JSONB,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ged_certificates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ged_certificates_certNumber_key" ON "ged_certificates"("certNumber");
ALTER TABLE "ged_certificates" ADD CONSTRAINT "ged_certificates_seniorStudentId_fkey"
    FOREIGN KEY ("seniorStudentId") REFERENCES "senior_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
