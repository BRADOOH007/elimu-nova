"use client"

import { Bell, UserPlus, Users, BookOpen, CreditCard, Calendar, LogIn, LogOut, Settings, FileText, Award, Eye, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Activity {
  id: string; type: string; description: string; createdAt: string
  user: { name: string; email: string; role: string } | null
}

interface ActivityLogProps {
  activities: Activity[]
}

const ACTIVITY_ICONS: Record<string, { icon: LucideIcon; bg: string; label: string }> = {
  TEACHER_ENROLLED: { icon: UserPlus, bg: "bg-blue-50 text-blue-600", label: "Enrolment" },
  STUDENT_ENROLLED: { icon: Users, bg: "bg-emerald-50 text-emerald-600", label: "Enrolment" },
  CLASS_CREATED: { icon: BookOpen, bg: "bg-purple-50 text-purple-600", label: "Class" },
  PAYMENT_RECEIVED: { icon: CreditCard, bg: "bg-teal-50 text-teal-600", label: "Payment" },
  MEETING_SCHEDULED: { icon: Calendar, bg: "bg-orange-50 text-orange-600", label: "Meeting" },
  USER_LOGIN: { icon: LogIn, bg: "bg-slate-50 text-slate-500", label: "Login" },
  USER_LOGOUT: { icon: LogOut, bg: "bg-slate-50 text-slate-500", label: "Logout" },
  SETTINGS_UPDATED: { icon: Settings, bg: "bg-gray-50 text-gray-500", label: "Settings" },
  REPORT_GENERATED: { icon: FileText, bg: "bg-amber-50 text-amber-600", label: "Report" },
  ASSESSMENT_PUBLISHED: { icon: Award, bg: "bg-rose-50 text-rose-600", label: "Assessment" },
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ""
  const now = new Date()
  const secs = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (secs < 60) return "Just now"
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`
  return date.toLocaleDateString()
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <Card className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Bell className="w-5 h-5 text-indigo-600" />
            System Activity Log
          </CardTitle>
          <CardDescription>Recent administrative events and actions</CardDescription>
        </div>
        <Link href="/school-admin/activities">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            View All Activities <Eye className="w-3.5 h-3.5" />
          </span>
        </Link>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <ul className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {activities.slice(0, 10).map((a) => {
              const meta = ACTIVITY_ICONS[a.type] || { icon: Bell, bg: "bg-slate-100 text-slate-500", label: "Event" }
              const Icon = meta.icon
              return (
                <li key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug line-clamp-2">{a.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {formatTimeAgo(a.createdAt)}{a.user ? ` \u00b7 by ${a.user.name}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    {meta.label}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No recent activities</p>
            <p className="text-xs text-slate-400 mt-0.5">Activities will appear here as your school operates</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
