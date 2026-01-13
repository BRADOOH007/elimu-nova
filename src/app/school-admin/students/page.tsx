"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  User,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  ArrowLeft,
  Loader2,
  GraduationCap
} from "lucide-react"
import EnrollStudentModal from "@/components/modals/enroll-student-modal"
import EditStudentModal from "@/components/modals/edit-student-modal"
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  name: string
  email: string
  teacher: string
  class?: string
  status: string
  joinDate: string
  phone?: string
  address?: string
  grade?: string
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/school-admin/students')
      
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        console.error('Failed to fetch students')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollSuccess = () => {
    fetchStudents()
    setIsEnrollModalOpen(false)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchStudents()
    setIsEditModalOpen(false)
    setSelectedStudent(null)
  }

  const handleDeleteStudent = async (studentId: string) => {
    // Confirmation removed - using toast notifications only
    try {
      const response = await fetch(`/api/school-admin/students/${studentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setStudents(prev => prev.filter(s => s.id !== studentId))
        toast.success('Student deleted successfully')
      } else {
        toast.error('Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error('Failed to delete student')
    }
  }