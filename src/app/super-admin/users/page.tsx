"use client"

import { useState, useEffect } from 'react'
import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateUserModal } from "@/components/modals/create-user-modal"
import { UserDetailsModal } from "@/components/modals/user-details-modal"
import { useToast } from "@/hooks/use-toast"
import { useDeleteConfirmation } from "@/components/ui/delete-confirmation-dialog"
import { 
  Search,
  Filter,
  Plus,
  Users,
  User,
  School,
  GraduationCap,
  Shield,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  UserCheck,
  UserX
} from "lucide-react"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  schoolAdmin?: {
    school: {
      id: string
      name: string
    }
  }
  teacher?: {
    school: {
      id: string
      name: string
    }
  }
  student?: {
    school: {
      id: string
      name: string
    }
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function UsersPage() {
  const { toast } = useToast()
  const { showDeleteConfirmation, DeleteConfirmationDialog } = useDeleteConfirmation()
  const [users, setUsers] = useState<User[]>([])
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
  const [activeTab, setActiveTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Modals
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Fetch users data
  const fetchUsers = async (page = 1, isRefresh = false) => {
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
        ...(activeTab !== 'all' && { role: activeTab }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/users?${params}`)
      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users data",
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users data",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchUsers(1)
  }, [])

  // Handle search and filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1)
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeTab, statusFilter, sortBy, sortOrder])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage)
  }

  // Handle user selection
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setUserDetailsOpen(true)
  }

  // Handle user creation
  const handleUserCreated = (userData: User) => {
    setUsers(prev => [userData, ...prev])
    fetchUsers(pagination.page, true)
    toast({
      variant: "success",
      title: "User Created",
      description: "New user has been created successfully!",
    })
  }

  // Handle user update
  const handleUserUpdated = (userData: User) => {
    setUsers(prev => prev.map(user => 
      user.id === userData.id ? userData : user
    ))
    toast({
      variant: "success",
      title: "User Updated",
      description: "User information has been updated successfully!",
    })
  }

  // Handle user deletion
  const handleUserDeleted = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId))
    toast({
      variant: "success",
      title: "User Deleted",
      description: "User has been deleted successfully!",
    })
  }

  // Handle quick status toggle
  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(prev => prev.map(user => 
          user.id === userId ? updatedUser : user
        ))
        toast({
          variant: "success",
          title: "Status Updated",
          description: `User has been ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update user status",
        })
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status",
      })
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchUsers(pagination.page, true)
  }

  // Calculate statistics
  const totalUsers = pagination.total
  const activeUsers = users.filter(user => user.isActive).length
  const superAdmins = users.filter(user => user.role === 'SUPER_ADMIN').length
  const schoolAdmins = users.filter(user => user.role === 'SCHOOL_ADMIN').length
  const teachers = users.filter(user => user.role === 'TEACHER').length
  const students = users.filter(user => user.role === 'STUDENT').length

  // Get current tab info
  const getCurrentTabInfo = () => {
    switch (activeTab) {
      case 'STUDENT':
        return { name: 'Students', count: students, icon: User }
      case 'TEACHER':
        return { name: 'Teachers', count: teachers, icon: GraduationCap }
      case 'SCHOOL_ADMIN':
        return { name: 'School Admins', count: schoolAdmins, icon: School }
      case 'SUPER_ADMIN':
        return { name: 'Super Admins', count: superAdmins, icon: Shield }
      default:
        return { name: 'All Users', count: totalUsers, icon: Users }
    }
  }

  const currentTabInfo = getCurrentTabInfo()

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Shield className="w-4 h-4" />
      case 'SCHOOL_ADMIN':
        return <School className="w-4 h-4" />
      case 'TEACHER':
        return <GraduationCap className="w-4 h-4" />
      case 'STUDENT':
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800'
      case 'SCHOOL_ADMIN':
        return 'bg-blue-100 text-blue-800'
      case 'TEACHER':
        return 'bg-green-100 text-green-800'
      case 'STUDENT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSchoolName = (user: User) => {
    if (user.schoolAdmin?.school) return user.schoolAdmin.school.name
    if (user.teacher?.school) return user.teacher.school.name
    if (user.student?.school) return user.student.school.name
    return 'No school assigned'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage all users and their permissions</p>
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
            onClick={() => setCreateUserOpen(true)}
            className="edugenius-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-purple-50 to-pink-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{teachers + students}</p>
                <p className="text-sm text-gray-600">Educators & Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-orange-50 to-red-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{superAdmins + schoolAdmins}</p>
                <p className="text-sm text-gray-600">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white via-red-50 to-pink-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-lg font-bold text-gray-900">{superAdmins}</p>
                <p className="text-xs text-gray-600">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-blue-50 to-cyan-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <School className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-lg font-bold text-gray-900">{schoolAdmins}</p>
                <p className="text-xs text-gray-600">School Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-lg font-bold text-gray-900">{teachers}</p>
                <p className="text-xs text-gray-600">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-purple-50 to-violet-50 shadow-lg backdrop-blur-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-lg font-bold text-gray-900">{students}</p>
                <p className="text-xs text-gray-600">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Tabs and Filters */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>All Users</span>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {totalUsers}
                </span>
              </TabsTrigger>
              <TabsTrigger value="STUDENT" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Students</span>
                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                  {students}
                </span>
              </TabsTrigger>
              <TabsTrigger value="TEACHER" className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span>Teachers</span>
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {teachers}
                </span>
              </TabsTrigger>
              <TabsTrigger value="SCHOOL_ADMIN" className="flex items-center space-x-2">
                <School className="w-4 h-4" />
                <span>School Admins</span>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {schoolAdmins}
                </span>
              </TabsTrigger>
              <TabsTrigger value="SUPER_ADMIN" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Super Admins</span>
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  {superAdmins}
                </span>
              </TabsTrigger>
            </TabsList>
            
            {/* Search and Additional Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users by name, email, or phone..."
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
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="lastLogin">Last Login</SelectItem>
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
          </Tabs>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="edugenius-text-gradient-blue flex items-center space-x-2">
            {React.createElement(currentTabInfo.icon, { className: "w-5 h-5" })}
            <span>{currentTabInfo.name}</span>
          </CardTitle>
          <CardDescription>
            Showing {users.length} of {pagination.total} {activeTab === 'all' ? 'users' : currentTabInfo.name.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || activeTab !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first user'
                }
              </p>
              {!searchQuery && activeTab === 'all' && statusFilter === 'all' && (
                <Button onClick={() => setCreateUserOpen(true)} className="edugenius-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First User
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div 
                  key={user.id}
                  className="p-6 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                          {getSchoolName(user) !== 'No school assigned' && (
                            <span className="text-xs text-gray-500">
                              at {getSchoolName(user)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">Created</p>
                      </div>
                      {user.lastLogin && (
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">Last Login</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) => {
                              handleStatusToggle(user.id, user.isActive)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUserClick(user.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              showDeleteConfirmation(
                                'Delete User',
                                'Are you sure you want to delete this user? This will permanently remove all their data, assignments, and access to the system.',
                                `${user.firstName} ${user.lastName}`,
                                async () => {
                                  try {
                                    const response = await fetch(`/api/users/${user.id}`, {
                                      method: 'DELETE',
                                    })
                                    if (response.ok) {
                                      handleUserDeleted(user.id)
                                      toast({
                                        title: "User Deleted Successfully",
                                        description: `${user.firstName} ${user.lastName} has been permanently removed.`,
                                        variant: "success",
                                      })
                                    } else {
                                      const error = await response.json()
                                      toast({
                                        variant: "destructive",
                                        title: "Delete Failed",
                                        description: error.error || "Unable to delete user. Please try again.",
                                      })
                                    }
                                  } catch (error) {
                                    console.error('Error deleting user:', error)
                                    toast({
                                      variant: "destructive",
                                      title: "Delete Failed",
                                      description: "Network error occurred. Please check your connection and try again.",
                                    })
                                  }
                                }
                              )
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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
      <CreateUserModal
        isOpen={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onUserCreated={handleUserCreated}
      />
      <UserDetailsModal
        isOpen={userDetailsOpen}
        onClose={() => {
          setUserDetailsOpen(false)
          setSelectedUserId(null)
        }}
        userId={selectedUserId}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
      />
      <DeleteConfirmationDialog />
    </div>
  )
}
