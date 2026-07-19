"use client"

import { Award, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Submission {
  id: string
  title: string
  subject: string
  studentName?: string
  grade?: number | null
}

interface RecentSubmissionsProps {
  submissions: Submission[]
  loading: boolean
}

export default function RecentSubmissionsPanel({ submissions, loading }: RecentSubmissionsProps) {
  return (
    <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Recent Submissions
          </CardTitle>
          <Link href="/teacher/assignments">
            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-6">
            <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent submissions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.slice(0, 4).map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-green-100">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{sub.title}</p>
                  <p className="text-xs text-gray-500">{sub.subject} · {sub.studentName || "Student"}</p>
                </div>
                {sub.grade !== null && sub.grade !== undefined && (
                  <span className="text-sm font-bold text-green-600">{Math.round(sub.grade)}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
