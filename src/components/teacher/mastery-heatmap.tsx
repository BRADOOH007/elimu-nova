"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, AlertTriangle, TrendingUp, Loader2, ChevronDown, ChevronUp } from "lucide-react"

interface SkillSummary {
  skillName: string
  skillCategory: string
  masteryScore: number
  timesTested: number
  timesCorrect: number
  lastPracticedAt: string | null
}

interface StudentMastery {
  id: string
  name: string
  masteryScore: number
  xp: number
  streak: number
  totalQuestions: number
  correctAnswers: number
  lastPracticedAt: string | null
  skills: SkillSummary[]
}

interface MasteryData {
  students: StudentMastery[]
  atRiskStudents: StudentMastery[]
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-50"
  if (score >= 50) return "bg-yellow-50"
  return "bg-red-50"
}

function scoreText(score: number): string {
  if (score >= 80) return "text-green-700"
  if (score >= 50) return "text-yellow-700"
  return "text-red-700"
}

export default function MasteryHeatmap() {
  const [data, setData] = useState<MasteryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/mastery-summary")
      if (res.ok) setData(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.students.length === 0) return null

  const classAvg = Math.round(data.students.reduce((s, st) => s + st.masteryScore, 0) / data.students.length)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-indigo-500" />
          Mastery Overview
          <Badge className="ml-auto bg-indigo-100 text-indigo-700 border-0">
            Class Avg: {classAvg}%
          </Badge>
          {data.atRiskStudents.length > 0 && (
            <Badge className="bg-red-100 text-red-700 border-0">
              {data.atRiskStudents.length} at risk
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.atRiskStudents.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-2">
              <AlertTriangle className="w-3 h-3" /> Needs attention
            </p>
            <div className="space-y-1">
              {data.atRiskStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-red-700">{s.name}</span>
                  <span className="text-red-600">{s.masteryScore}% mastery · {s.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          {data.students.map(student => {
            const isExpanded = expanded === student.id
            const accuracy = student.totalQuestions > 0 ? Math.round((student.correctAnswers / student.totalQuestions) * 100) : 0
            return (
              <div key={student.id}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : student.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${scoreColor(student.masteryScore)}`}>
                    {student.masteryScore}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.xp} XP · {student.streak} day streak</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                    <span className={scoreText(student.masteryScore)}>
                      {accuracy}% accuracy
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && student.skills.length > 0 && (
                  <div className="ml-11 mb-2 p-3 rounded-lg bg-slate-50 space-y-2">
                    {student.skills.map(skill => (
                      <div key={skill.skillName} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-slate-700 truncate">{skill.skillName}</span>
                            <span className={`text-xs font-bold ${scoreText(skill.masteryScore)}`}>{skill.masteryScore}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${scoreColor(skill.masteryScore)}`}
                              style={{ width: `${skill.masteryScore}%` }} />
                          </div>
                        </div>
                        <Badge className="bg-slate-200 text-slate-600 border-0 text-[10px] shrink-0">
                          {skill.skillCategory}
                        </Badge>
                      </div>
                    ))}
                    {student.skills.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No skill data yet</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
