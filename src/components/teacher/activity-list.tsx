"use client"

import { Activity, BookOpen, FileText, ClipboardList, Users, Calendar, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ActivityItem {
  id: string
  type: string
  action: string
  description: string
  time: string
  user: string
  metadata?: { activityType?: string }
}

interface ActivityListProps {
  activities: ActivityItem[]
  loading: boolean
  onRefresh: () => void
  onDelete: (id: string) => void
}

function ActivityIcon({ activity }: { activity: ActivityItem }) {
  const metaType = activity.metadata?.activityType
  const iconMap: Record<string, { icon: any; bg: string; color: string }> = {
    lesson_plan: { icon: BookOpen, bg: "bg-blue-100", color: "text-blue-600" },
    scheme_of_work: { icon: FileText, bg: "bg-orange-100", color: "text-orange-600" },
    assignment: { icon: ClipboardList, bg: "bg-purple-100", color: "text-purple-600" },
    STUDENT_ENROLLED: { icon: Users, bg: "bg-green-100", color: "text-green-600" },
    MEETING_SCHEDULED: { icon: Calendar, bg: "bg-pink-100", color: "text-pink-600" },
  }
  const match = iconMap[metaType || activity.type] || { icon: Activity, bg: "bg-gray-100", color: "text-gray-600" }
  const Icon = match.icon
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${match.bg}`}>
      <Icon className={`w-5 h-5 ${match.color}`} />
    </div>
  )
}

export default function ActivityList({ activities, loading, onRefresh, onDelete }: ActivityListProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          ) : (
            <Activity className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg border-0">
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/70 to-blue-50/70 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-48" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
              <p className="text-sm text-gray-500 mt-2">Your activities will appear here</p>
              <Button onClick={onRefresh} className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Activity className="w-4 h-4 mr-2" />
                Refresh Activities
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/70 to-blue-50/70 rounded-lg hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-4">
                    <ActivityIcon activity={a} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{a.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{new Date(a.time).toLocaleDateString()} at {new Date(a.time).toLocaleTimeString()}</span>
                        <span className="text-xs text-gray-400">by {a.user}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{a.action}</span>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(a.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
