"use client"

import { GraduationCap, Users, BookOpen, TrendingUp, Brain, Calendar, Clock, MapPin, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardStats {
  totalTeachers: { value: number; change: string }
  totalStudents: { value: number; change: string }
  activeClasses: { value: number; change: string }
  monthlyRevenue: { value: number; change: string }
  activeTeachers: { value: number; change: string }
}

interface Meeting {
  id: string; title: string; description?: string; date: string; time: string
  duration: number; location?: string; creator: string
}

interface SchoolOverviewProps {
  stats: DashboardStats | null
  upcomingMeetings: Meeting[]
}

export default function SchoolOverview({ stats, upcomingMeetings }: SchoolOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
      <Card className="bg-gradient-to-br from-white via-orange-50 to-amber-50 shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="w-5 h-5 text-orange-600" />
              Upcoming Meetings
            </CardTitle>
            <CardDescription>Scheduled meetings and events</CardDescription>
          </div>
          <Link href="/school-admin/meetings">
            <Button variant="outline" size="sm" className="border-gray-200">
              <Eye className="w-4 h-4 mr-1" /> View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No upcoming meetings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-orange-100">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.date).toLocaleDateString()} {m.time}</span>
                      {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                      <span>{m.duration}min</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">by {m.creator}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Brain className="w-5 h-5 text-green-600" />
            School Overview
          </CardTitle>
          <CardDescription>Quick snapshot of your school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Teachers", value: stats?.totalTeachers.value || 0, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-100" },
              { label: "Students", value: stats?.totalStudents.value || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
              { label: "Classes", value: stats?.activeClasses.value || 0, icon: BookOpen, color: "text-pink-600", bg: "bg-pink-100" },
              { label: "Active %", value: stats?.activeTeachers ? `${Math.round((stats.activeTeachers.value / Math.max(stats.totalTeachers.value, 1)) * 100)}%` : "—", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-white/70 border border-slate-100 text-center">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-1`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-lg font-bold text-slate-800">{s.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
          <Link href="/school-admin/reports">
            <Button variant="outline" size="sm" className="w-full mt-4 border-gray-200">
              View Reports
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
