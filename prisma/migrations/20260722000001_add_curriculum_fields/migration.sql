-- Add subject and term fields to Curriculum
ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "subject" TEXT NOT NULL DEFAULT '';
ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "term" INTEGER;

-- Add learningOutcomes and activities to CurriculumSubstrand
ALTER TABLE "curriculum_substrands" ADD COLUMN IF NOT EXISTS "learning_outcomes" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "curriculum_substrands" ADD COLUMN IF NOT EXISTS "activities" TEXT[] NOT NULL DEFAULT '{}';

-- Add composite unique constraints
DROP INDEX IF EXISTS "curriculums_type_grade_subject_term_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "curriculums_type_grade_subject_term_key" ON "curriculums"("type", "grade", "subject", "term");

-- Safely add curriculum_id column and create index
ALTER TABLE "curriculum_strands" ADD COLUMN IF NOT EXISTS "curriculum_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "curriculum_strands_curriculum_id_name_key" ON "curriculum_strands"("curriculum_id", "name");

ALTER TABLE "curriculum_substrands" ADD COLUMN IF NOT EXISTS "strand_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "curriculum_substrands_strand_id_name_key" ON "curriculum_substrands"("strand_id", "name");
