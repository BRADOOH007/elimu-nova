"use client"

import { UserPlus, Users, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface QuickActionsProps {
  onEnrollTeacher: () => void
  onEnrollStudent: () => void
}

export default function QuickActions({ onEnrollTeacher, onEnrollStudent }: QuickActionsProps) {
  const router = useRouter()

  return (
    <Card className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-900">Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start" onClick={onEnrollTeacher}>
          <UserPlus className="w-4 h-4 mr-2" /> Enroll New Teacher
        </Button>
        <Button variant="outline" className="w-full border-gray-200 justify-start" onClick={onEnrollStudent}>
          <Users className="w-4 h-4 mr-2" /> Add New Student
        </Button>
        <Button variant="outline" className="w-full border-gray-200 justify-start" onClick={() => router.push("/school-admin/curriculum")}>
          <FileText className="w-4 h-4 mr-2" /> Generate CBC Assessment Sheet
        </Button>
        <Button variant="outline" className="w-full border-gray-200 justify-start" onClick={() => router.push("/school-admin/reports")}>
          <Printer className="w-4 h-4 mr-2" /> Print Report Cards
        </Button>
      </CardContent>
    </Card>
  )
}
