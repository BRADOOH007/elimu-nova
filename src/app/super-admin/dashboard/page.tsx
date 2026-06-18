"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CreatePackageModal from "@/components/modals/create-package-modal"
import { CreateSchoolModal } from "@/components/modals/create-school-modal"
import { CreateAdminUserModal } from "@/components/modals/create-admin-user-modal"
import { UploadCurriculumModal } from "@/components/modals/upload-curriculum-modal"
import { SchoolDetailsModal } from "@/components/modals/school-details-modal"
import { 
  Users, 
  School, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Plus,
  BarChart3,
  FileText,
  Shield,
  CreditCard,
  UserPlus,
  Building2,
  Calendar,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Loader2
} from "lucide-react"

interface DashboardStats {
  schools: {
    total: number
    active: number
    change: number
    changeText: string
  }
  users: {
    total: number
    active: number
    change: number
    changeText: string
  }
  revenue: {
    total: string
    thisMonth: string
    change: number
    changeText: string
  }
  packages: {
    total: number
    active: number
    change: number
    changeText: string
  }
}

interface RecentSchool {
  id: string
  name: string
  admin: string
  students: number
  status: string
  revenue: string
  createdAt: string
  email?: string
  address?: string
}

interface SystemStatus {
  overall: {
    status: 'healthy' | 'warning' | 'critical'
    lastChecked: string
    uptime: number
  }
  database: {
    status: 'healthy' | 'error'
    responseTime: number
    connectionPool: string
  }
  server: {
    status: 'healthy' | 'warning' | 'critical'
    load: number
    memoryUsage: number
    diskUsage: number
  }
  aiServices: {
    status: 'online' | 'offline'
    responseTime: number
    lastCheck: string
  }
  backup: {
    lastBackup: string
    status: string
    size: string
  }
  statistics: {
    totalUsers: number
    activeUsers: number
    totalSchools: number
    activeSchools: number
    totalPackages: number
    activePackages: number
    totalSubscriptions: number
    activeSubscriptions: number
    recentActivity: number
    userActivityRate: number
    schoolActivityRate: number
    subscriptionRate: number
  }
}

interface PackageOverview {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  maxTeachers: number
  maxStudents: number
  features: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  metrics: {
    activeSubscriptions: number
    totalStudents: number
    monthlyRevenue: number
    utilizationRate: number
    totalCapacity: number
  }
  schools: Array<{
    id: string
    name: string
    studentCount: number
    startDate: string
    endDate: string
  }>
}

