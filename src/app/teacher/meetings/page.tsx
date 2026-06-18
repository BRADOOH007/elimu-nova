'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calendar, 
  Search, 
  Clock, 
  MapPin, 
  User, 
  Users,
  Eye,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Video,
  Link2
} from 'lucide-react'

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  duration: number;
  location: string | null;
  status: string;
  attendees?: any;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  // Progress info
  progress: number;
  progressText: string;
  daysUntil: number;
  hoursUntil: number;
  minutesUntil: number;
  isUpcoming: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isThisWeek: boolean;
}

export default function TeacherMeetingsPage() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    zoomLink: ''
  })

  useEffect(() => {
    fetchMeetings()
  }, [])

  useEffect(() => {
    filterMeetings()
  }, [meetings, searchTerm, statusFilter, timeFilter])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teacher/meetings?includePast=true&limit=50')
      
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

  const filterMeetings = () => {
    let filtered = [...meetings]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(meeting =>
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === statusFilter)
    }

    // Time filter
    if (timeFilter === 'upcoming') {
      filtered = filtered.filter(meeting => meeting.isUpcoming)
    } else if (timeFilter === 'today') {
      filtered = filtered.filter(meeting => meeting.isToday)
    } else if (timeFilter === 'tomorrow') {
      filtered = filtered.filter(meeting => meeting.isTomorrow)
    } else if (timeFilter === 'thisWeek') {
      filtered = filtered.filter(meeting => meeting.isThisWeek)
    } else if (timeFilter === 'past') {
      filtered = filtered.filter(meeting => !meeting.isUpcoming)
    }

    setFilteredMeetings(filtered)
  }

  const formatMeetingDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Tomorrow'
    } else if (diffDays < 7) {
      return `In ${diffDays} days`
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatMeetingTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4 text-green-600" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-gray-600" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'POSTPONED':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'POSTPONED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateMeeting = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teacher/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMeeting.title,
          description: newMeeting.description,
          date: newMeeting.date,
          time: newMeeting.time,
          duration: newMeeting.duration,
          location: newMeeting.location,
          zoomLink: newMeeting.zoomLink
        }),
      })

      if (response.ok) {
        await fetchMeetings()
        setCreateDialogOpen(false)
        setNewMeeting({
          title: '',
          description: '',
          date: '',
          time: '',
          duration: 60,
          location: '',
          zoomLink: ''
        })
      }
    } catch (error) {
      console.error('Error creating meeting:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-600">Schedule and manage your live classes</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchMeetings} disabled={loading} variant="outline">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Live Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Live Class</DialogTitle>
                <DialogDescription>
                  Schedule a new live class with your students
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Class Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Math Lesson: Algebra"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="What will be covered in this class?"
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newMeeting.duration}
                    onChange={(e) => setNewMeeting({ ...newMeeting, duration: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zoomLink">Zoom Link</Label>
                  <Input
                    id="zoomLink"
                    placeholder="https://zoom.us/j/..."
                    value={newMeeting.zoomLink}
                    onChange={(e) => setNewMeeting({ ...newMeeting, zoomLink: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={handleCreateMeeting}
                >
                  Create Class
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-gray-500">
              <Filter className="w-4 h-4 mr-2" />
              {filteredMeetings.length} of {meetings.length} meetings
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading meetings...</span>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <Card className="bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || timeFilter !== 'all'
                  ? 'Try adjusting your filters to see more meetings.'
                  : 'No meetings have been scheduled yet.'}
              </p>
              {(searchTerm || statusFilter !== 'all' || timeFilter !== 'all') && (
                <Button 
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setTimeFilter('all')
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      meeting.isToday ? 'bg-red-500' :
                      meeting.isTomorrow ? 'bg-orange-500' :
                      meeting.isThisWeek ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}>
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(meeting.status)}`}>
                            {getStatusIcon(meeting.status)}
                            <span className="ml-1">{meeting.status.replace('_', ' ')}</span>
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            meeting.isToday ? 'bg-red-100 text-red-800' :
                            meeting.isTomorrow ? 'bg-orange-100 text-orange-800' :
                            meeting.isThisWeek ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {meeting.progressText}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{formatMeetingDate(meeting.date)} at {formatMeetingTime(meeting.time)}</span>
                        </div>
                        
                        {meeting.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{meeting.duration} minutes</span>
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="text-gray-700 mb-4">{meeting.description}</p>
                      )}

                      {meeting.location && (
                        <div className="mb-4 flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-blue-600" />
                          <a 
                            href={meeting.location} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {meeting.location}
                          </a>
                        </div>
                      )}

                      {/* Progress Bar for Scheduled Meetings */}
                      {meeting.status === 'SCHEDULED' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Meeting Progress</span>
                            <span>{meeting.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${
                                meeting.isToday ? 'bg-red-500' :
                                meeting.isTomorrow ? 'bg-orange-500' :
                                meeting.isThisWeek ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${meeting.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>Created by {meeting.creator.firstName} {meeting.creator.lastName}</span>
                        </div>
                        
                        {meeting.attendees && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{Array.isArray(meeting.attendees) ? meeting.attendees.length : 0} attendees</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => router.push(`/teacher/meetings/${meeting.id}`)}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      {meeting.status === 'IN_PROGRESS' ? 'Join' : 'Start'}
                    </Button>
                    {meeting.location && (
                      <a 
                        href={meeting.location} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          <Video className="w-4 h-4 mr-1" />
                          Zoom
                        </Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}