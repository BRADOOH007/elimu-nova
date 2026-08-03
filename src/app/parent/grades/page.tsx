'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface GradeEntry {
  id: string
  grade: number
  feedback: string | null
  gradedAt: string | null
  isAiGraded: boolean
  assignment: {
    id: string
    title: string
    subject: string
    type: string
    createdAt: string
  }
}

interface StudentGrades {
  studentName: string
  totalGrades: number
  averageGrade: number
  grades: GradeEntry[]
}

function GradesContent() {
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('studentId') || ''
  const [data, setData] = useState<StudentGrades[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = selectedId ? `/api/parent/grades?studentId=${selectedId}` : '/api/parent/grades'
    fetch(url)
      .then(r => r.json())
      .then(d => setData(d.students || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedId])

  const gradeColor = (g: number) => {
    if (g >= 70) return 'bg-emerald-100 text-emerald-700'
    if (g >= 50) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  const trendIcon = (g: number) => {
    if (g >= 70) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    if (g >= 50) return <Minus className="h-3.5 w-3.5 text-amber-500" />
    return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Grades</h1>
        <p className="text-sm text-slate-500 mt-0.5">View your children&apos;s graded assignments</p>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No grades yet</p>
            <p className="text-slate-400 text-sm mt-1">Grades will appear once assignments are marked</p>
          </CardContent>
        </Card>
      ) : (
        data.map((student) => (
          <Card key={student.studentName}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{student.studentName}</CardTitle>
                <div className="flex items-center gap-2">
                  {trendIcon(student.averageGrade)}
                  <Badge className={gradeColor(student.averageGrade)}>
                    Avg: {student.averageGrade.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-slate-500">{student.totalGrades} graded assignment{student.totalGrades !== 1 ? 's' : ''}</p>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {student.grades.map((g) => (
                  <div key={g.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{g.assignment.title}</p>
                      <p className="text-xs text-slate-500">
                        {g.assignment.subject} &middot; {g.assignment.type}
                      </p>
                      {g.feedback && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{g.feedback}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {g.isAiGraded && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">AI</Badge>
                      )}
                      <Badge className={gradeColor(g.grade)}>
                        {g.grade}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

export default function ParentGradesPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="h-8 w-48 bg-slate-200 rounded animate-pulse" /></div>}>
      <GradesContent />
    </Suspense>
  )
}
