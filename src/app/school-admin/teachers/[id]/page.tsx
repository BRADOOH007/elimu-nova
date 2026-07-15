"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, Calendar, BookOpen, Users, School } from "lucide-react"

interface TeacherDetail {
  id: string; name: string; email: string; phone?: string; address?: string
  status: string; joinDate: string
  _count?: { students: number; classes: number; lessonPlans: number; schemesOfWork: number }
}

export default function SchoolAdminTeacherDetailPage() {
  const router = useRouter(); const params = useParams()
  const teacherId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teacherId) return
    fetch(`/api/school-admin/teachers/${teacherId}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => { setTeacher(data.teacher || data); setLoading(false) })
      .catch(() => { setError('Teacher not found'); setLoading(false) })
  }, [teacherId])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (error || !teacher) return (
    <div className="max-w-4xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/school-admin/teachers')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error}</CardContent></Card>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push('/school-admin/teachers')}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{teacher.name}</h1>
                <p className="text-gray-600 flex items-center"><Mail className="w-4 h-4 mr-1" />{teacher.email}</p>
              </div>
            </div>
            <Badge className={teacher.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{teacher.status}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {teacher.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{teacher.phone}</span></div>}
            {teacher.address && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span>{teacher.address}</span></div>}
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span>Joined {new Date(teacher.joinDate).toLocaleDateString()}</span></div>
          </div>
        </CardContent>
      </Card>

      {teacher._count && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow bg-gradient-to-br from-blue-50 to-indigo-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{teacher._count.students}</p><p className="text-xs text-gray-600">Students</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-green-50 to-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{teacher._count.classes}</p><p className="text-xs text-gray-600">Classes</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-purple-50 to-pink-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{teacher._count.lessonPlans}</p><p className="text-xs text-gray-600">Lesson Plans</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-amber-50 to-orange-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{teacher._count.schemesOfWork}</p><p className="text-xs text-gray-600">Schemes</p></CardContent></Card>
        </div>
      )}
    </div>
  )
}
