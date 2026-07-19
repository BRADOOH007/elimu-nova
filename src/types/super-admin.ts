export interface DashboardStats {
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

export interface RecentSchool {
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

export interface SystemStatus {
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

export interface PackageOverview {
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

export interface PackageOverviewData {
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
