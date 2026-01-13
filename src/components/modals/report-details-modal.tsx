'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText, Edit, Save, Trash2, Download, Share, Calendar, Clock, User, BarChart3, DollarSign, GraduationCap, Users, Activity, Settings, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { generateReportPDF } from '@/lib/pdf-generator'

// Component to display filters in a user-friendly format
function FiltersViewer({ filters }: { filters: string | null }) {
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
  } catch (error) {
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

// Component to display report content in a user-friendly format
function ReportContentViewer({ content }: { content: string }) {
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
    
    // Handle different types of report data
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
  } catch (error) {
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

// Analytics Report Viewer
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

// Financial Report Viewer
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

// Academic Report Viewer
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

// User Activity Report Viewer
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

// System Health Report Viewer
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

// Generic Report Viewer for custom or unknown formats
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
      // Check if it's a date string
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

interface ReportDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string
  onReportUpdated: (report: any) => void
  onReportDeleted: (reportId: string) => void
}

interface ReportData {
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

export default function ReportDetailsModal({
  isOpen,
  onClose,
  reportId,
  onReportUpdated,
  onReportDeleted
}: ReportDetailsModalProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ANALYTICS',
    status: 'DRAFT',
    content: '{}',
    filters: '',
    isPublic: false,
    scheduledAt: '',
    expiresAt: ''
  })
  const { toast } = useToast()

  const fetchReport = async () => {
    if (!reportId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
        setFormData({
          title: data.title,
          description: data.description || '',
          type: data.type,
          status: data.status,
          content: data.content,
          filters: data.filters || '',
          isPublic: data.isPublic,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : '',
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : ''
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch report details",
        })
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch report details",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReport()
    }
  }, [isOpen, reportId])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.title || !formData.type) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          scheduledAt: formData.scheduledAt || null,
          expiresAt: formData.expiresAt || null
        }),
      })

      if (response.ok) {
        const updatedReport = await response.json()
        setReportData(updatedReport)
        setEditing(false)
        onReportUpdated(updatedReport)
        toast({
          title: "Success",
          description: "Report updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update report",
        })
      }
    } catch (error) {
      console.error('Error updating report:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update report",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    // Add confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete "${reportData?.title}"? This action cannot be undone.`)
    
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onReportDeleted(reportId)
        onClose() // Close the modal after successful deletion
        toast({
          title: "Success",
          description: "Report deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to delete report",
        })
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete report",
      })
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
          <DialogHeader>
            <DialogTitle className="edugenius-text-gradient-blue">Loading Report Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading report details...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!reportData) {
    return null
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ANALYTICS': return BarChart3
      case 'FINANCIAL': return DollarSign
      case 'ACADEMIC': return GraduationCap
      case 'USER_ACTIVITY': return Users
      case 'SYSTEM_HEALTH': return Activity
      case 'CUSTOM': return Settings
      default: return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ANALYTICS': return 'bg-blue-100 text-blue-800'
      case 'FINANCIAL': return 'bg-green-100 text-green-800'
      case 'ACADEMIC': return 'bg-purple-100 text-purple-800'
      case 'USER_ACTIVITY': return 'bg-orange-100 text-orange-800'
      case 'SYSTEM_HEALTH': return 'bg-red-100 text-red-800'
      case 'CUSTOM': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircle
      case 'GENERATING': return Loader2
      case 'FAILED': return XCircle
      case 'EXPIRED': return AlertCircle
      case 'DRAFT': return Clock
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'GENERATING': return 'bg-blue-100 text-blue-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <DialogHeader className="sticky top-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 z-10 pb-4">
          <DialogTitle className="edugenius-text-gradient-blue flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Report Details
            </div>
            <div className="flex items-center space-x-2">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        title: reportData.title,
                        description: reportData.description || '',
                        type: reportData.type,
                        status: reportData.status,
                        content: reportData.content,
                        filters: reportData.filters || '',
                        isPublic: reportData.isPublic,
                        scheduledAt: reportData.scheduledAt ? new Date(reportData.scheduledAt).toISOString().slice(0, 16) : '',
                        expiresAt: reportData.expiresAt ? new Date(reportData.expiresAt).toISOString().slice(0, 16) : ''
                      })
                    }}
                    className="edugenius-glass"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="edugenius-button"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        generateReportPDF(reportData)
                        toast({
                          title: "Success",
                          description: "Report PDF downloaded successfully",
                        })
                      } catch (error) {
                        console.error('Error generating PDF:', error)
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Failed to generate PDF",
                        })
                      }
                    }}
                    className="edugenius-glass"
                    title="Download as PDF"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="edugenius-glass"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="edugenius-glass text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            View and manage report information and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Report Information */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  {editing ? (
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{reportData.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Report Type</Label>
                  {editing ? (
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANALYTICS">Analytics</SelectItem>
                        <SelectItem value="FINANCIAL">Financial</SelectItem>
                        <SelectItem value="ACADEMIC">Academic</SelectItem>
                        <SelectItem value="USER_ACTIVITY">User Activity</SelectItem>
                        <SelectItem value="SYSTEM_HEALTH">System Health</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getTypeColor(reportData.type)}>
                      {reportData.type.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {editing ? (
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="edugenius-glass"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{reportData.description || 'No description provided'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  {editing ? (
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger className="edugenius-glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="GENERATING">Generating</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(reportData.status)}>
                      {reportData.status}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isPublic">Public Access</Label>
                  {editing ? (
                    <Switch
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                    />
                  ) : (
                    <Badge variant={reportData.isPublic ? "default" : "outline"}>
                      {reportData.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters and Content */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Report Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filters">Applied Filters</Label>
                {editing ? (
                  <Textarea
                    id="filters"
                    value={formData.filters}
                    onChange={(e) => handleInputChange('filters', e.target.value)}
                    className="edugenius-glass"
                    rows={3}
                    placeholder="Enter filters as JSON"
                  />
                ) : (
                  <FiltersViewer filters={reportData.filters} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Report Content</Label>
                <ReportContentViewer content={reportData.content} />
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Scheduled At</Label>
                  {editing ? (
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {reportData.scheduledAt ? new Date(reportData.scheduledAt).toLocaleString() : 'Not scheduled'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At</Label>
                  {editing ? (
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                      className="edugenius-glass"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {reportData.expiresAt ? new Date(reportData.expiresAt).toLocaleString() : 'No expiration'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Metadata */}
          <Card className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="edugenius-text-gradient-blue">Report Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Generated by: {reportData.generatedByUser.firstName} {reportData.generatedByUser.lastName}
                  </span>
                </div>
                {reportData.school && (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      School: {reportData.school.name}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{new Date(reportData.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="font-medium">{new Date(reportData.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
