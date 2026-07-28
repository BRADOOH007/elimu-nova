"use client"

import { useState, useEffect } from "react"

interface Skill {
  name: string
  mastery: number
  category: string
}

interface Topic {
  name: string
  mastery: number
  subject: string
}

interface ProgressPageData {
  xp: number
  streak: number
  consecutiveCorrect: number
  totalQuestions: number
  correctAnswers: number
  skills: Skill[]
  topics: Topic[]
}

function masteryColor(score: number): string {
  if (score >= 75) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

function masteryLabel(score: number): string {
  if (score >= 75) return "text-green-600"
  if (score >= 40) return "text-yellow-600"
  return "text-red-600"
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressPageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/student/progress-page")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No progress data available yet.</p>
      </div>
    )
  }

  const accuracy = data.totalQuestions > 0
    ? Math.round((data.correctAnswers / data.totalQuestions) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">XP Earned</p>
              <p className="text-2xl font-bold text-gray-900">{data.xp.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Streak</p>
              <p className="text-2xl font-bold text-gray-900">{data.streak} days</p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Questions</p>
            <p className="text-xl font-bold text-gray-900">{data.totalQuestions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Correct</p>
            <p className="text-xl font-bold text-gray-900">{data.correctAnswers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Accuracy</p>
            <p className="text-xl font-bold text-gray-900">{accuracy}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Consecutive</p>
            <p className="text-xl font-bold text-gray-900">{data.consecutiveCorrect}</p>
          </div>
        </div>

        {/* Skill mastery breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Skill Mastery</h2>
          {data.skills.length === 0 ? (
            <p className="text-sm text-gray-400">No skills tracked yet.</p>
          ) : (
            <div className="space-y-4">
              {data.skills.map((skill, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate mr-2">{skill.name}</span>
                    <span className={`text-sm font-semibold whitespace-nowrap ${masteryLabel(skill.mastery)}`}>
                      {skill.mastery}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${masteryColor(skill.mastery)}`}
                      style={{ width: `${skill.mastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic mastery */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Topics</h2>
          {data.topics.length === 0 ? (
            <p className="text-sm text-gray-400">No topics studied yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.topics.slice(0, 6).map((topic, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{topic.name}</p>
                      <p className="text-xs text-gray-400 truncate">{topic.subject}</p>
                    </div>
                    <span className={`text-sm font-bold ml-2 ${masteryLabel(topic.mastery)}`}>
                      {topic.mastery}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${masteryColor(topic.mastery)}`}
                      style={{ width: `${topic.mastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
