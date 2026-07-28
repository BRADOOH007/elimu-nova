"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"

interface SkillMasteryItem {
  skillName: string
  skillCategory: string
  masteryScore: number
  timesCorrect: number
  timesTested: number
}

interface SkillMasteryWidgetProps {
  skills: SkillMasteryItem[]
}

function masteryColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

function masteryTextColor(score: number): string {
  if (score >= 80) return "text-green-600"
  if (score >= 50) return "text-yellow-600"
  return "text-red-600"
}

function categoryColor(cat: string): string {
  switch (cat) {
    case "knowledge": return "bg-blue-100 text-blue-700"
    case "comprehension": return "bg-purple-100 text-purple-700"
    case "application": return "bg-amber-100 text-amber-700"
    default: return "bg-slate-100 text-slate-700"
  }
}

export default function SkillMasteryWidget({ skills }: SkillMasteryWidgetProps) {
  if (!skills || skills.length === 0) return null

  const weakSkills = skills.filter(s => s.masteryScore < 50)
  const improvingSkills = skills.filter(s => s.masteryScore >= 50 && s.masteryScore < 80)
  const masteredSkills = skills.filter(s => s.masteryScore >= 80)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-500" />
          Skill Mastery Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {weakSkills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mb-2">
              <AlertCircle className="w-3 h-3" /> Needs Practice ({weakSkills.length})
            </p>
            <div className="space-y-2">
              {weakSkills.map(s => (
                <div key={s.skillName} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-slate-700 truncate">{s.skillName}</span>
                      <span className={`text-xs font-bold ${masteryTextColor(s.masteryScore)}`}>{s.masteryScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${masteryColor(s.masteryScore)}`} style={{ width: `${s.masteryScore}%` }} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryColor(s.skillCategory)}`}>{s.skillCategory}</span>
                      <span className="text-[10px] text-slate-400">{s.timesCorrect}/{s.timesTested} correct</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {improvingSkills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-yellow-600 flex items-center gap-1 mb-2">
              <TrendingUp className="w-3 h-3" /> Improving ({improvingSkills.length})
            </p>
            <div className="space-y-2">
              {improvingSkills.map(s => (
                <div key={s.skillName} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-slate-700 truncate">{s.skillName}</span>
                      <span className={`text-xs font-bold ${masteryTextColor(s.masteryScore)}`}>{s.masteryScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${masteryColor(s.masteryScore)}`} style={{ width: `${s.masteryScore}%` }} />
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryColor(s.skillCategory)}`}>{s.skillCategory}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {masteredSkills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-600 flex items-center gap-1 mb-2">
              <CheckCircle className="w-3 h-3" /> Mastered ({masteredSkills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {masteredSkills.map(s => (
                <span key={s.skillName} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                  {s.skillName}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
