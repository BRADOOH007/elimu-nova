"use client"

import { Mail, MessageSquare, Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface MessagesOverviewProps {
  unreadCount: number
  hasSession: boolean
}

export default function MessagesOverview({ unreadCount, hasSession }: MessagesOverviewProps) {
  return (
    <Card className="bg-gradient-to-br from-white via-purple-50 to-violet-50 shadow-lg border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Messages
          </CardTitle>
          <Link href="/teacher/messages">
            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {hasSession ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/70 border border-purple-100">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "No unread messages"}
                </p>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? "Check your inbox for new messages" : "All caught up!"}
                </p>
              </div>
            </div>
            <Link href="/teacher/messages">
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Messages
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
