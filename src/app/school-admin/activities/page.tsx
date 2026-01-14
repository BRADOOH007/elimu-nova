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
  Bell, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  UserPlus,
  Users,
  BookOpen,
  CreditCard,
  Calendar,
  LogIn,
  LogOut,
  Settings,
  FileText,
  Loader2,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal
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

interface ActivityFilters {
  search: string
  type: string
  sortBy: string
  sortOrder: string
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    type: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const { toast } = useToast()

  const fetchActivities = async () => {
    try {
      setLoading(true)
      
      // First test if the API is working
      const testResponse = await fetch('/api/test-activities')
      if (!testResponse.ok) {
        throw new Error('API test failed')
      }
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.type && filters.type !== 'all' && { type: filters.type })
      })

      const response = await fetch(`/api/school-admin/activities?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        })
      } else {
        // Check if response is HTML (error page)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          console.error('Received HTML instead of JSON:', await response.text())
          toast({
            title: "Server Error",
            description: "The server returned an error page. Please try again later.",
            variant: "destructive"
          })
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          toast({
            title: "Error",
            description: errorData.error || "Failed to fetch activities",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. The API might be down.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [pagination.page, filters])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TEACHER_ENROLLED':
        return <UserPlus className="w-4 h-4 text-blue-500" />
      case 'STUDENT_ENROLLED':
        return <Users className="w-4 h-4 text-green-500" />
      case 'CLASS_CREATED':
        return <BookOpen className="w-4 h-4 text-purple-500" />
      case 'PAYMENT_RECEIVED':
        return <CreditCard className="w-4 h-4 text-emerald-500" />
      case 'MEETING_SCHEDULED':
        return <Calendar className="w-4 h-4 text-orange-500" />
      case 'USER_LOGIN':
        return <LogIn className="w-4 h-4 text-indigo-500" />
      case 'USER_LOGOUT':
        return <LogOut className="w-4 h-4 text-gray-500" />
      case 'SETTINGS_UPDATED':
        return <Settings className="w-4 h-4 text-yellow-500" />
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

  const handleFilterChange = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleCreateActivity = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsEditModalOpen(true)
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return
    }

    try {
      const response = await fetch(`/api/school-admin/activities/${activityId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Activity deleted successfully",
        })
        fetchActivities()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete activity",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  const handleActivityCreated = () => {
    fetchActivities()
  }

  const handleActivityUpdated = () => {
    fetchActivities()
  }

  const exportActivities = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export",
      description: "Export functionality will be implemented soon",
    })
  }

  const activityTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'TEACHER_ENROLLED', label: 'Teacher Enrolled' },
    { value: 'STUDENT_ENROLLED', label: 'Student Enrolled' },
    { value: 'CLASS_CREATED', label: 'Class Created' },
    { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
    { value: 'MEETING_SCHEDULED', label: 'Meeting Scheduled' },
    { value: 'USER_LOGIN', label: 'User Login' },
    { value: 'USER_LOGOUT', label: 'User Logout' },
    { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
    { value: 'REPORT_GENERATED', label: 'Report Generated' },
    { value: 'OTHER', label: 'Other' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold edugenius-text-gradient-blue">Recent Activities</h1>
          <p className="text-gray-600 mt-1">Monitor all school activities and events</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportActivities}
            className="edugenius-glass"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch('/api/seed-activities', { method: 'POST' })
                if (response.ok) {
                  toast({
                    title: "Success",
                    description: "Sample activities created successfully",
                  })
                  fetchActivities()
                } else {
                  toast({
                    title: "Error",
                    description: "Failed to create sample activities",
                    variant: "destructive"
                  })
                }
              } catch (error) {
                console.error('Error creating sample activities:', error)
                toast({
                  title: "Error",
                  description: "An unexpected error occurred",
                  variant: "destructive"
                })
              }
            }}
            className="edugenius-glass"
          >
            <Plus className="w-4 h-4 mr-2" />
            Seed Data
          </Button>
          <Button
            onClick={handleCreateActivity}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Activity
          </Button>
          <Button
            onClick={fetchActivities}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="edugenius-text-gradient-blue">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 edugenius-glass"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className="edugenius-glass">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => handleFilterChange('sortOrder', value)}
              >
                <SelectTrigger className="edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="edugenius-text-gradient-blue">Activities</CardTitle>
          <CardDescription>
            Showing {activities.length} of {pagination.total} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
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
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          {activity.metadata && (
                            <p className="text-xs text-gray-500 mt-1">
                              {JSON.stringify(activity.metadata)}
                            </p>
                          )}
                        </div>
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
                        <div>
                          <p className="text-sm">{formatTimeAgo(activity.createdAt)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
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

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="edugenius-glass"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="edugenius-glass"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-500">No activities match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
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
