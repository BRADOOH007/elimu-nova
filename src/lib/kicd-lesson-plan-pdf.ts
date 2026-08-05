/**
 * KICD Lesson Plan PDF Generator
 * Produces a proper A4 PDF of a lesson plan (matching the KICD format),
 * usable for download. Mirrors the HTML export structure.
 */
import jsPDF from 'jspdf'

interface OrgStep {
  duration?: number
  teacherActivity?: string
  learnerActivity?: string
  teacherActions?: string
  studentActions?: string
  activity?: string
}

export class KICDLessonPlanPDF {
  private doc: jsPDF
  private y = 0
  private readonly pageHeight: number

  constructor() {
    this.doc = new jsPDF('portrait', 'mm', 'a4')
    this.pageHeight = this.doc.internal.pageSize.getHeight()
  }

  generate(c: any, meta: { title?: string; subject?: string; grade?: string; topic?: string; teacherName?: string }): jsPDF {
    const doc = this.doc
    const title = meta.title || c.title || meta.topic || 'Lesson Plan'
    const subject = meta.subject || c.subject || c.lessonHeader?.learningArea || ''
    const grade = meta.grade || c.grade || c.lessonHeader?.grade || ''
    const teacher = meta.teacherName || 'Teacher'

    this.addHeader(title, subject, grade, teacher)
    this.ensureSpace(20)

    // Strand / Sub-Strand
    if (c.strand || c.subStrand) {
      this.sectionTitle('Strand / Sub-Strand')
      this.text(`${c.strand || ''}${c.strand && c.subStrand ? ' → ' : ''}${c.subStrand || ''}`)
    }

    // Header meta (school / term / week / lesson / enrolment)
    const h = c.lessonHeader || {}
    const headerMeta: string[] = []
    if (h.school) headerMeta.push(`School: ${h.school}`)
    if (h.term) headerMeta.push(`Term: ${h.term}`)
    if (h.week) headerMeta.push(`Week: ${h.week}`)
    if (h.lesson) headerMeta.push(`Lesson: ${h.lesson}`)
    if (h.enrolment) headerMeta.push(`Enrolment: ${h.enrolment}`)
    if (headerMeta.length > 0) {
      this.sectionTitle('Lesson Details')
      headerMeta.forEach((m: string) => this.bullet(m))
    }

    // Core competencies / values / PCIs
    const comps = c.coreCompetencies || []
    const values = c.values || []
    const pcis = c.pcis || []
    if (comps.length > 0 || values.length > 0 || pcis.length > 0) {
      this.sectionTitle('Core Competencies / Values / PCIs')
      if (comps.length) { this.text('Core Competencies:'); comps.forEach((x: string) => this.bullet(x)) }
      if (values.length) { this.text('Values:'); values.forEach((x: string) => this.bullet(x)) }
      if (pcis.length) { this.text('Pertinent & Contemporary Issues:'); pcis.forEach((x: string) => this.bullet(x)) }
    }

    // Specific Learning Outcomes
    const slos = c.specificLearningOutcomes
      ? (Array.isArray(c.specificLearningOutcomes) ? c.specificLearningOutcomes : [c.specificLearningOutcomes])
      : (c.objectives ? (Array.isArray(c.objectives) ? c.objectives : [c.objectives]) : [])
    if (slos.length > 0) {
      this.sectionTitle('Specific Learning Outcomes')
      slos.forEach((s: string, i: number) => this.bullet(`${i + 1}. ${s}`))
    }

    // Key Inquiry Questions
    if (c.keyInquiryQuestions?.length) {
      this.sectionTitle('Key Inquiry Questions')
      c.keyInquiryQuestions.forEach((q: string) => this.bullet(q))
    }

    // Organisation of Learning
    const org = c.organisationOfLearning
    if (org) {
      this.sectionTitle('Organisation of Learning')
      const steps: Array<[string, OrgStep]> = [
        ['Introduction', org.introduction], ['Step 1', org.step1], ['Step 2', org.step2],
        ['Step 3', org.step3], ['Conclusion', org.conclusion],
      ]
      steps.forEach(([label, s]) => {
        if (s) {
          this.text(`${label} (${s.duration || ''} min)`)
          if (s.teacherActivity) this.text(`Teacher: ${s.teacherActivity}`)
          if (s.learnerActivity) this.text(`Learner: ${s.learnerActivity}`)
        }
      })
    }

    // Legacy activities
    if (!org && (c.introduction || c.mainActivity || c.conclusion)) {
      this.sectionTitle('Lesson Development')
      const legacy = [
        ['Introduction', c.introduction], ['Main Activity', c.mainActivity],
        ['Practice', c.practiceActivity], ['Conclusion', c.conclusion],
      ] as Array<[string, OrgStep]>
      legacy.forEach(([label, s]) => {
        if (s) {
          this.text(`${label} (${s.duration || ''} min)`)
          if (s.teacherActivity || s.teacherActions) this.text(`Teacher: ${s.teacherActivity || s.teacherActions}`)
          if (s.learnerActivity || s.studentActions) this.text(`Learner: ${s.learnerActivity || s.studentActions}`)
          if (s.activity && !s.teacherActivity && !s.learnerActivity) this.text(String(s.activity))
        }
      })
    }

    // Resources
    if (c.learningResources?.length) {
      this.sectionTitle('Learning Resources')
      c.learningResources.forEach((r: string) => this.bullet(r))
    }

    // Assessment
    if (c.assessment || c.conclusion?.assessment) {
      this.sectionTitle('Assessment')
      this.text(String(c.assessment || c.conclusion?.assessment))
    }

    // Extended activities / homework
    if (c.extendedActivities || c.homework) {
      this.sectionTitle('Extended Activities / Homework')
      this.text(String(c.extendedActivities || c.homework))
    }

    // Differentiation (legacy)
    const diff = c.differentiation
    if (diff && (diff.support || diff.extension)) {
      this.sectionTitle('Differentiation')
      if (diff.support) this.text(`Support: ${diff.support}`)
      if (diff.extension) this.text(`Extension: ${diff.extension}`)
    }

    // Reflection
    if (c.reflection || c.teacherReflection) {
      this.sectionTitle("Teacher's Reflection")
      this.text(String(c.reflection || c.teacherReflection))
    }

    // Raw generated content fallback
    if (c.generatedContent && !slos.length && !org) {
      this.sectionTitle('Content')
      this.wrappedText(String(c.generatedContent))
    }

    return doc
  }

