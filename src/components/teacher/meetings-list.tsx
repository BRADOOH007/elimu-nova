"use client"

import { Calendar, Clock, MapPin, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Meeting {
  id: string
  title: string
  description: string | null
  date: string
  time: string
  duration: number
  location: string | null
  status: string
  progress: number
  progressText: string
  isToday: boolean
  isTomorrow: boolean
  isThisWeek: boolean
  creator: { firstName: string; lastName: string }
  attendees?: any
}

interface MeetingsListProps {
  meetings: Meeting[]
  loading: boolean
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < 7) return `In ${diffDays} days`
  return date.toLocaleDateString()
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(":")
  const hour = parseInt(hours)
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`
}

export default function MeetingsList({ meetings, loading }: MeetingsListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Upcoming Meetings</h2>
        <Link href="/teacher/meetings">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </Link>
      </div>
      <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg border-0">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              <span className="ml-2 text-gray-600">Loading meetings...</span>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming meetings scheduled</p>
              <p className="text-sm text-gray-500 mt-2">Check back later for new meetings</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {meetings.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/70 to-green-50/70 rounded-lg hover:shadow-md transition-all group">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      m.isToday ? "bg-red-500" : m.isTomorrow ? "bg-orange-500" : m.isThisWeek ? "bg-yellow-500" : "bg-green-500"
                    }`}>
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{m.title}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            m.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" :
                            m.status === "IN_PROGRESS" ? "bg-green-100 text-green-800" :
                            m.status === "COMPLETED" ? "bg-gray-100 text-gray-800" :
                            "bg-red-100 text-red-800"
                          }`}>{m.status.replace("_", " ")}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            m.isToday ? "bg-red-100 text-red-800" : m.isTomorrow ? "bg-orange-100 text-orange-800" :
                            m.isThisWeek ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                          }`}>{m.progressText}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" />{formatDate(m.date)} at {formatTime(m.time)}</span>
                        {m.location && <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{m.location}</span>}
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1" />{m.duration} min</span>
                      </div>
                      {m.status === "SCHEDULED" && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Meeting Progress</span><span>{m.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${m.isToday ? "bg-red-500" : m.isTomorrow ? "bg-orange-500" : m.isThisWeek ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${m.progress}%` }} />
                          </div>
                        </div>
                      )}
                      {m.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{m.description}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">Created by {m.creator.firstName} {m.creator.lastName}</p>
                        {m.attendees && <p className="text-xs text-gray-500">{Array.isArray(m.attendees) ? m.attendees.length : 0} attendees</p>}
                      </div>
                    </div>
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
