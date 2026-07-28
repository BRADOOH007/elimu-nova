'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  BarChart3,
  DollarSign,
  GraduationCap,
  Users,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
} from 'lucide-react'

export interface ReportData {
  id: string
  title: string
  description: string | null
  type: 'ANALYTICS' | 'FINANCIAL' | 'ACADEMIC' | 'USER_ACTIVITY' | 'SYSTEM_HEALTH' | 'CUSTOM'
  status: 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
  content: string
  filters: string | null
  isPublic: boolean
  scheduledAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  generatedByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  school: {
    id: string
    name: string
    email: string
    address: string
    phone: string
  } | null
}

export function FiltersViewer({ filters }: { filters: string | null }) {
  if (!filters) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg text-center">
        <Settings className="w-6 h-6 text-gray-400 mx-auto mb-1" />
        <p className="text-sm text-gray-500">No filters applied</p>
      </div>
    )
  }

  try {
    const filterData = JSON.parse(filters)

    return (
      <div className="space-y-2">
        {Object.entries(filterData).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <Badge className="bg-blue-100 text-blue-800">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </Badge>
          </div>
        ))}
      </div>
    )
  } catch {
    return (
      <div className="p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-700">Invalid filter format</p>
        <details className="mt-1">
          <summary className="text-xs text-yellow-600 cursor-pointer">Show raw filters</summary>
          <pre className="text-xs text-yellow-800 mt-1 overflow-x-auto">{filters}</pre>
        </details>
      </div>
    )
  }
}

function AnalyticsReportViewer({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.metrics && Object.entries(data.metrics).map(([key, value]: [string, any]) => (
          <Card key={key} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        ))}
      </div>

      {data.trends && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Trends</h4>
          <div className="space-y-2">
            {Object.entries(data.trends).map(([key, trend]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="flex items-center space-x-2">
                  {trend.direction === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {trend.direction === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                  {trend.direction === 'stable' && <Minus className="w-4 h-4 text-gray-500" />}
                  <span className={`text-sm ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                    {trend.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function FinancialReportViewer({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.revenue && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${data.revenue.total?.toLocaleString() || '0'}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        )}

        {data.expenses && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${data.expenses.total?.toLocaleString() || '0'}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        )}
      </div>

      {data.breakdown && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Financial Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(data.breakdown).map(([category, amount]: [string, any]) => (
              <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="font-medium">${typeof amount === 'number' ? amount.toLocaleString() : amount}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function AcademicReportViewer({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.students && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{data.students.total?.toLocaleString() || '0'}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        )}

        {data.performance && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Grade</p>
                <p className="text-2xl font-bold text-purple-600">{data.performance.average || 'N/A'}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        )}

        {data.attendance && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-600">{data.attendance.rate || 'N/A'}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        )}
      </div>

      {data.subjects && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Subject Performance</h4>
          <div className="space-y-2">
            {Object.entries(data.subjects).map(([subject, performance]: [string, any]) => (
              <div key={subject} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="capitalize">{subject}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{performance.average || 'N/A'}</span>
                  <Badge className={`${performance.average >= 80 ? 'bg-green-100 text-green-800' : performance.average >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {performance.grade || 'N/A'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function UserActivityReportViewer({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.activeUsers && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-blue-600">{data.activeUsers.total?.toLocaleString() || '0'}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        )}

        {data.sessions && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-green-600">{data.sessions.total?.toLocaleString() || '0'}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        )}
      </div>

      {data.activities && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Recent Activities</h4>
          <div className="space-y-2">
            {data.activities.slice(0, 10).map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{activity.action || 'Unknown Action'}</span>
                  <p className="text-sm text-gray-600">{activity.user || 'Unknown User'}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown Time'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function SystemHealthReportViewer({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.uptime && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-green-600">{data.uptime.percentage || 'N/A'}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        )}

        {data.performance && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-blue-600">{data.performance.responseTime || 'N/A'}ms</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        )}

        {data.errors && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-red-600">{data.errors.rate || 'N/A'}%</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        )}
      </div>

      {data.services && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Service Status</h4>
          <div className="space-y-2">
            {Object.entries(data.services).map(([service, status]: [string, any]) => (
              <div key={service} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
                <Badge className={`${status === 'healthy' ? 'bg-green-100 text-green-800' : status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {status || 'Unknown'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function GenericReportViewer({ data }: { data: any }) {
  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">N/A</span>
    }

    if (typeof value === 'boolean') {
      return (
        <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }

    if (typeof value === 'number') {
      return <span className="font-medium">{value.toLocaleString()}</span>
    }

    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/) && !isNaN(Date.parse(value))) {
        return <span>{new Date(value).toLocaleString()}</span>
      }
      return <span>{value}</span>
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.slice(0, 5).map((item, index) => (
            <div key={index} className="text-sm bg-gray-100 p-1 rounded">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </div>
          ))}
          {value.length > 5 && (
            <div className="text-xs text-gray-500">... and {value.length - 5} more items</div>
          )}
        </div>
      )
    }

    if (typeof value === 'object') {
      return (
        <div className="space-y-1">
          {Object.entries(value).slice(0, 3).map(([key, val]) => (
            <div key={key} className="text-sm">
              <span className="font-medium">{key}:</span> {renderValue(val)}
            </div>
          ))}
          {Object.keys(value).length > 3 && (
            <div className="text-xs text-gray-500">... and {Object.keys(value).length - 3} more fields</div>
          )}
        </div>
      )
    }

    return <span>{String(value)}</span>
  }

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3">Report Data</h4>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col space-y-1 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <div className="text-gray-900">
              {renderValue(value)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function ReportContentViewer({ content }: { content: string }) {
  if (!content) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No content available</p>
      </div>
    )
  }

  try {
    const data = JSON.parse(content)

    if (data.analytics) {
      return <AnalyticsReportViewer data={data.analytics} />
    } else if (data.financial) {
      return <FinancialReportViewer data={data.financial} />
    } else if (data.academic) {
      return <AcademicReportViewer data={data.academic} />
    } else if (data.userActivity) {
      return <UserActivityReportViewer data={data.userActivity} />
    } else if (data.systemHealth) {
      return <SystemHealthReportViewer data={data.systemHealth} />
    } else {
      return <GenericReportViewer data={data} />
    }
  } catch {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">Error parsing report content</p>
        <details className="mt-2">
          <summary className="text-xs text-red-500 cursor-pointer">Show raw content</summary>
          <pre className="text-xs text-red-700 mt-2 overflow-x-auto">{content}</pre>
        </details>
      </div>
    )
  }
}
