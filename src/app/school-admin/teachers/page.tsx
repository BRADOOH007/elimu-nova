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
  GraduationCap,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { EnrollTeacherModal } from "@/components/modals/enroll-teacher-modal"
import { EditTeacherModal } from "@/components/modals/edit-teacher-modal"
import { useRouter } from 'next/navigation'

interface Teacher {
  id: string
  name: string
  email: string
  students: number
  status: string
  joinDate: string
  subjects: string[]
  phone?: string
  address?: string
}

export default function TeachersPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/school-admin/teachers')
      
      if (response.ok) {
        const data = await response.json()
        setTeachers(data.teachers || [])
      } else {
        console.error('Failed to fetch teachers')
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollSuccess = () => {
    fetchTeachers()
    setIsEnrollModalOpen(false)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchTeachers()
    setIsEditModalOpen(false)
    setSelectedTeacher(null)
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    // Confirmation removed - using toast notifications only
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTeachers(prev => prev.filter(t => t.id !== teacherId))
        toast.success('Teacher deleted successfully')
      } else {
        toast.error('Failed to delete teacher')
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error('Failed to delete teacher')
    }
  }