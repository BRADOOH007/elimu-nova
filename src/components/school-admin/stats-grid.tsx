"use client"

import { Users, GraduationCap, Calendar, BookOpen } from "lucide-react"

interface TermInfo {
  termName: string
  term: number
  weekNumber: number
  weeksCount: number
  nextEvent: string
}

interface StatsGridProps {
  stats: {
    activeStudents: { value: number }
    activeTeachers: { value: number }
    totalStudents: { value: number }
    totalTeachers: { value: number }
  } | null
  gradeBreakdown: { grade: string; count: number }[]
  subjectCoverage: { total: number; assigned: number }
  termInfo: TermInfo | null
  cbcReadiness: { percent: number; total: number; pending: number }
}

export default function StatsGrid({ stats, gradeBreakdown, subjectCoverage, termInfo, cbcReadiness }: StatsGridProps) {
  const topGrades = gradeBreakdown.slice(0, 3)
  const gradeLabel = topGrades.length > 0
    ? topGrades.map(g => `${g.grade.replace('Grade ', 'Gr ')}: ${g.count}`).join(' · ')
    : "No students enrolled"

  const cards = [
    {
      key: "students",
      label: "Total Students",
      icon: Users,
      iconBg: "bg-purple-100 text-purple-700",
      value: stats ? stats.activeStudents.value.toString() : "0",
      title: "Active students",
      subtext: gradeLabel,
    },
    {
      key: "teachers",
      label: "Teaching Staff",
      icon: GraduationCap,
      iconBg: "bg-blue-100 text-blue-700",
      value: stats ? stats.activeTeachers.value.toString() : "0",
      title: "Active teachers",
      subtext: subjectCoverage.total > 0
        ? subjectCoverage.assigned === subjectCoverage.total
          ? `All ${subjectCoverage.total} subjects assigned`
          : `${subjectCoverage.assigned}/${subjectCoverage.total} subjects assigned`
        : "No teachers yet",
    },
    {
      key: "term",
      label: "Academic Term",
      icon: Calendar,
      iconBg: "bg-emerald-100 text-emerald-700",
      value: termInfo
        ? termInfo.weekNumber > 0
          ? `Term ${termInfo.term} · Week ${termInfo.weekNumber}`
          : `${termInfo.termName} upcoming`
        : "No term",
      title: termInfo
        ? termInfo.weekNumber > 0
          ? `${termInfo.termName} — Week ${termInfo.weekNumber} of ${termInfo.weeksCount}`
          : `${termInfo.termName} (${termInfo.weeksCount} weeks)`
        : "Set up your academic calendar",
      subtext: termInfo ? `Next event: ${termInfo.nextEvent}` : "Add terms in Academic Calendar",
    },
    {
      key: "cbc",
      label: "CBC Assessment",
      icon: BookOpen,
      iconBg: "bg-amber-100 text-amber-700",
      value: `${cbcReadiness.percent}%`,
      title: "CBC assessment readiness",
      subtext: cbcReadiness.pending > 0
        ? `${cbcReadiness.pending} pending teacher reviews`
        : cbcReadiness.total > 0
          ? "All submissions reviewed"
          : "No assessments yet",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map(({ key, label, icon: Icon, iconBg, value, title, subtext }) => (
        <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 group hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs md:text-sm font-medium text-slate-500">{label}</p>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-slate-900 break-words" title={title}>{value}</p>
          <p className="text-xs text-slate-500 mt-1" title={subtext}>{subtext}</p>
        </div>
      ))}
    </div>
  )
}
