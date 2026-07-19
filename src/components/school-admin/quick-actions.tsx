"use client"

import { UserPlus, Users, BookOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface QuickActionsProps {
  onEnrollTeacher: () => void
  onEnrollStudent: () => void
  onCreateClass: () => void
  onScheduleMeeting: () => void
}

export default function QuickActions({ onEnrollTeacher, onEnrollStudent, onCreateClass, onScheduleMeeting }: QuickActionsProps) {
  const router = useRouter()

  return (
    <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-gray-900">Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white justify-start" onClick={onEnrollTeacher}>
          <UserPlus className="w-4 h-4 mr-2" /> Enroll New Teacher
        </Button>
        <Button variant="outline" className="w-full border-gray-200 justify-start" onClick={onEnrollStudent}>
          <Users className="w-4 h-4 mr-2" /> Add New Student
        </Button>
        <Button variant="outline" className="w-full border-gray-200 justify-start" onClick={onCreateClass}>
          <BookOpen className="w-4 h-4 mr-2" /> Create New Class
        </Button>
        <Button variant="outline" className="w-full border-gray-200 justify-start" onClick={onScheduleMeeting}>
          <Calendar className="w-4 h-4 mr-2" /> Schedule Meeting
        </Button>
        <Button variant="outline" className="w-full border-gray-200 justify-start" onClick={() => router.push("/school-admin/credentials")}>
          <Users className="w-4 h-4 mr-2" /> Credential Generator
        </Button>
      </CardContent>
    </Card>
  )
}
