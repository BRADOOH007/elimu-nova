import jsPDF from 'jspdf'

interface CBCSubjectGrade {
  subject: string
  score: number
  grade: string
  competency: string
  comment: string
}

interface CBCStudentInfo {
  name: string
  grade: string
  class: string
  term: string
  year: number
  schoolName: string
  schoolLogo?: string
  teacherName: string
  admissionNo?: string
}

interface CBCReportData {
  student: CBCStudentInfo
  subjects: CBCSubjectGrade[]
  coreCompetencies: { name: string; rating: string; notes: string }[]
  teacherComment: string
  headTeacherComment?: string
  daysPresent: number
  daysAbsent: number
  totalDays: number
}

const GRADE_MAP: Record<string, { min: number; max: number; label: string }> = {
  A: { min: 80, max: 100, label: 'Exceeding Expectations' },
  B: { min: 65, max: 79, label: 'Meeting Expectations' },
  C: { min: 50, max: 64, label: 'Approaching Expectations' },
  D: { min: 30, max: 49, label: 'Below Expectations' },
  E: { min: 0, max: 29, label: 'Needs Improvement' },
}

function getGrade(score: number): { grade: string; label: string } {
  for (const [grade, range] of Object.entries(GRADE_MAP)) {
    if (score >= range.min && score <= range.max) return { grade, label: range.label }
  }
  return { grade: 'E', label: 'Needs Improvement' }
}

export class CBCReportCardGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF('portrait', 'mm', 'a4')
  }

  generate(data: CBCReportData): jsPDF {
    this.addHeader(data)
    this.addStudentInfo(data)
    this.addSubjectTable(data)
    this.addCoreCompetencies(data)
    this.addAttendance(data)
    this.addTeacherComment(data)
    this.addFooter(data)
    return this.doc
  }

  private addHeader(data: CBCReportData) {
    const doc = this.doc
    doc.setFillColor(0, 102, 204)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('CBC PROGRESS REPORT', 105, 14, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`${data.student.schoolName}`, 105, 24, { align: 'center' })
    doc.text(`Term ${data.student.term} — ${data.student.year}`, 105, 32, { align: 'center' })
  }

  private addStudentInfo(data: CBCReportData) {
    const doc = this.doc
    let y = 45
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const infoLeft = [
      `Student: ${data.student.name}`,
      `Class: ${data.student.class}`,
      `Grade: ${data.student.grade}`,
    ]
    const infoRight = [
      `Admission No: ${data.student.admissionNo || '—'}`,
      `Teacher: ${data.student.teacherName}`,
      `Term: ${data.student.term} / ${data.student.year}`,
    ]

    for (let i = 0; i < infoLeft.length; i++) {
      doc.text(infoLeft[i], 20, y + i * 6)
      doc.text(infoRight[i], 110, y + i * 6)
    }
    y += infoLeft.length * 6 + 4

    doc.setDrawColor(0, 102, 204)
    doc.setLineWidth(0.5)
    doc.line(20, y, 190, y)
  }

  private addSubjectTable(data: CBCReportData) {
    const doc = this.doc
    let y = 70

    doc.setFillColor(240, 240, 240)
    doc.rect(20, y, 170, 7, 'F')
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Subject', 22, y + 5)
    doc.text('Score', 80, y + 5)
    doc.text('Grade', 100, y + 5)
    doc.text('Competency', 120, y + 5)
    y += 10

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    for (const sub of data.subjects) {
      const grade = getGrade(sub.score)
      doc.setTextColor(40, 40, 40)
      doc.text(sub.subject, 22, y)
      doc.text(`${sub.score}%`, 82, y, { align: 'center' })
      doc.text(grade.grade, 102, y, { align: 'center' })
      doc.text(sub.competency, 120, y)

      if (sub.comment) {
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(7.5)
        const lines = doc.splitTextToSize(sub.comment, 85)
        doc.text(lines, 120, y + 2)
        y += Math.max(6, lines.length * 3 + 2)
        doc.setFontSize(8.5)
      } else {
        y += 6
      }

      if (y > 250) {
        doc.addPage()
        y = 20
      }
    }

    y += 3
    doc.setDrawColor(200, 200, 200)
    doc.line(20, y, 190, y)
  }

  private addCoreCompetencies(data: CBCReportData) {
    const doc = this.doc
    let y = this.doc.getCurrentPageInfo().pageNumber > 1 ? 25 : this.getLastY() + 5

    if (y > 240) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 102, 204)
    doc.text('Core Competencies', 20, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    for (const comp of data.coreCompetencies) {
      doc.setTextColor(40, 40, 40)
      doc.text(`• ${comp.name}: ${comp.rating}`, 22, y)
      if (comp.notes) {
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(7.5)
        const notes = doc.splitTextToSize(comp.notes, 140)
        doc.text(notes, 30, y + 3)
        y += Math.max(6, notes.length * 3 + 4)
        doc.setFontSize(9)
      } else {
        y += 6
      }

      if (y > 260) {
        doc.addPage()
        y = 20
      }
    }

    y += 2
    doc.setDrawColor(200, 200, 200)
    doc.line(20, y, 190, y)
  }

  private addAttendance(data: CBCReportData) {
    const doc = this.doc
    let y = this.getLastY() + 5

    if (y > 255) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 102, 204)
    doc.text('Attendance', 20, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)
    doc.text(`Days Present: ${data.daysPresent}`, 22, y)
    doc.text(`Days Absent: ${data.daysAbsent}`, 80, y)
    doc.text(`Total Days: ${data.totalDays}`, 140, y)
    y += 10

    doc.setDrawColor(200, 200, 200)
    doc.line(20, y, 190, y)
  }

  private addTeacherComment(data: CBCReportData) {
    const doc = this.doc
    let y = this.getLastY() + 5

    if (y > 240) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 102, 204)
    doc.text("Teacher's Comment", 20, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(data.teacherComment, 170)
    doc.text(lines, 20, y)
    y += lines.length * 4.5 + 5
    doc.text(`— ${data.student.teacherName}`, 140, y + 5)

    if (data.headTeacherComment) {
      y += 12
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(0, 102, 204)
      doc.text("Head Teacher's Comment", 20, y)
      y += 7
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      const hlines = doc.splitTextToSize(data.headTeacherComment, 170)
      doc.text(hlines, 20, y)
    }
  }

  private addFooter(data: CBCReportData) {
    const doc = this.doc
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 285, 190, 285)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120, 120, 120)
      doc.text(`Generated by ElimuNova AI — ${data.student.schoolName}`, 20, 290)
      doc.text(`Page ${i} of ${pageCount}`, 170, 290, { align: 'right' })
    }
  }

  private getLastY(): number {
    return 160
  }
}

export function generateCBCReport(data: CBCReportData): jsPDF {
  const generator = new CBCReportCardGenerator()
  return generator.generate(data)
}
