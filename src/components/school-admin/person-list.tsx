"use client"

import { GraduationCap, Users, MoreHorizontal, Edit, Trash2, UserCheck, UserX, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Person {
  id: string; name: string; email: string; status: string
}

interface Teacher extends Person {
  students: number; joinDate: string
}

interface Student extends Person {
  teacher: string; joinDate: string
}

interface PersonListProps {
  teachers: Teacher[]
  students: Student[]
  onEditTeacher: (t: Teacher) => void
  onEditStudent: (s: Student) => void
  onDeleteTeacher: (id: string) => void
  onDeleteStudent: (id: string) => void
  onToggleTeacherStatus: (id: string, status: string) => void
  onToggleStudentStatus: (id: string, status: string) => void
  onViewTeachers: () => void
  onViewStudents: () => void
}

export default function PersonList({
  teachers, students, onEditTeacher, onEditStudent, onDeleteTeacher, onDeleteStudent,
  onToggleTeacherStatus, onToggleStudentStatus, onViewTeachers, onViewStudents,
}: PersonListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="min-w-0">
            <CardTitle className="text-gray-900">Recent Teachers</CardTitle>
            <CardDescription>Latest teacher enrollments and activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-gray-200 shrink-0" onClick={onViewTeachers}>
            <Eye className="w-4 h-4 mr-2" /> View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {teachers.length > 0 ? teachers.map((t) => (
              <TeacherRow key={t.id} teacher={t} onEdit={() => onEditTeacher(t)} onDelete={() => onDeleteTeacher(t.id)} onToggle={() => onToggleTeacherStatus(t.id, t.status)} />
            )) : (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No teachers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="min-w-0">
            <CardTitle className="text-gray-900">Recent Students</CardTitle>
            <CardDescription>Latest student enrollments</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-gray-200 shrink-0" onClick={onViewStudents}>
            <Eye className="w-4 h-4 mr-2" /> View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {students.length > 0 ? students.map((s) => (
              <StudentRow key={s.id} student={s} onEdit={() => onEditStudent(s)} onDelete={() => onDeleteStudent(s.id)} onToggle={() => onToggleStudentStatus(s.id, s.status)} />
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No students found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TeacherRow({ teacher, onEdit, onDelete, onToggle }: { teacher: Teacher; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50/70 rounded-xl hover:bg-slate-50 transition-all">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{teacher.name}</h3>
          <p className="text-sm text-gray-600 truncate">{teacher.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <div className="text-left sm:text-right flex-1 sm:flex-initial">
          <p className="text-sm font-medium text-gray-900">{teacher.students} students</p>
          <p className="text-xs text-gray-500 truncate">Joined: {teacher.joinDate}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${teacher.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {teacher.status}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>{teacher.status === "Active" ? <><UserX className="w-4 h-4 mr-2" />Deactivate</> : <><UserCheck className="w-4 h-4 mr-2" />Activate</>}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function StudentRow({ student, onEdit, onDelete, onToggle }: { student: Student; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50/70 rounded-xl hover:bg-slate-50 transition-all">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
          <p className="text-sm text-gray-600 truncate">{student.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <div className="text-left sm:text-right flex-1 sm:flex-initial">
          <p className="text-sm font-medium text-gray-900 truncate">{student.teacher}</p>
          <p className="text-xs text-gray-500">Teacher</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${student.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {student.status}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>{student.status === "Active" ? <><UserX className="w-4 h-4 mr-2" />Deactivate</> : <><UserCheck className="w-4 h-4 mr-2" />Activate</>}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

