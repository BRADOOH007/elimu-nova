'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Route, Target, TrendingUp, Calendar, CheckCircle, Lightbulb, BookOpen, Sparkles, Star, Zap } from 'lucide-react'

interface AITeacherInsights {
  currentLesson: {
    title: string
    subject: string
    progress: number
  }
  learningPath: {
    completed: string[]
    current: string
    upcoming: string[]
  }
  personalizedRecommendations: {
    focusAreas: string[]
    studyMethods: string[]
    timeAllocation: string[]
    resources: string[]
  }
  performanceAnalysis: {
    strengths: string[]
    improvements: string[]
    trends: string
  }
  aiTeachingPlan: {
    today: string[]
    thisWeek: string[]
    thisMonth: string[]
  }
}

interface Props {
  insights: AITeacherInsights | null
}

export default function AIInsightsCards({ insights }: Props) {
  if (!insights) return null

  return (
    <div className="space-y-4">
      {/* Learning Path */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-600" />
            Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.learningPath.completed.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-600 mb-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Completed
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.learningPath.completed.map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Current
              </p>
              <Badge className="bg-blue-100 text-blue-700 border-0">{insights.learningPath.current}</Badge>
            </div>
            {insights.learningPath.upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Upcoming
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.learningPath.upcoming.map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Teaching Plan */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            AI Teaching Plan
          </CardTitle>
          <CardDescription>Personalized daily, weekly, and monthly goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1.5">Today</p>
              <div className="space-y-1">
                {insights.aiTeachingPlan.today.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1.5">This Week</p>
              <div className="space-y-1">
                {insights.aiTeachingPlan.thisWeek.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-700 mb-1.5">This Month</p>
              <div className="space-y-1">
                {insights.aiTeachingPlan.thisMonth.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations + Performance combined */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Focus Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.personalizedRecommendations.focusAreas.map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{item}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Study Methods</p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.personalizedRecommendations.studyMethods.map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">{item}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Resources</p>
                <div className="flex flex-wrap gap-1.5">
                  {insights.personalizedRecommendations.resources.map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">{item}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.performanceAnalysis.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1.5 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Strengths
                  </p>
                  <div className="space-y-1">
                    {insights.performanceAnalysis.strengths.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {insights.performanceAnalysis.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Areas to Improve
                  </p>
                  <div className="space-y-1">
                    {insights.performanceAnalysis.improvements.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 italic mt-2">{insights.performanceAnalysis.trends}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
