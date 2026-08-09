# CBC Curriculum Coverage Audit

Status: Documentation only - no code changes made. This document records the
current state of CBC curriculum data in the platform so the gaps are known and
actionable.

Audited: from live production Postgres database (via Prisma) + source review.

## Summary

The platform does NOT yet contain complete curriculum designs for all grades.
Genuine strand/substrand data exists only for **Grades 4-9 core subjects**.
Pre-primary (PP1/PP2) and Senior School (Grade 10-12 / Form 1-4) have no
curriculum content at all. Grades 1-3 have Mathematics only. Junior School
(Grade 7-9) reuses Grade 5/6 strand data rather than authentic Grade 7/8/9
designs.

## Live database state (queried)

- `Curriculum` rows: **39**
- `CurriculumStrand` rows: **139**
- `CurriculumSubstrand` rows: **212**
- `CurriculumLesson` rows: **0**

| Grade | Subjects in DB | Notes |
|-------|----------------|-------|
| PP1 | none | only KEC workbook links |
| PP2 | none | only KEC workbook links |
| Grade 1 | Mathematics Activities | partial |
| Grade 2 | Mathematics Activities | partial |
| Grade 3 | Mathematics Activities | partial |
| Grade 4 | Math, English, Kiswahili, Science & Tech, Social Studies, C.R.E | full (6) |
| Grade 5 | same 6 | full |
| Grade 6 | same 6 | full |
| Grade 7 | same 6 | strands are Grade 5/6 data |
| Grade 8 | same 6 | strands are Grade 5/6 data |
| Grade 9 | same 6 | strands are Grade 5/6 data |
| Grade 10 (Form 1) | none | only KEC workbook links |
| Grade 11 (Form 2) | none | only KEC workbook links |
| Grade 12 (Form 3) | none | only KEC workbook links |
| Form 4 | none | only KEC workbook links |

## Three curriculum data sources

1. **Static subject lists** - `src/lib/constants/cbc-curriculum.ts`
   - `CBC_RATIONALIZED_CURRICULUM`: Lower Primary (7 core), Upper Primary (8),
     Junior School (9), Senior School (4 core + STEM/Social Sciences/Arts &
     Sports electives).
   - Contains subject lists only - no strands, substrands, or learning outcomes.
   - `getSubjectsForStudent()` is the safe consumer used by dashboards.

2. **DB-backed strands** - `prisma/repair-curriculum.ts` seed + `Curriculum` /
   `CurriculumStrand` / `CurriculumSubstrand` / `CurriculumLesson` models.
   - Served by `src/app/api/curriculum/strands/route.ts` and
     `src/app/api/curriculum/subjects/route.ts`.
   - Grades 1-3: Mathematics only (`LOWER_PRIMARY` map, `repair-curriculum.ts:551`).
   - Grades 4-6: 6 core subjects with real strand/substrand data
     (`G4_6_MAP`, `repair-curriculum.ts:579`).
   - Grades 7-9: **reuses Grade 5/6 strand data** (`G7_9_MAP` points at
     `SCIENCE_G5/G6`, `MATH_G5/G6`, etc., `repair-curriculum.ts:613`).

3. **External KEC workbook links** - `src/data/kec-workbooks.ts`
   - Hyperlinks to Kenya Education Cloud e-workbooks (lms.kec.ac.ke),
     covering PP1/PP2 through Form 4. Links only, no hosted content.
   - Helpers: `getKECWorkbook(grade, subject)`, `getKECCategoryUrl(grade)`.

## Gaps

- No Senior School (Grade 10-12 / Form 1-4) curriculum in DB.
- No PP1/PP2 content in DB.
- Grades 1-3 have only Mathematics seeded.
- Grades 7-9 strand content is not authentic (reuses Grades 5/6).
- No curriculum lessons seeded (`CurriculumLesson` = 0).
- Missing subjects entirely: Agriculture, IRE, Home Science, Creative Arts,
  Physical Education, Pre-Technical Studies (DB has no rows for them).
- UI fallback topic maps in `src/components/student/curriculum-browser.tsx`
  provide static name lists for additional subject names but are not
  structured curriculum data.

## How the UI handles gaps

- `curriculum-browser.tsx` fetches strands via `/api/curriculum/strands`; when
  the DB returns nothing for a grade/subject it falls back to a static topic
  map so the page still renders.
- Subject lists for every grade come from `getSubjectsForStudent` / static
  constants, so dashboards show full CBC subject sets even where DB strand
  content is missing.

## Recommended future work (not started)

1. Expand the seed for Grades 1-3 core subjects to match Grades 4-9 coverage.
2. Build authentic Grade 7-9 strand/substrand designs (replace Grade 5/6 reuse).
3. Seed Senior School (Grade 10-12) pathway content (STEM / Social Sciences /
   Arts & Sports).
4. Seed PP1/PP2 early-learning content.
5. Add curriculum lessons (`CurriculumLesson`) per substrand.
6. Re-run `prisma/repair-curriculum.ts` (it wipes and rebuilds all curriculum
   data) and re-verify coverage with the query in the appendix.

## Appendix: coverage query

```
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const curricula = await p.curriculum.findMany({ select: { grade: true, subject: true } })
const byGrade = {}
for (const c of curricula) (byGrade[c.grade] ||= []).push(c.subject)
for (const [g, subs] of Object.entries(byGrade)) console.log(g, '->', [...new Set(subs)].join(', '))
```

Expected current output:

```
Grade 1 -> Mathematics Activities
Grade 2 -> Mathematics Activities
Grade 3 -> Mathematics Activities
Grade 4 -> Science & Technology Activities, Social Studies Activities, Mathematics Activities, English Activities, Shughuli za Kiswahili, C.R.E Activities
Grade 5 -> same 6 subjects
Grade 6 -> same 6 subjects
Grade 7 -> same 6 subjects
Grade 8 -> same 6 subjects
Grade 9 -> same 6 subjects
```
