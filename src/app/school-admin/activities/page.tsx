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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Bell, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  FileText,
  Users,
  GraduationCap,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import CreateActivityModal from "@/components/modals/create-activity-modal"
import EditActivityModal from "@/components/modals/edit-activity-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Activity {
  id: string
  type: string
  action: string
  description: string
  metadata: any
  user: {
    name: string
    email: string
    role: string
  } | null
  createdAt: string
}

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  location: string
  attendees: string
  status: string
}

interface Report {
  id: string
  title: string
  type: string
  date: string
  status: string
  fileUrl?: string
}

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState('activities')
  const [activities, setActivities] = useState<Activity[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [activitiesRes] = await Promise.all([
        fetch('/api/school-admin/activities')
      ])

      if (activitiesRes.ok) {
        const data = await activitiesRes.json()
        setActivities(data.activities || [])
      }

      // Mock meetings and reports for now
      setMeetings([
        { id: '1', title: 'Parent-Teacher Meeting', date: '2026-06-20', time: '10:00 AM', location: 'Room 101', attendees: '20', status: 'Scheduled' },
        { id: '2', title: 'Staff Meeting', date: '2026-06-21', time: '02:00 PM', location: 'Main Hall', attendees: '15', status: 'Scheduled' }
      ])

      setReports([
        { id: '1', title: 'Term 1 Performance Report', type: 'Academic', date: '2026-06-15', status: 'Generated' },
        { id: '2', title: 'Attendance Report', type: 'Attendance', date: '2026-06-10', status: 'Generated' }
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TEACHER_ENROLLED':
      case 'STUDENT_ENROLLED':
        return <Users className="w-4 h-4 text-blue-500" />
      case 'CLASS_CREATED':
        return <GraduationCap className="w-4 h-4 text-purple-500" />
      case 'MEETING_SCHEDULED':
        return <Calendar className="w-4 h-4 text-orange-500" />
      case 'REPORT_GENERATED':
        return <FileText className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handleCreateActivity = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsEditModalOpen(true)
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return

    try {
      const response = await fetch(`/api/school-admin/activities/${activityId}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: 'Activity deleted successfully', variant: 'success' })
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  const handleActivityCreated = () => fetchData()
  const handleActivityUpdated = () => fetchData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Academics</span>
          </h1>
          <p className="text-gray-600">Manage schedules, reports, and school activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleCreateActivity}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="activities">
            <Bell className="w-4 h-4 mr-2" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Calendar className="w-4 h-4 mr-2" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-6">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-blue-600">Activities</CardTitle>
              <CardDescription>All school activities and events</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none">
                      <TableHead className="border-none">Type</TableHead>
                      <TableHead className="border-none">Description</TableHead>
                      <TableHead className="border-none">User</TableHead>
                      <TableHead className="border-none">Date</TableHead>
                      <TableHead className="border-none">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id} className="border-none">
                        <TableCell className="border-none">
                          <div className="flex items-center space-x-2">
                            {getActivityIcon(activity.type)}
                            <span className="text-sm font-medium">{activity.action}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-none">
                          <p className="text-sm">{activity.description}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          {activity.user ? (
                            <div>
                              <p className="text-sm font-medium">{activity.user.name}</p>
                              <p className="text-xs text-gray-500">{activity.user.role}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">System</span>
                          )}
                        </TableCell>
                        <TableCell className="border-none">
                          <p className="text-sm">{formatTimeAgo(activity.createdAt)}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteActivity(activity.id)}
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
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-6">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-blue-600">Meetings</CardTitle>
              <CardDescription>School meetings and schedules</CardDescription>
            </CardHeader>
            <CardContent>
              {meetings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none">
                      <TableHead className="border-none">Title</TableHead>
                      <TableHead className="border-none">Date</TableHead>
                      <TableHead className="border-none">Time</TableHead>
                      <TableHead className="border-none">Location</TableHead>
                      <TableHead className="border-none">Attendees</TableHead>
                      <TableHead className="border-none">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map((meeting) => (
                      <TableRow key={meeting.id} className="border-none">
                        <TableCell className="border-none">
                          <p className="text-sm font-medium">{meeting.title}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <p className="text-sm">{meeting.date}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <p className="text-sm">{meeting.time}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <p className="text-sm">{meeting.location}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <p className="text-sm">{meeting.attendees}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {meeting.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-blue-600">Reports</CardTitle>
              <CardDescription>Academic and administrative reports</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none">
                      <TableHead className="border-none">Title</TableHead>
                      <TableHead className="border-none">Type</TableHead>
                      <TableHead className="border-none">Date</TableHead>
                      <TableHead className="border-none">Status</TableHead>
                      <TableHead className="border-none">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id} className="border-none">
                        <TableCell className="border-none">
                          <p className="text-sm font-medium">{report.title}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <p className="text-sm">{report.type}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <p className="text-sm">{report.date}</p>
                        </TableCell>
                        <TableCell className="border-none">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {report.status}
                          </span>
                        </TableCell>
                        <TableCell className="border-none">
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onActivityCreated={handleActivityCreated}
      />
      
      <EditActivityModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedActivity(null)
        }}
        onActivityUpdated={handleActivityUpdated}
        activity={selectedActivity}
      />
    </div>
  )
}