interface PackageOverviewData {
  packages: PackageOverview[]
  summary: {
    totalPackages: number
    totalActiveSubscriptions: number
    totalMonthlyRevenue: number
    averageUtilization: number
    totalSchools: number
    totalStudents: number
  }
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentSchools, setRecentSchools] = useState<RecentSchool[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [packageOverview, setPackageOverview] = useState<PackageOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [createPackageOpen, setCreatePackageOpen] = useState(false)
  const [createSchoolOpen, setCreateSchoolOpen] = useState(false)
  const [createAdminUserOpen, setCreateAdminUserOpen] = useState(false)
  const [uploadCurriculumOpen, setUploadCurriculumOpen] = useState(false)
  const [schoolDetailsOpen, setSchoolDetailsOpen] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setLastUpdated(new Date())
      } else {
        console.error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Fetch recent schools
  const fetchRecentSchools = async () => {
    try {
      const response = await fetch('/api/dashboard/recent-schools?limit=5')
      if (response.ok) {
        const data = await response.json()
        setRecentSchools(data)
      } else {
        console.error('Failed to fetch recent schools')
      }
    } catch (error) {
      console.error('Error fetching recent schools:', error)
    }
  }

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/system-status')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      } else {
        console.error('Failed to fetch system status')
      }
    } catch (error) {
      console.error('Error fetching system status:', error)
    }
  }

  // Fetch package overview
  const fetchPackageOverview = async () => {
    try {
      const response = await fetch('/api/packages/overview')
      if (response.ok) {
        const data = await response.json()
        setPackageOverview(data)
      } else {
        console.error('Failed to fetch package overview')
      }
    } catch (error) {
      console.error('Error fetching package overview:', error)
    }
  }

  // Fetch all dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      await Promise.all([
        fetchStats(),
        fetchRecentSchools(),
        fetchSystemStatus(),
        fetchPackageOverview()
      ])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Handle package creation
  const handlePackageCreated = (packageData: any) => {
    // Refresh dashboard data to show updated stats
    fetchDashboardData(true)
  }

  // Handle school creation
  const handleSchoolCreated = (schoolData: any) => {
    // Refresh dashboard data to show updated stats
    fetchDashboardData(true)
  }

  // Handle admin user creation
  const handleAdminUserCreated = (userData: any) => {
    // Refresh dashboard data to show updated stats
    fetchDashboardData(true)
  }

  // Handle curriculum upload
  const handleCurriculumUploaded = (data: any) => {
    // Refresh dashboard data to show updated stats
    fetchDashboardData(true)
  }

  // Handle school selection
  const handleSchoolClick = (schoolId: string) => {
    setSelectedSchoolId(schoolId)
    setSchoolDetailsOpen(true)
  }

  // Handle school update
  const handleSchoolUpdated = (schoolData: any) => {
    // Refresh dashboard data to show updated stats
    fetchDashboardData(true)
  }

  // Handle school deletion
  const handleSchoolDeleted = (schoolId: string) => {
    // Remove school from recent schools list
    setRecentSchools(prev => prev.filter(school => school.id !== schoolId))
    // Refresh dashboard data
    fetchDashboardData(true)
  }


  // Define stats configuration
  const statsConfig = [
    {
      title: "Total Schools",
      value: stats?.schools.total || 0,
      change: stats?.schools.changeText || "Loading...",
      icon: School,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: "Active Users",
      value: stats?.users.total || 0,
      change: stats?.users.changeText || "Loading...",
      icon: Users,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Revenue",
      value: stats?.revenue.total || "$0",
      change: stats?.revenue.changeText || "Loading...",
      icon: DollarSign,
      color: "from-pink-500 to-rose-600"
    },
    {
      title: "Active Packages",
      value: stats?.packages.total || 0,
      change: stats?.packages.changeText || "Loading...",
      icon: Package,
      color: "from-rose-500 to-red-600"
    }
  ]

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="edugenius-text-gradient">Super Admin Overview</span>
            </h1>
            <p className="text-gray-600">Manage schools, packages, and system settings</p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="edugenius-glass"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      )}

      {/* Stats Grid */}
      {!loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsConfig.map((stat, index) => (
            <Card key={stat.title} className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm group hover:scale-105 transition-all duration-300 border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold edugenius-text-gradient-blue mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        {/* Quick Actions & System Status */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full edugenius-button justify-start"
                onClick={() => setCreatePackageOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Package
              </Button>
              <Button 
                variant="outline" 
                className="w-full edugenius-glass justify-start"
                onClick={() => setCreateSchoolOpen(true)}
              >
                <School className="w-4 h-4 mr-2" />
                Add New School
              </Button>
              <Button 
                variant="outline" 
                className="w-full edugenius-glass justify-start"
                onClick={() => setCreateAdminUserOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Admin User
              </Button>
              <Button 
                variant="outline" 
                className="w-full edugenius-glass justify-start"
                onClick={() => setUploadCurriculumOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Curriculum
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">System Status</CardTitle>
              <CardDescription>Current system health and performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemStatus ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database Status</span>
                    <span className={`text-sm font-medium ${
                      systemStatus.database.status === 'healthy' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {systemStatus.database.status === 'healthy' ? '✓ Healthy' : '✗ Error'}
                      {systemStatus.database.responseTime > 0 && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({systemStatus.database.responseTime}ms)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">AI Services</span>
                    <span className={`text-sm font-medium ${
                      systemStatus.aiServices.status === 'online' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {systemStatus.aiServices.status === 'online' ? '✓ Online' : '✗ Offline'}
                      <span className="text-xs text-gray-500 ml-1">
                        ({systemStatus.aiServices.responseTime}ms)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Server Load</span>
                    <span className={`text-sm font-medium ${
                      systemStatus.server.load < 70 
                        ? 'text-green-600' 
                        : systemStatus.server.load < 90 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {systemStatus.server.load}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className={`text-sm font-medium ${
                      systemStatus.server.memoryUsage < 70 
                        ? 'text-green-600' 
                        : systemStatus.server.memoryUsage < 90 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {systemStatus.server.memoryUsage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Disk Usage</span>
                    <span className={`text-sm font-medium ${
                      systemStatus.server.diskUsage < 70 
                        ? 'text-green-600' 
                        : systemStatus.server.diskUsage < 90 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {systemStatus.server.diskUsage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Backup</span>
                    <span className="text-sm text-gray-600">
                      {new Date(systemStatus.backup.lastBackup).toLocaleDateString()} 
                      <span className="text-xs text-gray-500 ml-1">
                        ({systemStatus.backup.size})
                      </span>
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Status</span>
                      <span className={`text-sm font-medium ${
                        systemStatus.overall.status === 'healthy' 
                          ? 'text-green-600' 
                          : systemStatus.overall.status === 'warning'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {systemStatus.overall.status === 'healthy' ? '✓ Healthy' : 
                         systemStatus.overall.status === 'warning' ? '⚠ Warning' : '✗ Critical'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">Uptime</span>
                      <span className="text-xs text-gray-500">
                        {Math.floor(systemStatus.overall.uptime / 3600)}h {Math.floor((systemStatus.overall.uptime % 3600) / 60)}m
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading system status...</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="edugenius-text-gradient-blue">Package Overview</CardTitle>
                <CardDescription>Current subscription packages</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = '/super-admin/packages'
                }}
                className="edugenius-glass"
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Packages
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {packageOverview ? (
                <>
                  {packageOverview.packages.length > 0 ? (
                    <>
                      {/* Show only the first package */}
                      {(() => {
                        const pkg = packageOverview.packages[0]
                        return (
                          <div className="p-4 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg shadow-sm border-t border-gray-200/50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg">{pkg.name}</h4>
                                {pkg.description && (
                                  <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 text-lg">${pkg.price.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">per {pkg.duration} days</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{pkg.metrics.activeSubscriptions}</p>
                                <p className="text-xs text-gray-500">Active Schools</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{pkg.metrics.totalStudents}</p>
                                <p className="text-xs text-gray-500">Total Students</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">${(pkg.metrics.monthlyRevenue / 1000).toFixed(0)}K</p>
                                <p className="text-xs text-gray-500">Monthly Revenue</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">{pkg.metrics.utilizationRate}%</p>
                                <p className="text-xs text-gray-500">Utilization</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                <span className="text-gray-600">
                                  <span className="font-medium">{pkg.maxTeachers}</span> teachers max
                                </span>
                                <span className="text-gray-600">
                                  <span className="font-medium">{pkg.maxStudents}</span> students max
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  pkg.isActive ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                <span className={`text-xs font-medium ${
                                  pkg.isActive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {pkg.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>

                            {pkg.features.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">Features:</p>
                                <div className="flex flex-wrap gap-1">
                                  {pkg.features.slice(0, 3).map((feature, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {feature}
                                    </span>
                                  ))}
                                  {pkg.features.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                      +{pkg.features.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                      
                      {/* Show summary if there are multiple packages */}
                      {packageOverview.packages.length > 1 && (
                        <div className="text-center py-2">
                          <p className="text-sm text-gray-500">
                            +{packageOverview.packages.length - 1} more packages available
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No packages found</p>
                      <p className="text-sm text-gray-400">Create your first package to get started</p>
                    </div>
                  )}
                  
                  {packageOverview.summary && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{packageOverview.summary.totalPackages}</p>
                          <p className="text-xs text-gray-500">Total Packages</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{packageOverview.summary.totalActiveSubscriptions}</p>
                          <p className="text-xs text-gray-500">Active Subscriptions</p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-lg font-bold text-gray-900">${(packageOverview.summary.totalMonthlyRevenue / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-gray-500">Total Monthly Revenue</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading packages...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Schools */}
        {!loading && (
          <Card className="border-0 edugenius-card-gradient">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="edugenius-text-gradient-blue">Recent Schools</CardTitle>
                <CardDescription>Latest school registrations and activity</CardDescription>
              </div>
              <Button 
                variant="outline" 
                className="edugenius-glass"
                onClick={() => {
                  window.location.href = '/super-admin/schools'
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {recentSchools.length === 0 ? (
                <div className="text-center py-8">
                  <School className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No schools found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSchools.map((school) => (
                    <div 
                      key={school.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-lg hover:from-white/90 hover:to-blue-50/90 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
                      onClick={() => handleSchoolClick(school.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <School className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {school.name}
                          </h3>
                          <p className="text-sm text-gray-600">Admin: {school.admin}</p>
                          <p className="text-xs text-gray-500">
                            Joined: {new Date(school.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{school.students} students</p>
                          <p className="text-sm text-gray-600">{school.revenue} revenue</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            school.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {school.status}
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <CreatePackageModal
          isOpen={createPackageOpen}
          onClose={() => setCreatePackageOpen(false)}
          onPackageCreated={handlePackageCreated}
        />
        <CreateSchoolModal
          isOpen={createSchoolOpen}
          onClose={() => setCreateSchoolOpen(false)}
          onSchoolCreated={handleSchoolCreated}
        />
        <CreateAdminUserModal
          isOpen={createAdminUserOpen}
          onClose={() => setCreateAdminUserOpen(false)}
          onUserCreated={handleAdminUserCreated}
        />
        <UploadCurriculumModal
          isOpen={uploadCurriculumOpen}
          onClose={() => setUploadCurriculumOpen(false)}
          onCurriculumUploaded={handleCurriculumUploaded}
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
