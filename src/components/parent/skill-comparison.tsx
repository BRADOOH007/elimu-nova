"use client"

import { Brain, Zap, TrendingUp } from "lucide-react"

interface SkillSummary {
  skillName: string; skillCategory: string; masteryScore: number; timesCorrect: number; timesTested: number
}

interface ProgressSummary {
  xp: number; streak: number; masteryScore: number; consecutiveCorrect: number
  totalQuestions: number; correctAnswers: number; skillMastery: SkillSummary[]
}

interface ChildSummary {
  id: string; name: string; grade: string; school: string
  averageGrade: number | null; pendingAssignments: number
  completedAssignments: number; streakDays: number
  progress: ProgressSummary | null
}

interface SkillComparisonProps {
  children: ChildSummary[]
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}

function scoreText(score: number): string {
  if (score >= 80) return "text-emerald-600"
  if (score >= 50) return "text-amber-600"
  return "text-red-600"
}

export default function SkillComparison({ children }: SkillComparisonProps) {
  const withProgress = children.filter(c => c.progress?.skillMastery && c.progress.skillMastery.length > 0)
  if (withProgress.length === 0) return null

  const allSkills = [...new Set(withProgress.flatMap(c => c.progress!.skillMastery.map(s => s.skillName)))]

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Brain className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Skill Comparison</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {withProgress.map(child => {
          const p = child.progress!
          const accuracy = p.totalQuestions > 0 ? Math.round((p.correctAnswers / p.totalQuestions) * 100) : 0
          return (
            <div key={child.id} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-800 text-sm">{child.name}</p>
                <span className={`text-sm font-bold ${scoreText(p.masteryScore)}`}>{p.masteryScore}%</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{p.xp} XP</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{accuracy}% acc</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full ${scoreColor(p.masteryScore)} transition-all`} style={{ width: `${p.masteryScore}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {allSkills.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-3 font-semibold text-slate-600">Skill</th>
                {withProgress.map(child => (
                  <th key={child.id} className="text-center py-2 px-2 font-semibold text-slate-600 min-w-[90px]">{child.name.split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allSkills.map(skillName => (
                <tr key={skillName} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-3 text-slate-700 font-medium truncate max-w-[160px]">{skillName}</td>
                  {withProgress.map(child => {
                    const skill = child.progress!.skillMastery.find(s => s.skillName === skillName)
                    const score = skill?.masteryScore ?? 0
                    return (
                      <td key={child.id} className="text-center py-2 px-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${score}%` }} />
                          </div>
                          <span className={`font-semibold ${scoreText(score)} w-6`}>{score}%</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
