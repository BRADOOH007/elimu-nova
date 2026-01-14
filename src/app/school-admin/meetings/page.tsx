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
    if (!confirm('Are you sure you want to delete this meeting?')) return

    try {
      const response = await fetch(`/api/school-admin/meetings/${meetingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMeetings(meetings.filter(meeting => meeting.id !== meetingId))
      } else {
        console.error('Failed to delete meeting')
      }
    } catch (error) {
      console.error('Error deleting meeting:', error)
    }
  }

  const handleUpdateStatus = async (meetingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/school-admin/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (response.ok) {
        fetchMeetings()
      } else {
        console.error('Failed to update meeting status')
      }
    } catch (error) {
      console.error('Error updating meeting status:', error)
    }
  }

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (meeting.description && meeting.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (meeting.location && meeting.location.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'POSTPONED':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'POSTPONED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading meetings...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="edugenius-text-gradient">Meetings Management</span>
            </h1>
            <p className="text-gray-600">Schedule and manage school meetings</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search meetings by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="POSTPONED">Postponed</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="edugenius-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Meetings Table */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="edugenius-text-gradient-blue">Meetings List</CardTitle>
          <CardDescription>
            {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMeetings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-none">
                    <TableHead className="border-none">Meeting</TableHead>
                    <TableHead className="border-none">Date & Time</TableHead>
                    <TableHead className="border-none">Duration</TableHead>
                    <TableHead className="border-none">Location</TableHead>
                    <TableHead className="border-none">Status</TableHead>
                    <TableHead className="border-none">Created By</TableHead>
                    <TableHead className="border-none">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeetings.map((meeting) => (
                    <TableRow key={meeting.id} className="border-none hover:bg-blue-50/50">
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{meeting.title}</p>
                            {meeting.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">{meeting.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{formatDate(meeting.date)}</p>
                            <p className="text-xs text-gray-500">{formatTime(meeting.time)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{meeting.duration} min</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        {meeting.location ? (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{meeting.location}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No location</span>
                        )}
                      </TableCell>
                      <TableCell className="border-none">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status)}`}>
                          {getStatusIcon(meeting.status)}
                          <span className="ml-1">{meeting.status.replace('_', ' ')}</span>
                        </span>
                      </TableCell>
                      <TableCell className="border-none">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{meeting.createdBy.name}</p>
                            <p className="text-xs text-gray-500">{meeting.createdBy.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-none">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {/* TODO: Edit meeting */}}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {meeting.status === 'SCHEDULED' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(meeting.id, 'IN_PROGRESS')}>
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Start Meeting
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(meeting.id, 'CANCELLED')}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                            {meeting.status === 'IN_PROGRESS' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(meeting.id, 'COMPLETED')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by scheduling your first meeting'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && (
                <Button 
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="edugenius-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule First Meeting
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  )
}
