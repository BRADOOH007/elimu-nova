"use client"

import { Bell, UserPlus, Users, BookOpen, CreditCard, Calendar, LogIn, LogOut, Settings, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Activity {
  id: string; type: string; description: string; createdAt: string
  user: { name: string; email: string; role: string } | null
}

interface SchoolInfo {
  name: string; address: string; package: string
  subscription: { packageName: string; status: string; amount: number; daysRemaining: number }
  packagePrice: number
}

interface SchoolInfoPanelProps {
  schoolInfo: SchoolInfo | null
  activities: Activity[]
  formatCurrency: (amount: number) => string
}

function getActivityIcon(type: string) {
  const icons: Record<string, any> = {
    TEACHER_ENROLLED: UserPlus, STUDENT_ENROLLED: Users, CLASS_CREATED: BookOpen,
    PAYMENT_RECEIVED: CreditCard, MEETING_SCHEDULED: Calendar, USER_LOGIN: LogIn,
    USER_LOGOUT: LogOut, SETTINGS_UPDATED: Settings, REPORT_GENERATED: FileText,
  }
  const Icon = icons[type] || Bell
  const colors: Record<string, string> = {
    TEACHER_ENROLLED: "text-blue-500", STUDENT_ENROLLED: "text-green-500",
    CLASS_CREATED: "text-purple-500", PAYMENT_RECEIVED: "text-emerald-500",
    MEETING_SCHEDULED: "text-orange-500",
  }
  return <Icon className={`w-4 h-4 ${colors[type] || "text-gray-500"}`} />
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const secs = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (secs < 60) return "Just now"
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`
  return date.toLocaleDateString()
}

export default function SchoolInfoPanel({ schoolInfo, activities, formatCurrency }: SchoolInfoPanelProps) {
  return (
    <>
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-gray-900">School Information</CardTitle>
          <CardDescription>Current school details and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600 flex-shrink-0">School Name</span>
            <span className="text-sm font-medium text-gray-900 text-right truncate">{schoolInfo?.name || "Loading..."}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600 flex-shrink-0">Location</span>
            <span className="text-sm text-gray-600 text-right truncate">{schoolInfo?.address || "Loading..."}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600 flex-shrink-0">Package</span>
            <span className="text-sm text-green-600 font-medium truncate">{schoolInfo?.subscription?.packageName || "Loading..."}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600 flex-shrink-0">Subscription</span>
            <span className={`text-sm font-medium truncate ${schoolInfo?.subscription?.status === "ACTIVE" ? "text-green-600" : "text-red-600"}`}>
              {schoolInfo?.subscription?.status || "Loading..."}
            </span>
          </div>
          {schoolInfo?.subscription?.amount && schoolInfo.subscription.amount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-600 flex-shrink-0">Package Price</span>
              <span className="text-sm text-blue-600 font-medium">{formatCurrency(schoolInfo.subscription.amount)}</span>
            </div>
          )}
          {schoolInfo?.subscription?.daysRemaining !== undefined && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-600 flex-shrink-0">Days Remaining</span>
              <span className={`text-sm font-medium ${
                schoolInfo.subscription.daysRemaining <= 7 ? "text-red-600" :
                schoolInfo.subscription.daysRemaining <= 30 ? "text-amber-600" : "text-green-600"
              }`}>{schoolInfo.subscription.daysRemaining} days</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Activity</CardTitle>
          <CardDescription>Latest school activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length > 0 ? (
            activities.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center space-x-3 p-2 bg-gradient-to-r from-white/70 to-blue-50/70 rounded-lg shadow-sm">
                {getActivityIcon(a.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.description}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(a.createdAt)}{a.user && ` • by ${a.user.name}`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activities</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
