import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { route } from '@/lib/api-middleware'

const FALLBACK_TOPICS: Record<string, string[]> = {
  Mathematics: ['Whole Numbers','Fractions','Decimals','Measurement','Geometry','Algebra','Data Handling'],
  English: ['Reading Comprehension','Grammar','Writing','Vocabulary','Poetry'],
  Kiswahili: ['Sarufi','Msamiati','Ufahamu','Insha','Fasihi'],
  Science: ['Living Things','Energy','Light','Sound','Forces','Materials','Weather'],
  'Social Studies': ['Our Country','Environment','Resources','Transport','Government'],
  Physics: ['Forces','Motion','Energy','Waves','Light','Electricity','Magnetism'],
  Chemistry: ['States of Matter','Mixtures','Chemical Reactions','Acids & Bases'],
  Biology: ['Cells','Classification','Nutrition','Respiration','Reproduction','Ecology'],
  History: ['Early Man','Trade','Colonial Administration','Independence'],
  Geography: ['Map Work','Weather & Climate','Vegetation','Population'],
  Agriculture: ['Crop Farming','Animal Keeping','Soil Preparation'],
  'Business Studies': ['Business Environment','Entrepreneurship','Money & Banking'],
  'Computer Studies': ['Computer Basics','Programming','Internet','Data Security'],
  CRE: ['Creation','The Bible','Jesus Christ','Christian Values'],
}

// Map app-level short subject names to DB CBC subject names (with variations)
const SUBJECT_ALIASES: Record<string, string[]> = {
  Mathematics: ['Mathematics Activities', 'Mathematics', 'Maths', 'Essential Mathematics'],
  English: ['English Activities', 'English Language Activities', 'English'],
  Kiswahili: ['Shughuli za Kiswahili', 'Kiswahili'],
  Science: ['Science & Technology Activities', 'Science and Technology Activities', 'Integrated Science Activities', 'Integrated Science', 'Science'],
  'Social Studies': ['Social Studies Activities', 'Social Studies'],
  CRE: ['C.R.E Activities', 'Christian Religious Education Activities', 'CRE Activities', 'Religious Activities', 'CRE'],
  Agriculture: ['Agriculture & Nutrition Activities', 'Agriculture and Nutrition Activities', 'Agriculture'],
  Physics: ['Physics'],
  Chemistry: ['Chemistry'],
  Biology: ['Biology'],
  History: ['History'],
  Geography: ['Geography'],
  'Business Studies': ['Business Studies'],
  'Computer Studies': ['Computer Studies', 'Pretechnical Studies Activities'],
}

async function findCurriculum(grade: string, subject: string) {
  const exact = await prisma.curriculum.findFirst({ where: { type: 'CBC', grade, subject, isActive: true }, select: { id: true } })
  if (exact) return exact.id

  const aliases = SUBJECT_ALIASES[subject] || []
  if (aliases.length > 0) {
    const viaAlias = await prisma.curriculum.findFirst({
      where: { type: 'CBC', grade, subject: { in: aliases }, isActive: true },
      select: { id: true },
    })
    if (viaAlias) return viaAlias.id
  }

  // Fuzzy: subject contains (handles "Science and Technology Activities" vs "Science & Technology Activities")
  const fuzzy = await prisma.curriculum.findFirst({
    where: { type: 'CBC', grade, isActive: true, subject: { contains: subject } },
    select: { id: true },
  })
  return fuzzy?.id || null
}

async function getOrderedPath(grade: string, subject: string) {
  // Try DB-backed curriculum first (strands → substrands in order)
  const curriculumId = await findCurriculum(grade, subject)

  if (curriculumId) {
    const strands = await prisma.curriculumStrand.findMany({
      where: { curriculumId },
      select: { id: true, name: true, order: true },
      orderBy: { order: 'asc' },
    })

    const path: Array<{ strandName: string; topicName: string; order: number }> = []
    let order = 0
    for (const strand of strands) {
      const substrands = await prisma.curriculumSubstrand.findMany({
        where: { strandId: strand.id },
        select: { name: true, order: true },
        orderBy: { order: 'asc' },
      })
      if (substrands.length > 0) {
        for (const sub of substrands) {
          path.push({ strandName: strand.name, topicName: sub.name, order: order++ })
        }
      } else {
        path.push({ strandName: strand.name, topicName: strand.name, order: order++ })
      }
    }
    if (path.length > 0) return path
  }

  // Fallback: static topic list
  return (FALLBACK_TOPICS[subject] || ['General']).map((t, i) => ({
    strandName: subject, topicName: t, order: i,
  }))
}

