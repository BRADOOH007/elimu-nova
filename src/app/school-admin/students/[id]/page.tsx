"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, School, Calendar, BookOpen, Users } from "lucide-react"

interface StudentDetail {
  id: string; name: string; email: string; phone?: string; address?: string
  status: string; joinDate: string
  class?: { id: string; name: string; grade: string; subject: string } | null
  teacher?: { id: string; name: string } | null
  credentials?: { password: string } | null
}

export default function SchoolAdminStudentDetailPage() {
  const router = useRouter(); const params = useParams()
  const studentId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) return
    fetch(`/api/school-admin/students/${studentId}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => { setStudent(data.student || data); setLoading(false) })
      .catch(() => { setError('Student not found'); setLoading(false) })
  }, [studentId])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (error || !student) return (
    <div className="max-w-4xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/school-admin/students')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error}</CardContent></Card>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push('/school-admin/students')}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{student.name}</h1>
                <p className="text-gray-600 flex items-center"><Mail className="w-4 h-4 mr-1" />{student.email}</p>
              </div>
            </div>
            <Badge className={student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{student.status}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {student.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{student.phone}</span></div>}
            {student.address && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span>{student.address}</span></div>}
            {student.class && <div className="flex items-center gap-2 text-sm"><School className="w-4 h-4 text-gray-400" /><span>{student.class.name} - {student.class.subject} (Grade {student.class.grade})</span></div>}
            {student.teacher && <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-gray-400" /><span>Teacher: {student.teacher.name}</span></div>}
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span>Joined {new Date(student.joinDate).toLocaleDateString()}</span></div>
          </div>
        </CardContent>
      </Card>

      {student.credentials?.password && (
        <Card className="border-0 shadow bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-800 mb-1">Login Credentials</p>
            <p className="font-mono text-sm">Username: {student.email}</p>
            <p className="font-mono text-sm">Password: {student.credentials.password}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
