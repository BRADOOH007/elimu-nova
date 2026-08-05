import { prisma } from './src/lib/prisma'
import { parseLessonContent, hasStructuredLesson, extractMarkdownContent } from './src/lib/lesson-plan-content'

async function main() {
  const plans = await prisma.lessonPlan.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  console.log('Sample plans:', plans.length)
  for (const p of plans) {
    const c = parseLessonContent(p.content)
    const markdown = extractMarkdownContent(p.content)
    console.log('---')
    console.log('title:', p.title, '| subject:', p.subject, '| grade:', p.grade)
    console.log('contentType:', typeof p.content)
    console.log('parsed keys:', c ? Object.keys(c).join(', ') : 'NULL')
    console.log('hasStructured:', hasStructuredLesson(p.content), '| markdown?', markdown !== null)
    if (c && typeof c === 'object' && c.organisationOfLearning) {
      console.log('org steps:', Object.keys(c.organisationOfLearning).join(', '))
    }
    if (c && c.lessonHeader) console.log('lessonHeader:', JSON.stringify(c.lessonHeader))
    if (c && c.strand) console.log('strand:', c.strand)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1) })
