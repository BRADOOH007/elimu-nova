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
  Calendar, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { ScheduleMeetingModal } from "@/components/modals/schedule-meeting-modal"
import { useRouter } from 'next/navigation'

interface Meeting {
  id: string
  title: string
  description?: string
  date: string
  time: string
  duration: number
  location?: string
  status: string
  attendees?: any
  createdBy: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function MeetingsPage() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/school-admin/meetings')
      
      if (response.ok) {
        const data = await response.json()
        setMeetings(data.meetings || [])
      } else {
        console.error('Failed to fetch meetings')
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSuccess = () => {
    fetchMeetings()
    setIsScheduleModalOpen(false)
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    // Confirmation removed - using toast notifications only
    try {
      const response = await fetch(`/api/school-admin/meetings/${meetingId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setMeetings(prev => prev.filter(m => m.id !== meetingId))
        toast.success('Meeting deleted successfully')
      } else {
        toast.error('Failed to delete meeting')
      }
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast.error('Failed to delete meeting')
    }
  }