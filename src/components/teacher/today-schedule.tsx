"use client"

import { Calendar, MapPin, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ScheduleItem {
  id: string
  title: string
  startTime: string
  class?: { name: string }
  location?: string
  type: string
}

interface TodayScheduleProps {
  schedules: ScheduleItem[]
  loading: boolean
}

export default function TodaySchedule({ schedules, loading }: TodayScheduleProps) {
  return (
    <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today&apos;s Schedule
          </CardTitle>
          <Link href="/teacher/calendar">
            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />)}
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No classes scheduled today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-blue-100">
                <div className="w-14 text-center shrink-0">
                  <p className="text-xs font-bold text-blue-600">
                    {new Date(item.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {item.class && <span>{item.class.name}</span>}
                    {item.location && <><span>·</span><MapPin className="w-3 h-3" />{item.location}</>}
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  item.type === "CLASS" ? "bg-blue-100 text-blue-700" :
                  item.type === "EXAM" ? "bg-red-100 text-red-700" :
                  "bg-green-100 text-green-700"
                }`}>{item.type}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
