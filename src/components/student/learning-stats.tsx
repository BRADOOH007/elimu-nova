"use client"

import { Clock, CheckCircle, Star, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface LearningStatsProps {
  studyTime: number
  completedAssignments: number
  averageGrade: number | null
  activeAssignments: number
}

export default function LearningStats({ studyTime, completedAssignments, averageGrade, activeAssignments }: LearningStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Study Time</p>
              <p className="text-3xl font-bold">{Math.round(studyTime / 60)}h</p>
              <p className="text-blue-200 text-xs">This week</p>
            </div>
            <Clock className="w-8 h-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold">{completedAssignments}</p>
              <p className="text-green-200 text-xs">Assignments</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Average Grade</p>
              <p className="text-3xl font-bold">
                {averageGrade ? Math.round(averageGrade) : "N/A"}%
              </p>
              <p className="text-yellow-200 text-xs">This week</p>
            </div>
            <Star className="w-8 h-8 text-yellow-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Active</p>
              <p className="text-3xl font-bold">{activeAssignments}</p>
              <p className="text-pink-200 text-xs">Assignments</p>
            </div>
            <AlertCircle className="w-8 h-8 text-pink-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
