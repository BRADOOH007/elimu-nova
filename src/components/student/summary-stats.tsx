"use client"

import { BookOpen, Calendar, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StudentSummaryStatsProps {
  learningAreasCount: number
  currentTerm: number
  gradeLevel: string
}

export default function StudentSummaryStats({ learningAreasCount, currentTerm, gradeLevel }: StudentSummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
      <Card className="relative overflow-hidden border border-blue-100 shadow-xl bg-gradient-to-br from-white to-blue-50">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BookOpen className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Learning Areas</p>
              <p className="text-3xl font-bold text-gray-900">{learningAreasCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border border-purple-100 shadow-xl bg-gradient-to-br from-white to-purple-50">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Calendar className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Current Term</p>
              <p className="text-3xl font-bold text-gray-900">Term {currentTerm}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border border-green-100 shadow-xl bg-gradient-to-br from-white to-green-50">
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <GraduationCap className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Grade Level</p>
              <p className="text-3xl font-bold text-gray-900">{gradeLevel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