// GET /api/student/learning-path?grade=&subject=
// Returns the full ordered topic path with each topic's progress status,
// the resume topic (in-progress, or next to start), and totals.
export const GET = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const { searchParams } = new URL(request.url)
  const grade   = searchParams.get('grade')   || 'Grade 4'
  const subject = searchParams.get('subject') || 'Mathematics'

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const path = await getOrderedPath(grade, subject)

  const progress = await prisma.topicProgress.findMany({
    where: { studentId: student.id, grade, subject },
  })
  const progressMap = new Map(progress.map(p => [p.topicName, p]))

  const topics = path.map(t => {
    const p = progressMap.get(t.topicName)
    return {
      ...t,
      status: p?.status || 'NOT_STARTED',
      lastContent: p?.lastContent || null,
      lastPosition: p?.lastPosition || 0,
      completedAt: p?.completedAt || null,
    }
  })

  const resumeTopic = topics.find(t => t.status === 'IN_PROGRESS')
    || topics.find(t => t.status === 'NOT_STARTED')
    || null

  const completedCount = topics.filter(t => t.status === 'COMPLETED').length

  return NextResponse.json({
    grade,
    subject,
    topics,
    resumeTopic,
    completedCount,
    totalCount: topics.length,
    percentComplete: topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0,
  })
})

// POST /api/student/learning-path
// { action: 'start' | 'complete', grade, subject, strandName, topicName, order, content? }
export const POST = route({ auth: 'STUDENT' }, async (request, { user }) => {
  const body = await request.json()
  const { action, grade, subject, strandName, topicName, order, content } = body

  if (!subject || !topicName) {
    return NextResponse.json({ error: 'subject and topicName required' }, { status: 400 })
  }

  const student = await prisma.student.findUnique({ where: { userId: user.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const gradeVal = grade || 'Grade 4'

  const existing = await prisma.topicProgress.findUnique({
    where: {
      studentId_grade_subject_topicName: {
        studentId: student.id, grade: gradeVal, subject, topicName,
      },
    },
  })

  if (action === 'complete') {
    const tp = await prisma.topicProgress.upsert({
      where: {
        studentId_grade_subject_topicName: {
          studentId: student.id, grade: gradeVal, subject, topicName,
        },
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
        lastPosition: 100,
      },
      create: {
        studentId: student.id, grade: gradeVal, subject,
        strandName: strandName || subject, topicName,
        order: typeof order === 'number' ? order : (existing?.order ?? 0),
        status: 'COMPLETED',
        completedAt: new Date(),
        lastPosition: 100,
      },
    })

    // Also bump unit mastery lessonsCompleted so Mastery Gates update
    await prisma.unitMastery.upsert({
      where: { studentId_subject_unitName: { studentId: student.id, subject, unitName: topicName } },
      update: {
        lessonsCompleted: { increment: 1 },
        lastPracticedAt: new Date(),
        masteryLevel: 'PROFICIENT',
      },
      create: {
        studentId: student.id, subject, unitName: topicName, grade: gradeVal,
        lessonsCompleted: 1,
        masteryLevel: 'PROFICIENT',
        masteryScore: 70,
        lastPracticedAt: new Date(),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, topicProgress: tp })
  }

  // action === 'start' (or default): mark in-progress, cache content for resume
  const tp = await prisma.topicProgress.upsert({
    where: {
      studentId_grade_subject_topicName: {
        studentId: student.id, grade: gradeVal, subject, topicName,
      },
    },
    update: {
      status: 'IN_PROGRESS',
      strandName: strandName || subject,
      ...(typeof order === 'number' ? { order } : {}),
      ...(content ? { lastContent: content } : {}),
    },
    create: {
      studentId: student.id, grade: gradeVal, subject,
      strandName: strandName || subject, topicName,
      order: typeof order === 'number' ? order : 0,
      status: 'IN_PROGRESS',
      ...(content ? { lastContent: content } : {}),
    },
  })

  return NextResponse.json({ success: true, topicProgress: tp })
})
