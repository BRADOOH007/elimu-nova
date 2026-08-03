"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateSchoolModal } from "@/components/modals/create-school-modal"
import { SchoolDetailsModal } from "@/components/modals/school-details-modal"
import { useToast } from "@/hooks/use-toast"
import { 
  Search,
  Filter,
  Plus,
  School,
  Users,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MapPin
} from "lucide-react"

interface School {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  website?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  schoolAdmin?: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
  teachers?: Array<{
    user: {
      firstName: string
      lastName: string
    }
  }>
  students?: Array<{
    id: string
  }>
  subscriptions?: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    isFreemium: boolean
    package: {
      name: string
      price: number
    }
  }>
}

interface SchoolsResponse {
  schools: School[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function SchoolsPage() {
  const { toast } = useToast()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Modals
  const [createSchoolOpen, setCreateSchoolOpen] = useState(false)
  const [schoolDetailsOpen, setSchoolDetailsOpen] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)

  // Fetch schools data
  const fetchSchools = async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/schools?${params}`)
      if (response.ok) {
        const data: SchoolsResponse = await response.json()
        setSchools(data.schools)
        setPagination(data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch schools data",
        })
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch schools data",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchSchools(1)
  }, [])

  // Handle search and filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSchools(1)
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, sortBy, sortOrder])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchSchools(newPage)
  }

  // Handle school selection
  const handleSchoolClick = (schoolId: string) => {
    setSelectedSchoolId(schoolId)
    setSchoolDetailsOpen(true)
  }

  // Handle school creation
  const handleSchoolCreated = (schoolData: School) => {
    setSchools(prev => [schoolData, ...prev])
    fetchSchools(pagination.page, true)
    toast({
      variant: "default",
      title: "School Created",
      description: "New school has been created successfully!",
    })
  }

  // Handle school update
  const handleSchoolUpdated = (schoolData: School) => {
    setSchools(prev => prev.map(school => 
      school.id === schoolData.id ? schoolData : school
    ))
    toast({
      variant: "default",
      title: "School Updated",
      description: "School information has been updated successfully!",
    })
  }

  // Handle school deletion
  const handleSchoolDeleted = (schoolId: string) => {
    setSchools(prev => prev.filter(school => school.id !== schoolId))
    toast({
      variant: "default",
      title: "School Deleted",
      description: "School has been deleted successfully!",
    })
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchSchools(pagination.page, true)
  }

  // Calculate total students and revenue
  const totalStudents = schools.reduce((sum, school) => sum + (school.students?.length || 0), 0)
  const totalRevenue = schools.reduce((sum, school) => {
    return sum + (school.subscriptions?.filter(sub => !sub.isFreemium).reduce((subSum, sub) => subSum + (sub as any).amount || 0, 0) || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schools Management</h1>
          <p className="text-gray-600 mt-1">Manage all schools and their information</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="edugenius-glass"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() => setCreateSchoolOpen(true)}
            className="edugenius-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <School className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                <p className="text-sm text-gray-600">Total Schools</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-purple-50 to-pink-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">${(totalRevenue / 1000).toFixed(0)}K</p>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-orange-50 to-red-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.filter(school => school.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Active Schools</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search schools by name, address, or admin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="edugenius-text-gradient-blue">Schools List</CardTitle>
          <CardDescription>
            Showing {schools.length} of {pagination.total} schools
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Loading schools...</span>
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-12">
              <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first school'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => setCreateSchoolOpen(true)} className="edugenius-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First School
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {schools.map((school) => (
                <div 
                  key={school.id}
                  className="p-6 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                  onClick={() => handleSchoolClick(school.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <School className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {school.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {school.address}
                        </p>
                        {school.schoolAdmin && (
                          <p className="text-sm text-gray-500">
                            Admin: {school.schoolAdmin.user.firstName} {school.schoolAdmin.user.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{school.students?.length || 0}</p>
                        <p className="text-xs text-gray-500">Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{school.teachers?.length || 0}</p>
                        <p className="text-xs text-gray-500">Teachers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          ${school.subscriptions?.filter(sub => !sub.isFreemium).reduce((sum, sub) => sum + ((sub as any).amount || 0), 0).toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-gray-500">Revenue</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          school.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {school.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSchoolClick(school.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {school.subscriptions && school.subscriptions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Active Subscriptions:</p>
                      <div className="flex flex-wrap gap-2">
                        {school.subscriptions.map((subscription) => (
                          <span 
                            key={subscription.id}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${
                              subscription.isFreemium ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {subscription.package.name}
                            {subscription.isFreemium
                              ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">Freemium</span>
                              : <span>- ${subscription.package.price.toLocaleString()}</span>
                            }
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} schools
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 text-sm font-medium">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateSchoolModal
        isOpen={createSchoolOpen}
        onClose={() => setCreateSchoolOpen(false)}
        onSchoolCreated={handleSchoolCreated}
      />
      <SchoolDetailsModal
        isOpen={schoolDetailsOpen}
        onClose={() => {
          setSchoolDetailsOpen(false)
          setSelectedSchoolId(null)
        }}
        schoolId={selectedSchoolId}
        onSchoolUpdated={handleSchoolUpdated}
        onSchoolDeleted={handleSchoolDeleted}
      />
    </div>
  )
}