  private addHeader(title: string, subject: string, grade: string, teacher: string) {
    const doc = this.doc
    doc.setFillColor(26, 58, 108)
    doc.rect(0, 0, 210, 30, 'F')
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 30, 210, 0.5, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('LESSON PLAN', 105, 12, { align: 'center' })
    doc.setFontSize(10)
    doc.setTextColor(220, 230, 245)
    doc.text('Kenya Competency-Based Curriculum (CBC) - KICD Format', 105, 19, { align: 'center' })

    this.y = 38
    doc.setTextColor(20, 20, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    this.text(title)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    const line = [subject && `Subject: ${subject}`, grade && `Grade: ${grade}`, teacher && `Teacher: ${teacher}`].filter(Boolean).join('   |   ')
    if (line) this.text(line)
    this.y += 4
  }

  private ensureSpace(h: number) {
    if (this.y + h > this.pageHeight - 20) {
      this.doc.addPage()
      this.y = 20
    }
  }

  private sectionTitle(t: string) {
    this.ensureSpace(14)
    const doc = this.doc
    doc.setFillColor(26, 58, 108)
    doc.roundedRect(10, this.y, 190, 7, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(t.toUpperCase(), 14, this.y + 4.8)
    this.y += 10
    doc.setTextColor(20, 20, 20)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
  }

  private text(t: string) {
    if (!t) return
    const doc = this.doc
    const wrapped = doc.splitTextToSize(String(t), 185)
    const h = wrapped.length * 4.5
    this.ensureSpace(h)
    doc.text(wrapped, 12, this.y + 4)
    this.y += h + 1
  }

  private bullet(t: string) {
    if (!t) return
    const doc = this.doc
    const wrapped = doc.splitTextToSize(String(t), 178)
    const h = wrapped.length * 4.5
    this.ensureSpace(h)
    doc.text('•', 12, this.y + 4)
    doc.text(wrapped, 16, this.y + 4)
    this.y += h + 1
  }

  private wrappedText(t: string) {
    this.text(t)
  }
}

export function generateLessonPlanPDF(c: any, meta?: { title?: string; subject?: string; grade?: string; topic?: string; teacherName?: string }): jsPDF {
  return new KICDLessonPlanPDF().generate(c, meta || {})
}